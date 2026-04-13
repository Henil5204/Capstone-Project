import React from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

const PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";

export default function ResubscribePage({ onSuccess, onBack }) {
  const { user, updateUser } = useAuth();
  const [stripe,        setStripe]        = React.useState(null);
  const [clientSecret,  setClientSecret]  = React.useState("");
  const [customerId,    setCustomerId]    = React.useState("");
  const [setupIntentId, setSetupIntentId] = React.useState("");
  const [step,          setStep]          = React.useState("loading");
  const [error,         setError]         = React.useState("");
  const elementsRef = React.useRef(null);
  const mounted     = React.useRef(false);

  // Load Stripe.js
  React.useEffect(() => {
    if (!PUBLISHABLE_KEY) { setError("Stripe not configured."); setStep("error"); return; }
    if (window.Stripe)    { setStripe(window.Stripe(PUBLISHABLE_KEY)); return; }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/"; s.async = true;
    s.onload  = () => setStripe(window.Stripe(PUBLISHABLE_KEY));
    s.onerror = () => { setError("Failed to load Stripe."); setStep("error"); };
    document.head.appendChild(s);
  }, []);

  // Create SetupIntent via resubscribe endpoint
  React.useEffect(() => {
    if (!stripe) return;
    mounted.current = false;
    api.post("/subscription/resubscribe")
      .then(res => {
        if (res.data.clientSecret) {
          setClientSecret(res.data.clientSecret);
          setCustomerId(res.data.customerId || "");
          setSetupIntentId(res.data.setupIntentId || "");
        } else { setError("Failed to initialize payment."); setStep("error"); }
      })
      .catch(err => { setError(err.response?.data?.message || "Failed to initialize."); setStep("error"); });
  }, [stripe]);

  // Mount Stripe Elements
  React.useEffect(() => {
    if (!stripe || !clientSecret || mounted.current) return;
    const container = document.getElementById("resub-payment-element");
    if (!container) return;
    mounted.current = true;
    try {
      const el = stripe.elements({
        clientSecret,
        appearance: { theme:"stripe", variables:{ colorPrimary:"#f5b800", borderRadius:"10px" } },
      });
      elementsRef.current = el;
      const pe = el.create("payment", { layout:{ type:"tabs", defaultCollapsed:false } });
      pe.mount("#resub-payment-element");
      pe.on("ready", () => { setStep("ready"); setError(""); });
      pe.on("change", e => { if (e.error) setError(e.error.message); else setError(""); });
    } catch(err) { setError("Payment form error: " + err.message); setStep("error"); }
  }, [stripe, clientSecret]);

  const handlePay = async () => {
    if (!stripe || !elementsRef.current || step !== "ready") return;
    setStep("processing"); setError("");

    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements: elementsRef.current,
      confirmParams: {
        return_url: window.location.origin,
        payment_method_data: {
          billing_details: {
            name:  `${user?.firstName||""} ${user?.lastName||""}`.trim(),
            email: user?.email || "",
          },
        },
      },
      redirect: "if_required",
    });

    if (stripeError) { setError(stripeError.message); setStep("ready"); return; }

    try {
      await api.post("/subscription/activate", {
        customerId,
        paymentMethodId: setupIntent?.payment_method,
        setupIntentId:   setupIntent?.id || setupIntentId,
      });
      // Update local user object
      updateUser({ ...user, subscriptionStatus:"active" });
      onSuccess?.();
    } catch(err) {
      setError(err.response?.data?.message || "Activation failed."); setStep("ready");
    }
  };

  const trialEnd = new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString("en-CA",{month:"long",day:"numeric",year:"numeric"});

  return (
    <div style={{ minHeight:"100vh", background:"#f4f4f0", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:"100%", maxWidth:520 }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color:"#f5b800", letterSpacing:3, marginBottom:8 }}>SHIFT-UP</div>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:40, color:"#1a1a1a", margin:"0 0 8px", letterSpacing:.5 }}>Reactivate Subscription</h1>
          <p style={{ color:"#888", fontSize:14 }}>7 days free · Then $5 CAD/month · Cancel anytime</p>
        </div>

        <div style={{ background:"#fff", borderRadius:20, padding:"32px 28px", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>

          {/* Account info */}
          <div style={{ background:"#f9f9f7", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#555", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ color:"#aaa" }}>Account</span>
            <span style={{ fontWeight:700, color:"#1a1a1a" }}>{user?.email}</span>
          </div>

          {/* Trial banner */}
          <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#166534" }}>7-Day Free Trial</div>
              <div style={{ fontSize:12, color:"#166534", opacity:.8, marginTop:2 }}>Card saved now · Charged after {trialEnd}</div>
            </div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#16a34a" }}>FREE</div>
          </div>

          {/* Card form */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#555", marginBottom:10 }}>Card Details</div>
            {step === "loading" && (
              <div style={{ height:100, display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7", borderRadius:12, border:"1px dashed #e0e0e0" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:28, height:28, border:"3px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 8px" }} />
                  <div style={{ fontSize:13, color:"#aaa" }}>Loading secure payment form…</div>
                </div>
              </div>
            )}
            {step === "error" && (
              <div style={{ padding:"14px 16px", background:"#fee2e2", borderRadius:10, color:"#dc2626", fontSize:13 }}>
                ⚠ {error}
              </div>
            )}
            <div id="resub-payment-element"
              style={{ display:step==="error"?"none":"block", visibility:step==="loading"?"hidden":"visible", height:step==="loading"?0:"auto" }} />
          </div>

          {error && step === "ready" && (
            <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:12 }}>⚠ {error}</div>
          )}

          {/* Price breakdown */}
          <div style={{ background:"#f9f9f7", borderRadius:10, overflow:"hidden", marginBottom:20 }}>
            <div style={{ padding:"10px 16px", display:"flex", justifyContent:"space-between", fontSize:13, borderBottom:"1px solid #eee" }}>
              <span style={{ color:"#888" }}>Today (7-day trial)</span>
              <span style={{ fontWeight:800, color:"#16a34a" }}>$0.00 CAD</span>
            </div>
            <div style={{ padding:"10px 16px", display:"flex", justifyContent:"space-between", fontSize:13 }}>
              <span style={{ color:"#888" }}>After trial</span>
              <span style={{ fontWeight:800 }}>$5.00 CAD/month</span>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handlePay} disabled={step !== "ready"}
            style={{ width:"100%", padding:"16px", background:step!=="ready"?"#e5e5e5":"#f5b800", color:step!=="ready"?"#aaa":"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:16, cursor:step!=="ready"?"not-allowed":"pointer", marginBottom:12 }}>
            {step === "processing" ? "⏳ Activating…" : step === "loading" ? "⏳ Loading…" : step === "error" ? "Fix error above" : "Reactivate — $0 Today"}
          </button>

          <div style={{ textAlign:"center", fontSize:12, color:"#aaa", marginBottom:12 }}>
            256-bit SSL · Powered by Stripe · Cancel anytime
          </div>

          <button onClick={onBack}
            style={{ width:"100%", padding:10, background:"transparent", color:"#aaa", border:"none", cursor:"pointer", fontSize:13, fontFamily:"var(--font-body)" }}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}