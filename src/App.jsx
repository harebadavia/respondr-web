import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ResidentDashboard from "./pages/ResidentDashboard";
import OfficialDashboard from "./pages/OfficialDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/resident"
          element={
            <ProtectedRoute requiredRole="resident">
              <ResidentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/official"
          element={
            <ProtectedRoute requiredRole="official">
              <OfficialDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;