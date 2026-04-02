import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Index from "./pages/Index";
import LiveScoresPage from "./pages/LiveScoresPage";
import RegisterPage from "./pages/RegisterPage";
import GroupPage from "./pages/GroupPage";
import GroupMatchesPage from "./pages/GroupMatchesPage";
import PointsTablePage from "./pages/PointsTablePage";
import MatchesPage from "./pages/MatchesPage";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "live-scores",
        element: <LiveScoresPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "group",
        element: <GroupPage />,
      },
      {
        path: "group/:id",
        element: <GroupMatchesPage />,
      },
      {
        path: "points-table",
        element: <PointsTablePage />,
      },
      {
        path: "matches",
        element: <MatchesPage />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);