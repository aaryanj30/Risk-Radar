import {
  ChevronLeft,
  ChevronRight,
  Database,
  Network,
  Search,
  Table
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";

function CSVViewer() {
  const [loading, setLoading] = useState(true);
  const [rawCsvData, setRawCsvData] = useState({ applications: [], graph: [], risk: [] });
  const [activeCsvTable, setActiveCsvTable] = useState("applications"); // "applications" | "graph" | "risk"
  const [csvSearchQuery, setCsvSearchQuery] = useState("");
  const [csvPage, setCsvPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    api.get("/graph/")
      .then((res) => {
        if (res.data.raw_csv) {
          setRawCsvData(res.data.raw_csv);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching CSV data:", err);
        setLoading(false);
      });
  }, []);

  // Reset CSV page on tab/search change
  useEffect(() => {
    setCsvPage(1);
  }, [csvSearchQuery, activeCsvTable]);

  // CSV Tab Calculations
  let filteredCsvItems = [];
  if (activeCsvTable === "applications") {
    filteredCsvItems = (rawCsvData.applications || []).filter(item =>
      (item.app_id || "").toLowerCase().includes(csvSearchQuery.toLowerCase()) ||
      (item.vendor || "").toLowerCase().includes(csvSearchQuery.toLowerCase()) ||
      (item.application || "").toLowerCase().includes(csvSearchQuery.toLowerCase()) ||
      (item.base_risk || "").toLowerCase().includes(csvSearchQuery.toLowerCase())
    );
  } else if (activeCsvTable === "graph") {
    filteredCsvItems = (rawCsvData.graph || []).filter(item =>
      (item.source || "").toLowerCase().includes(csvSearchQuery.toLowerCase()) ||
      (item.target || "").toLowerCase().includes(csvSearchQuery.toLowerCase()) ||
      (item.weight || "").toLowerCase().includes(csvSearchQuery.toLowerCase())
    );
  } else {
    filteredCsvItems = (rawCsvData.risk || []).filter(item =>
      (item.node || "").toLowerCase().includes(csvSearchQuery.toLowerCase()) ||
      (item.propagated_risk || "").toLowerCase().includes(csvSearchQuery.toLowerCase())
    );
  }

  const totalPages = Math.max(1, Math.ceil(filteredCsvItems.length / itemsPerPage));
  const paginatedCsvItems = filteredCsvItems.slice(
    (csvPage - 1) * itemsPerPage,
    csvPage * itemsPerPage
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div className="pulse-dot" style={{ width: "24px", height: "24px" }}></div>
        <span style={{ marginLeft: "16px", color: "var(--text-secondary)" }}>Loading source CSV records...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", gap: "20px" }}>
      <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "20px", flexGrow: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>

          {/* Table Selector Tabs */}
          <div style={{ display: "flex", gap: "10px", background: "var(--bg-pill)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <button
              onClick={() => { setActiveCsvTable("applications"); }}
              style={{
                background: activeCsvTable === "applications" ? "var(--primary)" : "transparent",
                border: "none",
                borderRadius: "6px",
                color: "white",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Database size={14} /> applications.csv
            </button>
            <button
              onClick={() => { setActiveCsvTable("graph"); }}
              style={{
                background: activeCsvTable === "graph" ? "var(--primary)" : "transparent",
                border: "none",
                borderRadius: "6px",
                color: "white",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Network size={14} /> graph.csv
            </button>
            <button
              onClick={() => { setActiveCsvTable("risk"); }}
              style={{
                background: activeCsvTable === "risk" ? "var(--primary)" : "transparent",
                border: "none",
                borderRadius: "6px",
                color: "white",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Table size={14} /> risk.csv
            </button>
          </div>

          {/* CSV Table Search Input */}
          <div style={{ minWidth: "260px" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder={`Search in ${activeCsvTable}.csv...`}
                value={csvSearchQuery}
                onChange={(e) => setCsvSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "8px 12px 8px 34px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none"
                }}
              />
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>
        </div>

        {/* CSV Stats Subtitle */}
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
          <span>Showing filtered results from <strong>enterprise_{activeCsvTable}.csv</strong></span>
          <span>Total records: <strong>{filteredCsvItems.length}</strong></span>
        </div>

        {/* Tables Rendering */}
        <div className="table-container" style={{ flexGrow: 1, minHeight: 0, overflowY: "auto" }}>
          {activeCsvTable === "applications" && (
            <table>
              <thead>
                <tr>
                  <th>app_id</th>
                  <th>vendor</th>
                  <th>application</th>
                  <th>base_risk</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCsvItems.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ color: "var(--primary)", fontWeight: "600" }}>{row.app_id}</td>
                    <td>{row.vendor}</td>
                    <td>{row.application}</td>
                    <td>
                      <span className={`badge ${parseFloat(row.base_risk) >= 75 ? "badge-danger" : parseFloat(row.base_risk) >= 50 ? "badge-warning" : "badge-success"}`} style={{ fontSize: "11px" }}>
                        {row.base_risk}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedCsvItems.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)" }}>No records match your query</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeCsvTable === "graph" && (
            <table>
              <thead>
                <tr>
                  <th>source</th>
                  <th>target</th>
                  <th>weight</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCsvItems.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "500" }}>{row.source}</td>
                    <td style={{ fontWeight: "500" }}>{row.target}</td>
                    <td>
                      <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--accent-cyan)" }}>
                        {row.weight}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedCsvItems.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)" }}>No records match your query</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeCsvTable === "risk" && (
            <table>
              <thead>
                <tr>
                  <th>node</th>
                  <th>propagated_risk</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCsvItems.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "500" }}>{row.node}</td>
                    <td>
                      <span className={`badge ${parseFloat(row.propagated_risk) >= 75 ? "badge-danger" : parseFloat(row.propagated_risk) >= 50 ? "badge-warning" : "badge-success"}`} style={{ fontSize: "11px" }}>
                        {row.propagated_risk}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedCsvItems.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: "center", color: "var(--text-muted)" }}>No records match your query</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Page {csvPage} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              disabled={csvPage === 1}
              onClick={() => setCsvPage(prev => Math.max(1, prev - 1))}
              style={{
                background: "var(--bg-pill)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                color: csvPage === 1 ? "var(--text-muted)" : "white",
                padding: "6px 12px",
                cursor: csvPage === 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              disabled={csvPage === totalPages}
              onClick={() => setCsvPage(prev => Math.min(totalPages, prev + 1))}
              style={{
                background: "var(--bg-pill)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                color: csvPage === totalPages ? "var(--text-muted)" : "white",
                padding: "6px 12px",
                cursor: csvPage === totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CSVViewer;
