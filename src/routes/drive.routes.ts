import { Router } from "express";
import { requireUser } from "../middleware/requireUser";
import { 
    createDrive, 
    getMyDrives, 
    bookRide, 
    getTrips, 
    updateDriveStatus 
} from "../controllers/drive.controller"; 

const router = Router();

// Publisher & Map Sidebar
router.post("/", requireUser, createDrive);       // Publish a new drive
router.get("/", requireUser, getMyDrives);        // Get active drives for sidebar

// Booking Logic
router.post("/book", requireUser, bookRide);      // Confirm booking & decrement seats

// Dashboard & Lifecycle (NEW)
router.get("/trips", requireUser, getTrips);      // Get history/dashboard data
router.patch("/:id/status", requireUser, updateDriveStatus); // Start or Complete ride

export default router;