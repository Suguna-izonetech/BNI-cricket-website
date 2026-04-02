import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TeamsSection from "@/components/TeamsSection";
import VideosSection from "@/components/VideosSection";
import SponsorsSection from "@/components/SponsorsSection";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    const target = (location.state as { scrollTarget?: string } | null)?.scrollTarget;
    if (target) {
      window.setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.key, location.state]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TeamsSection />
      <VideosSection />
      <SponsorsSection />
      <Footer />
    </div>
  );
};

export default Index;
