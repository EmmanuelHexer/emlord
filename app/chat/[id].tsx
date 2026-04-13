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
  Platform,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  // Group consecutive messages from same sender
  const groupedMessages = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = i > 0 ? messages[i - 1] : null;
      const next = i < messages.length - 1 ? messages[i + 1] : null;
      const isFirstInGroup = !prev || prev.authorId !== msg.authorId ||
        msg._creationTime - prev._creationTime > 3 * 60 * 1000;
      const isLastInGroup = !next || next.authorId !== msg.authorId ||
        next._creationTime - msg._creationTime > 3 * 60 * 1000;

      // Date separator
      const showDateHeader = !prev ||
        new Date(prev._creationTime).toDateString() !== new Date(msg._creationTime).toDateString();

      return { ...msg, isFirstInGroup, isLastInGroup, showDateHeader };
    });
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D14" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation?.displayName ?? "Chat"}
          </Text>
          {conversation?.type === "group" && (
            <Text style={styles.headerMembers}>
              {conversation.members.length} members
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={groupedMessages}
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
            <ActivityIndicator size="small" color="#2563EB" style={{ marginBottom: 16 }} />
          ) : null
        }
        renderItem={({ item }) => {
          const isMe = item.authorId === currentUser?._id;
          return (
            <>
              {item.showDateHeader && (
                <View style={styles.dateHeader}>
                  <Text style={styles.dateHeaderText}>
                    {formatDateHeader(item._creationTime)}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.messageRow,
                  isMe ? styles.messageRowRight : styles.messageRowLeft,
                  { marginTop: item.isFirstInGroup ? 12 : 2 },
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.myBubble : styles.theirBubble,
                    isMe && item.isLastInGroup && styles.myBubbleTail,
                    !isMe && item.isLastInGroup && styles.theirBubbleTail,
                  ]}
                >
                  {!isMe && item.isFirstInGroup && conversation?.type === "group" && (
                    <Text style={styles.senderName}>{item.userName}</Text>
                  )}
                  <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                    {item.body}
                  </Text>
                  <Text style={[styles.timeStamp, isMe ? styles.myTime : styles.theirTime]}>
                    {new Date(item._creationTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            </>
          );
        }}
        ListEmptyComponent={
          status === "LoadingFirstPage" ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👋</Text>
              <Text style={styles.emptyText}>Send the first message</Text>
            </View>
          )
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor="#555"
          multiline
          maxLength={1000}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function formatDateHeader(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D14",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0D0D14",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1A1A26",
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "300",
    marginTop: -2,
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F9FAFB",
  },
  headerMembers: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  loadMoreButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#1A1A26",
    borderRadius: 20,
  },
  loadMoreText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "500",
  },
  dateHeader: {
    alignSelf: "center",
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginVertical: 12,
    backgroundColor: "#1A1A26",
    borderRadius: 12,
  },
  dateHeaderText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  myBubble: {
    backgroundColor: "#2563EB",
  },
  theirBubble: {
    backgroundColor: "#1A1A26",
  },
  myBubbleTail: {
    borderBottomRightRadius: 6,
  },
  theirBubbleTail: {
    borderBottomLeftRadius: 6,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
    marginBottom: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myText: {
    color: "#fff",
  },
  theirText: {
    color: "#E5E5E5",
  },
  timeStamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myTime: {
    color: "rgba(255,255,255,0.5)",
  },
  theirTime: {
    color: "#555",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0D0D14",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1A1A26",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#1A1A26",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 16,
    maxHeight: 120,
    color: "#F9FAFB",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#1A1A26",
  },
  sendIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: -1,
  },
});
