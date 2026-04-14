import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { showError } from "../lib/errorHandler";

interface SetNameProps {
  onDone: () => void;
}

export function SetName({ onDone }: SetNameProps) {
  const setName = useMutation(api.profile.setName);
  const [name, setLocalName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await setName({ name: name.trim() });
      onDone();
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [name, setName, onDone]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>What's your name?</Text>
        <Text style={styles.subtitle}>
          This is how others will see you in chats.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setLocalName}
          autoCapitalize="words"
          autoFocus
          maxLength={50}
          onSubmitEditing={handleSubmit}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!name.trim() || loading) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!name.trim() || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D14",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F9FAFB",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#1A1A26",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#2A2A3A",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
