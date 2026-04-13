import { ConvexError } from "convex/values";
import { Alert } from "react-native";

/**
 * Extract a user-friendly message from any error.
 * - ConvexError → uses the custom data string from the backend
 * - Known auth error patterns → mapped to friendly messages
 * - Everything else → generic fallback
 */
export function getFriendlyError(error: unknown): string {
  if (error instanceof ConvexError) {
    return typeof error.data === "string"
      ? error.data
      : "Something went wrong. Please try again.";
  }

  const msg =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("password")) {
    return "Incorrect email or password";
  }
  if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
    return "An account with this email already exists";
  }
  if (msg.includes("not found") || msg.includes("no user")) {
    return "No account found with this email";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("offline")) {
    return "No internet connection. Please check your network.";
  }
  if (msg.includes("timeout")) {
    return "Request timed out. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

/**
 * Show an error alert. Use this in catch blocks for mutations.
 */
export function showError(error: unknown, title = "Oops") {
  Alert.alert(title, getFriendlyError(error));
}
