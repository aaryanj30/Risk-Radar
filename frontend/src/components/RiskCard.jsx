import React from "react";

function RiskCard({ title, value, icon: Icon, className = "" }) {
  return (
    <div className={`stat-card ${className}`}>
      {Icon && (
        <div className="stat-card-icon">
          <Icon size={24} />
        </div>
      )}
      <div className="stat-card-details">
        <h3>{title}</h3>
        <h1>{value !== undefined && value !== null ? value : "—"}</h1>
      </div>
    </div>
  );
}

export default RiskCard;