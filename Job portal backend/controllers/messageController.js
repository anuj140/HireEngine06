
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

exports.getConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user.id })
    .populate("participants", "name")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name" },
    })
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, conversations });
};

exports.sendMessage = async (req, res) => {
  const { recipientId, content, jobId } = req.body;
  const senderId = req.user.id;

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, recipientId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({ participants: [senderId, recipientId] });
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    content,
    job: jobId,
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  // In a real-time app, you'd emit a socket event here
  res.status(201).json({ success: true, message });
};
