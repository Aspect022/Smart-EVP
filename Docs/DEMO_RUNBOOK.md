# SmartEVP+ 3-Laptop Demo Runbook

This guide contains everything you need to know to run the "WOW-factor" 3-laptop interactive demo. 
The SmartEVP+ dashboard is designed so each laptop provides a distinct, synced experience showcasing the end-to-end emergency lifecycle.

## Setup Instructions

### 1. Identify the "Host" Laptop (Laptop 1)
- Pick one laptop to run the Backend and the `audio_processor`.
- Open a terminal and start the backend: `python app.py`
- Open another terminal and start the processor: `python audio_processor.py`
- Start the frontend: `npm run dev` (Port 3000)
- On the host laptop, log into the frontend at `http://localhost:3000`. You will see the IP Address of Laptop 1 displayed on the top left of the dashboard (e.g., `Host: 192.168.1.55`). Note this IP down!

### 2. Configure Guest Laptops (Laptops 2 & 3)
- Ensure all laptops are connected to the **same Wi-Fi network**.
- Open `Frontend/.env.local` on laptops 2 and 3 and set the backend URL using Laptop 1's IP address:
  ```env
  NEXT_PUBLIC_BACKEND_URL=http://192.168.1.55:8080
  ```
- Start the frontend on both guest laptops: `npm run dev`.
- They will now connect directly to the host laptop's Socket.IO backend!

### 3. Assign Roles via the Launcher
On each laptop, load `http://localhost:3000` (or the host's IP `http://192.168.1.55:3000` if you don't want to run the frontend server locally on laptops 2 and 3!).
Click the floating red **"💻 3-Laptop Demo Setup"** button on the bottom right and pick one role per laptop:

- **Laptop 1 (The Presenter):** `Admin Command Center` (Shows overall network overview, traffic map, signals)
- **Laptop 2 (The Field Unit):** `Ambulance HUD` (Shows Google Maps, EMT Input, Push-to-Talk)
- **Laptop 3 (The Hospital):** `Hospital ERIS Console` (Shows incoming warning sirens, AI briefs)

---

## The Demo Flow (The Script)

The demo is triggered deterministically and syncs seamlessly across all three screens.

### Stage 1: The Initial Dispatch
1. Ensure all laptops are ready on their respective views.
2. On the **Admin Console (Laptop 1)**, click the **"RUN FULL DEMO"** cyan button in the top right corner.
3. Automatically:
   - A critical incident gets raised and assigned.
   - The **Ambulance HUD** Google Maps module dynamically updates route geometry.
   - The ambulance sets out (GPS auto-movement begins over socket).

### Stage 2: Patient Pick-Up & Navigation
1. You (The EMT) speak: *"The ambulance arrives at the scene."*
2. On the **Ambulance HUD (Laptop 2)**, click the **"Patient Picked Up"** button on the bottom panel.
3. Notice:
   - The map re-routes from the patient directly to the Hospital.
   - The **Hospital Console (Laptop 3)** immediately flashes an incoming `CODE CRITICAL` alarm with the live ETA clock running!

### Stage 3: The Voice Intelligence Record
1. The EMT is now routing to the hospital. In the **Ambulance HUD (Laptop 2)**, find the Audio Intake module.
2. Click **"Push to Talk"** and speak your medical brief clearly into the microphone. For example:
   *"Patient is a 58-year-old male presenting with acute chest pain radiating to the left arm. Heart rate 112, BP 90 over 60, SpO2 94%. We suspect a STEMI. ETA 4 minutes."*
3. Click **"End Recording"**.
4. The system will visualize the audio being sent and transcribed. Within 5-10 seconds, the Gemma 4 AI brief will automatically pop up perfectly formatted on the **Hospital Console (Laptop 3)**!

### Stage 4: Arriving & Preemption
1. As the GPS nears the destination, click the **"Final Approach (Preempt Signals)"** red button on the Ambulance HUD.
2. Look at the **Admin Console (Laptop 1)** map to observe the traffic signal preemption wave clearing the intersection!

---

## Troubleshooting

- **Google Map is grey/erroring:** You did not add a valid `NEXT_PUBLIC_GOOGLE_MAPS_KEY` to the `.env.local`. Review the `Docs/GOOGLE_MAPS_API_GUIDE.md`. Even if it fails, a fallback button will open native maps.
- **Audio isn't processing:** Ensure `python audio_processor.py` is continuously running on Laptop 1.
- **Laptops aren't syncing:** Ensure the `NEXT_PUBLIC_BACKEND_URL` on the frontend correctly points to Laptop 1's LAN IP address and all laptops are on the exact same Wi-Fi network. Check the top left badge to ensure it says `LIVE`.
