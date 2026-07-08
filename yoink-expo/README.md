# Yoink Market Expo Go

This is a thin iPhone shell for the local Market Copy web app. It opens the Vite app in `react-native-webview` and maps Yoink haptic events to `expo-haptics`.

The wrapper intentionally targets Expo SDK 54 so updated Expo Go installs on older iPhones can open it. SDK 55+ can require a newer Expo Go build than some still-updated devices receive.

## Run on iPhone with Expo Go

1. Start the web app on your Mac's local network:

```bash
cd /Users/byungkim/yoink-market-copy/yoink
npm run dev -- --host 0.0.0.0
```

The Vite config pins this server to `0.0.0.0:5173` and exits if that port is already taken.

2. Get your Mac Wi-Fi IP:

```bash
ipconfig getifaddr en0
```

3. Start Expo with that URL:

```bash
cd /Users/byungkim/yoink-market-copy/yoink-expo
EXPO_PUBLIC_YOINK_URL=http://<mac-ip>:5173 npm run start
```

The start script runs a preflight check first. It refuses to start if `EXPO_PUBLIC_YOINK_URL` is missing, points at localhost, points at the wrong web port, or if Expo port `8084` is already occupied.

To run the same check without starting Expo:

```bash
EXPO_PUBLIC_YOINK_URL=http://<mac-ip>:5173 npm run check:ports
```

4. Open Expo Go on the iPhone and scan the QR code from the terminal.

The Expo shell appends `?shell=expo` automatically so the Vite app removes the desktop phone frame.
