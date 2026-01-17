import { Router } from "express";
import { requireUser } from "../middleware/requireUser";
import { createDrive, getMyDrives } from "../controllers/drive.controller"; 

const router = Router();

router.post("/", requireUser, createDrive); 
router.get("/", requireUser, getMyDrives);  

export default router;