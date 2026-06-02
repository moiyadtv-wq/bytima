const ActivityLog = require("../models/activityLogSchema");

async function log(req, action, targetType = "", targetId = "", details = "") {
  if (!req.session.user) return;
  try {
    await ActivityLog.create({
      user: req.session.user.id,
      userEmail: req.session.user.email,
      action,
      targetType,
      targetId: String(targetId),
      details
    });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }
}

module.exports = { log };