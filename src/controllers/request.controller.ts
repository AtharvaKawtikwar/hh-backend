import { Response } from "express";
import { AuthedRequest } from "../middleware/requireUser";
import { db } from "../config/firebase"; 
import { decodePolyline, getPointOnPolylineStatus } from "../utils/geometry";
import { getLocationCell } from "../utils/h3"; 

declare global { var io: any; }

export async function createRequestAndFindMatches(req: AuthedRequest, res: Response): Promise<void> {
  const { pickup, dropoff, date, passengers } = req.body;
  const seatsNeeded = Number(passengers) || 1;

  console.log(`\n--- 🕵️‍♂️ NEW MATCHING DEBUG START ---`);
  console.log(`Rider Request: Date=${date}, Seats=${seatsNeeded}`);
  console.log(`Pickup: ${pickup.lat},${pickup.lng}`);
  
  if (!pickup || !dropoff || !date) {
    res.status(400).json({ error: "Missing pickup, dropoff, or date" });
    return;
  }

  try {
    const requestRef = await db.collection("requests").add({
      riderId: req.userId,
      pickup, dropoff, date, seatsNeeded, status: "pending", createdAt: new Date().toISOString()
    });

    // 1. H3 Broad Phase
    const riderPickupCell = getLocationCell(pickup.lat, pickup.lng);
    const h3Snapshot = await db.collection("driveOffers")
      .where("status", "==", "active")
      .where("routeCells", "array-contains", riderPickupCell)
      .get();

    console.log(`⚡ H3 Found ${h3Snapshot.size} candidates in cell ${riderPickupCell}`);
    const matches: any[] = [];

    // 2. Narrow Phase (With Logs)
    h3Snapshot.forEach(doc => {
        const drive = doc.data();
        const driveId = doc.id;
        console.log(`\n🔍 Checking Drive ${driveId}:`);

        // A. SEAT CHECK
        const available = drive.availableSeats ?? 0;
        if (available < seatsNeeded) {
            console.log(`   ❌ REJECTED: Not enough seats (Has ${available}, Needed ${seatsNeeded})`);
            return;
        }

        // B. DATE CHECK
        if (drive.date !== date) {
            console.log(`   ❌ REJECTED: Date mismatch (Drive: ${drive.date} vs Rider: ${date})`);
            return;
        }

        // C. ROUTE GEOMETRY CHECK
        if (!drive.overview_polyline) {
             console.log(`   ❌ REJECTED: No polyline data`);
             return;
        }
        
        const path = decodePolyline(drive.overview_polyline);
        const pickupCheck = getPointOnPolylineStatus(pickup, path, 5000); 
        const dropoffCheck = getPointOnPolylineStatus(dropoff, path, 5000);

        console.log(`   📏 Geometry Check:`);
        console.log(`      Pickup on Route? ${pickupCheck.isOnRoute} (Dist: ${Math.round(pickupCheck.distance)}m)`);
        console.log(`      Dropoff on Route? ${dropoffCheck.isOnRoute} (Dist: ${Math.round(dropoffCheck.distance)}m)`);
        console.log(`      Direction Valid? ${pickupCheck.index < dropoffCheck.index}`);

        if (!pickupCheck.isOnRoute) {
             console.log(`   ❌ REJECTED: Pickup too far from route`);
             return;
        }
        if (!dropoffCheck.isOnRoute) {
             console.log(`   ❌ REJECTED: Dropoff too far from route`);
             return;
        }
        if (pickupCheck.index >= dropoffCheck.index) {
             console.log(`   ❌ REJECTED: Wrong direction (Dropoff is before Pickup)`);
             return;
        }

        console.log(`   ✅ MATCHED!`);
        matches.push({
            driveId: doc.id,
            driverId: drive.driverId,
            price: drive.price,
            seats: available,
            time: drive.time,
            pickup: drive.pickup,
            dropoff: drive.dropoff 
        });
    });

    console.log(`\n🎉 Total Matches Sent: ${matches.length}`);
    res.status(201).json({ requestId: requestRef.id, matches });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}