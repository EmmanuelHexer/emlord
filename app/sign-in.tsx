import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";

export function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      await signIn("password", {
        email,
        password,
        flow,
        ...(flow === "signUp" ? { name } : {}),
      });
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [email, password, flow, name, signIn]);

  const toggleFlow = useCallback(() => {
    setFlow((f) => (f === "signIn" ? "signUp" : "signIn"));
    setError("");
    setShowPassword(false);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Ethreal</Text>
          <Text style={styles.subtitle}>
            {flow === "signIn" ? "Welcome back" : "Create your account"}
          </Text>
        </View>

        <View style={styles.card}>
          {flow === "signUp" && (
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#6B7280"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={flow === "signIn" ? "Enter password" : "Create a password"}
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                spellCheck={false}
              />
              <Pressable
                onPress={() => setShowPassword((s) => !s)}
                style={styles.eyeButton}
                hitSlop={8}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Please wait..."
                : flow === "signIn"
                  ? "Sign In"
                  : "Create Account"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={toggleFlow}
          style={styles.switchButton}
          activeOpacity={0.7}
        >
          <Text style={styles.switchText}>
            {flow === "signIn"
              ? "Don\u2019t have an account? "
              : "Already have an account? "}
            <Text style={styles.switchTextBold}>
              {flow === "signIn" ? "Sign Up" : "Sign In"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111118",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#F9FAFB",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: "#2A2A3A",
  },
  inputWrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#111118",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#2A2A3A",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111118",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A3A",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#F9FAFB",
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeIcon: {
    fontSize: 13,
    color: "#6C5CE7",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#6C5CE7",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  error: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
  },
  switchButton: {
    marginTop: 24,
    alignItems: "center",
  },
  switchText: {
    color: "#6B7280",
    fontSize: 14,
  },
  switchTextBold: {
    color: "#6C5CE7",
    fontWeight: "600",
  },
});
