import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

import { AppRoot } from './src/app/AppRoot';
import { colors } from './src/ui/theme';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <AppRoot />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
});
