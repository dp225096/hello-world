const express = require(“express”);
const http = require(“http”);
const { Server } = require(“socket.io”);
const path = require(“path”);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
cors: { origin: “*”, methods: [“GET”, “POST”] },
});

// Serve the frontend
app.use(express.static(path.join(__dirname, “public”)));

// ── State ──────────────────────────────────────────────────────────────────
const waiting = [];          // queue of socket IDs waiting for a match
const activeUsers = new Set(); // all connected socket IDs

// ── Helpers ────────────────────────────────────────────────────────────────
function broadcastCount() {
io.emit(“user-count”, activeUsers.size);
}

function tryMatch(socket) {
// Remove any stale entry of this socket from the queue
const myIdx = waiting.indexOf(socket.id);
if (myIdx !== -1) waiting.splice(myIdx, 1);

if (waiting.length === 0) {
// No one waiting — join the queue
waiting.push(socket.id);
socket.emit(“waiting”);
console.log(`[match] ${socket.id} is waiting. Queue: ${waiting.length}`);
} else {
// Pop the first waiting peer and pair them
const partnerId = waiting.shift();
const partnerSocket = io.sockets.sockets.get(partnerId);

```
if (!partnerSocket) {
  // Partner disconnected before match — try again
  return tryMatch(socket);
}

// Assign roles: initiator calls, receiver waits
socket.emit("matched", { partnerId, role: "initiator" });
partnerSocket.emit("matched", { partnerId: socket.id, role: "receiver" });
console.log(`[match] Paired ${socket.id} ↔ ${partnerId}`);
```

}
}

// ── Socket events ──────────────────────────────────────────────────────────
io.on(“connection”, (socket) => {
activeUsers.add(socket.id);
broadcastCount();
console.log(`[+] ${socket.id} connected. Online: ${activeUsers.size}`);

// Client wants to find a match
socket.on(“find-match”, () => {
tryMatch(socket);
});

// WebRTC signaling — relay offer/answer/ice to partner
socket.on(“signal”, ({ to, data }) => {
const target = io.sockets.sockets.get(to);
if (target) {
target.emit(“signal”, { from: socket.id, data });
}
});

// Client skipped — remove from any pairing, re-queue
socket.on(“skip”, ({ partnerId }) => {
// Notify old partner
const partnerSocket = io.sockets.sockets.get(partnerId);
if (partnerSocket) {
partnerSocket.emit(“partner-left”);
}
tryMatch(socket);
});

// Client ended call
socket.on(“end-call”, ({ partnerId }) => {
const partnerSocket = io.sockets.sockets.get(partnerId);
if (partnerSocket) {
partnerSocket.emit(“partner-left”);
}
// Remove from waiting queue if present
const idx = waiting.indexOf(socket.id);
if (idx !== -1) waiting.splice(idx, 1);
});

socket.on(“disconnect”, () => {
activeUsers.delete(socket.id);
// Remove from waiting queue
const idx = waiting.indexOf(socket.id);
if (idx !== -1) waiting.splice(idx, 1);
broadcastCount();
console.log(`[-] ${socket.id} disconnected. Online: ${activeUsers.size}`);
});
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
console.log(`RandomCall server running on http://localhost:${PORT}`);
});
