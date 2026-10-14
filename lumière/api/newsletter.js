import { Resend } from "resend";
import { validEmail } from "../server/email.js";

const json = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed." });
  }

  const { email, consent, website } = req.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : email;
  if (website) return json(res, 400, { error: "Invalid submission." });
  if (!validEmail(normalizedEmail) || consent !== true) {
    return json(res, 400, { error: "Enter a valid email and confirm you want to receive updates." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    console.error("Newsletter signup is missing RESEND_API_KEY or RESEND_AUDIENCE_ID.");
    return json(res, 500, { error: "Newsletter signup is not configured yet." });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.contacts.create({
      audienceId,
      email: normalizedEmail,
      unsubscribed: false,
    });
    if (error) {
      const { data: existingContact, error: lookupError } = await resend.contacts.get({
        audienceId,
        email: normalizedEmail,
      });
      if (lookupError || !existingContact) {
        throw new Error(error.message || "Could not subscribe this email.");
      }
      if (existingContact.unsubscribed) {
        const { error: updateError } = await resend.contacts.update({
          audienceId,
          email: normalizedEmail,
          unsubscribed: false,
        });
        if (updateError) throw new Error(updateError.message || "Could not update newsletter consent.");
      } else if (existingContact.unsubscribed !== false) {
        throw new Error("Could not verify the existing newsletter subscription.");
      }
    }
    return json(res, 200, { subscribed: true });
  } catch (error) {
    console.error("Could not subscribe newsletter contact:", error);
    return json(res, 502, { error: "Could not subscribe right now. Please try again." });
  }
}
