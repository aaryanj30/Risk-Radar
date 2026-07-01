import React, { useEffect, useState } from "react";
import api from "../services/api";
import RiskCard from "../components/RiskCard";
import VendorRiskChart from "../components/VendorRiskChart";
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  ArrowUpRight 
} from "lucide-react";
import { Link } from "react-router-dom";

function Dashboard() {
  const [dashboard, setDashboard] = useState({
    enterprise_score: 0,
    total_vendors: 0,
    critical_vendors: 0,
    high_vendors: 0
  });
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchDashboard = api.get("/dashboard/").then((res) => {
      // Backend returns: enterprise_score, total_vendors, critical_vendors, high_vendors
      setDashboard({
        enterprise_score: res.data.enterprise_score || 0,
        total_vendors: res.data.total_vendors || 0,
        critical_vendors: res.data.critical_vendors || 0,
        high_vendors: res.data.high_vendors || 0
      });
    }).catch(err => console.error("Error fetching dashboard stats:", err));

    // Fetch vendors list to calculate distribution dynamically
    const fetchVendors = api.get("/vendors/").then((res) => {
      setVendors(res.data || []);
    }).catch(err => console.error("Error fetching vendors:", err));

    Promise.all([fetchDashboard, fetchVendors]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Compute risk distribution dynamically based on vendor data
  const getRiskDistribution = () => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    vendors.forEach((vendor) => {
      const level = vendor.risk_level;
      if (counts[level] !== undefined) {
        counts[level]++;
      } else {
        // Fallback or mapping
        if (level === "Low" || !level) counts.Low++;
        else if (level === "Medium") counts.Medium++;
        else if (level === "High") counts.High++;
        else if (level === "Critical") counts.Critical++;
      }
    });

    return [
      { name: "Critical", count: counts.Critical },
      { name: "High", count: counts.High },
      { name: "Medium", count: counts.Medium },
      { name: "Low", count: counts.Low }
    ];
  };

  const riskDistribution = getRiskDistribution();

  // Sort vendors by risk score descending and get top 3
  const topRiskyVendors = [...vendors]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 3);

  const getRiskBadgeClass = (level) => {
    switch (level?.toLowerCase()) {
      case "critical": return "badge-danger";
      case "high": return "badge-warning";
      case "medium": return "badge-warning";
      default: return "badge-success";
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div className="pulse-dot" style={{ width: "24px", height: "24px" }}></div>
        <span style={{ marginLeft: "16px", color: "var(--text-secondary)" }}>Analyzing system risk profiles...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <RiskCard
          title="Enterprise Risk Score"
          value={`${dashboard.enterprise_score}`}
          icon={Activity}
          className="enterprise"
        />
        <RiskCard
          title="Total Vendors"
          value={dashboard.total_vendors}
          icon={Users}
        />
        <RiskCard
          title="Critical Risk Vendors"
          value={dashboard.critical_vendors}
          icon={ShieldAlert}
          className="critical"
        />
        <RiskCard
          title="High Risk Vendors"
          value={dashboard.high_vendors}
          icon={AlertTriangle}
          className="warning"
        />
      </div>

      {/* Main Panel layout */}
      <div className="dashboard-main-panel">
        {/* Risk Distribution Chart */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Risk Distribution</h2>
              <p className="panel-subtitle">Distribution of vendors by their designated risk level</p>
            </div>
            <ShieldCheck size={18} className="text-success" />
          </div>
          <VendorRiskChart data={riskDistribution} />
        </div>

        {/* Top Risky Vendors and Quick Insights */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Top Risk Vendors</h2>
              <p className="panel-subtitle">Vendors requiring immediate review & remediation</p>
            </div>
            <Link to="/vendors" style={{ color: "var(--primary)", display: "flex", alignItems: "center", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>
              View All <ArrowUpRight size={14} style={{ marginLeft: "2px" }} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {topRiskyVendors.length === 0 ? (
              <div className="empty-state">
                <p>No vendor data registered</p>
              </div>
            ) : (
              topRiskyVendors.map((vendor) => (
                <div 
                  key={vendor.id} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    background: "var(--bg-pill)",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>{vendor.name}</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Score: {vendor.risk_score}/100</p>
                  </div>
                  <span className={`badge ${getRiskBadgeClass(vendor.risk_level)}`}>
                    {vendor.risk_level}
                  </span>
                </div>
              ))
            )}
          </div>

          <div 
            style={{ 
              marginTop: "24px",
              padding: "16px",
              background: "rgba(139, 92, 246, 0.05)",
              border: "1px dashed var(--border-primary)",
              borderRadius: "12px",
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: "1.5"
            }}
          >
            <strong>Advisor Insight:</strong> Enterprise risk is currently driven by {dashboard.critical_vendors} critical vendors. Review critical-severity alerts to initiate mitigation workflows.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;