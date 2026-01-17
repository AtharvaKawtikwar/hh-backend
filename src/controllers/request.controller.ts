import { Response } from "express";
import { AuthedRequest } from "../middleware/requireUser";
import { db } from "../config/firebase"; 
import { decodePolyline, getPointOnPolylineStatus } from "../utils/geometry";

declare global { var io: any; }

export async function createRequestAndFindMatches(req: AuthedRequest, res: Response): Promise<void> {
  const { pickup, dropoff, date } = req.body;
  
  if (!pickup || !dropoff || !date) {
    res.status(400).json({ error: "Missing pickup, dropoff, or date" });
    return;
  }

  try {
    const requestRef = await db.collection("requests").add({
      riderId: req.userId,
      pickup, dropoff, date, 
      status: "pending",
      createdAt: new Date().toISOString()
    });

    // Fetch potential drives
    const allDrivesSnapshot = await db.collection("driveOffers")
      .where("status", "==", "active")
      .get();

    const matches: any[] = [];

    allDrivesSnapshot.forEach(doc => {
        const drive = doc.data();
        // 1. Filter by Date (Manual check to be safe)
        if (drive.date !== date) return; 
        if (!drive.overview_polyline) return;

        // 2. Filter by Route (Math)
        const path = decodePolyline(drive.overview_polyline);
        const pickupCheck = getPointOnPolylineStatus(pickup, path, 5000); 
        const dropoffCheck = getPointOnPolylineStatus(dropoff, path, 5000);

        if (pickupCheck.isOnRoute && dropoffCheck.isOnRoute && pickupCheck.index < dropoffCheck.index) {
             // 3. Add to Matches List (Include PRICE)
             matches.push({
               driveId: doc.id,
               driverId: drive.driverId,
               price: drive.price,
               time: drive.time,
               pickup: drive.pickup, // To show driver's start point
               dropoff: drive.dropoff 
             });
        }
    });

    // 4. Return matches to Frontend (Rider selects one)
    console.log(`✅ Found ${matches.length} matches for Rider`);
    res.status(201).json({ 
      requestId: requestRef.id, 
      matches // <--- Send list to UI
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}