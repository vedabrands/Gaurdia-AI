# GUARDIA AI — Autonomous Multi-Modal Surveillance & Threat Intelligence OS

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-blue?style=flat-square)](https://docs.ultralytics.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS%204.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

GUARDIA AI is a high-performance, edge-capable autonomous video surveillance system. It performs real-time multi-person pose estimation, open-vocabulary weapon detection, violent action classification, fall detection, multi-channel emergency alert dispatching, and features an integrated real-time web operations dashboard.

---

## Key Capabilities

### 1. Vision & Neural Threat Detection
- **YOLOv8 Pose Estimation**: Single-pass 17-keypoint skeleton tracking with spatial temporal heuristics.
- **YOLO-World Zero-Shot Weapon Detection**: Open-vocabulary identification of firearms, edged weapons, blunt objects, and improvised weapons.
- **Physical Violence & Choking Classification**: Wrist velocity tracking, spatial interaction distance, and wrist-to-neck chokehold proximity verification.
- **Fall Detection**: Bounding-box aspect ratio inversion and keypoint centroid tracking.
- **Multi-Tier Threat Matrix**: Hierarchical categorization from Normal to Critical Threat levels.

### 2. Full-Stack Web Operations Dashboard
- **Live Surveillance Monitor (`/`)**: Sub-second low-latency MJPEG video HUD with REC indicator, dynamic threat tier banners, and real-time metric gauges.
- **Incident Log (`/alerts`)**: Searchable and threat-filtered incident audit log with direct snapshot inspection, chronological drawer views, and downloads.
- **Surveillance Analytics (`/analytics`)**: Hourly threat frequency distribution charts, categorical threat breakdowns, and uptime telemetry.
- **System Settings (`/settings`)**: Live hot-reloading of neural confidence thresholds, violence strike velocities, alert cooldowns, and notification credentials without restarting the engine.

### 3. Multi-Channel Alert Dispatcher
- **Instant Messaging**: Telegram bot integration with automated photo snapshot dispatch.
- **Discord**: Rich embed webhook alerts.
- **WhatsApp**: CallMeBot and Twilio WhatsApp messaging.
- **Local Audio**: Offline siren sounds and real-time Text-to-Speech (TTS) voice announcements.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│             Next.js 16 Web Dashboard                  │
│             http://localhost:3000                      │
│   (Live HUD · Incident Log · Analytics · Settings)     │
└───────────────┬────────────────────────▲───────────────┘
                │ HTTP Proxy             │ WebSocket (1 Hz + Alerts)
                ▼                        │
┌────────────────────────────────────────┴───────────────┐
│             FastAPI Inference Server                   │
│             http://localhost:8000                      │
│   • /api/stream (MJPEG Multipart Video Stream)         │
│   • /ws/events (Bi-directional Telemetry & Alerts)     │
│   • /api/config (Live Parameter Hot Reloading)         │
│   • /api/alerts/history (Incident Audit Records)       │
└───────────────────────────┬────────────────────────────┘
                            │ Thread-Safe Memory Lock
                            ▼
┌────────────────────────────────────────────────────────┐
│             AI Surveillance Pipeline (Daemon)          │
│   • OpenCV Camera Stream Capture                       │
│   • Ultralytics YOLOv8 Pose (17 Keypoints)             │
│   • Ultralytics YOLO-World Open-Vocabulary Detection   │
│   • Multi-Channel Alert Dispatcher                     │
└────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
GUARDIA AI/
├── api_server.py           # FastAPI server & daemon surveillance pipeline
├── main.py                 # Standalone desktop surveillance runner (cv2.imshow)
├── config.py               # Centralized configuration & thresholds
├── detector.py             # Weapon detection engine (YOLO-World / Custom)
├── pose_action.py          # Action heuristics (fighting, chokeholds, falls)
├── tracker_utils.py        # YOLOv8 pose tracker & skeleton drawer
├── alert.py                # Multi-channel notification dispatcher
├── requirements.txt        # Python backend dependencies
├── .env.example            # Environment variables template
├── snapshots/              # Incident snapshot captures
└── frontend/               # Next.js 16 web dashboard
    ├── src/
    │   ├── app/            # App Router pages (/, /alerts, /analytics, /settings)
    │   ├── components/     # UI components (dashboard, alerts, settings, analytics)
    │   ├── hooks/          # React hooks (useWebSocket, useTelemetry, useConfig)
    │   └── lib/            # Types, formatters, and API clients
    ├── package.json
    ├── tailwind.config.ts
    └── next.config.ts
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Webcam or RTSP/Video Stream

### 1. Install Backend Dependencies
```bash
python -m pip install -r requirements.txt
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env` and configure any notification credentials:
```bash
cp .env.example .env
```

### 3. Launch the Full-Stack Web Application

**Terminal 1 — FastAPI Backend:**
```bash
python -m uvicorn api_server:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Next.js Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:3000`** to view the live dashboard.

---

### 4. Deploy Frontend to Vercel
1. Import this repository into **[Vercel](https://vercel.com/)**.
2. Set **Framework Preset** to `Next.js`.
3. Set **Root Directory** to `frontend`.
4. (Optional) Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to point to your hosted FastAPI backend.
5. Click **Deploy**.

---

### Alternative: Standalone Desktop Mode
To run the system as a local desktop application without the web dashboard:
```bash
python main.py
```

---

## Security & Ethics
This software is intended for defensive security, threat prevention, automated physical security monitoring, and educational research.

---

## License
MIT License
