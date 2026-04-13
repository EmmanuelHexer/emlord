import * as SystemUI from "expo-system-ui";
import * as SecureStore from "expo-secure-store";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { Platform, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Stack } from "expo-router";

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
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <View style={styles.root}>
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
