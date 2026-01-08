import { Router } from "express";
import { requireUser } from "../middleware/requireUser";
import * as driveCtrl from "../controllers/drive.controller";

const router = Router();

// POST /api/drives
router.post("/", requireUser, driveCtrl.createDrive);

export default router;