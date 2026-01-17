import { Response } from "express";
import { AuthedRequest } from "../middleware/requireUser";
import { db } from "../config/firebase";

// 1. Explicitly set return type to Promise<void>
export async function createDrive(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { pickup, dropoff, date, time, overview_polyline } = req.body;

    // 2. Validate
    if (!pickup || !dropoff || !date || !time || !overview_polyline) {
       // Send response, then empty return to stop execution
       res.status(400).json({ error: "Missing required fields (pickup, dropoff, date, time, polyline)" });
       return;
    }

    // 3. Save to Firestore
    const driveRef = await db.collection("driveOffers").add({
      driverId: req.userId,
      pickup,
      dropoff,
      date,   
      time,   
      overview_polyline,
      status: "active",
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Drive Published: ${driveRef.id} for Date: ${date}`);

    // Just send the response (don't return it)
    res.status(201).json({ id: driveRef.id, message: "Drive published successfully" });

  } catch (error) {
    console.error("Error creating drive:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Fixed getMyDrives as well
export async function getMyDrives(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const drivesSnapshot = await db.collection("driveOffers")
      .where("driverId", "==", req.userId)
      .orderBy("createdAt", "desc")
      .get();

    const drives = drivesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(drives);
  } catch (err) {
    console.error("Error fetching drives:", err);
    res.status(500).json({ error: "Failed to fetch drives" });
  }
}