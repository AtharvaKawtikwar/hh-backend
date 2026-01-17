import { Response } from "express";
import { AuthedRequest } from "../middleware/requireUser";
import { db } from "../config/firebase";
import { getRouteCells } from "../utils/h3";

declare global { var io: any; }

export async function createDrive(req: AuthedRequest, res: Response): Promise<void> {
  try {
    // 1. Get 'seats' from body
    const { pickup, dropoff, date, time, overview_polyline, price, seats } = req.body;

    if (!pickup || !dropoff || !date || !time || !overview_polyline || !price || !seats) {
       res.status(400).json({ error: "Missing fields" });
       return;
    }

    const routeCells = getRouteCells(overview_polyline);

    // 2. Save Seats Info
    const totalSeats = Number(seats);
    
    const driveRef = await db.collection("driveOffers").add({
      driverId: req.userId,
      pickup,
      dropoff,
      date,   
      time,   
      overview_polyline,
      routeCells,
      price: Number(price),
      totalSeats: totalSeats,       // Total Capacity
      availableSeats: totalSeats,   // Seats left (starts full)
      status: "active",
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Drive Published: ${driveRef.id} with ${totalSeats} seats`);

    res.status(201).json({ id: driveRef.id, message: "Drive published successfully" });

  } catch (error) {
    console.error("Error creating drive:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// --- NEW FUNCTION: Handle Booking & Seat Decrement ---
export async function bookRide(req: AuthedRequest, res: Response): Promise<void> {
    const { driveId, requestId, riderId, seatsNeeded, priceOffered } = req.body;

    try {
        const driveRef = db.collection("driveOffers").doc(driveId);
        
        // Run a Transaction to ensure seats don't get double-booked
        await db.runTransaction(async (t) => {
            const driveDoc = await t.get(driveRef);
            if (!driveDoc.exists) throw new Error("Drive not found");

            const driveData = driveDoc.data();
            const currentSeats = driveData?.availableSeats || 0;

            if (currentSeats < seatsNeeded) {
                throw new Error("Not enough seats available!");
            }

            // 1. Decrement Seats
            const newSeats = currentSeats - seatsNeeded;
            t.update(driveRef, { 
                availableSeats: newSeats,
                // Optional: If 0 seats left, mark as 'full' (but keep active for current riders)
            });

            // 2. Update Request Status
            const requestRef = db.collection("requests").doc(requestId);
            t.update(requestRef, { status: "accepted" });
        });

        console.log(`✅ Booking Confirmed! Drive ${driveId} now has fewer seats.`);

        // 3. Notify Rider via Socket (Server-Side Emit)
        if (global.io) {
            global.io.to(riderId).emit("negotiate:accept", {
                finalPrice: priceOffered,
                driveId
            });
        }

        res.status(200).json({ message: "Booking successful", seatsLeft: "updated" });

    } catch (err: any) {
        console.error("Booking failed:", err);
        res.status(400).json({ error: err.message });
    }
}

// (Keep getMyDrives as is)
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
      console.error(err);
      res.status(500).json({ error: "Failed to fetch drives" });
    }
}