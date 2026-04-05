const express  = require("express");
const router   = express.Router();
const passport = require("passport");
const User     = require("../models/User");
const { protect, generateToken } = require("../middleware/auth");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, position, availability } = req.body;
    if (!firstName || !lastName || !email || !password || !role)
      return res.status(400).json({ success: false, message: "All fields required" });
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email already registered" });
    const user  = await User.create({ firstName, lastName, email, password, role, position: position || "", availability: availability || "Full-Time" });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, position: user.position, subscriptionStatus: user.subscriptionStatus } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    const token = generateToken(user._id);
    res.json({ success: true, token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, position: user.position, availability: user.availability, avatar: user.avatar, subscriptionStatus: user.subscriptionStatus } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, position: user.position, availability: user.availability, availabilitySchedule: user.availabilitySchedule, noShows: user.noShows, coveragePercent: user.coveragePercent, lastAttendance: user.lastAttendance, avatar: user.avatar, subscriptionStatus: user.subscriptionStatus } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/auth/me
router.put("/me", protect, async (req, res) => {
  try {
    const { firstName, lastName, position, availability, availabilitySchedule, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { firstName, lastName, position, availability, availabilitySchedule, avatar }, { new: true });
    res.json({ success: true, user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT /api/auth/change-password — change password while logged in
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Current and new password required" });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.matchPassword(currentPassword)))
      return res.status(401).json({ success: false, message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Google OAuth
router.get("/google", (req, res, next) => {
  const role = ["employee","manager","owner"].includes(req.query.role) ? req.query.role : "employee";
  passport.authenticate("google", { scope: ["profile","email"], session: false, state: role })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (req.query.state) req.query.role = req.query.state;
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=google_failed` })(req, res, next);
}, (req, res) => {
  const token = generateToken(req.user._id);
  const data  = encodeURIComponent(JSON.stringify({ token, user: { id: req.user._id, firstName: req.user.firstName, lastName: req.user.lastName, email: req.user.email, role: req.user.role, subscriptionStatus: req.user.subscriptionStatus } }));
  res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/oauth/callback?data=${data}`);
});

module.exports = router;