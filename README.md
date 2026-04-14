# RandomCall 🎥

Peer-to-peer random video chat. WebRTC for video (no server sees your stream), Socket.io for signaling and matchmaking.

## Project Structure

```
randomcall/
├── server.js          ← Node.js signaling server (Socket.io)
├── package.json
├── render.yaml        ← One-click Render.com deploy config
├── .gitignore
└── public/
    └── index.html     ← Frontend (served by the server)
```

## Deploy in 5 minutes (free on Render.com)

1. **Push to GitHub**
   
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/randomcall.git
   git push -u origin main
   ```
1. **Deploy on Render**
- Go to [render.com](https://render.com) → New → Web Service
- Connect your GitHub repo
- Render auto-detects `render.yaml` — just click **Deploy**
- You get a free URL like `https://randomcall.onrender.com`
1. **Open on two devices** → Click **Start Call** on both → Connected! ✅

## Run locally

```bash
npm install
npm start
# Open http://localhost:3000 in two browser tabs
```

## How it works

1. Both users open the page → connect to the Socket.io server
1. Server maintains a **waiting queue** — first user waits, second user gets matched
1. Server tells them each other’s socket ID and who is `initiator` vs `receiver`
1. **Initiator** creates a WebRTC offer → server relays it to receiver
1. **Receiver** answers → ICE candidates exchanged → direct P2P video established
1. Server is no longer needed — video flows directly device-to-device
1. Active user count is tracked in real time on the server and broadcast to all clients

## Tech stack

- **Express** — serves the static frontend
- **Socket.io** — real-time signaling (offer/answer/ICE relay + matchmaking)
- **WebRTC** (native browser API) — peer-to-peer video/audio
- **STUN servers** (Google’s free ones) — NAT traversal
