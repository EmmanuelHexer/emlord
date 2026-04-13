import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Throw a user-facing error. Only ConvexError messages reach the client.
 */
export function throwError(message: string): never {
  throw new ConvexError(message);
}

/**
 * Get the authenticated user ID or throw a user-facing error.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("You must be signed in");
  return userId;
}

/**
 * Validate a string field. Returns trimmed value.
 */
export function validateString(
  value: string,
  fieldName: string,
  opts?: { min?: number; max?: number }
): string {
  const trimmed = value.trim();
  const min = opts?.min ?? 1;
  const max = opts?.max ?? 10000;
  if (trimmed.length < min) {
    throw new ConvexError(`${fieldName} must be at least ${min} character${min > 1 ? "s" : ""}`);
  }
  if (trimmed.length > max) {
    throw new ConvexError(`${fieldName} must be under ${max} characters`);
  }
  return trimmed;
}
