import Navbar from "@/components/Navbar";
import LiveScores from "@/components/LiveScores";
import Footer from "@/components/Footer";

const LiveScoresPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <LiveScores />
      </main>
      <Footer />
    </div>
  );
};

export default LiveScoresPage;
