import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";
import "../../App.css";
import LanguageSwitcher  from "../../components/LanguageSwitcher";
import ProfileCard       from "../../components/ProfileCard";

import ManagerDashboard  from "./ManagerDashboard";
import ManagerSchedule   from "./ManagerSchedule";
import SwapApprovals     from "./SwapApprovals";
import StaffReport       from "./StaffReport";
import EmployeeOverview  from "./EmployeeOverview";
import TipManager        from "./TipManager";
import RegisterStaff     from "./RegisterStaff";
import RegisterEmployee  from "./RegisterEmployee";

function Header({ view, setView, unreadCount, user, onLogout }) {
  const { t }   = useLanguage();
  const isOwner = user?.role === "owner";

  const nav = [
    { key:"managerDash",      label:t("dashboard")        },
    { key:"managerSchedule",  label:t("schedule")         },
    { key:"swapApprovals",    label:t("swapApprovals"), badge: unreadCount > 0 },
    { key:"staffReport",      label:t("staffReports")     },
    { key:"employeeOverview", label:t("employeeOverview") },
    ...(isOwner ? [{ key:"tipManager",      label:t("tips")                }] : []),
    // ── Registration tabs ──────────────────────────────────────────
    ...(isOwner ? [{ key:"registerStaff",   label:"Register Staff", isNew:true }] : []),
    ...(!isOwner ? [{ key:"registerEmployee", label:"Register Employee", isNew:true }] : []),
  ];

  return (
    <header className="su-header">
      <div className="su-brand">
        <div className="su-logobox">UP</div>
        {t("appName")}
      </div>
      <div className="su-nav" style={{ flexWrap:"wrap" }}>
        {nav.map(({ key, label, badge, isNew }) => (
          <button key={key} className={`su-navbtn ${view === key ? "active" : ""}`} onClick={() => setView(key)} style={{ position:"relative" }}>
            {badge ? (
              <span className="su-badge-wrap">{label}<span className="su-badge-dot" /></span>
            ) : label}
            {isNew && view !== key && (
              <span style={{ position:"absolute", top:-4, right:-4, background:"#f5b800", color:"#1a1a1a", fontSize:9, fontWeight:900, borderRadius:99, padding:"1px 5px" }}>NEW</span>
            )}
          </button>
        ))}
        <LanguageSwitcher light />
        <button className="su-navbtn logout" onClick={onLogout}>{t("logout")}</button>
      </div>
    </header>
  );
}

export default function ManagerPortal({ onSubscription }) {
  const { user, logout } = useAuth();
  const [view,         setView]         = useState("managerDash");
  const [pendingCount, setPendingCount] = useState(0);
  const [showProfile,  setShowProfile]  = useState(false);

  const fetchPendingCount = async () => {
    try { const res = await api.get("/swaps?status=pending"); setPendingCount(res.data.count || 0); } catch {}
  };

  useEffect(() => {
    fetchPendingCount();
    const i = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(i);
  }, []);

  const renderView = () => {
    switch (view) {
      case "managerDash":      return <ManagerDashboard user={user} onGoToSwaps={() => setView("swapApprovals")} />;
      case "managerSchedule":  return <ManagerSchedule user={user} />;
      case "swapApprovals":    return <SwapApprovals user={user} onUpdate={fetchPendingCount} />;
      case "staffReport":      return <StaffReport />;
      case "employeeOverview": return <EmployeeOverview />;
      case "tipManager":       return <TipManager />;
      case "registerStaff":    return <RegisterStaff />;
      case "registerEmployee": return <RegisterEmployee />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec" }}>
      <Header
        view={view}
        setView={setView}
        unreadCount={pendingCount}
        user={user}
        onLogout={logout}
      />

      {/* Profile button */}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:100 }}>
        <button
          onClick={() => setShowProfile(true)}
          style={{ width:48, height:48, borderRadius:"50%", background: user?.avatar ? "transparent" : "#f5b800", border:"none", cursor:"pointer", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(0,0,0,.15)" }}
        >
          {user?.avatar
            ? <img src={user.avatar} alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontWeight:900, fontSize:18, color:"#1a1a1a" }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
          }
        </button>
      </div>

      {showProfile && <ProfileCard onClose={() => setShowProfile(false)} />}

      <main style={{ minHeight:"calc(100vh - 64px)" }}>
        {renderView()}
      </main>
    </div>
  );
}