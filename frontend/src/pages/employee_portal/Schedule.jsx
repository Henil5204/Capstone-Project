import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";

<<<<<<< HEAD
export default function Schedule({ user }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDates = (offset) => {
    const base = new Date();
    const day = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - ((day + 6) % 7) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const days = getWeekDates(weekOffset);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fmt = (d) => d.toISOString().split("T")[0];

  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      try {
        const from = fmt(days[0]);
        const to = fmt(days[6]);
        const res = await api.get(`/shifts/week?start=${from}&end=${to}`);
        setShifts(res.data.shifts || []);
      } catch (err) {
        console.error("Failed to load shifts:", err);
        // Fallback demo data
        setShifts([
          { _id: "1", date: fmt(days[0]), timeLabel: "9-5pm", startTime: "09:00", endTime: "17:00", role: "Waitstaff", area: "Front", status: "scheduled" },
          { _id: "2", date: fmt(days[2]), timeLabel: "5-11pm", startTime: "17:00", endTime: "23:00", role: "Waitstaff", area: "Front", status: "scheduled" },
          { _id: "3", date: fmt(days[4]), timeLabel: "9-5pm", startTime: "09:00", endTime: "17:00", role: "Waitstaff", area: "Bar", status: "scheduled" },
        ]);
=======
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function Schedule({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await api.get("/shifts");

        const shifts = res.data.shifts || res.data || [];

        const mappedEvents = shifts.map((shift) => {
          const dateOnly = new Date(shift.date)
            .toISOString()
            .split("T")[0];

          return {
            id: shift._id,
            title: `${shift.role}${shift.area ? ` (${shift.area})` : ""}`,
            start: `${dateOnly}T${shift.startTime}`,
            end: `${dateOnly}T${shift.endTime}`
          };
        });

        setEvents(mappedEvents);
      } catch (err) {
        console.error("Failed to load shifts:", err);
>>>>>>> f9f616b1 (updated project)
      } finally {
        setLoading(false);
      }
    };
<<<<<<< HEAD
    fetchShifts();
  }, [weekOffset]);

  const roleColors = {
    Waitstaff: "#4f46e5", Dishwasher: "#0891b2", "Kitchen Staff": "#16a34a",
    Bartender: "#dc2626", Front: "#d97706", default: "#6b7280",
  };

  const wl = `${days[0].toLocaleDateString("en", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="su-page">
      {/* WEEK NAV */}
      <div className="flex justify-between items-center mb-4">
        <div className="su-title">MY SCHEDULE</div>
        <div className="flex items-center gap-3">
          <button className="su-btn su-btn-sm su-btn-outline" onClick={() => setWeekOffset((o) => o - 1)}>← Prev</button>
          <span className="font-bold text-sm">{wl}</span>
          <button className="su-btn su-btn-sm su-btn-outline" onClick={() => setWeekOffset((o) => o + 1)}>Next →</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted" style={{ padding: 40 }}>Loading shifts...</div>
      ) : (
        <div className="su-g7">
          {days.map((d, i) => {
            const dateStr = fmt(d);
            const shift = shifts.find((s) => {
              const sd = typeof s.date === "string" ? s.date.split("T")[0] : new Date(s.date).toISOString().split("T")[0];
              return sd === dateStr;
            });
            const color = shift ? (roleColors[shift.role] || roleColors.default) : null;

            return shift ? (
              <div key={dateStr} style={{ background: "#fff", borderRadius: 12, padding: 14, boxShadow: "0 2px 6px rgba(0,0,0,.06)", borderTop: `4px solid ${color}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#aaa" }}>{dayNames[i]}</div>
                <div style={{ fontSize: 22, fontWeight: 700, margin: "3px 0" }}>{d.getDate()}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{shift.timeLabel || `${shift.startTime}–${shift.endTime}`}</div>
                <div style={{ display: "inline-block", background: color + "20", color, padding: "2px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, marginTop: 8 }}>
                  {shift.role}
                </div>
                {shift.area && <div className="text-xs text-muted mt-2">{shift.area}</div>}
                <div style={{ marginTop: 6 }}>
                  <span className={`su-badge ${shift.status === "completed" ? "su-badge-green" : shift.status === "no-show" ? "su-badge-red" : "su-badge-gray"}`} style={{ fontSize: 10 }}>
                    {shift.status}
                  </span>
                </div>
              </div>
            ) : (
              <div key={dateStr} style={{ background: "#f9f9f7", border: "2px dashed #e0e0e0", borderRadius: 12, padding: 14, textAlign: "center", color: "#ccc" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#ccc", marginBottom: 4 }}>{dayNames[i]}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#d0d0d0" }}>{d.getDate()}</div>
                <div style={{ marginTop: 6, fontSize: 11 }}>Off</div>
              </div>
            );
          })}
        </div>
      )}

      {/* PROFILE SIDEBAR */}
      <div className="su-card mt-4" style={{ maxWidth: 300 }}>
        <div className="su-card-title">My Profile</div>
        <div className="text-sm"><strong>Name:</strong> {user?.name || `${user?.firstName} ${user?.lastName}`}</div>
        <div className="text-sm mt-2"><strong>Role:</strong> {user?.position || user?.role}</div>
        <div className="text-sm mt-2"><strong>Availability:</strong> {user?.availability}</div>
        <div className="text-sm mt-2"><strong>Email:</strong> {user?.email}</div>
      </div>
=======

    fetchShifts();
  }, []);

  return (
    <div className="su-page">

      {/* PAGE TITLE */}
      <div className="su-title mb-4">MY SCHEDULE</div>

      {/* PROFILE CARD */}
      <div className="su-card mb-4" style={{ maxWidth: 300 }}>
        <div className="su-card-title">My Profile</div>

        <div className="text-sm">
          <strong>Name:</strong>{" "}
          {user?.name || `${user?.firstName} ${user?.lastName}`}
        </div>

        <div className="text-sm mt-2">
          <strong>Role:</strong> {user?.position || user?.role}
        </div>

        <div className="text-sm mt-2">
          <strong>Availability:</strong> {user?.availability}
        </div>

        <div className="text-sm mt-2">
          <strong>Email:</strong> {user?.email}
        </div>
      </div>

      {/* CALENDAR CARD */}
      <div className="su-card">
        <div className="su-card-title">Schedule Calendar</div>

        {loading ? (
          <div style={{ padding: 40 }}>Loading shifts...</div>
        ) : (
          <main className="schedule">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay"
              }}
              events={events}
              height="auto"
            />
          </main>
        )}
      </div>

>>>>>>> f9f616b1 (updated project)
    </div>
  );
}
