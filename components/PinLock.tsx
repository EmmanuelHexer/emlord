import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated,
} from "react-native";
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "ethreal_pin";
const PIN_LENGTH = 4;

type Mode = "enter" | "setup" | "confirm";

interface PinLockProps {
  onUnlock: () => void;
}

export function PinLock({ onUnlock }: PinLockProps) {
  const [mode, setMode] = useState<Mode>("enter");
  const [pin, setPin] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [error, setError] = useState("");
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [shakeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    SecureStore.getItemAsync(PIN_KEY).then((stored) => {
      if (stored) {
        setHasPin(true);
        setMode("enter");
      } else {
        setHasPin(false);
        setMode("setup");
      }
    });
  }, []);

  const shake = useCallback(() => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handlePress = useCallback(
    async (digit: string) => {
      if (digit === "del") {
        setPin((p) => p.slice(0, -1));
        setError("");
        return;
      }

      const newPin = pin + digit;
      if (newPin.length > PIN_LENGTH) return;
      setPin(newPin);
      setError("");

      if (newPin.length === PIN_LENGTH) {
        if (mode === "setup") {
          setSetupPin(newPin);
          setPin("");
          setMode("confirm");
        } else if (mode === "confirm") {
          if (newPin === setupPin) {
            await SecureStore.setItemAsync(PIN_KEY, newPin);
            onUnlock();
          } else {
            shake();
            setPin("");
            setError("PINs don't match. Try again.");
            setMode("setup");
            setSetupPin("");
          }
        } else if (mode === "enter") {
          const stored = await SecureStore.getItemAsync(PIN_KEY);
          if (newPin === stored) {
            onUnlock();
          } else {
            shake();
            setPin("");
            setError("Wrong PIN");
          }
        }
      }
    },
    [pin, mode, setupPin, onUnlock, shake]
  );

  if (hasPin === null) return null;

  const title =
    mode === "setup"
      ? "Set your PIN"
      : mode === "confirm"
        ? "Confirm your PIN"
        : "Enter PIN";

  const subtitle =
    mode === "setup"
      ? "Choose a 4-digit PIN to lock Ethreal"
      : mode === "confirm"
        ? "Enter the same PIN again"
        : "";

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <Animated.View
          style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length && styles.dotFilled]}
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.keypad}>
        {[
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
          ["", "0", "del"],
        ].map((row, ri) => (
          <View key={ri} style={styles.keypadRow}>
            {row.map((digit) =>
              digit === "" ? (
                <View key="empty" style={styles.key} />
              ) : (
                <TouchableOpacity
                  key={digit}
                  style={styles.key}
                  onPress={() => handlePress(digit)}
                  activeOpacity={0.5}
                >
                  <Text style={styles.keyText}>
                    {digit === "del" ? "⌫" : digit}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D14",
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 40,
  },
  top: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  dots: {
    flexDirection: "row",
    gap: 16,
    marginTop: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  error: {
    color: "#EF4444",
    fontSize: 14,
    marginTop: 16,
  },
  keypad: {
    paddingHorizontal: 40,
    gap: 12,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  keyText: {
    fontSize: 28,
    color: "#F9FAFB",
    fontWeight: "400",
  },
});
