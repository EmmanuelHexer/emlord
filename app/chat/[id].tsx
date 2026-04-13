import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { showError } from "../../lib/errorHandler";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { Id } from "../../convex/_generated/dataModel";
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

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id as Id<"conversations">;
  const router = useRouter();

  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.list,
    { conversationId },
    { initialNumItems: 30 }
  );
  const messages = useMemo(
    () => (results ? [...results].reverse() : []),
    [results]
  );
  const currentUser = useQuery(api.users.currentUser);
  const conversations = useQuery(api.conversations.list);
  const sendMessage = useMutation(api.messages.send);

  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Find conversation display name
  const conversation = conversations?.find((c) => c._id === conversationId);

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
    try {
      await sendMessage({ conversationId, body: trimmed });
    } catch (e: unknown) {
      setText(trimmed);
      showError(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation?.displayName ?? "Chat"}
          </Text>
          {conversation?.type === "group" && (
            <Text style={styles.headerSubtitle}>
              {conversation.members.length} members
            </Text>
          )}
        </View>
        <View style={{ width: 50 }} />
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
          const isMe = item.authorId === currentUser?._id;
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
            placeholderTextColor="#6B7280"
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
    backgroundColor: "#111118",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1A1A24",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3A",
    paddingTop: Platform.OS === "android" ? 40 : 12,
  },
  backButton: {
    paddingRight: 12,
  },
  backText: {
    color: "#6C5CE7",
    fontSize: 16,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F9FAFB",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  loadMoreButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A3A",
  },
  loadMoreText: {
    color: "#6C5CE7",
    fontSize: 13,
    fontWeight: "500",
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
    backgroundColor: "#1A1A24",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#2A2A3A",
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
    color: "#F9FAFB",
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
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#1A1A24",
    borderTopWidth: 1,
    borderTopColor: "#2A2A3A",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#111118",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#2A2A3A",
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
