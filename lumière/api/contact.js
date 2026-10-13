import { escapeHtml, sendEmail, validEmail } from "../server/email.js";

const json = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed." });
  }

  const { name, email, message, website } = req.body ?? {};
  if (website) return json(res, 400, { error: "Invalid submission." });
  if (
    typeof name !== "string" || !name.trim() || name.length > 120 ||
    !validEmail(email) ||
    typeof message !== "string" || !message.trim() || message.length > 5000
  ) {
    return json(res, 400, { error: "Enter your name, a valid email, and a message under 5,000 characters." });
  }

  const inbox = process.env.CONTACT_INBOX_EMAIL;
  if (!inbox) {
    console.error("Contact form is missing CONTACT_INBOX_EMAIL.");
    return json(res, 500, { error: "Contact form is not configured. Please email support directly." });
  }

  try {
    await sendEmail({
      to: inbox,
      replyTo: email.trim(),
      subject: `Website enquiry from ${name.trim().replace(/[\r\n]+/g, " ").slice(0, 100)}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name.trim())}</p><p><strong>Email:</strong> ${escapeHtml(email.trim())}</p><p>${escapeHtml(message.trim()).replace(/\r?\n/g, "<br>")}</p>`,
      text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
    });
    return json(res, 200, { sent: true });
  } catch (error) {
    console.error("Could not deliver contact form message:", error);
    return json(res, 502, { error: "Could not send your message. Please try again." });
  }
}
