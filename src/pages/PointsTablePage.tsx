import Navbar from "@/components/Navbar";
import PointsTable from "@/components/PointsTable";
import Footer from "@/components/Footer";

const PointsTablePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <PointsTable />
      </main>
      <Footer />
    </div>
  );
};

export default PointsTablePage;
