import * as SystemUI from "expo-system-ui";
import * as SecureStore from "expo-secure-store";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { Platform, View, StyleSheet, AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Stack } from "expo-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { PinLock } from "../components/PinLock";

SystemUI.setBackgroundColorAsync("#0D0D14");

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export default function RootLayout() {
  const [locked, setLocked] = useState(true);
  const appState = useRef(AppState.currentState);

  const handleUnlock = useCallback(() => {
    setLocked(false);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      // Lock when coming back from background
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        setLocked(true);
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <View style={styles.root}>
          {locked ? (
            <PinLock onUnlock={handleUnlock} />
          ) : (
            <ConvexAuthProvider
              client={convex}
              storage={
                Platform.OS === "ios" || Platform.OS === "android"
                  ? secureStorage
                  : undefined
              }
            >
              <Stack screenOptions={{ headerShown: false }} />
            </ConvexAuthProvider>
          )}
        </View>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0D14",
  },
});
