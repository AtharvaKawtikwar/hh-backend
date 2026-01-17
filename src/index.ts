import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import routes from "./routes"; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// 1. Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// 2. Global Declaration (Use 'any' to fix TS issues)
declare global {
  var io: any;
}
global.io = io;

io.on("connection", (socket) => {
  console.log("↔️  Socket connected:", socket.id);

  // A. Join User's Personal Room
  socket.on("register", (data) => {
    const { userId, role } = data;
    if (userId) {
      console.log(`✅ Registering ${role} ${userId} to room`);
      socket.join(userId); 
    }
  });

  // B. RIDER STARTS NEGOTIATION (Forward to Driver)
  socket.on("negotiate:start", (data) => {
    console.log(`💬 Negotiation from Rider ${data.riderId} -> Driver ${data.targetDriverId}`);
    
    // Forward the offer to the specific Driver
    io.to(data.targetDriverId).emit("negotiate:offer", {
        ...data,
        eventId: Date.now()
    });
  });

  // C. DRIVER RESPONDS (Forward to Rider)
  socket.on("negotiate:respond", (data) => {
    console.log(`🤝 Driver responded to Rider ${data.targetRiderId}: ${data.status}`);
    io.to(data.targetRiderId).emit("negotiate:accept", data);
  });

  socket.on("disconnect", () => {
     // console.log("❌ Socket disconnected");
  });
});

app.use(routes);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});