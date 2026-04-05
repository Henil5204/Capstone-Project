const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// GET /api/users — all staff (manager + employee)
router.get("/", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const users = await User.find({ role:{ $in:["employee","manager"] } })
      .select("-password").sort({ firstName:1 });
    res.json({ success:true, users });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/users/employees
router.get("/employees", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const users = await User.find({ role:"employee" })
      .select("-password").sort({ firstName:1 });
    res.json({ success:true, users, employees:users });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/users/managers
router.get("/managers", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const users = await User.find({ role:"manager" })
      .select("-password").sort({ firstName:1 });
    res.json({ success:true, users });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/users/reports
router.get("/reports", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const users = await User.find({ role:"employee" }).select("-password");
    res.json({ success:true, users });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/users/create-employee — manager/owner creates account
router.post("/create-employee", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const { firstName, lastName, email, password, position, availability, role } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ success:false, message:"All fields required" });

    // Managers can only create employees
    if (req.user.role === "manager" && role === "manager")
      return res.status(403).json({ success:false, message:"Only owners can create manager accounts" });

    if (await User.findOne({ email }))
      return res.status(400).json({ success:false, message:"Email already registered" });

    const user = await User.create({
      firstName, lastName, email, password,
      role:         role === "manager" ? "manager" : "employee",
      position:     position     || "",
      availability: availability || "Full-Time",
    });

    res.status(201).json({
      success: true,
      message: `${role === "manager" ? "Manager" : "Employee"} account created successfully`,
      user: {
        id:user._id, firstName:user.firstName, lastName:user.lastName,
        email:user.email, role:user.role, position:user.position,
      },
    });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/users/:id
router.get("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success:false, message:"User not found" });
    res.json({ success:true, user });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// PUT /api/users/:id
router.put("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new:true }).select("-password");
    if (!user) return res.status(404).json({ success:false, message:"User not found" });
    res.json({ success:true, user });
  } catch(err) { res.status(400).json({ success:false, message:err.message }); }
});

// DELETE /api/users/:id
router.delete("/:id", protect, authorize("owner"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success:false, message:"User not found" });
    res.json({ success:true, message:"User deleted" });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;