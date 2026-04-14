import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity: pulse },
        style,
      ]}
    />
  );
}

export function ConversationSkeleton() {
  return (
    <View style={styles.conversationRow}>
      <Skeleton width={52} height={52} borderRadius={18} />
      <View style={styles.conversationInfo}>
        <Skeleton width="60%" height={15} borderRadius={6} />
        <View style={{ height: 8 }} />
        <Skeleton width="85%" height={13} borderRadius={6} />
      </View>
    </View>
  );
}

export function UserSkeleton() {
  return (
    <View style={styles.userRow}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={styles.conversationInfo}>
        <Skeleton width="45%" height={14} borderRadius={6} />
        <View style={{ height: 6 }} />
        <Skeleton width="70%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#1A1A26",
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 14,
  },
});
