const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const getStripe = () => process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

const sendTrialEmail = async (toEmail, name) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const nodemailer  = require("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from:    `"SHIFT-UP" <${process.env.EMAIL_USER}>`,
    to:      toEmail,
    subject: "🎉 Your SHIFT-UP 7-Day Free Trial Has Started!",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:16px;overflow:hidden">
        <div style="background:#1a1a1a;padding:32px 40px;text-align:center">
          <div style="font-size:28px;font-weight:900;color:#f5b800;letter-spacing:2px">SHIFT-UP</div>
        </div>
        <div style="padding:40px">
          <h2 style="font-size:22px;color:#1a1a1a">🎁 Your 7-Day Free Trial Has Started!</h2>
          <p style="color:#555;line-height:1.7">Hi ${name || "there"}! Full access for 7 days. No charge until trial ends.</p>
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" style="display:block;text-align:center;background:#f5b800;color:#1a1a1a;font-weight:800;font-size:15px;padding:16px;border-radius:10px;text-decoration:none;margin:24px 0">
            Go to Dashboard →
          </a>
          <p style="font-size:12px;color:#aaa;text-align:center">Trial ends in 7 days. Cancel anytime = $0. After trial: $5 CAD/month.</p>
        </div>
      </div>
    `,
  });
  console.log(`✅ Trial email sent to ${toEmail}`);
};

// GET /api/subscription/plan
router.get("/plan", (req, res) => {
  res.json({ success: true, plan: { name:"SHIFT-UP Pro", priceId: process.env.STRIPE_PRICE_ID, amount: 500, trial: 7 } });
});

// GET /api/subscription/status
router.get("/status", protect, async (req, res) => {
  try {
    const stripe = getStripe();
    const user   = await User.findById(req.user._id);
    if (!stripe || !user.stripeCustomerId)
      return res.json({ success: true, active: false, trial: false, subscription: null });

    const subs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, limit: 1 });
    if (!subs.data.length)
      return res.json({ success: true, active: false, trial: false, subscription: null });

    const sub      = subs.data[0];
    const isTrial  = sub.status === "trialing";
    const isActive = sub.status === "active" || isTrial;
    res.json({
      success: true, active: isActive, trial: isTrial,
      subscription: {
        id: sub.id, status: sub.status,
        trialEnd:         sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtEnd:      sub.cancel_at_period_end,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/checkout
router.post("/checkout", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });
    if (!process.env.STRIPE_PRICE_ID) return res.status(400).json({ success: false, message: "STRIPE_PRICE_ID not set" });

    const user = await User.findById(req.user._id);
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: `${user.firstName} ${user.lastName}`, metadata: { userId: user._id.toString() } });
      customerId = customer.id; user.stripeCustomerId = customerId; await user.save();
    }

    const existingSubs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
    const hadTrial     = existingSubs.data.some(s => s.trial_start);

    const sessionConfig = {
      customer: customerId, payment_method_types: ["card"], mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription/cancel`,
      metadata: { userId: user._id.toString() },
    };
    if (!hadTrial) sessionConfig.subscription_data = { trial_period_days: 7 };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ success: true, url: session.url, hasTrial: !hadTrial });
  } catch (err) { console.error("Checkout error:", err.message); res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/create-intent
router.post("/create-intent", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });
    if (!process.env.STRIPE_PRICE_ID) return res.status(400).json({ success: false, message: "STRIPE_PRICE_ID not set" });

    const user = await User.findById(req.user._id);
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: `${user.firstName} ${user.lastName}`, metadata: { userId: user._id.toString() } });
      customerId = customer.id; user.stripeCustomerId = customerId; await user.save();
    }

    const existingSubs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
    const hadTrial     = existingSubs.data.some(s => s.trial_start);

    const subConfig = {
      customer: customerId,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId: user._id.toString() },
    };
    if (!hadTrial) subConfig.trial_period_days = 7;

    const subscription = await stripe.subscriptions.create(subConfig);
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    res.json({ success: true, clientSecret, subscriptionId: subscription.id, hasTrial: !hadTrial });
  } catch (err) { console.error("Create intent error:", err.message); res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/activate
router.post("/activate", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { subscriptionStatus: "active", subscriptionPlan: "pro" });
    const user = await User.findById(req.user._id);
    try { await sendTrialEmail(user.email, user.firstName); } catch {}
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/portal
router.post("/portal", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) return res.status(400).json({ success: false, message: "No subscription found" });
    const session = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription` });
    res.json({ success: true, url: session.url });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/cancel
router.post("/cancel", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) return res.status(400).json({ success: false, message: "No subscription found" });
    const [a, t] = await Promise.all([
      stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "active",   limit: 1 }),
      stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "trialing", limit: 1 }),
    ]);
    const sub = a.data[0] || t.data[0];
    if (!sub) return res.status(400).json({ success: false, message: "No active subscription" });
    const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    res.json({ success: true, cancelDate: new Date(updated.current_period_end * 1000), wasTrial: updated.status === "trialing" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;