import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { SignIn } from "./sign-in";
import { Conversations } from "./conversations";

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
        <Conversations />
      </Authenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111118",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
