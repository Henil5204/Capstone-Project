import React, { useState, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import ChangePassword from "./ChangePassword";

/**
 * ProfileCard — works for Employee, Manager and Owner portals.
 * Shows profile info, photo upload, and password change.
 */
export default function ProfileCard({ onClose }) {
  const { user, updateUser, logout } = useAuth();
  const [tab,          setTab]          = useState("profile");
  const [firstName,    setFirstName]    = useState(user?.firstName || "");
  const [lastName,     setLastName]     = useState(user?.lastName  || "");
  const [position,     setPosition]     = useState(user?.position  || "");
  const [availability, setAvailability] = useState(user?.availability || "Full-Time");
  const [avatar,       setAvatar]       = useState(user?.avatar    || null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState("");
  const fileRef = useRef();

  const initials = `${user?.firstName?.[0]||""}${user?.lastName?.[0]||""}`.toUpperCase();
  const roleColor = { employee:"#4f46e5", manager:"#0891b2", owner:"#f5b800" }[user?.role] || "#888";

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Photo must be under 2MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setAvatar(reader.result); setError(""); };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await api.put("/auth/me", { firstName, lastName, position, availability, avatar });
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile.");
    } finally { setSaving(false); }
  };

  const inputStyle = {
    width:"100%", padding:"10px 14px", border:"1.5px solid #e0e0e0",
    borderRadius:10, fontFamily:"var(--font-body)", fontSize:14,
    outline:"none", boxSizing:"border-box", background:"#fff",
  };

  const TABS = [
    { key:"profile",  icon:"👤", label:"Profile"  },
    { key:"password", icon:"🔐", label:"Password" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:520, maxHeight:"92vh", overflow:"hidden", fontFamily:"var(--font-body)", boxShadow:"0 24px 80px rgba(0,0,0,.25)", display:"flex", flexDirection:"column" }}>

        {/* ── Header ── */}
        <div style={{ background:"#1a1a1a", padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {avatar ? (
              <img src={avatar} alt="" style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", border:"2px solid #f5b800" }} />
            ) : (
              <div style={{ width:44, height:44, borderRadius:"50%", background:roleColor, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:16, color: user?.role==="owner"?"#1a1a1a":"#fff" }}>
                {initials}
              </div>
            )}
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:16 }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                <span style={{ background:roleColor, color: user?.role==="owner"?"#1a1a1a":"#fff", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>
                  {user?.role}
                </span>
                <span style={{ color:"#666", fontSize:12 }}>{user?.email}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.1)", border:"none", color:"#fff", width:34, height:34, borderRadius:"50%", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", borderBottom:"2px solid #f0f0f0", flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex:1, padding:"13px 0", border:"none", cursor:"pointer",
              background: tab===t.key ? "#fff" : "#f9f9f7",
              fontFamily:"var(--font-body)", fontWeight: tab===t.key ? 800 : 600,
              fontSize:13, color: tab===t.key ? "#1a1a1a" : "#aaa",
              borderBottom: tab===t.key ? "2px solid #f5b800" : "2px solid transparent",
              transition:"all .2s",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ padding:"24px 28px", overflowY:"auto", flex:1 }}>

          {/* ══ PROFILE TAB ══════════════════════════════════════════════ */}
          {tab === "profile" && (
            <>
              {/* Avatar upload */}
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, padding:"16px", background:"#f9f9f7", borderRadius:14 }}>
                <div style={{ position:"relative", flexShrink:0 }}>
                  {avatar ? (
                    <img src={avatar} alt="profile" style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", border:"3px solid #f5b800" }} />
                  ) : (
                    <div style={{ width:80, height:80, borderRadius:"50%", background:roleColor, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:28, color: user?.role==="owner"?"#1a1a1a":"#fff" }}>
                      {initials}
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current.click()}
                    style={{ position:"absolute", bottom:2, right:2, width:26, height:26, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #fff", color:"#f5b800", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}
                  >
                    ✏
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} style={{ display:"none" }} />
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:15 }}>{firstName} {lastName}</div>
                  <div style={{ fontSize:13, color:"#aaa", marginTop:2 }}>{position || "No position set"}</div>
                  <button onClick={() => fileRef.current.click()} style={{ marginTop:8, padding:"5px 14px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                    📷 Change Photo
                  </button>
                  <div style={{ fontSize:11, color:"#ccc", marginTop:4 }}>JPG, PNG or WEBP · Max 2MB</div>
                </div>
              </div>

              {error && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:14 }}>{error}</div>}

              {/* Name */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>First Name</label>
                  <input style={inputStyle} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Last Name</label>
                  <input style={inputStyle} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" />
                </div>
              </div>

              {/* Position */}
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Position</label>
                <input style={inputStyle} value={position} onChange={e=>setPosition(e.target.value)} placeholder="e.g. Waitstaff, Cook, Manager" />
              </div>

              {/* Availability */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Availability</label>
                <select style={inputStyle} value={availability} onChange={e=>setAvailability(e.target.value)}>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="On-Call">On-Call</option>
                </select>
              </div>

              {/* Account info (read-only) */}
              <div style={{ background:"#f9f9f7", borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Account Info</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { label:"Email",       value: user?.email },
                    { label:"Role",        value: user?.role  },
                    { label:"Availability",value: user?.availability },
                    { label:"Member Since",value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—" },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ fontSize:10, color:"#bbb", textTransform:"uppercase", letterSpacing:.5 }}>{row.label}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#555", marginTop:2 }}>{row.value || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ width:"100%", padding:"13px", background: saved?"#22c55e":"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor:"pointer", opacity:saving?.7:1, transition:"background .3s", marginBottom:10 }}
              >
                {saving ? "Saving..." : saved ? "✅ Profile Saved!" : "Save Profile"}
              </button>

              {/* Sign out */}
              <button
                onClick={logout}
                style={{ width:"100%", padding:"11px", background:"transparent", color:"#dc2626", border:"1.5px solid #fee2e2", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:700, fontSize:14, cursor:"pointer" }}
              >
                Sign Out
              </button>
            </>
          )}

          {/* ══ PASSWORD TAB ═════════════════════════════════════════════ */}
          {tab === "password" && <ChangePassword />}
        </div>
      </div>
    </div>
  );
}