import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";

export function Chat() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.list,
    {},
    { initialNumItems: 30 }
  );
  const messages = useMemo(
    () => (results ? [...results].reverse() : []),
    [results]
  );
  const currentUser = useQuery(api.users.currentUser);
  const sendMessage = useMutation(api.messages.send);
  const { signOut } = useAuthActions();
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await sendMessage({ body: trimmed });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>emlord</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser?.name || currentUser?.email || ""}
          </Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        ListHeaderComponent={
          status === "CanLoadMore" ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => loadMore(20)}
            >
              <Text style={styles.loadMoreText}>Load older messages</Text>
            </TouchableOpacity>
          ) : status === "LoadingMore" ? (
            <ActivityIndicator size="small" color="#6C5CE7" style={{ marginBottom: 12 }} />
          ) : null
        }
        renderItem={({ item }) => {
          const isMe = item.userId === currentUser?._id;
          return (
            <View
              style={[
                styles.messageBubble,
                isMe ? styles.myMessage : styles.theirMessage,
              ]}
            >
              {!isMe && (
                <Text style={styles.senderName}>{item.userName}</Text>
              )}
              <Text
                style={[
                  styles.messageText,
                  isMe ? styles.myMessageText : styles.theirMessageText,
                ]}
              >
                {item.body}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  isMe ? styles.myMessageTime : styles.theirMessageTime,
                ]}
              >
                {new Date(item._creationTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          status === "LoadingFirstPage" ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#6C5CE7" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Say hi!</Text>
            </View>
          )
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#6C5CE7",
    paddingTop: Platform.OS === "android" ? 40 : 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  signOutButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#6C5CE7",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E8E6F0",
  },
  senderName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6C5CE7",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: "#fff",
  },
  theirMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: "rgba(255,255,255,0.6)",
  },
  theirMessageTime: {
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E8E6F0",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F8F7FF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: "#333",
  },
  sendButton: {
    backgroundColor: "#6C5CE7",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
