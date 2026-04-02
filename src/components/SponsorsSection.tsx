import { useState } from "react";
import { SPONSOR_LOGOS } from "@/lib/logos";

const sponsors = [
  { name: "Tata", tier: "Title Sponsor" },
  { name: "Dream11", tier: "Official Partner" },
  { name: "CRED", tier: "Official Partner" },
  { name: "Swiggy", tier: "Official Partner" },
  { name: "Jio", tier: "Digital Streaming" },
  { name: "Upstox", tier: "Official Partner" },
  { name: "PhonePe", tier: "Official Partner" },
  { name: "Unacademy", tier: "Education Partner" },
];

const SponsorLogo = ({ name }: { name: string }) => {
  const [failed, setFailed] = useState(false);
  const src = SPONSOR_LOGOS[name];

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-md bg-muted text-lg font-bold text-primary">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      className="h-full w-full object-contain"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

const SponsorsSection = () => {
  return (
    <section id="sponsors" className="bg-ipl-surface px-4 py-16">
      <div className="container mx-auto">
        <h2 className="mb-8 text-center font-heading text-3xl font-bold uppercase text-foreground md:text-4xl">
          Official Sponsors
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {sponsors.map((sponsor, index) => (
            <div
              key={sponsor.name}
              className="gold-panel block p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:glow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary animate-fade-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                <SponsorLogo name={sponsor.name} />
              </div>
              <h3 className="font-heading font-semibold text-foreground">{sponsor.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{sponsor.tier}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SponsorsSection;
