const mongoose = require("mongoose");

const swapRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proposedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
    },
    shiftDate: {
      type: String,
      required: true,
    },
    shiftTime: {
      type: String,
      required: true,
    },
    shiftRole: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
    },
    coverageNote: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    managerComment: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SwapRequest", swapRequestSchema);