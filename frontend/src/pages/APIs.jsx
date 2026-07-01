import {
  AlertTriangle,
  CheckCircle,
  Globe,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import RiskCard from "../components/RiskCard";
import api from "../services/api";

function APIs() {
  const [apis, setApis] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [authFilter, setAuthFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/apis/")
      .then((response) => {
        setApis(response.data || []);
      })
      .catch((err) => console.error("Error loading APIs:", err))
      .finally(() => setLoading(false));
  }, []);

  // Compute metrics
  const totalAPIs = apis.length;
  const criticalAPIs = apis.filter(api => api.risk_score >= 70).length;
  const unauthAPIs = apis.filter(api => !api.auth).length;
  const secureAPIs = apis.filter(api => api.auth && api.tls && api.rate_limit).length;

  // Extract unique vendors
  const uniqueVendors = Array.from(
    new Set(apis.map((item) => item.vendor).filter(Boolean))
  ).sort();

  const filteredApis = apis.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.vendor && item.vendor.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesAuth =
      authFilter === "All" ||
      (authFilter === "Enabled" && item.auth) ||
      (authFilter === "Disabled" && !item.auth);
    const matchesVendor =
      vendorFilter === "All" ||
      item.vendor === vendorFilter;

    let matchesDate = true;
    if (item.last_used) {
      const itemDate = new Date(item.last_used).getTime();
      if (fromDate) {
        const fromTime = new Date(fromDate).getTime();
        if (itemDate < fromTime) matchesDate = false;
      }
      if (toDate) {
        // Add 1 day to toDate to include the whole day
        const toTime = new Date(toDate).getTime() + 86400000;
        if (itemDate >= toTime) matchesDate = false;
      }
    } else if (fromDate || toDate) {
      // If there is no last_used date but a filter is applied, we exclude it
      matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesAuth && matchesVendor && matchesDate;
  });

  const getRiskBadgeClass = (score) => {
    if (score >= 70) return "badge-danger";
    if (score >= 40) return "badge-warning";
    return "badge-success";
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active": return "badge-success";
      case "deprecated": return "badge-warning";
      case "zombie": return "badge-danger";
      case "shadow": return "badge-danger";
      default: return "badge-success";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div className="pulse-dot" style={{ width: "24px", height: "24px" }}></div>
        <span style={{ marginLeft: "16px", color: "var(--text-secondary)" }}>Loading API inventory registry...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Metric Cards Grid */}
      <div className="stats-grid">
        <RiskCard
          title="Total API Endpoints"
          value={totalAPIs}
          icon={Globe}
        />
        <RiskCard
          title="Critical Risk APIs"
          value={criticalAPIs}
          icon={ShieldAlert}
          className="critical"
        />
        <RiskCard
          title="Unauthenticated APIs"
          value={unauthAPIs}
          icon={AlertTriangle}
          className="warning"
        />
        <RiskCard
          title="Fully Secure APIs"
          value={secureAPIs}
          icon={ShieldCheck}
          className="enterprise"
        />
      </div>

      {/* Filters Panel */}
      <div className="panel-card" style={{ marginBottom: "28px", padding: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.5fr",
            gap: "20px"
          }}
        >
          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Search size={14} /> Search APIs
            </label>
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)"
                }}
              />
              <input
                type="text"
                placeholder="Search by name, endpoint, owner or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  padding: "12px 16px 12px 42px",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--sans)",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Vendor Filter */}
          <div>
            <label>Vendor</label>
            <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
              <option value="All">All Vendors</option>
              {uniqueVendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label>API Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Deprecated">Deprecated</option>
              <option value="Zombie">Zombie</option>
              <option value="Shadow">Shadow</option>
            </select>
          </div>

          {/* Auth Filter */}
          <div>
            <label>Authentication</label>
            <select value={authFilter} onChange={(e) => setAuthFilter(e.target.value)}>
              <option value="All">All APIs</option>
              <option value="Enabled">Auth Enabled</option>
              <option value="Disabled">Auth Disabled</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label>Last Used Range</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
                title="From Date"
                style={{
                  width: "100%",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  padding: "8px",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--sans)",
                  fontSize: "13px",
                  outline: "none"
                }}
              />
              <input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
                title="To Date"
                style={{
                  width: "100%",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  padding: "8px",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--sans)",
                  fontSize: "13px",
                  outline: "none"
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        {filteredApis.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px" }}>
            <p>No APIs found matching current filters.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>API Name & Endpoint</th>
                <th>Owner / Dept</th>
                <th style={{ textAlign: "center" }}>Auth</th>
                <th style={{ textAlign: "center" }}>TLS</th>
                <th style={{ textAlign: "center" }}>Rate Limit</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Risk Score</th>
                <th>Last Used</th>
              </tr>
            </thead>
            <tbody>
              {filteredApis.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>
                          {item.name}
                        </span>
                        {item.vendor && (
                          <span style={{
                            fontSize: "10px",
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "rgb(129, 140, 248)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 500
                          }}>
                            {item.vendor}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                        {item.endpoint}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                    {item.owner}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {item.auth ? (
                      <CheckCircle size={18} className="text-success" style={{ display: "inline" }} />
                    ) : (
                      <XCircle size={18} className="text-danger" style={{ display: "inline" }} />
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {item.tls ? (
                      <CheckCircle size={18} className="text-success" style={{ display: "inline" }} />
                    ) : (
                      <XCircle size={18} className="text-danger" style={{ display: "inline" }} />
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {item.rate_limit ? (
                      <CheckCircle size={18} className="text-success" style={{ display: "inline" }} />
                    ) : (
                      <XCircle size={18} className="text-danger" style={{ display: "inline" }} />
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>
                    <span className={`badge ${getRiskBadgeClass(item.risk_score)}`}>
                      {item.risk_score}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    {formatDate(item.last_used)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default APIs;
