import * as SystemUI from "expo-system-ui";
import * as SecureStore from "expo-secure-store";

SystemUI.setBackgroundColorAsync("#111118");
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { Platform, View, StyleSheet } from "react-native";
import { Stack } from "expo-router";

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
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#111118",
  },
});
