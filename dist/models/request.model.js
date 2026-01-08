"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequest = createRequest;
exports.getRequest = getRequest;
exports.cancelRequest = cancelRequest;
exports.listRequestsByRider = listRequestsByRider;
exports.listActiveRequests = listActiveRequests;
const firebase_1 = require("../config/firebase");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const COLLECTION = "rideRequests";
async function createRequest(input) {
    const ref = firebase_1.db.collection(COLLECTION).doc();
    const doc = {
        ...input,
        status: "REQUESTED",
        createdAt: firebase_admin_1.default.firestore.Timestamp.now(),
    };
    await ref.set(doc);
    return { id: ref.id, ...doc };
}
async function getRequest(id) {
    const snap = await firebase_1.db.collection(COLLECTION).doc(id).get();
    return snap.exists ? ({ id: snap.id, ...snap.data() }) : null;
}
async function cancelRequest(id, byRiderId) {
    const ref = firebase_1.db.collection(COLLECTION).doc(id);
    await firebase_1.db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists)
            throw new Error("Request not found");
        const cur = snap.data();
        if (cur.riderId !== byRiderId)
            throw new Error("Not your request");
        if (cur.status !== "REQUESTED")
            return; // idempotent
        tx.update(ref, { status: "CANCELLED" });
    });
}
async function listRequestsByRider(riderId, limit = 20) {
    const snap = await firebase_1.db
        .collection(COLLECTION)
        .where("riderId", "==", riderId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
async function listActiveRequests(limit = 100) {
    const snap = await firebase_1.db.collection(COLLECTION)
        .where("status", "==", "REQUESTED")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
