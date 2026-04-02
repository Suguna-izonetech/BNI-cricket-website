import Navbar from "@/components/Navbar";
import GroupsSection from "@/components/GroupsSection";
import Footer from "@/components/Footer";

const GroupPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] pt-16">
        <GroupsSection />
      </main>
      <Footer />
    </div>
  );
};

export default GroupPage;
