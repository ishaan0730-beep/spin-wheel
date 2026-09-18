# 🎰 Lucky Hourly Spin - 10-Slot Real-Time Multi-Device Wheel

A high-performance, real-time synchronized 10-slot lucky spin wheel web application with customizable numbers (1-100), 12-hour round scheduling, luxury dark gold / cyberpunk visual aesthetics, and hidden Master Administrative Controls.

---

## ✨ Key Features

- **10 Customizable Number Slots (1–100)**: Smooth physics deceleration with tick audio and realistic pointer deflection.
- **Real-Time Cross-Device Synchronization**: Changes made on PC (numbers, timer mode, upcoming queue, forced winners, schedule) sync instantly to mobile devices and tablets via local HTTP API (`/api/state`).
- **Simultaneous Wheel Spins**: When the countdown timer reaches `00:00:00` or a manual test spin is triggered, all connected screens spin in unison and display the exact same winning outcome with confetti and audio fanfare.
- **Dual Timer Modes**:
  - **Real-Time Hourly Clock**: Automatically counts down to the top of every hour (12:00 AM to 11:00 PM).
  - **Manual Countdown Interval**: Custom duration (e.g. 30s, 1m, 2m, etc.) with custom round titles.
- **12-Hour Time Format**: All timestamps and schedules display in standard 12-hour AM/PM format (e.g. `03:00 PM`).
- **Hidden Master Admin Controls**:
  - **On PC**: Type secret keyboard sequence `00773300`.
  - **On Mobile**: Tap the center gold star emblem (or discreet footer lock icon, or visit `#master`).
  - **Master Password**: `00773300` (can be updated from Master Drawer).
- **Public Clean Screen**: Only the wheel, live countdown timer, and "Last 3 Results" cards are visible to players.

---

## 🚀 How to Run Locally

### Option 1: 1-Click Batch Launcher (Windows)
Double-click **`start_server.bat`**.

### Option 2: PowerShell Server
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

---

## 🌐 Network Access

- **PC / Computer**: `http://localhost:3000/`
- **Mobile Phones (Same Wi-Fi / Hotspot)**: `http://<your-pc-ip>:3000/`
- **Mobile Direct Master Access**: `http://<your-pc-ip>:3000/#master`

---

## 🛠️ Technology Stack

- **Frontend**: HTML5 Canvas, Vanilla CSS3, Modern ES6+ JavaScript.
- **Server**: Native C# TCP Multi-Threaded HTTP Server compiled inside PowerShell (no external dependencies required).
- **Audio & FX**: Web Audio API oscillator synthesis, Canvas Confetti particle explosion.
