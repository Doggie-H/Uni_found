const mongoose = require("mongoose");
const Claim = require("../models/claim-model");
const Item = require("../models/item-model");
const User = require("../models/user-model");
const Conversation = require("../models/conversation-model");
const Message = require("../models/message-model");

const toSafeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getSortOption = (sortBy, order, allowed) => {
  const key = allowed.includes(sortBy) ? sortBy : "created_at";
  const direction = order === "asc" ? 1 : -1;
  return { [key]: direction };
};

const ensureConversation = async ({ itemId, claimId, type, participants }) => {
  const uniqueParticipants = Array.from(new Set(participants.map(String))).map(
    (id) => new mongoose.Types.ObjectId(id),
  );

  const conversation = await Conversation.findOneAndUpdate(
    {
      item_id: itemId,
      claim_id: claimId,
      type,
    },
    {
      $setOnInsert: {
        item_id: itemId,
        claim_id: claimId,
        type,
        participants: uniqueParticipants,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  ).lean();

  return conversation;
};

const sendSystemMessage = async (conversationId, body) => {
  if (!conversationId || !body) return;
  await Message.create({
    conversation_id: conversationId,
    sender_id: null,
    is_system: true,
    system_label: "He thong",
    body,
  });
};

// Tao moi claim va tu dong mo kenh chat dung vai tro.
exports.createClaim = (req, res) => {
  const { item_id, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(item_id)) {
    return res.status(400).json({ error: "Item khong hop le." });
  }

  Item.findById(item_id)
    .lean()
    .then(async (item) => {
      if (!item) {
        return res.status(404).json({ error: "Khong tim thay item." });
      }
      if (item.status !== "FOUND") {
        return res
          .status(400)
          .json({ error: "Item da duoc tra, khong the claim." });
      }
      if (item.user_id?.toString() === req.user.id) {
        return res
          .status(400)
          .json({ error: "Ban khong the claim mon do do chinh minh dang." });
      }

      const normalizedDescription =
        typeof description === "string" ? description.trim() : "";
      if (normalizedDescription.length < 10) {
        return res
          .status(400)
          .json({ error: "Mo ta xac minh can it nhat 10 ky tu." });
      }
      if (normalizedDescription.length > 1000) {
        return res
          .status(400)
          .json({ error: "Mo ta xac minh qua dai (toi da 1000 ky tu)." });
      }

      const existingActiveClaim = await Claim.findOne({
        item_id,
        user_id: req.user.id,
        status: "CONNECTED",
      }).lean();

      if (existingActiveClaim) {
        return res.status(400).json({
          error: "Ban da co yeu cau dang xu ly cho mon do nay.",
        });
      }

      // Tat ca claim deu CONNECTED ngay (khong can admin duyet)
      const newClaim = await Claim.create({
        item_id,
        user_id: req.user.id,
        description: normalizedDescription,
        status: "CONNECTED",
      });

      // Tất cả conversation: FINDER_SEEKER (finder + seeker nhắn tin trực tiếp)
      const conversation = await ensureConversation({
        itemId: item._id,
        claimId: newClaim._id,
        type: "FINDER_SEEKER",
        participants: [req.user.id, item.user_id.toString()],
      });

      const isLostPost = item.post_type === "LOST";
      const systemNotice = isLostPost
        ? "Thong bao: Co nguoi nhat duoc vat pham ban dang tim va da gui thong tin xac minh."
        : "Thong bao: Co nguoi yeu cau nhan lai vat pham kem bang chung xac minh.";

      const initialUserMessage = isLostPost
        ? "Xin chao, minh da nhat duoc vat pham ban dang tim. Minh gui thong tin de doi chieu va ban giao."
        : "Xin chao, minh dang gui yeu cau nhan lai vat pham kem bang chung de doi chieu.";

      await sendSystemMessage(conversation._id, systemNotice);

      await Message.create({
        conversation_id: conversation._id,
        sender_id: req.user.id,
        body: initialUserMessage,
      });

      return res.status(201).json({
        message: isLostPost
          ? "Da gui thong bao co nguoi nhat duoc vat pham ban dang tim."
          : "Da gui yeu cau nhan lai vat pham kem bang chung.",
        claim_id: newClaim._id.toString(),
        conversation_id: conversation?._id?.toString?.() || null,
      });
    })
    .catch((err) => {
      if (err?.code === 11000) {
        return res
          .status(400)
          .json({ error: "Ban da gui claim cho item nay va dang cho duyet." });
      }
      return res.status(500).json({ error: err.message });
    });
};

// Danh sach claims cho admin.
exports.getClaims = (req, res) => {
  const { status, page, limit, sortBy, order } = req.query;
  const query = {};
  if (
    typeof status === "string" &&
    ["CONNECTED", "RETURN_CONFIRMED"].includes(status)
  ) {
    query.status = status;
  }

  const hasPagination = page !== undefined || limit !== undefined;
  const safePage = toSafeInt(page, 1);
  const safeLimit = Math.min(toSafeInt(limit, 20), 100);
  const sort = getSortOption(sortBy, order, ["created_at", "status"]);

  const mapper = (claim) => ({
    id: claim._id.toString(),
    item_id: claim.item_id?._id?.toString?.() || null,
    user_id: claim.user_id?._id?.toString?.() || null,
    description: claim.description,
    status: claim.status,
    seeker_confirmed: Boolean(claim.seeker_confirmed),
    holder_confirmed: Boolean(claim.holder_confirmed),
    returned_confirmed_at: claim.returned_confirmed_at || null,
    created_at: claim.created_at,
    item_title: claim.item_id?.title || "Khong ro",
    item_custody_type: claim.item_id?.custody_type || "FINDER",
    item_holder_username: claim.item_id?.user_id?.username || "Khong ro",
    claimer_username: claim.user_id?.username || "Khong ro",
  });

  const baseQuery = Claim.find(query)
    .populate("item_id", "title custody_type user_id")
    .populate({
      path: "item_id",
      populate: { path: "user_id", select: "username" },
    })
    .populate("user_id", "username")
    .sort(sort);

  if (!hasPagination) {
    return baseQuery
      .lean()
      .then((rows) => res.json(rows.map(mapper)))
      .catch((err) => res.status(500).json({ error: err.message }));
  }

  Promise.all([
    baseQuery
      .clone()
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Claim.countDocuments(query),
  ])
    .then(([rows, total]) =>
      res.json({
        data: rows.map(mapper),
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        },
      }),
    )
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Nguoi tim + ben giu do xac nhan da hoan tra.
exports.confirmReturn = (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Claim not found" });
  }

  Claim.findById(id)
    .populate("item_id", "user_id status")
    .then(async (claim) => {
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }

      if (!["CONNECTED", "RETURN_CONFIRMED"].includes(claim.status)) {
        return res.status(400).json({
          error: "Claim chua dat trang thai co the xac nhan hoan tra.",
        });
      }

      const item = claim.item_id;
      const isSeeker = claim.user_id.toString() === req.user.id;
      const isHolder = item.user_id?.toString() === req.user.id;

      if (!isSeeker && !isHolder) {
        return res
          .status(403)
          .json({ error: "Ban khong co quyen xac nhan claim nay." });
      }

      if (isSeeker) claim.seeker_confirmed = true;
      if (isHolder) claim.holder_confirmed = true;

      const conversation = await Conversation.findOne({
        claim_id: claim._id,
        type: "FINDER_SEEKER",
      })
        .select("_id")
        .lean();

      if (claim.seeker_confirmed && claim.holder_confirmed) {
        claim.status = "RETURN_CONFIRMED";
        claim.returned_confirmed_at = new Date();

        await Item.findByIdAndUpdate(item._id, {
          status: "RETURNED",
          returned_at: claim.returned_confirmed_at,
        });

        await Claim.updateMany(
          {
            _id: { $ne: claim._id },
            item_id: item._id,
            status: "CONNECTED",
          },
          { $set: { status: "RETURN_CONFIRMED" } },
        );

        if (conversation?._id) {
          await sendSystemMessage(
            conversation._id,
            "Thong bao admin: Vat pham da duoc hoan tra thanh cong.",
          );
        }
      }

      await claim.save();

      return res.json({
        message:
          claim.status === "RETURN_CONFIRMED"
            ? "Da xac nhan hoan tra. Admin da nhan thong bao vat pham da duoc hoan tra."
            : "Da ghi nhan xac nhan cua ban.",
        claim: {
          id: claim._id.toString(),
          status: claim.status,
          seeker_confirmed: claim.seeker_confirmed,
          holder_confirmed: claim.holder_confirmed,
          returned_confirmed_at: claim.returned_confirmed_at,
        },
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

// Danh sach hoan tra da xac nhan cho admin.
exports.getReturnRecords = (req, res) => {
  Claim.find({ status: "RETURN_CONFIRMED" })
    .populate("item_id", "title location custody_type")
    .populate("user_id", "username full_name khoa nganh")
    .sort({ returned_confirmed_at: -1 })
    .lean()
    .then((rows) =>
      res.json(
        rows.map((claim) => ({
          id: claim._id.toString(),
          item_title: claim.item_id?.title || "Khong ro",
          item_location: claim.item_id?.location || "Khong ro",
          custody_type: claim.item_id?.custody_type || "FINDER",
          seeker_name:
            claim.user_id?.full_name || claim.user_id?.username || "Khong ro",
          seeker_khoa: claim.user_id?.khoa || null,
          seeker_nganh: claim.user_id?.nganh || null,
          returned_confirmed_at:
            claim.returned_confirmed_at || claim.created_at,
        })),
      ),
    )
    .catch((err) => res.status(500).json({ error: err.message }));
};
