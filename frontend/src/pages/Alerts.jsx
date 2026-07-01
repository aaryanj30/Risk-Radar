import {
    CheckCircle,
    Clock,
    Filter,
    HelpCircle,
    ShieldAlert,
    ShieldCheck,
    User
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";

function Alerts() {
    const [searchParams, setSearchParams] = useSearchParams();
    const vendorParam = searchParams.get("vendor");

    const [vendors, setVendors] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const [selectedVendor, setSelectedVendor] = useState("");
    const [selectedSeverity, setSelectedSeverity] = useState("All");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const [vendorInfo, setVendorInfo] = useState(null);
    const [loadingAlerts, setLoadingAlerts] = useState(false);
    const [cyberNews, setCyberNews] = useState([]);

    // Load Vendors list on mount
    useEffect(() => {
        api.get("/vendors/")
            .then((res) => {
                setVendors(res.data || []);
            })
            .catch((err) => {
                console.error("Error loading vendors:", err);
            });
    }, []);

    // Update selectedVendor if URL parameter changes
    useEffect(() => {
        if (vendorParam) {
            setSelectedVendor(vendorParam);
        }
    }, [vendorParam]);

    // Load Vendor Alerts
    useEffect(() => {
        if (!selectedVendor) {
            setAlerts([]);
            return;
        }

        setLoadingAlerts(true);
        api.get(`/alerts/${selectedVendor}/`)
            .then((res) => {
                setAlerts(res.data || []);
            })
            .catch((err) => {
                console.error("Error loading alerts:", err);
            })
            .finally(() => {
                setLoadingAlerts(false);
            });
    }, [selectedVendor]);
    // Realtime polling for alerts every 30 seconds
    useEffect(() => {
        if (!selectedVendor) return;
        const interval = setInterval(() => {
            api.get(`/alerts/${selectedVendor}/`)
                .then((res) => {
                    setAlerts(res.data || []);
                })
                .catch((err) => {
                    console.error("Error polling alerts:", err);
                });
        }, 30000);
        return () => clearInterval(interval);
    }, [selectedVendor]);

    // Load Vendor Summary
    useEffect(() => {
        if (!selectedVendor) {
            setVendorInfo(null);
            return;
        }

        api.get(`/vendors/${selectedVendor}/`)
            .then((res) => {
                setVendorInfo(res.data);
            })
            .catch((err) => {
                console.error("Error loading vendor summary:", err);
            });
    }, [selectedVendor]);


    useEffect(() => {

    if (!selectedVendor) {
        setCyberNews([]);
        return;
    }

    api.get(
        `/vendors/cyber-news/${selectedVendor}/`
    )
        .then((res) => {

            setCyberNews(
                res.data || []
            );

        })
        .catch((err) => {

            console.error(
                "Error loading cyber news:",
                err
            );

        });

}, [selectedVendor]);

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case "critical":
                return "#ef4444"; // red
            case "high":
                return "#f97316"; // orange
            case "medium":
                return "#eab308"; // yellow
            case "low":
                return "#10b981"; // green
            default:
                return "#64748b"; // slate
        }
    };

    const getSeverityBadgeClass = (severity) => {
        switch (severity?.toLowerCase()) {
            case "critical": return "badge-danger";
            case "high": return "badge-warning";
            case "medium": return "badge-warning";
            default: return "badge-success";
        }
    };

    const getThreatColor = (news) => {

    const total =

        (news.cyber_hits || 0)

        +

        (news.financial_hits || 0)

        +

        (news.compliance_hits || 0)

        +

        (news.operational_hits || 0);

    if (total >= 4)
        return "#ef4444";

    if (total >= 2)
        return "#f97316";

    return "#10b981";
};

    const filteredAlerts = alerts.filter((alert) => {
        const severityMatch =
            selectedSeverity === "All" ||
            alert.severity === selectedSeverity;

        const categoryMatch =
            selectedCategory === "All" ||
            alert.category === selectedCategory;

        return severityMatch && categoryMatch;
    });

    const categories = [
        "All",
        ...new Set(
            alerts
                .map((alert) => alert.category)
                .filter(Boolean)
        )
    ];

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div>
            {/* Selection Panel */}
            <div className="panel-card gap-24">
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.5fr 1fr 1fr",
                        gap: "20px"
                    }}
                >
                    {/* Vendor Selector */}
                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <User size={14} /> Vendor
                        </label>
                        <select
                            value={selectedVendor}
                            onChange={(e) => {
                                setSelectedVendor(e.target.value);
                                setSearchParams({ vendor: e.target.value });
                            }}
                        >
                            <option value="">Select Vendor</option>
                            {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.name}>
                                    {vendor.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Severity Filter */}
                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <ShieldAlert size={14} /> Severity
                        </label>
                        <select
                            value={selectedSeverity}
                            onChange={(e) => setSelectedSeverity(e.target.value)}
                            disabled={!selectedVendor}
                        >
                            <option value="All">All Severities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Filter size={14} /> Category
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            disabled={!selectedVendor}
                        >
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Vendor Profile & Risk Scores */}
            {vendorInfo && (
                <div className="panel-card gap-24" style={{ borderLeft: `4px solid ${getSeverityColor(vendorInfo.risk_level)}` }}>
                    <div className="flex-between">
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: "700" }}>{vendorInfo.name}</h2>
                            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                                Active Risk Events: <strong>{vendorInfo.risk_events_count}</strong>
                            </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
                                <span className={`badge ${getSeverityBadgeClass(vendorInfo.risk_level)}`}>
                                    {vendorInfo.risk_level} Risk
                                </span>
                                <span style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)" }}>
                                    {vendorInfo.risk_score}
                                </span>
                            </div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Risk Rating Index</span>
                        </div>
                    </div>

                    {/* Core Risk Categories */}
                    <div className="vendor-overview-grid">
                        <div className="overview-stat-box cybersecurity">
                            <h3>Cybersecurity</h3>
                            <h2>{vendorInfo.cybersecurity}</h2>
                        </div>
                        <div className="overview-stat-box financial">
                            <h3>Financial</h3>
                            <h2>{vendorInfo.financial}</h2>
                        </div>
                        <div className="overview-stat-box compliance">
                            <h3>Compliance</h3>
                            <h2>{vendorInfo.compliance}</h2>
                        </div>
                        <div className="overview-stat-box operational">
                            <h3>Operational</h3>
                            <h2>{vendorInfo.operational}</h2>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts View List */}
            {selectedVendor ? (
                <div>
                    <div className="flex-between gap-24" style={{ marginTop: "12px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
                            Risk Intelligence Alerts ({filteredAlerts.length})
                        </h3>
                    </div>

                    {loadingAlerts ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                            <div className="pulse-dot" style={{ width: "16px", height: "16px" }}></div>
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="empty-state">
                            <ShieldCheck size={40} style={{ color: "var(--success)", marginBottom: "12px" }} />
                            <h3>All Clear</h3>
                            <p>No active risk events match the selected filters.</p>
                        </div>
                    ) : (
                        <div className="alerts-list">
                            {filteredAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="alert-card"
                                    style={{
                                        borderLeft: `5px solid ${getSeverityColor(alert.severity)}`
                                    }}
                                >
                                    <div className="alert-card-header">
                                        <h3>{alert.title}</h3>
                                        <div className="alert-card-meta">
                                            <span className="alert-category-tag">{alert.category}</span>
                                            <span className={`alert-severity-badge badge ${getSeverityBadgeClass(alert.severity)}`}>
                                                {alert.severity}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Clock size={12} />
                                            <span>Published: {formatDate(alert.created_at)}</span>
                                        </div>
                                        {alert.resolved ? (
                                            <span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                                                <CheckCircle size={12} /> Resolved
                                            </span>
                                        ) : (
                                            <span style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                                                <ShieldAlert size={12} /> Active Incident
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                    {
    cyberNews.length > 0 && (

        <div
            className="panel-card gap-24"
            style={{
                marginTop: "24px"
            }}
        >

            <h3
                style={{
                    fontSize: "16px",
                    fontWeight: "600"
                }}
            >
                Threat Intelligence Feed
            </h3>

            <div className="alerts-list">

                {
                    cyberNews
                        .slice(0, 10)
                        .map((news) => (

                            <div
                                key={news.id}
                                className="alert-card"
                                style={{
                                    borderLeft:
                                        `5px solid ${getThreatColor(news)}`
                                }}
                            >

                                <h3>
                                    {news.title}
                                </h3>

                                <p
                                    style={{
                                        color:
                                            "var(--text-muted)",
                                        marginTop: "10px"
                                    }}
                                >
                                    {news.risk_category}
                                </p>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "20px",
                                        marginTop: "12px",
                                        flexWrap: "wrap"
                                    }}
                                >

                                    <span>
                                        🔐 Cyber:
                                        {" "}
                                        {news.cyber_hits}
                                    </span>

                                    <span>
                                        💰 Financial:
                                        {" "}
                                        {news.financial_hits}
                                    </span>

                                    <span>
                                        ⚖ Compliance:
                                        {" "}
                                        {news.compliance_hits}
                                    </span>

                                    <span>
                                        🏢 Operational:
                                        {" "}
                                        {news.operational_hits}
                                    </span>

                                </div>

                            </div>

                        ))
                }

            </div>

        </div>

    )
}


                </div>
            ) : (
                <div className="empty-state" style={{ padding: "60px 40px" }}>
                    <HelpCircle size={48} style={{ color: "var(--text-muted)", marginBottom: "16px" }} />
                    <h3>No Vendor Selected</h3>
                    <p>Please select a vendor from the dropdown menu to investigate active threats and risk alerts.</p>
                </div>
            )}
        </div>
    );
}

export default Alerts;