import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

export default function ResidentIncidentsList() {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMyReports() {
      try {
        const data = await apiRequest("/incidents/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIncidents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadMyReports();
    }
  }, [token]);

  if (loading) return <p>Loading reports...</p>;

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <section>
      <h1>My Reports</h1>

      {incidents.length === 0 ? (
        <p>No reports yet.</p>
      ) : (
        <ul>
          {incidents.map((incident) => (
            <li key={incident.id} style={{ marginBottom: 10 }}>
              <Link to={`/resident/incidents/${incident.id}`}>
                {incident.title}
              </Link>{" "}
              <span>({incident.status})</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
