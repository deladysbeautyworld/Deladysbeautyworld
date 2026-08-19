import { useState } from "react";
import { Link } from "react-router-dom";

export default function Cookies() {
  const [prefs, setPrefs] = useState({ analytics: true, marketing: false });

  function toggle(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="min-h-[80vh] flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-4">De Lady's Beauty World</Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">Cookie settings</h1>
          <p className="text-[13px] text-(--color-muted) font-light">Manage which cookies you allow. Necessary cookies are always enabled.</p>
        </div>

        <div className="grid gap-6">
          <div className="p-4 border border-(--color-border) rounded-sm flex items-center justify-between">
            <div>
              <p className="font-medium">Necessary cookies</p>
              <p className="text-[13px] text-(--color-muted)">Required for the site to function.</p>
            </div>
            <div className="text-[13px] text-(--color-faint)">Enabled</div>
          </div>

          <div className="p-4 border border-(--color-border) rounded-sm flex items-center justify-between">
            <div>
              <p className="font-medium">Analytics cookies</p>
              <p className="text-[13px] text-(--color-muted)">Helps us understand site usage.</p>
            </div>
            <button onClick={() => toggle('analytics')} className="h-8 px-3 border rounded-sm">{prefs.analytics ? 'On' : 'Off'}</button>
          </div>

          <div className="p-4 border border-(--color-border) rounded-sm flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing cookies</p>
              <p className="text-[13px] text-(--color-muted)">Used to personalise promotions.</p>
            </div>
            <button onClick={() => toggle('marketing')} className="h-8 px-3 border rounded-sm">{prefs.marketing ? 'On' : 'Off'}</button>
          </div>

          <div className="mt-4">
            <button className="h-11 bg-(--color-ink) text-(--color-cream) rounded-sm px-6">Save settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
