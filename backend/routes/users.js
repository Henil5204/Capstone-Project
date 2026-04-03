const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// GET /api/users — get all users (manager/owner)
router.get("/", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["employee","manager"] } })
      .select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/reports
router.get("/reports", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const users = await User.find({ role: "employee" }).select("-password");
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/users/create-employee — manager creates employee account
router.post("/create-employee", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const { firstName, lastName, email, password, position, availability, role } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email already registered" });

    // Get org code from the manager/owner's account
    const creator = await User.findById(req.user._id);
    const orgCode = creator.orgCode || null;
    const orgOwner = creator.role === "owner" ? creator._id : (creator.orgOwner || null);

    const user = await User.create({
      firstName, lastName, email, password,
      role:         role === "manager" ? "manager" : "employee",
      position:     position     || "",
      availability: availability || "Full-Time",
      orgCode:      null,
      orgOwner,
      createdBy:    req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `${role === "manager" ? "Manager" : "Employee"} account created successfully`,
      user: {
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, role: user.role, position: user.position,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:id
router.get("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/users/:id
router.put("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/users/:id
router.delete("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;