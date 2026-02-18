import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import "../../App.css";

import ManagerDashboard from "./ManagerDashboard";
import ManagerSchedule from "./ManagerSchedule";
import SwapApprovals from "./SwapApprovals";
import StaffReport from "./StaffReport";
import EmployeeOverview from "./EmployeeOverview";

function Header({ view, setView, unreadCount, user, onLogout }) {
  const nav = [
    ["managerDash", "Dashboard"],
    ["managerSchedule", "Schedule"],
    ["swapApprovals", "My Approvals"],
    ["staffReport", "Staff Reports"],
    ["employeeOverview", "Employee Overview"],
  ];
  return (
    <header className="su-header">
      <div className="su-brand">
        <div className="su-logobox">UP</div>
        SHIFT-UP
      </div>
      <div className="su-nav">
        {nav.map(([v, label]) => (
          <button key={v} className={`su-navbtn ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
            {v === "swapApprovals" ? (
              <span className="su-badge-wrap">
                {label}
                {unreadCount > 0 && <span className="su-badge-dot" />}
              </span>
            ) : label}
          </button>
        ))}
        <button className="su-navbtn logout" onClick={onLogout}>Log Out</button>
      </div>
    </header>
  );
}

export default function ManagerPortal() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("managerDash");
  const [pendingSwapsCount, setPendingSwapsCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get("/swaps?status=pending");
      setPendingSwapsCount(res.data.count || 0);
    } catch {}
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (view) {
      case "managerDash":      return <ManagerDashboard user={user} onGoToSwaps={() => setView("swapApprovals")} />;
      case "managerSchedule":  return <ManagerSchedule user={user} />;
      case "swapApprovals":    return <SwapApprovals user={user} onUpdate={fetchPendingCount} />;
      case "staffReport":      return <StaffReport />;
      case "employeeOverview": return <EmployeeOverview />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f0ec" }}>
      <Header view={view} setView={setView} unreadCount={pendingSwapsCount} user={user} onLogout={logout} />
      {renderView()}
    </div>
  );
}
