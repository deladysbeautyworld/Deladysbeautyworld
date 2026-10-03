import { createClient } from "@supabase/supabase-js";

export const ADMIN_ROLES = new Set(["admin", "developer", "staff"]);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new HttpError(500, "Server database access is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requireAdmin(req, supabase) {
  const authorization = req.headers.authorization;
  const token =
    typeof authorization === "string" && authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";
  if (!token) throw new HttpError(401, "Sign in to an admin account.");

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Your session is invalid or expired.");
  if (!ADMIN_ROLES.has(data.user.app_metadata?.role)) {
    throw new HttpError(403, "Admin access is required.");
  }

  return data.user;
}

export function sendError(res, error) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("Admin push API request failed:", error);
  return res.status(500).json({ error: "Could not process the notification request." });
}
