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

// 2. DECLARE GLOBAL HERE (Set to 'any' to avoid type conflicts)
declare global {
  var io: any;
}
global.io = io;

// 3. Socket Logic
io.on("connection", (socket) => {
  console.log("↔️  Socket connected:", socket.id);

  socket.on("register", (data) => {
    const { userId, role } = data;
    if (userId) {
      console.log(`✅ Registering ${role} ${userId} to room`);
      socket.join(userId); 
    }
  });

  socket.on("disconnect", () => {
     // console.log("❌ Socket disconnected:", socket.id);
  });
});

app.use(routes);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});