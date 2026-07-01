import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

function VendorRiskChart({ data }) {
  // If data is empty or undefined, render a nice placeholder
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <p>No risk distribution data available</p>
      </div>
    );
  }

  // Custom tooltips matching the dark-theme styling
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "var(--bg-sidebar)",
          border: "1px solid var(--border-color)",
          padding: "10px 14px",
          borderRadius: "8px",
          boxShadow: "var(--shadow-md)"
        }}>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
            {payload[0].payload.name} Risk
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 700, color: "var(--primary)" }}>
            {payload[0].value} {payload[0].value === 1 ? "Vendor" : "Vendors"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="rgba(255,255,255,0.03)" 
          />
          <XAxis 
            dataKey="name" 
            tickLine={false}
            axisLine={false}
            stroke="var(--text-muted)"
            fontSize={12}
            dy={8}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            stroke="var(--text-muted)"
            fontSize={12}
            dx={-8}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
          <Bar 
            dataKey="count" 
            fill="url(#barGradient)" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default VendorRiskChart;