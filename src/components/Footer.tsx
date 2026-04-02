import brandImage from "@/assets/Cricket_logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-[linear-gradient(180deg,rgba(var(--surface-dim-rgb),0.55),rgba(var(--background-rgb),0.92))] py-12 px-4 shadow-[0_-8px_24px_rgba(var(--dark-surface-rgb),0.08)]">
      <div className="container mx-auto text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <img src={brandImage} alt="Brand logo" className="h-14 w-auto object-contain md:h-16" />
        </div>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          <span className="block">BN1 TRICHY PREMIER LEAGUE 2026</span>
          <span className="block">Building Business Beyond Boundaries</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
