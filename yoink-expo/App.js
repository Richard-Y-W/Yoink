import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, View } from 'react-native';
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
};

function parseYoinkMessage(value) {
  try {
    const { source, type, name } = JSON.parse(value);
    if (source === 'yoink' && type === 'haptic') return name;
  } catch {}
  return null;
}

export default function App() {
  const onMessage = (event) => {
    const name = parseYoinkMessage(event.nativeEvent.data);
    const trigger = HAPTIC_HANDLERS[name];
    if (trigger) trigger().catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <WebView
        style={styles.webview}
        source={{ uri: MARKET_URL }}
        onMessage={onMessage}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        bounces={false}
        setSupportMultipleWindows={false}
        renderError={() => (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>Market app is offline</Text>
            <Text style={styles.errorText}>Start the local Vite server, then reload Expo Go.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
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
