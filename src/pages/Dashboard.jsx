import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
  const coverageToday = [
    { area: "Front 01", staff: "Kevin Chen" },
    { area: "Kitchen 02", staff: "Maria Garcia" },
    { area: "Bar 03", staff: "Sarah T." },
    { area: "Waitstaff 04", staff: "John M." },
  ];

  const approvals = [
    { name: "Maria", type: "swap", status: "On going" },
    { name: "Kevin", type: "swap", status: "On going" },
    { name: "James", type: "swap", status: "Review now" },
  ];

  return (
    <div className="su-dash-shell">
      <header className="su-dash-header">
        <div className="su-logo">SHIFT‑UP</div>
        <nav className="su-dash-nav">
          <button className="active">Dashboard</button>
          <button>Schedule</button>
          <button>My Approvals</button>
          <button>Staff Reports</button>
        </nav>
        <button className="su-btn su-btn-outline">Log Out</button>
      </header>

      <main className="su-dash-main">
        {/* top tiles */}
        <section className="su-dash-row su-dash-row-top">
          <div className="su-dash-card su-dash-no-shows">
            <p className="su-dash-label">NO‑SHOWS</p>
            <h2>0</h2>
            <p className="su-dash-sub">for this week</p>
          </div>

          <div className="su-dash-card su-dash-week">
            <p className="su-dash-sub">WELCOME OWNER</p>
            <h2>Week Oct 20–26, 2025</h2>
          </div>

          <div className="su-dash-card su-dash-efficiency">
            <p className="su-dash-label">STAFFING EFFICIENCY</p>
            <h2>90%</h2>
            <p className="su-dash-sub">Efficiency • Coverage 95%</p>
          </div>
        </section>

        {/* performance + coverage */}
        <section className="su-dash-row su-dash-row-2col">
          <div className="su-dash-card">
            <h3>Performance metrics</h3>
            <div className="su-dash-metric-grid">
              <div>
                <p className="su-dash-label">Weekly sales</p>
                <p className="su-dash-value">5K</p>
              </div>
              <div>
                <p className="su-dash-label">Hours worked</p>
                <p className="su-dash-value">120</p>
              </div>
              <div>
                <p className="su-dash-label">Average capacity</p>
                <p className="su-dash-value">92%</p>
              </div>
              <div>
                <p className="su-dash-label">Peak hours coverage</p>
                <p className="su-dash-value">97%</p>
              </div>
              <div>
                <p className="su-dash-label">Swap requests</p>
                <p className="su-dash-value">4 approved, 1 rejected</p>
              </div>
            </div>
          </div>

          <div className="su-dash-card">
            <h3>Today&apos;s coverage</h3>
            <ul className="su-dash-list">
              {coverageToday.map((c) => (
                <li key={c.area}>
                  <span>{c.area}</span>
                  <span>{c.staff}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* approvals */}
        <section className="su-dash-row">
          <div className="su-dash-card">
            <h3>Pending approvals</h3>
            <ul className="su-dash-list su-dash-list-approvals">
              {approvals.map((a, idx) => (
                <li key={idx}>
                  <span>{a.name}</span>
                  <span>{a.type}</span>
                  <span
                    className={
                      "su-status " +
                      (a.status === "Review now" ? "su-status-attention" : "")
                    }
                  >
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
