import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { showError } from "../lib/errorHandler";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Id } from "../convex/_generated/dataModel";

type Mode = "select" | "group";

export default function NewChat() {
  const users = useQuery(api.conversations.allUsers);
  const createDM = useMutation(api.conversations.createDM);
  const createGroup = useMutation(api.conversations.createGroup);
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("select");
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [search, setSearch] = useState("");

  const filteredUsers = users?.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const toggleUser = (id: Id<"users">) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDM = async (userId: Id<"users">) => {
    try {
      const conversationId = await createDM({ otherUserId: userId });
      router.replace(`/chat/${conversationId}`);
    } catch (e) {
      showError(e);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    if (selectedUsers.length === 0) return;
    try {
      const conversationId = await createGroup({
        name: groupName.trim(),
        memberIds: selectedUsers,
      });
      router.replace(`/chat/${conversationId}`);
    } catch (e) {
      showError(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "select" ? "New Chat" : "New Group"}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      {mode === "select" && (
        <TouchableOpacity
          style={styles.groupOption}
          onPress={() => setMode("group")}
        >
          <View style={styles.groupIcon}>
            <Text style={styles.groupIconText}>G</Text>
          </View>
          <Text style={styles.groupOptionText}>Create a group chat</Text>
        </TouchableOpacity>
      )}

      {mode === "group" && (
        <View style={styles.groupNameContainer}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Group name"
            placeholderTextColor="#6B7280"
            value={groupName}
            onChangeText={setGroupName}
            autoFocus
          />
          <Text style={styles.selectedCount}>
            {selectedUsers.length} selected
          </Text>
        </View>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="Search people..."
        placeholderTextColor="#6B7280"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        style={styles.list}
        renderItem={({ item }) => {
          const isSelected = selectedUsers.includes(item._id);
          return (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() =>
                mode === "select" ? handleDM(item._id) : toggleUser(item._id)
              }
              activeOpacity={0.7}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {(item.name ?? item.email ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {item.name ?? "No name"}
                </Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              {mode === "group" && (
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}
                >
                  {isSelected && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {users === undefined ? "Loading..." : "No users found"}
            </Text>
          </View>
        }
      />

      {mode === "group" && selectedUsers.length > 0 && groupName.trim() && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateGroup}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>
            Create group with {selectedUsers.length} people
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D14",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#1A1A26",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3A",
    paddingTop: Platform.OS === "android" ? 40 : 14,
  },
  backText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F9FAFB",
  },
  groupOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A26",
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  groupIconText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  groupOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  groupNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3A",
  },
  groupNameInput: {
    flex: 1,
    fontSize: 16,
    color: "#F9FAFB",
    backgroundColor: "#1A1A26",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2A2A3A",
  },
  selectedCount: {
    marginLeft: 12,
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },
  searchInput: {
    marginHorizontal: 20,
    marginVertical: 12,
    fontSize: 15,
    color: "#F9FAFB",
    backgroundColor: "#1A1A26",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2A2A3A",
  },
  list: {
    flex: 1,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2A2A3A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  userAvatarText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F9FAFB",
  },
  userEmail: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2A2A3A",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
  createButton: {
    backgroundColor: "#2563EB",
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
