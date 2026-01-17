import { Response } from "express";
import { AuthedRequest } from "../middleware/requireUser";
import { db } from "../config/firebase"; 
import { decodePolyline, getPointOnPolylineStatus } from "../utils/geometry";

// 1. MATCHING GLOBAL DECLARATION (Must match index.ts exactly)
declare global {
  var io: any;
}

export async function createRequestAndFindMatches(req: AuthedRequest, res: Response): Promise<void> {
  const { pickup, dropoff, date } = req.body;
  
  console.log("\n--- 🔍 Incoming Ride Request ---");
  console.log("📅 Rider Requested Date:", date);
  
  if (!pickup || !dropoff || !date) {
    res.status(400).json({ error: "Missing pickup, dropoff, or date" });
    return;
  }

  try {
    // 1. Save Request
    const requestRef = await db.collection("requests").add({
      riderId: req.userId,
      pickup,
      dropoff,
      date, 
      status: "pending",
      createdAt: new Date().toISOString()
    });

    // 2. DEBUG MODE: Fetch ALL active drives to see what is in DB
    console.log(`🔎 LOOKING FOR DATE: ${date}`);
    
    // Fetch all active drives
    const allDrivesSnapshot = await db.collection("driveOffers")
      .where("status", "==", "active")
      .get();

    console.log(`📂 TOTAL ACTIVE DRIVES FOUND: ${allDrivesSnapshot.size}`);
    
    const matchingDateDrives: any[] = [];

    // Log details to help debug date mismatches
    allDrivesSnapshot.forEach(doc => {
        const d = doc.data();
        console.log(`   🚗 Drive ${doc.id} | DB Date: ${d.date} | Driver: ${d.driverId}`);
        
        if (d.date === date) {
            matchingDateDrives.push({ id: doc.id, ...d });
        }
    });

    console.log(`🎯 Drives matching requested date: ${matchingDateDrives.length}`);

    // 3. Run Matching Algorithm
    const matches: any[] = [];
    matchingDateDrives.forEach(drive => {
        if (!drive.overview_polyline) return;

        const path = decodePolyline(drive.overview_polyline);
        // Tolerance set to 5000m (5km) for easier testing
        const pickupCheck = getPointOnPolylineStatus(pickup, path, 5000); 
        const dropoffCheck = getPointOnPolylineStatus(dropoff, path, 5000);

        if (pickupCheck.isOnRoute && dropoffCheck.isOnRoute && pickupCheck.index < dropoffCheck.index) {
             console.log(`✅ MATCH FOUND: Driver ${drive.driverId}`);
             
             const offerPayload = {
                 requestId: requestRef.id,
                 eventId: "offer_" + Date.now(),
                 pickup: pickup,
                 dropoff: dropoff,
                 distanceMeters: 5000, 
                 price: 150
             };

             if (global.io) {
                 console.log(`🔔 Sending notification to room: ${drive.driverId}`);
                 global.io.to(drive.driverId).emit("request:offer", offerPayload);
             } else {
                 console.error("❌ Socket IO not found globally!");
             }

             matches.push({
               driveId: drive.id,
               driverId: drive.driverId,
               score: "perfect_match"
             });
        }
    });

    res.status(201).json({ 
      requestId: requestRef.id, 
      matches 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}