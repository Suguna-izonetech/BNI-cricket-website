import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RegisterPageForm from "@/components/RegisterPage";

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <RegisterPageForm />
      </main>
      <Footer />
    </div>
  );
};

export default RegisterPage;
