import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase.js";

const decodeApplicationServerKey = (key) => {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = `${key}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
};

async function saveSubscription(subscription) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("Your admin session has expired. Please sign in again.");

  const response = await fetch("/api/admin-push-subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "subscribe", subscription }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not save notification settings.");
}

export default function AdminPushSetup() {
  const supported =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification === "undefined" ? "default" : Notification.permission
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription && Notification.permission === "granted") {
          await saveSubscription(subscription);
          setSubscribed(true);
        }
      })
      .catch((subscriptionError) => {
        console.error("Could not restore admin push subscription:", subscriptionError);
        setError("Could not check notification settings. Try again.");
      });
  }, [supported]);

  const enableNotifications = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!supported) {
        throw new Error("Push notifications are not supported by this browser.");
      }
      const publicKey = import.meta.env.VITE_ADMIN_PUSH_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("Push notifications are not configured for this app yet.");
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        throw new Error("Allow notifications in your browser settings to receive new-order alerts.");
      }

      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeApplicationServerKey(publicKey),
        }));
      await saveSubscription(subscription);
      setSubscribed(true);
      setMessage("New-order notifications are enabled on this device.");
    } catch (enableError) {
      console.error("Could not enable admin push notifications:", enableError);
      setError(enableError.message || "Could not enable notifications.");
    } finally {
      setLoading(false);
    }
  };

  const disableNotifications = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setSubscribed(false);
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Your admin session has expired. Please sign in again.");

      const response = await fetch("/api/admin-push-subscriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "unsubscribe",
          endpoint: subscription.endpoint,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not remove this device.");

      const removed = await subscription.unsubscribe();
      if (!removed) throw new Error("The browser could not remove this device subscription.");
      setSubscribed(false);
      setMessage("New-order notifications are turned off on this device.");
    } catch (disableError) {
      console.error("Could not disable admin push notifications:", disableError);
      setError(disableError.message || "Could not turn off notifications.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-6 rounded-sm border border-(--color-border) bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[12px] font-medium text-(--color-ink)">
            New-order phone alerts
          </h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-(--color-muted)">
            {subscribed
              ? "This device will receive a private alert when an order arrives. Open the alert to view order details."
              : "Enable alerts on each phone or computer where you want to hear about new orders."}
          </p>
          {permission === "denied" && (
            <p className="mt-2 text-[11px] text-amber-700">
              Notifications are blocked in this browser. Allow them in browser settings, then try again.
            </p>
          )}
          {message && <p role="status" className="mt-2 text-[11px] text-green-700">{message}</p>}
          {error && <p role="alert" className="mt-2 text-[11px] text-red-700">{error}</p>}
          {supported && !subscribed && (
            <p className="mt-2 text-[11px] text-(--color-faint)">
              On iPhone, add this app to your Home Screen first, then open it there to enable alerts.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={subscribed ? disableNotifications : enableNotifications}
          disabled={loading || !supported}
          className="h-10 shrink-0 rounded-sm bg-(--color-ink) px-4 text-[10px] font-medium uppercase tracking-widest text-(--color-cream) transition-colors hover:bg-(--color-pink) disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Please wait…"
            : !supported
              ? "Not supported"
              : subscribed
                ? "Turn off alerts"
                : "Enable alerts"}
        </button>
      </div>
    </section>
  );
}
