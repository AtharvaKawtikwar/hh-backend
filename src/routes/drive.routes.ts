import { Router } from "express";
import { requireUser } from "../middleware/requireUser";
import { createDrive, getMyDrives, bookRide } from "../controllers/drive.controller"; 

const router = Router();

router.post("/", requireUser, createDrive);
router.get("/", requireUser, getMyDrives);
router.post("/book", requireUser, bookRide); // <--- ADD THIS

export default router;