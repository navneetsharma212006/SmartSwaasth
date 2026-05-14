const Message = require("../models/Message");
const User = require("../models/User");

exports.getChatHistory = async (req, res, next) => {
  try {
    const { userId } = req.params; // The other user in the chat
    const currentUserId = req.user.id;

    // Mark messages as read
    await Message.updateMany(
      { senderId: userId, receiverId: currentUserId, read: false },
      { $set: { read: true } }
    );

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

exports.getUnreadCounts = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    
    // Aggregate unread messages targeted to current user, grouped by sender
    const unreadCounts = await Message.aggregate([
      { $match: { receiverId: require('mongoose').Types.ObjectId(currentUserId), read: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } }
    ]);
    
    // Convert to object: { senderId: count }
    const result = {};
    unreadCounts.forEach(item => {
      result[item._id.toString()] = item.count;
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};
