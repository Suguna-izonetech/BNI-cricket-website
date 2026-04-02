import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import brandImage from "../assets/Cricket_logo.png";

const navItems = ["Home", "Live Scores", "Matches", "Group", "Teams", "Points Table", "Videos", "Sponsors"];
const LIVE_SCORES_ROUTE = "/live-scores";
const REGISTER_ROUTE = "/register";
const POINTS_TABLE_ROUTE = "/points-table";
const MATCHES_ROUTE = "/matches";
const GROUP_ROUTE = "/group";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    if (id === "home") {
      if (location.pathname !== "/") {
        navigate("/");
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setOpen(false);
      return;
    }

    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTarget: id } });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setOpen(false);
  };

  const openPointsTable = () => {
    navigate(POINTS_TABLE_ROUTE);
    setOpen(false);
  };

  const openMatches = () => {
    navigate(MATCHES_ROUTE);
    setOpen(false);
  };

  const openLiveScores = () => {
    navigate(LIVE_SCORES_ROUTE);
    setOpen(false);
  };

  const openGroup = () => {
    navigate(GROUP_ROUTE);
    setOpen(false);
  };

  const openRegister = () => {
    navigate(REGISTER_ROUTE);
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-[linear-gradient(180deg,rgba(var(--surface-dim-rgb),0.96),rgba(var(--background-rgb),0.94))] shadow-[0_8px_24px_rgba(var(--dark-surface-rgb),0.2)] backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <img
            src={brandImage}
            alt="Brand logo"
            className="h-20 w-auto object-contain mix-blend-multiply contrast-125 saturate-125 brightness-95 drop-shadow-[0_4px_10px_rgba(var(--dark-surface-rgb),0.22)] md:h-24"
          />
        </div>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() =>
                item === "Points Table"
                  ? openPointsTable()
                  : item === "Matches"
                    ? openMatches()
                    : item === "Group"
                      ? openGroup()
                      : item === "Live Scores"
                        ? openLiveScores()
                        : scrollTo(item.toLowerCase().replace(/\s+/g, "-"))
              }
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {item}
            </button>
          ))}
          <button
            onClick={openRegister}
            className="gold-button text-sm"
          >
            Register
          </button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3">
          <button
            onClick={openRegister}
            className="gold-button block w-full text-center text-sm"
          >
            Register
          </button>
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() =>
                item === "Points Table"
                  ? openPointsTable()
                  : item === "Matches"
                    ? openMatches()
                    : item === "Group"
                      ? openGroup()
                      : item === "Live Scores"
                        ? openLiveScores()
                        : scrollTo(item.toLowerCase().replace(/\s+/g, "-"))
              }
              className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

