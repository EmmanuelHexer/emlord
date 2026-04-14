import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { SignIn } from "../components/SignIn";
import { Conversations } from "../components/Conversations";
import { SetName } from "../components/SetName";
import { api } from "../convex/_generated/api";

function AuthedContent() {
  const currentUser = useQuery(api.users.currentUser);

  if (currentUser === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (currentUser && !currentUser.name) {
    return <SetName onDone={() => {}} />;
  }

  return <Conversations />;
}

export default function Index() {
  return (
    <View style={styles.container}>
      <AuthLoading>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <AuthedContent />
      </Authenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D14",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
