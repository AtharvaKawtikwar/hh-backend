import { Response } from "express";
import { AuthedRequest } from "../middleware/requireUser";
import { db } from "../config/firebase";

export async function createDrive(req: AuthedRequest, res: Response): Promise<void> {
  try {
    // 1. Get price from body
    const { pickup, dropoff, date, time, overview_polyline, price } = req.body;

    if (!pickup || !dropoff || !date || !time || !overview_polyline || !price) {
       res.status(400).json({ error: "Missing fields: pickup, dropoff, date, time, polyline, price" });
       return;
    }

    // 2. Save Price to DB
    const driveRef = await db.collection("driveOffers").add({
      driverId: req.userId,
      pickup,
      dropoff,
      date,   
      time,   
      overview_polyline,
      price: Number(price), // Ensure it's a number
      status: "active",
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Drive Published: ${driveRef.id} for ₹${price}`);

    res.status(201).json({ id: driveRef.id, message: "Drive published successfully" });

  } catch (error) {
    console.error("Error creating drive:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Keep getMyDrives as it was...
export async function getMyDrives(req: AuthedRequest, res: Response): Promise<void> {
  // ... (Same as before)
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