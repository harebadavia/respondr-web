import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResidentDashboard from "./pages/ResidentDashboard";
import OfficialDashboard from "./pages/OfficialDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ResidentLayout from "./layouts/ResidentLayout";
import OfficialLayout from "./layouts/OfficialLayout";
import AdminLayout from "./layouts/AdminLayout";
import ResidentIncidentsNew from "./pages/ResidentIncidentsNew";
import ResidentIncidentsList from "./pages/ResidentIncidentsList";
import ResidentIncidentDetail from "./pages/ResidentIncidentDetail";
import OfficialIncidents from "./pages/OfficialIncidents";
import OfficialMap from "./pages/OfficialMap";
import OfficialLocations from "./pages/OfficialLocations";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/resident"
          element={
            <ProtectedRoute requiredRoles={["resident"]}>
              <ResidentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ResidentDashboard />} />
          <Route path="incidents/new" element={<ResidentIncidentsNew />} />
          <Route path="incidents" element={<ResidentIncidentsList />} />
          <Route path="incidents/:id" element={<ResidentIncidentDetail />} />
        </Route>

        <Route
          path="/official"
          element={
            <ProtectedRoute requiredRoles={["official", "admin"]}>
              <OfficialLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<OfficialDashboard />} />
          <Route path="incidents" element={<OfficialIncidents />} />
          <Route path="map" element={<OfficialMap />} />
          <Route path="locations" element={<OfficialLocations />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
