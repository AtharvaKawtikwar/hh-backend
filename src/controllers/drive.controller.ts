import { Response } from "express";
import { AuthedRequest } from "../middleware/requireUser";
import { createDriveOffer } from "../models/drive.model";

export async function createDrive(req: AuthedRequest, res: Response) {
    if (req.userRole !== "driver") {
        res.status(403).json({ error: "Only drivers can publish drives" });
        return;
    }

    const { pickup, dropoff, time } = req.body;
    if (!pickup || !dropoff || !time) {
        res.status(400).json({ error: "Missing pickup, dropoff, or time" });
        return;
    }

    try {
        const drive = await createDriveOffer({
            driverId: req.userId!,
            pickup,
            dropoff,
            time,
            status: "active",
            createdAt: new Date()
        });
        res.status(201).json(drive);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create drive offer" });
    }
}