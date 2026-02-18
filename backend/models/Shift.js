const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee is required"],
    },
    date: {
      type: Date,
      required: [true, "Shift date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
    timeLabel: {
      type: String, // e.g. "9-5pm"
    },
    role: {
      type: String,
      required: [true, "Role is required"],
    },
    area: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "no-show", "swapped"],
      default: "scheduled",
    },
    notes: {
      type: String,
      default: "",
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Index for efficient querying
shiftSchema.index({ employee: 1, date: 1 });
shiftSchema.index({ date: 1 });

module.exports = mongoose.model("Shift", shiftSchema);