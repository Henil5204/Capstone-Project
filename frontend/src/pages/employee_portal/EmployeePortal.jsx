import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import "../../App.css";

import Schedule from "./Schedule";
import ShiftSwap from "./ShiftSwap";
import Availability from "./Availability";
import Notifications from "./Notifications";

function Header({ view, setView, unreadCount, onLogout }) {
  const nav = [
    ["schedule", "Schedule"],
    ["shiftSwap", "Shift Swap"],
    ["availability", "Availability"],
    ["notifications", "Notifications"],
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
            {v === "notifications" ? (
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

export default function EmployeePortal() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("schedule");
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await api.get("/notifications?unread=true");
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (view) {
      case "schedule":      return <Schedule user={user} />;
      case "shiftSwap":     return <ShiftSwap user={user} />;
      case "availability":  return <Availability user={user} onSaved={() => {}} />;
      case "notifications": return <Notifications onRead={fetchUnread} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f0ec" }}>
      <Header view={view} setView={setView} unreadCount={unreadCount} onLogout={logout} />
      {renderView()}
    </div>
  );
}
