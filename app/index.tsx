import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { SignIn } from "./sign-in";
import { Chat } from "./chat";

export default function Index() {
  return (
    <View style={styles.container}>
      <AuthLoading>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#6C5CE7" />
        </View>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <Chat />
      </Authenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
