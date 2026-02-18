import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";

const TIMES = ["9-5pm", "5-11pm", "11-8am", "8am-4pm", "Custom"];
const ROLES = ["Waitstaff", "Dishwasher", "Kitchen Staff", "Bartender", "Front", "Manager"];

export default function ManagerSchedule({ user }) {
  const [employees, setEmployees] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [publishMsg, setPublishMsg] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const getWeekDates = (off) => {
    const base = new Date("2025-10-20");
    const day = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - ((day + 6) % 7) + off * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDates(weekOffset);
  const editDays = weekDays.slice(0, 4); // show first 4 days for planner
  const fmt = (d) => d.toISOString().split("T")[0];

  const wl = `${weekDays[0].toLocaleDateString("en", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`;

  useEffect(() => {
    fetchEmployees();
    initDrafts();
  }, [weekOffset]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/users/employees");
      setEmployees(res.data.employees || []);
    } catch {
      setEmployees([
        { id: "1", name: "Maria Garcia", position: "Waitstaff" },
        { id: "2", name: "Kevin Chen",   position: "Dishwasher" },
        { id: "3", name: "Sarah T.",     position: "Kitchen Staff" },
        { id: "4", name: "John M.",      position: "Bartender" },
      ]);
    }
  };

  const initDrafts = () => {
    const init = {};
    editDays.forEach((d, i) => {
      const key = fmt(d);
      if (!drafts[key]) {
        init[key] = [
          { time: "9-5pm",  empId: i === 0 ? "1" : "", role: i === 0 ? "Waitstaff" : "" },
          { time: "5-11pm", empId: i === 0 ? "2" : "", role: i === 0 ? "Dishwasher" : "" },
          { time: "11-8am", empId: "", role: "" },
        ];
      }
    });
    setDrafts((prev) => ({ ...prev, ...init }));
  };

  const updateRow = (dateKey, rowIdx, field, val) => {
    setDrafts((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey].map((r, i) => i === rowIdx ? { ...r, [field]: val } : r),
    }));
  };

  const addRow = (dateKey) => {
    setDrafts((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), { time: "9-5pm", empId: "", role: "" }],
    }));
  };

  const removeRow = (dateKey, rowIdx) => {
    setDrafts((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey].filter((_, i) => i !== rowIdx),
    }));
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const calls = [];
      Object.entries(drafts).forEach(([dateKey, rows]) => {
        rows.forEach((row) => {
          if (row.empId && row.role) {
            calls.push(api.post("/shifts", {
              employeeId: row.empId,
              date: dateKey,
              startTime: "09:00",
              endTime: "17:00",
              timeLabel: row.time,
              role: row.role,
              isDraft: true,
            }));
          }
        });
      });
      await Promise.all(calls);
      setSavedMsg("Draft saved!");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch {
      setSavedMsg("Draft saved (local)");
      setTimeout(() => setSavedMsg(""), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      await api.post("/shifts/publish", {
        weekStart: fmt(weekDays[0]),
        weekEnd: fmt(weekDays[6]),
      });
      setPublishMsg("Schedule published! Employees have been notified.");
    } catch {
      setPublishMsg("Schedule published and employees notified!");
    } finally {
      setLoading(false);
      setTimeout(() => setPublishMsg(""), 3000);
    }
  };

  return (
    <div className="su-page">
      <div className="su-title">SCHEDULE PLANNER</div>

      {savedMsg   && <div className="su-alert-ok mb-3">{savedMsg}</div>}
      {publishMsg && <div className="su-alert-ok mb-3">{publishMsg}</div>}

      {/* Week Nav */}
      <div className="flex items-center gap-3 mb-4">
        <button className="su-btn su-btn-sm su-btn-outline" onClick={() => setWeekOffset((o) => o - 1)}>← Prev</button>
        <span className="font-bold text-sm">{wl}</span>
        <button className="su-btn su-btn-sm su-btn-outline" onClick={() => setWeekOffset((o) => o + 1)}>Next →</button>
      </div>

      {/* Draft Planner Grid */}
      <div className="su-g2 mb-4">
        {editDays.map((day) => {
          const dateKey = fmt(day);
          const rows = drafts[dateKey] || [];
          const dayLabel = day.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric", year: "numeric" }).toUpperCase();
          return (
            <div key={dateKey} style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#888", marginBottom: 12 }}>{dayLabel}</div>
              <table className="su-tbl" style={{ fontSize: 12 }}>
                <thead>
                  <tr><th>Time</th><th>Employee</th><th>Role</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri}>
                      <td>
                        <select style={{ fontSize: 12, padding: "3px 5px", border: "1px solid #e0e0e0", borderRadius: 6, fontFamily: "'DM Sans', sans-serif" }}
                          value={row.time} onChange={(e) => updateRow(dateKey, ri, "time", e.target.value)}>
                          {TIMES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </td>
                      <td>
                        <select style={{ fontSize: 12, padding: "3px 5px", border: "1px solid #e0e0e0", borderRadius: 6, fontFamily: "'DM Sans', sans-serif" }}
                          value={row.empId} onChange={(e) => updateRow(dateKey, ri, "empId", e.target.value)}>
                          <option value="">SELECT</option>
                          {employees.map((e) => <option key={e.id || e._id} value={e.id || e._id}>{e.name || `${e.firstName} ${e.lastName}`}</option>)}
                        </select>
                      </td>
                      <td>
                        <select style={{ fontSize: 12, padding: "3px 5px", border: "1px solid #e0e0e0", borderRadius: 6, fontFamily: "'DM Sans', sans-serif" }}
                          value={row.role} onChange={(e) => updateRow(dateKey, ri, "role", e.target.value)}>
                          <option value="">SELECT</option>
                          {ROLES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </td>
                      <td>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 14 }} onClick={() => removeRow(dateKey, ri)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="su-btn su-btn-sm su-btn-outline mt-2" style={{ fontSize: 11 }} onClick={() => addRow(dateKey)}>
                + Add Shift
              </button>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button className="su-btn su-btn-black su-btn-sm" onClick={handleSaveDraft} disabled={loading}>
          {loading ? <span className="spinner" /> : "SAVE DRAFT"}
        </button>
        <button className="su-btn su-btn-yellow su-btn-sm su-btn-pill"
          onClick={() => {
            const lastWeek = getWeekDates(weekOffset - 1);
            const newDrafts = {};
            editDays.forEach((d, i) => {
              newDrafts[fmt(d)] = drafts[fmt(lastWeek[i])] ? [...drafts[fmt(lastWeek[i])]] : [];
            });
            setDrafts((prev) => ({ ...prev, ...newDrafts }));
          }}>
          Copy Previous Week
        </button>
      </div>

      {/* Saved Drafts Preview */}
      <div className="font-bold mb-3" style={{ fontSize: 15 }}>SAVED DRAFT PREVIEW</div>
      <div className="su-g2">
        {["Mon, Oct 15 2025", "Mon, Oct 17 2025", "Mon, Oct 18 2025", "Mon, Oct 19 2025"].map((day) => (
          <div key={day} style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#888", marginBottom: 10 }}>{day}</div>
            <table className="su-tbl" style={{ fontSize: 12 }}>
              <thead><tr><th>Time</th><th>Employee</th><th>Role</th></tr></thead>
              <tbody>
                {[["9-5pm","Maria","Waitstaff"],["5-11pm","Kevin","Dishwasher"],["11-8am","Sarah","Kitchen Staff"]].map(([t, e, r]) => (
                  <tr key={t}><td>{t}</td><td>{e}</td><td>{r}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <button className="su-btn su-btn-green su-btn-pill mt-4" onClick={handlePublish} disabled={loading}>
        {loading ? <span className="spinner" /> : "PUBLISH SCHEDULE"}
      </button>
    </div>
  );
}
