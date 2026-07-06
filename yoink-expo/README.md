# Yoink Market Expo Go

This is a thin iPhone shell for the local Market Copy web app. It opens the Vite app in `react-native-webview` and maps Yoink haptic events to `expo-haptics`.

The wrapper intentionally targets Expo SDK 55 so updated Expo Go installs on older iPhones can open it. SDK 56 and 57 require newer iOS support than some still-updated devices receive.

## Run on iPhone with Expo Go

1. Start the web app on your Mac's local network:

```bash
cd /Users/byungkim/yoink-market-copy/yoink
npm run dev -- --host 0.0.0.0
```

2. Get your Mac Wi-Fi IP:

```bash
ipconfig getifaddr en0
```

3. Start Expo with that URL:

```bash
cd /Users/byungkim/yoink-market-copy/yoink-expo
EXPO_PUBLIC_YOINK_URL=http://<mac-ip>:5173 npm run start
```

4. Open Expo Go on the iPhone and scan the QR code from the terminal.

For the iOS Simulator on the same Mac, you can usually use:

```bash
EXPO_PUBLIC_YOINK_URL=http://127.0.0.1:5173 npm run ios
```

The Expo shell appends `?shell=expo` automatically so the Vite app removes the desktop phone frame.
