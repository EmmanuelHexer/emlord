import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated,
  Pressable,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { useAuthActions } from "@convex-dev/auth/react";

const PIN_KEY = "ethreal_pin";
const PIN_LENGTH = 4;
const SECRET_TAPS = 7;

type Mode = "enter" | "setup" | "confirm" | "reset";

interface PinLockProps {
  onUnlock: () => void;
}

// Inner component that uses the auth context for PIN reset
function ResetForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signIn("password", { email: email.trim(), password, flow: "signIn" });
      // If signIn succeeds, the user is verified
      await SecureStore.deleteItemAsync(PIN_KEY);
      onSuccess();
    } catch {
      setError("Incorrect email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.resetContainer}>
      <Text style={styles.title}>Reset PIN</Text>
      <Text style={styles.subtitle}>Sign in to verify your identity</Text>

      <TextInput
        style={styles.resetInput}
        placeholder="Email"
        placeholderTextColor="#555"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />
      <TextInput
        style={styles.resetInput}
        placeholder="Password"
        placeholderTextColor="#555"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.resetButton, loading && styles.resetButtonDisabled]}
        onPress={handleVerify}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.resetButtonText}>
          {loading ? "Verifying..." : "Verify & Reset PIN"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

export function PinLock({ onUnlock }: PinLockProps) {
  const [mode, setMode] = useState<Mode>("enter");
  const [pin, setPin] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [error, setError] = useState("");
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [shakeAnim] = useState(new Animated.Value(0));

  // Temp client for reset flow
  const resetClient = useRef<ConvexReactClient | null>(null);

  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleSecretTap = useCallback(() => {
    if (mode !== "enter") return;
    tapCount.current += 1;

    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 2000);

    if (tapCount.current >= SECRET_TAPS) {
      tapCount.current = 0;
      // Create a temporary Convex client for the reset auth flow
      if (!resetClient.current) {
        resetClient.current = new ConvexReactClient(
          process.env.EXPO_PUBLIC_CONVEX_URL!,
          { unsavedChangesWarning: false }
        );
      }
      setMode("reset");
      setPin("");
      setError("");
    }
  }, [mode]);

  const handleResetSuccess = useCallback(() => {
    // PIN deleted, go to setup
    setMode("setup");
    setPin("");
    setSetupPin("");
    setError("");
  }, []);

  const handleResetCancel = useCallback(() => {
    setMode("enter");
    setError("");
  }, []);

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

  // Reset screen with temporary Convex provider
  if (mode === "reset" && resetClient.current) {
    const secureStorage = {
      getItem: SecureStore.getItemAsync,
      setItem: SecureStore.setItemAsync,
      removeItem: SecureStore.deleteItemAsync,
    };
    return (
      <View style={styles.container}>
        <ConvexAuthProvider client={resetClient.current} storage={secureStorage}>
          <ResetForm onSuccess={handleResetSuccess} onCancel={handleResetCancel} />
        </ConvexAuthProvider>
      </View>
    );
  }

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
        <Pressable onPress={handleSecretTap}>
          <Text style={styles.appName}>Ethreal</Text>
        </Pressable>
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
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#F9FAFB",
    letterSpacing: 1,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
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
  // Reset screen
  resetContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  resetInput: {
    backgroundColor: "#1A1A26",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#F9FAFB",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A3A",
  },
  resetButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: 20,
  },
  cancelText: {
    color: "#666",
    fontSize: 14,
  },
});
