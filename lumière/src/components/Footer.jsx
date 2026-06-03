const FOOTER_LINKS = {
  Shop: ["All products", "Best sellers", "New arrivals", "Bundles", "Sale"],
  Help: ["Track my order", "Returns & exchanges", "Shipping info", "FAQ", "Contact us"],
  Company: ["About Lumière", "Our ingredients", "Sustainability", "Journal", "Careers"],
};

const SOCIALS = [
  { label: "Instagram", path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zm1.5-4.87h.01M6.5 6.5h11A1.5 1.5 0 0 1 19 8v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 16V8A1.5 1.5 0 0 1 6.5 6.5z" },
  { label: "TikTok", path: "M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" },
  { label: "Pinterest", path: "M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.76 1.22-5.14 1.22-5.14s-.31-.62-.31-1.54c0-1.45.84-2.53 1.88-2.53.89 0 1.32.67 1.32 1.47 0 .9-.57 2.24-.86 3.48-.24 1.04.51 1.89 1.53 1.89 1.83 0 3.07-2.33 3.07-5.08 0-2.1-1.42-3.68-3.99-3.68-2.91 0-4.73 2.17-4.73 4.59 0 .83.24 1.42.62 1.88.09.11.1.2.07.32-.06.26-.2.86-.23.98-.04.16-.16.22-.3.16-1.11-.45-1.63-1.67-1.63-3.03 0-2.83 2.38-6.22 7.12-6.22 3.81 0 6.33 2.76 6.33 5.73 0 3.93-2.17 6.87-5.38 6.87-1.08 0-2.09-.58-2.44-1.24l-.66 2.54c-.24.93-.88 2.09-1.31 2.79.99.3 2.04.47 3.12.47 5.52 0 10-4.48 10-10S17.52 2 12 2z" },
];

export default function Footer() {
  return (
    <footer className="border-t border-(--color-border) bg-[#F5F3EE]">
      <div className="px-6 md:px-10 pt-12 pb-6">

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-[20px] italic font-light text-(--color-ink) mb-3">
              Lumière
            </p>
            <p className="text-[13px] text-(--color-faint) leading-[1.7] font-light mb-5 max-w-55">
              Clean skincare formulated for real skin. Conscious ingredients, honest pricing.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map(({ label, path }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 border border-[#C8C5BE] rounded-full flex items-center justify-center text-(--color-faint) hover:border-(--color-ink) hover:text-(--color-ink) transition-all duration-200"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={path}/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <p className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-5">
                {title}
              </p>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[13px] text-(--color-muted) hover:text-(--color-ink) transition-colors duration-200 font-light"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-(--color-border) pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-(--color-faint) font-light">
            © 2025 Lumière. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy policy", "Terms of service", "Cookie settings"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[12px] text-(--color-faint) hover:text-(--color-ink) transition-colors duration-200 font-light"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}