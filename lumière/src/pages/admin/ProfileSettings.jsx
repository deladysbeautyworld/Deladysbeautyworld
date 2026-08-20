import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { useAuthStore } from "../../stores/authStore";
import AdminPageHeader from "./components/AdminPageHeader.jsx";
import Field from "../../components/common/Field.jsx";

const inputClass =
  "w-full h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-white outline-none focus:border-(--color-pink) transition-colors font-light";

const submitBtn =
  "h-11 px-6 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-ink-soft) transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Admin profile settings — three independent sections:
 *
 *  1. Profile    — full_name, phone (saved to profiles table)
 *  2. Email      — change login email (requires current password, sends confirmation)
 *  3. Password   — change login password (requires current password)
 */
export default function ProfileSettings() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <div className="px-6 md:px-10 py-10 max-w-3xl">
        <AdminPageHeader
          title="Profile settings"
          subtitle="Manage your account details and login credentials."
        />

        <div className="flex flex-col gap-6">
          <ProfileSection />
          <EmailSection email={user?.email} />
          <PasswordSection />
        </div>
      </div>
    </div>
  );
}

/* ---- 1. Profile (name + phone) ---- */

function ProfileSection() {
  const user           = useAuthStore((s) => s.user);
  const updateProfile  = useAuthStore((s) => s.updateProfile);

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? "");
  const [phone, setPhone]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);

  // Pull the current profile row on mount so the phone field is pre-filled.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      if (data) {
        if (data.full_name) setFullName(data.full_name);
        if (data.phone) setPhone(data.phone);
      } else if (error && error.code !== "PGRST116") {
        setError(error.message);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProfile({ fullName, phone });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Profile" description="Your name and phone number appear on customer-facing emails and WhatsApp notifications.">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="Full name" required>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            className={inputClass}
            placeholder="Your full name"
          />
        </Field>

        <Field label="Phone number" hint="Used for WhatsApp order updates.">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            className={inputClass}
            placeholder="+234 800 000 0000"
          />
        </Field>

        <RowFeedback error={error} success={success} successMsg="Profile updated." />

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving || loading} className={submitBtn}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Section>
  );
}

/* ---- 2. Email ---- */

function EmailSection({ email }) {
  const updateEmail = useAuthStore((s) => s.updateEmail);

  const [newEmail, setNewEmail]       = useState("");
  const [currentPwd, setCurrentPwd]   = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);
  const [success, setSuccess]         = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newEmail === email) {
      setError("New email is the same as your current email.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateEmail({ newEmail, currentPassword: currentPwd });
      setSuccess(true);
      setNewEmail("");
      setCurrentPwd("");
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      title="Email"
      description="Changing your email requires your current password. Supabase will send a confirmation link to the new address."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="Current email">
          <input
            type="email"
            value={email ?? ""}
            disabled
            className={`${inputClass} bg-(--color-cream-dark) text-(--color-muted) cursor-not-allowed`}
          />
        </Field>

        <Field label="New email" required>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
            required
          />
        </Field>

        <Field label="Current password" required>
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            className={inputClass}
            placeholder="Enter your current password"
            required
          />
        </Field>

        <RowFeedback
          error={error}
          success={success}
          successMsg="Confirmation email sent. Check your new inbox to complete the change."
        />

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className={submitBtn}>
            {saving ? "Saving…" : "Update email"}
          </button>
        </div>
      </form>
    </Section>
  );
}

/* ---- 3. Password ---- */

function PasswordSection() {
  const updatePassword = useAuthStore((s) => s.updatePassword);

  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);
  const [success, setSuccess]         = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newPwd.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("New passwords don't match.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updatePassword({ currentPassword: currentPwd, newPassword: newPwd });
      setSuccess(true);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      title="Password"
      description="Choose a strong password. You'll need your current password to confirm the change."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="Current password" required>
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            className={inputClass}
            placeholder="Enter your current password"
            required
          />
        </Field>

        <Field label="New password" required hint="At least 8 characters.">
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
            required
          />
        </Field>

        <Field label="Confirm new password" required>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
            required
          />
        </Field>

        <RowFeedback error={error} success={success} successMsg="Password updated." />

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className={submitBtn}>
            {saving ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </Section>
  );
}

/* ---- shared bits ---- */

function Section({ title, description, children }) {
  return (
    <section className="bg-white border border-(--color-border) rounded-sm">
      <div className="px-6 py-5 border-b border-(--color-border)">
        <h2 className="font-display text-[20px] font-light text-(--color-ink)">
          {title}
        </h2>
        {description && (
          <p className="text-[12px] text-(--color-faint) font-light mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function RowFeedback({ error, success, successMsg }) {
  if (error) {
    return (
      <p className="text-[12px] text-(--color-error) font-light">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="text-[12px] text-(--color-success) font-light">
        {successMsg}
      </p>
    );
  }
  return null;
}
