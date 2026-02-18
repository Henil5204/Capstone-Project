const express = require("express");
const router = express.Router();
const SwapRequest = require("../models/SwapRequest");
const Notification = require("../models/Notification");
const Shift = require("../models/Shift");
const { protect, authorize } = require("../middleware/auth");

// ── GET /api/swaps – Get swap requests
router.get("/", protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "employee") {
      query = { $or: [{ requester: req.user._id }, { proposedEmployee: req.user._id }] };
    }

    if (req.query.status) query.status = req.query.status;

    const swaps = await SwapRequest.find(query)
      .populate("requester", "firstName lastName name position")
      .populate("proposedEmployee", "firstName lastName name position")
      .populate("shift", "date startTime endTime role area timeLabel")
      .populate("reviewedBy", "firstName lastName name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: swaps.length, swaps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/swaps – Submit a swap request
router.post("/", protect, authorize("employee"), async (req, res) => {
  try {
    const { proposedEmployeeId, shiftId, shiftDate, shiftTime, shiftRole, reason, coverageNote } = req.body;

    if (!proposedEmployeeId || !reason) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Validate shiftId is a valid ObjectId
    if (shiftId && !shiftId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid shift ID" });
    }

    // Check for existing pending swap for same shift
    if (shiftId) {
      const existing = await SwapRequest.findOne({ shift: shiftId, status: "pending" });
      if (existing) {
        return res.status(400).json({ success: false, message: "A pending swap already exists for this shift" });
      }
    }

    const swap = await SwapRequest.create({
      requester: req.user._id,
      proposedEmployee: proposedEmployeeId,
      shift: shiftId || undefined,
      shiftDate: shiftDate || "",
      shiftTime: shiftTime || "",
      shiftRole: shiftRole || "",
      reason,
      coverageNote: coverageNote || "",
    });

    await swap.populate([
      { path: "requester", select: "firstName lastName name" },
      { path: "proposedEmployee", select: "firstName lastName name" },
    ]);

    // Notify proposed employee
    await Notification.create({
      recipient: proposedEmployeeId,
      type: "SWAP_REQUEST",
      title: "Swap Request",
      message: `${req.user.name} requested you to cover their ${shiftRole || "shift"} on ${shiftDate || "upcoming date"}`,
      relatedSwap: swap._id,
    });

    // Notify managers
    const managers = await require("../models/User").find({ role: { $in: ["manager", "owner"] } });
    const managerNotifs = managers.map((m) => ({
      recipient: m._id,
      type: "SWAP_REQUEST",
      title: "New Swap Request",
      message: `${req.user.name} submitted a swap request for ${shiftDate || "upcoming date"}`,
      relatedSwap: swap._id,
    }));
    if (managerNotifs.length) await Notification.insertMany(managerNotifs);

    res.status(201).json({ success: true, swap });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/swaps/:id/approve – Approve a swap
router.put("/:id/approve", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id)
      .populate("requester", "_id name")
      .populate("proposedEmployee", "_id name")
      .populate("shift");

    if (!swap) return res.status(404).json({ success: false, message: "Swap not found" });
    if (swap.status !== "pending") return res.status(400).json({ success: false, message: "Swap already resolved" });

    swap.status = "approved";
    swap.managerComment = req.body.comment || "";
    swap.reviewedBy = req.user._id;
    swap.reviewedAt = new Date();
    await swap.save();

    // Update the shift's employee to proposedEmployee
    if (swap.shift) {
      await Shift.findByIdAndUpdate(swap.shift._id, {
        employee: swap.proposedEmployee._id,
        status: "swapped",
      });
    }

    // Notify requester
    await Notification.create({
      recipient: swap.requester._id,
      type: "APPROVED",
      title: "Swap Approved",
      message: `Your swap request for ${swap.shiftDate} was APPROVED by ${req.user.name}`,
      relatedSwap: swap._id,
    });

    // Notify proposed employee
    await Notification.create({
      recipient: swap.proposedEmployee._id,
      type: "APPROVED",
      title: "You Received a Shift",
      message: `You now have a ${swap.shiftRole} shift on ${swap.shiftDate}`,
      relatedSwap: swap._id,
    });

    res.json({ success: true, swap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/swaps/:id/reject – Reject a swap
router.put("/:id/reject", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id)
      .populate("requester", "_id name");

    if (!swap) return res.status(404).json({ success: false, message: "Swap not found" });
    if (swap.status !== "pending") return res.status(400).json({ success: false, message: "Swap already resolved" });

    swap.status = "rejected";
    swap.managerComment = req.body.comment || "";
    swap.reviewedBy = req.user._id;
    swap.reviewedAt = new Date();
    await swap.save();

    // Notify requester
    await Notification.create({
      recipient: swap.requester._id,
      type: "REJECTED",
      title: "Swap Rejected",
      message: `Your swap request for ${swap.shiftDate} was rejected. ${swap.managerComment || ""}`,
      relatedSwap: swap._id,
    });

    res.json({ success: true, swap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;