import { Response } from "express";
import { AuthedRequest } from "../middleware/requireUser";
import { db } from "../config/firebase";
import { getRouteCells } from "../utils/h3";

// Declare socket.io global so we can emit events
declare global {
  var io: any;
}

// 1. PUBLISH A NEW DRIVE
export async function createDrive(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { pickup, dropoff, date, time, overview_polyline, price, seats } = req.body;

    if (!pickup || !dropoff || !date || !time || !overview_polyline || !price || !seats) {
       res.status(400).json({ error: "Missing fields" });
       return;
    }

    // Generate H3 Hexagons for geospatial search
    const routeCells = getRouteCells(overview_polyline);

    const totalSeats = Number(seats);
    
    const driveRef = await db.collection("driveOffers").add({
      driverId: req.userId,
      pickup,
      dropoff,
      date,   
      time,   
      overview_polyline,
      routeCells,       // H3 Index
      price: Number(price),
      totalSeats: totalSeats,
      availableSeats: totalSeats,
      status: "active", // active -> started -> completed
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Drive Published: ${driveRef.id} with ${totalSeats} seats`);

    res.status(201).json({ id: driveRef.id, message: "Drive published successfully" });

  } catch (error) {
    console.error("Error creating drive:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// 2. BOOK A RIDE (Handle Transaction & Seats)
export async function bookRide(req: AuthedRequest, res: Response): Promise<void> {
    const { driveId, requestId, riderId, seatsNeeded, priceOffered } = req.body;

    try {
        const driveRef = db.collection("driveOffers").doc(driveId);
        
        await db.runTransaction(async (t) => {
            const driveDoc = await t.get(driveRef);
            if (!driveDoc.exists) throw new Error("Drive not found");

            const driveData = driveDoc.data();
            const currentSeats = driveData?.availableSeats || 0;

            if (currentSeats < seatsNeeded) {
                throw new Error("Not enough seats available!");
            }

            // Decrement Seats
            const newSeats = currentSeats - seatsNeeded;
            t.update(driveRef, { availableSeats: newSeats });

            // Update Request Status
            const requestRef = db.collection("requests").doc(requestId);
            t.update(requestRef, { status: "accepted" });
        });

        console.log(`✅ Booking Confirmed! Drive ${driveId} updated.`);

        // Notify Rider via Socket
        if (global.io) {
            global.io.to(riderId).emit("negotiate:accept", {
                finalPrice: priceOffered,
                driveId // Send driveId so they can join chat
            });
        }

        res.status(200).json({ message: "Booking successful", seatsLeft: "updated" });

    } catch (err: any) {
        console.error("Booking failed:", err);
        res.status(400).json({ error: err.message });
    }
}

// 3. GET ACTIVE DRIVES (For Sidebar - Driver Only)
export async function getMyDrives(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const drivesSnapshot = await db.collection("driveOffers")
        .where("driverId", "==", req.userId)
        .where("status", "==", "active") // Only show active ones in sidebar map
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

// 4. GET TRIP HISTORY (DEBUGGER MODE)
export async function getTrips(req: AuthedRequest, res: Response): Promise<void> {
    try {
        const role = (req.query.role as string || "").toLowerCase();
        console.log(`\n🕵️‍♂️ DEBUG: Fetching trips for Logged-In User: ${req.userId}`);
        console.log(`   Requested Role: ${role}`);

        let trips = [];

        if (role === 'driver') {
            // Fetch ALL drives, ignore ID check for a moment to see if data exists
            const snapshot = await db.collection("driveOffers").get(); // GET EVERYTHING
            
            console.log(`   Found ${snapshot.size} total drives in DB.`);
            
            trips = snapshot.docs.map(doc => {
                const data = doc.data();
                // Log if this drive belongs to current user
                if (data.driverId === req.userId) {
                    console.log(`   ✅ MATCH: Found drive ${doc.id} for this user.`);
                }
                return { id: doc.id, ...data };
            });

            // Filter in memory so we can see the count before filtering
            const myTrips = trips.filter((t: any) => t.driverId === req.userId);
            console.log(`   -> Returning ${myTrips.length} drives owned by you.`);
            res.json(myTrips);

        } else {
            // RIDER
            const snapshot = await db.collection("requests").get(); // GET EVERYTHING
            
            console.log(`   Found ${snapshot.size} total requests in DB.`);

            trips = snapshot.docs.map(doc => {
                const data = doc.data();
                const isMatch = data.riderId === req.userId;
                console.log(`   [Request ${doc.id}] Rider: ${data.riderId} | Status: ${data.status} | Match? ${isMatch}`);
                return { id: doc.id, ...data };
            });

            // Filter in memory
            const myRequests = trips.filter((t: any) => t.riderId === req.userId);
            
            // 🔥 REMOVED THE "ACCEPTED" CHECK. SHOW EVERYTHING.
            console.log(`   -> Returning ${myRequests.length} requests for you (Any Status).`);
            res.json(myRequests);
        }

    } catch (err: any) {
        console.error("❌ Fatal Error:", err.message);
        res.status(500).json({ error: "Failed to fetch trips" });
    }
}

// 5. UPDATE DRIVE STATUS (Start/Complete Ride - NEW)
export async function updateDriveStatus(req: AuthedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body; // 'started' | 'completed' | 'cancelled'

    try {
        await db.collection("driveOffers").doc(id).update({ status });
        console.log(`🔄 Drive ${id} status updated to: ${status}`);
        
        res.json({ success: true, status });
    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ error: "Update failed" });
    }
}