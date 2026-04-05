const mongoose = require("mongoose");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");

const toProfileLabel = (u) => {
  const khoa = u?.khoa ? String(u.khoa).trim() : "";
  const nganh = u?.nganh ? String(u.nganh).trim() : "";
  if (khoa && nganh) return `${khoa} - ${nganh}`;
  if (khoa) return khoa;
  if (nganh) return nganh;
  return "Chua cap nhat khoa/nganh";
};

const isParticipant = (conversation, userId) =>
  conversation.participants.some((p) => p._id.toString() === userId);

exports.getConversations = async (req, res) => {
  try {
    const rows = await Conversation.find({
      participants: new mongoose.Types.ObjectId(req.user.id),
    })
      .populate("participants", "username full_name role khoa nganh")
      .populate("item_id", "title status custody_type")
      .populate(
        "claim_id",
        "status seeker_confirmed holder_confirmed returned_confirmed_at",
      )
      .sort({ created_at: -1 })
      .lean();

    const mapped = await Promise.all(
      rows.map(async (conversation) => {
        const lastMessage = await Message.findOne({
          conversation_id: conversation._id,
        })
          .sort({ created_at: -1 })
          .lean();

        return {
          id: conversation._id.toString(),
          type: conversation.type,
          item: {
            id: conversation.item_id?._id?.toString?.() || null,
            title: conversation.item_id?.title || "Khong ro",
            status: conversation.item_id?.status || "FOUND",
            custody_type: conversation.item_id?.custody_type || "FINDER",
          },
          claim: conversation.claim_id
            ? {
                id: conversation.claim_id._id.toString(),
                status: conversation.claim_id.status,
                seeker_confirmed: Boolean(
                  conversation.claim_id.seeker_confirmed,
                ),
                holder_confirmed: Boolean(
                  conversation.claim_id.holder_confirmed,
                ),
                returned_confirmed_at:
                  conversation.claim_id.returned_confirmed_at || null,
              }
            : null,
          participants: (conversation.participants || []).map((p) => ({
            id: p._id.toString(),
            username: p.username,
            full_name: p.full_name,
            role: p.role,
            khoa: p.khoa,
            nganh: p.nganh,
            profile_label: toProfileLabel(p),
            is_me: p._id.toString() === req.user.id,
          })),
          last_message: lastMessage
            ? {
                body: lastMessage.body,
                created_at: lastMessage.created_at,
                is_system: Boolean(lastMessage.is_system),
                system_label: lastMessage.system_label || "He thong",
              }
            : null,
          created_at: conversation.created_at,
        };
      }),
    );

    return res.json(mapped);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getConversationMessages = async (req, res) => {
  const { conversationId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(404).json({ error: "Khong tim thay cuoc tro chuyen." });
  }

  try {
    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "username")
      .lean();

    if (!conversation) {
      return res.status(404).json({ error: "Khong tim thay cuoc tro chuyen." });
    }

    if (!isParticipant(conversation, req.user.id)) {
      return res
        .status(403)
        .json({ error: "Ban khong co quyen xem cuoc tro chuyen nay." });
    }

    const rows = await Message.find({
      conversation_id: conversationId,
    })
      .populate("sender_id", "username full_name role khoa nganh")
      .sort({ created_at: 1 })
      .lean();

    return res.json(
      rows.map((m) => ({
        id: m._id.toString(),
        body: m.body,
        is_system: Boolean(m.is_system),
        system_label: m.system_label || "He thong",
        created_at: m.created_at,
        sender: {
          id: m.sender_id?._id?.toString?.() || null,
          username: m.sender_id?.username || "unknown",
          full_name:
            m.sender_id?.full_name || m.sender_id?.username || "unknown",
          role: m.sender_id?.role || "user",
          khoa: m.sender_id?.khoa || null,
          nganh: m.sender_id?.nganh || null,
          profile_label: toProfileLabel(m.sender_id),
        },
      })),
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { body } = req.body;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(404).json({ error: "Khong tim thay cuoc tro chuyen." });
  }

  const normalizedBody = typeof body === "string" ? body.trim() : "";
  if (!normalizedBody) {
    return res
      .status(400)
      .json({ error: "Noi dung tin nhan khong duoc de trong." });
  }

  try {
    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "username")
      .lean();

    if (!conversation) {
      return res.status(404).json({ error: "Khong tim thay cuoc tro chuyen." });
    }

    if (!isParticipant(conversation, req.user.id)) {
      return res
        .status(403)
        .json({ error: "Ban khong co quyen gui vao cuoc tro chuyen nay." });
    }

    const saved = await Message.create({
      conversation_id: conversationId,
      sender_id: req.user.id,
      body: normalizedBody,
    });

    return res.status(201).json({
      id: saved._id.toString(),
      body: saved.body,
      created_at: saved.created_at,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
