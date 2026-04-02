import Navbar from "@/components/Navbar";
import MatchSetupSection from "@/components/MatchSetupSection";
import Footer from "@/components/Footer";

const RevealMatchPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <MatchSetupSection />
      </main>
      <Footer />
    </div>
  );
};

export default RevealMatchPage;
