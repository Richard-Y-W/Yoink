import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_MARKET_URL = 'http://127.0.0.1:5173';
const baseMarketUrl = process.env.EXPO_PUBLIC_YOINK_URL || DEFAULT_MARKET_URL;
const MARKET_URL = baseMarketUrl.includes('?')
  ? `${baseMarketUrl}&shell=expo`
  : `${baseMarketUrl}?shell=expo`;

const HAPTIC_HANDLERS = {
  tap: () => Haptics.selectionAsync(),
  tab: () => Haptics.selectionAsync(),
  cart: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  watch: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  unwatch: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  'search-submit': () => Haptics.selectionAsync(),
  'loader-page-load': () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  orders: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  'delivery-update': () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  reward: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  'rare-flash': () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  'ultra-drop': () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function parseYoinkMessage(value) {
  try {
    const message = JSON.parse(value);
    if (message.source === 'yoink' && message.type === 'haptic') {
      return { type: 'haptic', name: message.name };
    }
    if (message.source === 'yoink' && message.type === 'notification') {
      return {
        type: 'notification',
        title: message.title,
        body: message.body,
        seconds: message.seconds,
      };
    }
  } catch {}
  return null;
}

async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

async function scheduleYoinkNotification({ title, body, seconds }) {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || 'Yoink update',
      body: body || 'Something moved in your market.',
      sound: true,
    },
    trigger: {
      seconds: Math.max(1, Number(seconds) || 1),
    },
  });
}

export default function App() {
  const onMessage = (event) => {
    const message = parseYoinkMessage(event.nativeEvent.data);
    if (!message) return;

    if (message.type === 'haptic') {
      const trigger = HAPTIC_HANDLERS[message.name];
      if (trigger) trigger().catch(() => {});
    }

    if (message.type === 'notification') {
      scheduleYoinkNotification(message).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <WebView
        style={styles.webview}
        source={{ uri: MARKET_URL }}
        onMessage={onMessage}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        bounces
        setSupportMultipleWindows={false}
        renderError={() => (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>Market app is offline</Text>
            <Text style={styles.errorText}>Start the local Vite server, then reload Expo Go.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F7F3FF',
  },
  errorTitle: {
    color: '#171326',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorText: {
    color: '#7A7686',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
