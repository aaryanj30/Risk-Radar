import React from 'react';
import { X } from 'lucide-react';

const VendorDetailsDrawer = ({ vendor, isOpen, onClose }) => {
  if (!vendor) return null;
  return (
    <div className={`vendor-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-content">
        <header className="drawer-header">
          <h2>{vendor.name}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <section className="drawer-body">
          <p><strong>Risk Score:</strong> {vendor.risk_score}/100</p>
          <p><strong>Risk Level:</strong> {vendor.risk_level}</p>
          <p><strong>Connected Apps:</strong> {vendor.connected_apps?.join(', ')}</p>
          {/* Add more detailed risk metrics as needed */}
        </section>
      </div>
    </div>
  );
};

export default VendorDetailsDrawer;
