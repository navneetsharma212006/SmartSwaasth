const Message = require("../models/Message");
const User = require("../models/User");
const { sendPushToUsers } = require("../services/pushService");

exports.triggerSOS = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const patient = await User.findById(patientId);

    if (!patient || patient.role !== "patient") {
      return res.status(403).json({ error: "Only patients can trigger SOS alerts." });
    }

    // Find all connected doctors (caregivers)
    const caregivers = await User.find({
      _id: { $in: patient.caregivers }
    });

    if (caregivers.length === 0) {
      return res.status(404).json({ error: "No connected doctors found to alert." });
    }

    const doctorIds = caregivers.map(doc => doc._id);
    const doctorNames = caregivers.map(doc => doc.name).join(", ");

    // 1. Send Push Notifications
    const pushPayload = {
      title: "🚨 EMERGENCY SOS",
      body: `${patient.name} has triggered an emergency SOS alert! Please check the chat immediately.`,
      url: `/chat/${patientId}`,
      tag: "emergency-sos",
      data: {
        urgent: true,
        patientId
      }
    };
    await sendPushToUsers(doctorIds, pushPayload);

    // 2. Automatically post emergency messages in chats
    const emergencyMessages = doctorIds.map(doctorId => ({
      senderId: patientId,
      receiverId: doctorId,
      content: "🚨 EMERGENCY SOS! I have triggered an emergency alert. Please contact me immediately.",
    }));
    await Message.insertMany(emergencyMessages);

    // 3. (Optional) In a real app, you might also trigger an SMS or Phone Call here

    res.json({ 
      message: "SOS alert sent to all connected doctors.",
      notifiedDoctors: doctorNames
    });
  } catch (err) {
    next(err);
  }
};
