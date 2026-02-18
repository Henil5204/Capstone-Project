import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";

export default function ShiftSwap({ user }) {
  const [employees, setEmployees] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [form, setForm] = useState({ shiftId: "", proposedEmployeeId: "", reason: "", coverageNote: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empsRes, shiftsRes, swapsRes] = await Promise.all([
        api.get("/users/employees"),
        api.get("/shifts"),
        api.get("/swaps"),
      ]);
      setEmployees((empsRes.data.employees || []).filter((e) => e.id !== user?.id));
      setMyShifts(shiftsRes.data.shifts || []);
      setMyRequests(swapsRes.data.swaps || []);
    } catch {
      // Fallback demo employees only — no fake shift IDs to avoid ObjectId errors
      setEmployees([
        { id: "2", name: "Kevin Chen", position: "Dishwasher" },
        { id: "3", name: "Sarah T.", position: "Kitchen Staff" },
        { id: "4", name: "John M.", position: "Bartender" },
      ]);
      // Leave myShifts empty when backend unavailable
      setMyShifts([]);
    }
  };

  const handleSubmit = async () => {
    setErr(""); setMsg("");
    if (!form.shiftId || !form.proposedEmployeeId || !form.reason) {
      setErr("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const shift = myShifts.find((s) => s._id === form.shiftId);
      const dateStr = shift ? new Date(shift.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "";
      await api.post("/swaps", {
        proposedEmployeeId: form.proposedEmployeeId,
        shiftId: form.shiftId,
        shiftDate: dateStr,
        shiftTime: shift?.timeLabel || "",
        shiftRole: shift?.role || "",
        reason: form.reason,
        coverageNote: form.coverageNote,
      });
      setMsg("Swap request submitted successfully!");
      setForm({ shiftId: "", proposedEmployeeId: "", reason: "", coverageNote: "" });
      fetchData();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to submit swap request.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = { pending: "su-badge-orange", approved: "su-badge-green", rejected: "su-badge-red" };
    return `su-badge ${map[status] || "su-badge-gray"}`;
  };

  return (
    <div className="su-page">
      <div className="su-title">SHIFT SWAP</div>
      <div className="su-g2" style={{ gap: 22, alignItems: "start" }}>

        {/* LEFT: Submit Form */}
        <div>
          <div className="su-card mb-3">
            <div className="su-card-title">Submit Swap Request</div>
            {err && <div className="su-alert-err">{err}</div>}
            {msg && <div className="su-alert-ok">{msg}</div>}

            <div className="su-form-row">
              <label className="su-label">Select Shift *</label>
              <select className="su-input" value={form.shiftId} onChange={(e) => setForm({ ...form, shiftId: e.target.value })}>
                <option value="">Choose your shift…</option>
                {myShifts.map((s) => (
                  <option key={s._id} value={s._id}>
                    {new Date(s.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })} — {s.timeLabel || `${s.startTime}–${s.endTime}`} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="su-form-row">
              <label className="su-label">Propose Replacement *</label>
              <select className="su-input" value={form.proposedEmployeeId} onChange={(e) => setForm({ ...form, proposedEmployeeId: e.target.value })}>
                <option value="">Select coworker…</option>
                {employees.map((e) => (
                  <option key={e.id || e._id} value={e.id || e._id}>
                    {e.name || `${e.firstName} ${e.lastName}`} — {e.position}
                  </option>
                ))}
              </select>
            </div>

            <div className="su-form-row">
              <label className="su-label">Reason for Swap *</label>
              <textarea className="su-input" placeholder="Explain why you need a swap…" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>

            <div className="su-form-row">
              <label className="su-label">Coverage Note (optional)</label>
              <input className="su-input" type="text" placeholder="e.g. Kevin confirmed he is available" value={form.coverageNote} onChange={(e) => setForm({ ...form, coverageNote: e.target.value })} />
            </div>

            <button className="su-btn su-btn-black su-btn-pill" onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="spinner" /> : "Submit Request"}
            </button>
          </div>
        </div>

        {/* RIGHT: My Requests */}
        <div className="su-card">
          <div className="su-card-title">My Swap Requests</div>
          {myRequests.filter((r) => r.requester?.id === user?.id || r.requester?._id === user?.id).length === 0 ? (
            <p className="text-sm text-muted text-center" style={{ padding: 20 }}>No swap requests yet.</p>
          ) : (
            myRequests.filter((r) => {
              const rid = r.requester?.id || r.requester?._id;
              return rid === user?.id;
            }).map((r) => (
              <div key={r._id} style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 12, marginBottom: 12 }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold">{r.shiftDate}</span>
                  <span className={getStatusBadge(r.status)}>{r.status}</span>
                </div>
                <div className="text-xs text-muted">Proposed: {r.proposedEmployee?.name || `${r.proposedEmployee?.firstName} ${r.proposedEmployee?.lastName}`}</div>
                <div className="text-xs text-muted">Reason: {r.reason}</div>
                {r.managerComment && (
                  <div className="text-xs mt-2" style={{ color: "#555" }}>Manager: {r.managerComment}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}