import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Users, 
  Menu, 
  X, 
  Activity, 
  ShieldCheck,
  Globe,
  Brain,
  Sun,
  Moon
} from "lucide-react";

function Layout({ children }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const menuItems = [
    {
      path: "/",
      name: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview of enterprise risk"
    },
    {
      path: "/vendors",
      name: "Vendors",
      icon: Users,
      description: "Vendor risk rankings"
    },
    {
      path: "/alerts",
      name: "Alerts",
      icon: ShieldAlert,
      description: "Security & risk alerts"
    },
    {
      path: "/apis",
      name: "APIs",
      icon: Globe,
      description: "Enterprise API Inventory"
    },
    {
      path: "/graph",
      name: "Risk Graph",
      icon: Activity,
      description: "Cascade Breach Simulator"
    },
    {
      path: "/analyst",
      name: "Risk Analyst",
      icon: Brain,
      description: "AI-powered risk analysis"
    }
  ];

  return (
    <div className="app-container">
      {/* Mobile Toggle Bar */}
      <div className="mobile-header">
        <div className="brand">
          <ShieldCheck className="brand-icon-logo animate-pulse-slow" size={24} />
          <span>RiskRadar</span>
        </div>
        <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <ShieldCheck className="brand-icon-logo" size={32} />
          <div className="brand-text">
            <h2>RiskRadar</h2>
            <span>Enterprise risk intelligence</span>
          </div>
        </div>

        <nav className="nav-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                <div className="nav-icon-wrapper">
                  <Icon size={20} />
                </div>
                <div className="nav-item-text">
                  <span className="nav-name">{item.name}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className="pulse-dot"></span>
            <span>System Secure</span>
          </div>
          <p className="version-tag">v2.4.0</p>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <header className="top-header">
          <div className="header-title">
            <h1>
              {menuItems.find(item => item.path === location.pathname)?.name || "Page"}
            </h1>
            <p className="header-subtitle">
              {menuItems.find(item => item.path === location.pathname)?.description || ""}
            </p>
          </div>
          <div className="header-meta">
            <div className="meta-pill">
              <Activity size={14} className="text-success" />
              <span>API: Online</span>
            </div>
            <div className="meta-pill user-profile">
              <span className="avatar">AD</span>
              <span>Admin</span>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', marginLeft: '12px' }}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
