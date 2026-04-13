import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { showError } from "../../lib/errorHandler";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef, useMemo, useCallback } from "react";
import { Id } from "../../convex/_generated/dataModel";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id as Id<"conversations">;
  const router = useRouter();

  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.list,
    { conversationId },
    { initialNumItems: 30 }
  );

  const currentUser = useQuery(api.users.currentUser);
  const conversations = useQuery(api.conversations.list);
  const sendMessage = useMutation(api.messages.send);

  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const conversation = conversations?.find((c) => c._id === conversationId);

  const groupedMessages = useMemo(() => {
    if (!results) return [];
    return results.map((msg, i) => {
      const newer = i > 0 ? results[i - 1] : null;
      const older = i < results.length - 1 ? results[i + 1] : null;
      const isFirstInGroup =
        !newer ||
        newer.authorId !== msg.authorId ||
        newer._creationTime - msg._creationTime > 3 * 60 * 1000;
      const isLastInGroup =
        !older ||
        older.authorId !== msg.authorId ||
        msg._creationTime - older._creationTime > 3 * 60 * 1000;
      const showDateHeader =
        !older ||
        new Date(older._creationTime).toDateString() !==
          new Date(msg._creationTime).toDateString();
      return { ...msg, isFirstInGroup, isLastInGroup, showDateHeader };
    });
  }, [results]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    try {
      await sendMessage({ conversationId, body: trimmed });
    } catch (e: unknown) {
      setText(trimmed);
      showError(e);
    }
  }, [text, conversationId, sendMessage]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D14" />

      {/* Header stays OUTSIDE KeyboardAvoidingView so it never moves */}
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
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
      </SafeAreaView>

      {/* Only the messages + input move with keyboard */}
      <KeyboardAvoidingView style={styles.body} behavior="padding">
        <FlatList
          ref={flatListRef}
          inverted
          data={groupedMessages}
          keyExtractor={(item) => item._id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (status === "CanLoadMore") loadMore(20);
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            status === "LoadingMore" ? (
              <ActivityIndicator
                size="small"
                color="#2563EB"
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
          renderItem={({ item }) => {
            const isMe = item.authorId === currentUser?._id;
            return (
              <View>
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
                    { marginBottom: item.isFirstInGroup ? 10 : 2 },
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.myBubble : styles.theirBubble,
                      isMe && item.isFirstInGroup && styles.myBubbleTail,
                      !isMe && item.isFirstInGroup && styles.theirBubbleTail,
                    ]}
                  >
                    {!isMe &&
                      item.isLastInGroup &&
                      conversation?.type === "group" && (
                        <Text style={styles.senderName}>{item.userName}</Text>
                      )}
                    <Text
                      style={isMe ? styles.myText : styles.theirText}
                    >
                      {item.body}
                    </Text>
                    <Text
                      style={[
                        styles.timeStamp,
                        isMe ? styles.myTime : styles.theirTime,
                      ]}
                    >
                      {new Date(item._creationTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            status === "LoadingFirstPage" ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Send the first message</Text>
              </View>
            )
          }
        />

        <SafeAreaView edges={["bottom"]} style={styles.inputSafe}>
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
              style={[
                styles.sendButton,
                !text.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!text.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
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
  screen: {
    flex: 1,
    backgroundColor: "#0D0D14",
  },
  headerSafe: {
    backgroundColor: "#0D0D14",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1A1A26",
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
  body: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  /* All messages on the left — no flexDirection row needed */
  messageRow: {
    paddingHorizontal: 4,
  },
  bubble: {
    alignSelf: "flex-start",
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  myBubble: {
    backgroundColor: "#1E293B",
  },
  theirBubble: {
    backgroundColor: "#1A1A26",
  },
  myBubbleTail: {
    borderBottomLeftRadius: 6,
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
  myText: {
    color: "#F1F5F9",
    fontSize: 16,
    lineHeight: 22,
  },
  theirText: {
    color: "#E5E5E5",
    fontSize: 16,
    lineHeight: 22,
  },
  timeStamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myTime: {
    color: "#64748B",
  },
  theirTime: {
    color: "#555",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  inputSafe: {
    backgroundColor: "#0D0D14",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
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
