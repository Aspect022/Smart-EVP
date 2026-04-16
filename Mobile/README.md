# SmartEVP Driver App

Expo-based driver companion app for the SmartEVP+ demo.

## Run

```bash
npm install
npm run start
```

The app will try to infer the backend URL from the Expo Go host automatically.

If you need to override it, start Expo like this:

```bash
EXPO_PUBLIC_BACKEND_URL=http://192.168.43.65:8080 npm run start
```

## Current scope

- Driver profile selection
- Polling-based dispatch detection
- Full-screen alert takeover for new cases
- Active case corridor + ETA + transcript/brief view
- Driver accept flow wired to `POST /api/driver/accept`

## Notes

- Custom Syne / JetBrains Mono font assets are not checked into this repo yet.
- The UI currently uses system font fallbacks while keeping the color and layout language from the docs.
