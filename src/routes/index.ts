import { Router } from 'express';
import waitlistRoutes from './waitlist.routes';
import userRoutes from "./user.routes";
import rideRoutes from './ride.routes';
import requestRoutes from './request.routes';
import driveRoutes from './drive.routes'; // 
import authRoutes from "./auth.routes";

const router = Router();

router.use('/api/test-route-1', (req, res) => {
    res.send("Hello from test route 1!");
});

router.use('/api/waitlist', waitlistRoutes);
// router.use("/api/auth", userRoutes);
router.use("/api/rides", rideRoutes);
router.use("/api/requests", requestRoutes);
// router.use("/api/matches",  matchRoutes);
router.use("/api/drives", driveRoutes);
router.use("/api/auth", authRoutes);
export default router;
