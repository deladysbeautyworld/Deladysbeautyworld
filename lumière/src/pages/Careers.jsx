import { Link } from "react-router-dom";
import SEOMeta from "../utils/seo";

const OPENINGS = [
  { id: 1, title: "Customer Support Representative", location: "Remote / Lagos" },
  { id: 2, title: "Content & Social Media Associate", location: "Lagos" },
];

export default function Careers() {
  return (
    <>
      <SEOMeta
        title="Careers"
        description="Explore current career opportunities with De Lady's Beauty World."
        canonical="https://deladysbeautyworld.com/careers"
      />
      <div className="min-h-[80vh] flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link to="/" className="font-display text-[24px] italic font-light text-(--color-ink) block mb-4">De Lady's Beauty World</Link>
          <h1 className="font-display text-[28px] font-light text-(--color-ink) mb-2">Careers</h1>
          <p className="text-[13px] text-(--color-muted) font-light">Join our team — see open roles below and apply by sending your CV to careers@deladys.ng.</p>
        </div>

        <div className="grid gap-4">
          {OPENINGS.map((o) => (
            <div key={o.id} className="p-4 border border-(--color-border) rounded-sm flex items-center justify-between">
              <div>
                <p className="font-medium">{o.title}</p>
                <p className="text-[13px] text-(--color-muted)">{o.location}</p>
              </div>
              <a href="mailto:careers@deladys.ng" className="h-9 px-4 bg-(--color-ink) text-(--color-cream) rounded-sm flex items-center">Apply</a>
            </div>
          ))}
        </div>
      </div>
      </div>
    </>
  );
}
