const Message = require("../models/Message");
const User = require("../models/User");

exports.getChatHistory = async (req, res, next) => {
  try {
    const { userId } = req.params; // The other user in the chat
    const currentUserId = req.user.id;

    // Fetch messages between these two users
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 }) // oldest first to display top-to-bottom
      .limit(100);

    // Optionally fetch the other user's name
    const otherUser = await User.findById(userId, "name role");

    res.json({ messages, otherUser });
  } catch (err) {
    next(err);
  }
};
