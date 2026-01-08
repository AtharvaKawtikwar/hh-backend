"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const waitlist_routes_1 = __importDefault(require("./waitlist.routes"));
const ride_routes_1 = __importDefault(require("./ride.routes"));
const request_routes_1 = __importDefault(require("./request.routes"));
const drive_routes_1 = __importDefault(require("./drive.routes")); // 
const auth_routes_1 = __importDefault(require("./auth.routes"));
const router = (0, express_1.Router)();
router.use('/api/test-route-1', (req, res) => {
    res.send("Hello from test route 1!");
});
router.use('/api/waitlist', waitlist_routes_1.default);
// router.use("/api/auth", userRoutes);
router.use("/api/rides", ride_routes_1.default);
router.use("/api/requests", request_routes_1.default);
// router.use("/api/matches",  matchRoutes);
router.use("/api/drives", drive_routes_1.default);
router.use("/api/auth", auth_routes_1.default);
exports.default = router;
