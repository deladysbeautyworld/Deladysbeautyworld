import {
  createServiceClient,
  HttpError,
  requireAdmin,
  sendError,
} from "../server/adminPush.js";
import { sendAdminPush } from "../server/sendAdminPush.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createServiceClient();
    const user = await requireAdmin(req, supabase);
    const result = await sendAdminPush(
      supabase,
      {
        title: "Test notification",
        body: "Push alerts are working on this device.",
        url: "/admin/orders",
        tag: `admin-push-test-${Date.now()}`,
      },
      user.id
    );
    if (!result.sent) {
      throw new HttpError(409, "No saved notification devices found. Enable alerts first.");
    }
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
}
