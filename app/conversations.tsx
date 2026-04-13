import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";

export function Conversations() {
  const conversations = useQuery(api.conversations.list);
  const currentUser = useQuery(api.users.currentUser);
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ethreal</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser?.name || currentUser?.email || ""}
          </Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        style={styles.list}
        contentContainerStyle={conversations?.length === 0 ? styles.emptyList : undefined}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => router.push(`/chat/${item._id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.type === "group"
                  ? item.displayName.charAt(0).toUpperCase()
                  : item.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.conversationInfo}>
              <View style={styles.conversationTop}>
                <Text style={styles.conversationName} numberOfLines={1}>
                  {item.displayName}
                </Text>
                {item.lastMessageTime && (
                  <Text style={styles.conversationTime}>
                    {formatTime(item.lastMessageTime)}
                  </Text>
                )}
              </View>
              <View style={styles.conversationBottom}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessageText ?? "No messages yet"}
                </Text>
                {item.type === "group" && (
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupBadgeText}>
                      {item.members.length}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap + to start a new chat
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/new-chat")}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function formatTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111118",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#1A1A24",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3A",
    paddingTop: Platform.OS === "android" ? 40 : 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F9FAFB",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: "#2A2A3A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A24",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6C5CE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9FAFB",
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  conversationBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    marginRight: 8,
  },
  groupBadge: {
    backgroundColor: "#2A2A3A",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  groupBadgeText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6C5CE7",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "300",
    marginTop: -2,
  },
});
