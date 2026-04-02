import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function OAuthCallback() {
  const { loginWithOAuthData } = useAuth();
  const [status, setStatus]    = useState("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw    = params.get("data");
    const err    = params.get("error");

    if (err || !raw) {
      setStatus("error");
      if (window.opener) {
        window.opener.postMessage({ type:"OAUTH_ERROR" }, window.location.origin);
        setTimeout(() => window.close(), 800);
      } else {
        setTimeout(() => { window.location.href = "/"; }, 2000);
      }
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type:"OAUTH_SUCCESS", token:parsed.token, user:parsed.user }, window.location.origin);
        setStatus("done");
        setTimeout(() => window.close(), 500);
      } else {
        loginWithOAuthData(parsed.token, parsed.user);
        window.location.href = "/";
      }
    } catch {
      setStatus("error");
      setTimeout(() => { window.location.href = "/"; }, 2000);
    }
  }, []);

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f0ec", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {status === "error" ? (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48 }}>❌</div>
          <div style={{ fontWeight:700, color:"#dc2626", marginTop:12 }}>Sign-in failed</div>
        </div>
      ) : status === "done" ? (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48 }}>✅</div>
          <div style={{ fontWeight:700, color:"#16a34a", marginTop:12 }}>Signed in!</div>
        </div>
      ) : (
        <div style={{ textAlign:"center" }}>
          <div style={{ width:48, height:48, border:"4px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
          <div style={{ color:"#888", fontWeight:600 }}>Signing you in…</div>
        </div>
      )}
    </div>
  );
}