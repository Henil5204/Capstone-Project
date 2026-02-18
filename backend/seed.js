require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");
const Shift = require("./models/Shift");
const SwapRequest = require("./models/SwapRequest");
const Notification = require("./models/Notification");
const Attendance = require("./models/Attendance");

const seed = async () => {
  await connectDB();
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Shift.deleteMany(),
      SwapRequest.deleteMany(),
      Notification.deleteMany(),
      Attendance.deleteMany(),
    ]);
    console.log("🗑  Cleared existing data");

    // ── Create Users ─────────────────────────────────────────────────────
    const users = await User.create([
      {
        firstName: "Maria", lastName: "Garcia",
        email: "maria@shiftup.com", password: "password123",
        role: "employee", position: "Waitstaff", availability: "Full-Time",
        noShows: 0, coveragePercent: 95,
        lastAttendance: new Date("2025-10-19"),
      },
      {
        firstName: "Kevin", lastName: "Chen",
        email: "kevin@shiftup.com", password: "password123",
        role: "employee", position: "Dishwasher", availability: "Full-Time",
        noShows: 5, coveragePercent: 85,
        lastAttendance: new Date("2025-10-17"),
      },
      {
        firstName: "Sarah", lastName: "T.",
        email: "sarah@shiftup.com", password: "password123",
        role: "employee", position: "Kitchen Staff", availability: "Part-Time",
        noShows: 6, coveragePercent: 50,
        lastAttendance: new Date("2025-10-15"),
      },
      {
        firstName: "John", lastName: "M.",
        email: "john@shiftup.com", password: "password123",
        role: "employee", position: "Bartender", availability: "Full-Time",
        noShows: 0, coveragePercent: 95,
        lastAttendance: new Date("2025-10-19"),
      },
      {
        firstName: "Terry", lastName: "Young",
        email: "terry@shiftup.com", password: "password123",
        role: "employee", position: "Dishwasher", availability: "Full-Time",
        noShows: 1, coveragePercent: 90,
        lastAttendance: new Date("2025-10-17"),
      },
      {
        firstName: "Manager", lastName: "Abel",
        email: "manager@shiftup.com", password: "password123",
        role: "manager", position: "Manager",
      },
      {
        firstName: "Owner", lastName: "Smith",
        email: "owner@shiftup.com", password: "password123",
        role: "owner", position: "Owner",
      },
    ]);
    console.log(`✅ Created ${users.length} users`);

    const [maria, kevin, sarah, john, terry, manager] = users;

    // ── Create Shifts ─────────────────────────────────────────────────────
    const shifts = await Shift.create([
      // This week – Oct 20
      { employee: maria._id, date: new Date("2025-10-20"), startTime: "09:00", endTime: "17:00", timeLabel: "9-5pm", role: "Waitstaff", area: "Front",     status: "scheduled", createdBy: manager._id },
      { employee: kevin._id, date: new Date("2025-10-20"), startTime: "17:00", endTime: "23:00", timeLabel: "5-11pm", role: "Dishwasher", area: "Kitchen",  status: "scheduled", createdBy: manager._id },
      { employee: sarah._id, date: new Date("2025-10-20"), startTime: "11:00", endTime: "20:00", timeLabel: "11-8am", role: "Kitchen Staff", area: "Bar",   status: "scheduled", createdBy: manager._id },
      { employee: john._id,  date: new Date("2025-10-20"), startTime: "09:00", endTime: "17:00", timeLabel: "9-5pm", role: "Bartender", area: "Waitstaff",  status: "scheduled", createdBy: manager._id },
      // Oct 21
      { employee: maria._id, date: new Date("2025-10-21"), startTime: "09:00", endTime: "17:00", timeLabel: "9-5pm", role: "Waitstaff", area: "Front",     status: "scheduled", createdBy: manager._id },
      { employee: kevin._id, date: new Date("2025-10-21"), startTime: "17:00", endTime: "23:00", timeLabel: "5-11pm", role: "Dishwasher", area: "Kitchen",  status: "scheduled", createdBy: manager._id },
      // Past week – Oct 15
      { employee: maria._id, date: new Date("2025-10-15"), startTime: "09:00", endTime: "17:00", timeLabel: "9-5pm", role: "Waitstaff", area: "Front",     status: "completed", createdBy: manager._id },
      { employee: kevin._id, date: new Date("2025-10-15"), startTime: "17:00", endTime: "23:00", timeLabel: "5-11pm", role: "Dishwasher", area: "Kitchen",  status: "completed", createdBy: manager._id },
    ]);
    console.log(`✅ Created ${shifts.length} shifts`);

    // ── Create Swap Requests ──────────────────────────────────────────────
    const swaps = await SwapRequest.create([
      {
        requester: maria._id, proposedEmployee: kevin._id,
        shift: shifts[0]._id,
        shiftDate: "Mon Oct 20, 2025", shiftTime: "9:00 AM - 5:00 PM", shiftRole: "Waitstaff",
        reason: "Doctor appointment", coverageNote: "Kevin is available",
        status: "pending",
      },
      {
        requester: maria._id, proposedEmployee: kevin._id,
        shift: shifts[4]._id,
        shiftDate: "Mon Oct 20, 2025", shiftTime: "9:00 AM - 5:00 PM", shiftRole: "Waitstaff",
        reason: "Doctor appointment", coverageNote: "Kevin is available",
        status: "pending",
      },
      {
        requester: john._id, proposedEmployee: sarah._id,
        shift: shifts[3]._id,
        shiftDate: "Mon Oct 20, 2025", shiftTime: "9:00 AM - 5:00 PM", shiftRole: "Bartender",
        reason: "Family event", coverageNote: "Sarah confirmed availability",
        status: "pending",
      },
    ]);
    console.log(`✅ Created ${swaps.length} swap requests`);

    // ── Create Notifications ──────────────────────────────────────────────
    await Notification.create([
      {
        recipient: maria._id, type: "APPROVED",
        title: "Swap Approved",
        message: "Your swap was APPROVED – Manager Abel approval for Mon Oct 20",
        read: false,
        relatedSwap: swaps[0]._id,
      },
      {
        recipient: maria._id, type: "SCHEDULE_PUBLISHED",
        title: "Schedule Published",
        message: "SCHEDULE PUBLISHED – New schedule published – Week of Oct 20–26",
        read: false,
      },
    ]);
    console.log("✅ Created notifications");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Demo Login Credentials:");
    console.log("   Employee : maria@shiftup.com   / password123");
    console.log("   Manager  : manager@shiftup.com / password123");
    console.log("   Owner    : owner@shiftup.com   / password123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

seed();