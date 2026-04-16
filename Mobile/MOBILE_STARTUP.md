# Mobile Startup Checklist

Use this every time you want the SmartEVP+ mobile app to work cleanly in Expo Go.

## 1. Start backend services first

Open a PowerShell window:

```powershell
cd D:\Projects\SmartEVP+\Backend
.\.venv\Scripts\Activate.ps1
python start_all.py
```

Make sure:
- Mosquitto is already running on port `1883`
- backend health works at `http://YOUR_LAPTOP_IP:8080/api/health`

## 2. Confirm backend `.env`

Inside `Backend/.env`, check these:

```env
HF_API_KEY=your_huggingface_key
OLLAMA_BASE_URL=http://10.1.16.183:11434
OLLAMA_MODEL=gemma2:2b
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

Backend AI order is:
1. Ollama
2. Gemini fallback
3. hardcoded fallback brief

## 3. Start the mobile app

Open a second PowerShell window:

```powershell
cd D:\Projects\SmartEVP+\Mobile
$env:EXPO_PUBLIC_BACKEND_URL="http://YOUR_LAPTOP_IP:8080"
npx expo start -c
```

Replace `YOUR_LAPTOP_IP` with the laptop IP on the same network as the phone.

## 4. Open in Expo Go

On the phone:
1. Connect to the same Wi-Fi or hotspot as the laptop
2. Open Expo Go
3. Scan the QR code
4. Allow notification permission when asked

## 5. What should work after launch

- home screen loads from backend
- driver can accept dispatch
- local alert appears when a case is polled
- remote push can arrive if backend has the Expo push token registered

## 6. Recommended demo order

1. Start backend
2. Start mobile Expo server
3. Open admin, hospital, ambulance, and mobile
4. Trigger `demo/trigger`
5. Mobile should receive a dispatch alert
6. Admin map should show patient leg first
7. Hospital should receive transcript and structured brief after the pickup phase
8. Ambulance should continue toward hospital

## 7. If mobile stops working

Restart Expo:

```powershell
cd D:\Projects\SmartEVP+\Mobile
npx expo start -c
```

If needed, restart backend too:

```powershell
cd D:\Projects\SmartEVP+\Backend
python start_all.py
```

## 8. Quick failure checks

- `api/health` does not load: backend is not reachable
- no mobile alert: phone is on wrong network, Expo app not connected, or notification permission was denied
- no hospital transcript/brief: audio processor is not running or AI providers are unavailable
- no remote push: Expo push token was not registered yet on the backend
