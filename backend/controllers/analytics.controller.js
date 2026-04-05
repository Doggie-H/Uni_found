const Visit = require("../models/visit.model");
const Item = require("../models/item.model");
const User = require("../models/user.model");
const Claim = require("../models/claim.model");

const TRACK_EVENT_TYPES = new Set(["page_view"]);
const TRACK_SOURCES = new Set(["web", "mobile", "seed", "demo", "unknown"]);
const DEDUP_WINDOW_MS = 45 * 1000;

const RANGE_CONFIG = {
  day: { buckets: 24, label: "Giờ" },
  week: { buckets: 7, label: "Ngày" },
  month: { buckets: 30, label: "Ngày" },
  year: { buckets: 12, label: "Tháng" },
};

const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date, amount) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

const addMonths = (date, amount) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
};

const formatDayLabel = (date) =>
  date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

const formatMonthLabel = (date) =>
  date.toLocaleDateString("vi-VN", { month: "2-digit", year: "2-digit" });

const buildBuckets = (range) => {
  const now = new Date();
  const config = RANGE_CONFIG[range] || RANGE_CONFIG.month;

  if (range === "day") {
    const buckets = [];
    const base = startOfDay(now);
    for (let i = 0; i < 24; i += 1) {
      const bucketStart = new Date(base);
      bucketStart.setHours(i, 0, 0, 0);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(bucketEnd.getHours() + 1);
      buckets.push({
        key: String(i),
        label: `${String(i).padStart(2, "0")}:00`,
        start: bucketStart,
        end: bucketEnd,
        visits: 0,
        itemsReported: 0,
        itemsReturned: 0,
      });
    }
    return { buckets, rangeLabel: "24 giờ gần nhất" };
  }

  if (range === "year") {
    const buckets = [];
    const base = startOfDay(now);
    const start = new Date(base.getFullYear(), base.getMonth() - 11, 1);
    for (let i = 0; i < 12; i += 1) {
      const bucketStart = new Date(
        start.getFullYear(),
        start.getMonth() + i,
        1,
      );
      const bucketEnd = new Date(
        bucketStart.getFullYear(),
        bucketStart.getMonth() + 1,
        1,
      );
      buckets.push({
        key: `${bucketStart.getFullYear()}-${bucketStart.getMonth()}`,
        label: formatMonthLabel(bucketStart),
        start: bucketStart,
        end: bucketEnd,
        visits: 0,
        itemsReported: 0,
        itemsReturned: 0,
      });
    }
    return { buckets, rangeLabel: "12 tháng gần nhất" };
  }

  const buckets = [];
  const days = config.buckets;
  const base = startOfDay(now);
  const start = addDays(base, -(days - 1));
  for (let i = 0; i < days; i += 1) {
    const bucketStart = addDays(start, i);
    const bucketEnd = addDays(bucketStart, 1);
    buckets.push({
      key: bucketStart.toISOString().slice(0, 10),
      label: formatDayLabel(bucketStart),
      start: bucketStart,
      end: bucketEnd,
      visits: 0,
      itemsReported: 0,
      itemsReturned: 0,
    });
  }
  return {
    buckets,
    rangeLabel: range === "week" ? "7 ngày gần nhất" : "30 ngày gần nhất",
  };
};

const placeInBucket = (buckets, date, field) => {
  const matchedBucket = buckets.find(
    (bucket) => date >= bucket.start && date < bucket.end,
  );
  if (matchedBucket) {
    matchedBucket[field] += 1;
  }
};

const normalizePath = (value) => {
  if (typeof value !== "string") return "/";
  const trimmed = value.trim();
  if (!trimmed) return "/";
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalized.slice(0, 512);
};

const normalizeNullableText = (value, maxLength = 256) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
};

const normalizeEventType = (value) =>
  TRACK_EVENT_TYPES.has(value) ? value : "page_view";

const normalizeSource = (value) => {
  if (typeof value !== "string") return "web";
  const normalized = value.trim().toLowerCase();
  return TRACK_SOURCES.has(normalized) ? normalized : "unknown";
};

const toSafeInt = (value, fallback, min = 1, max = 200) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

exports.recordVisit = async (req, res) => {
  try {
    const event_type = normalizeEventType(req.body?.event_type);
    const source = normalizeSource(req.body?.source);
    const path = normalizePath(req.body?.path);
    const referrer = normalizeNullableText(req.body?.referrer, 512);
    const visitor_id = normalizeNullableText(req.body?.visitor_id, 120);
    const session_id = normalizeNullableText(req.body?.session_id, 120);
    const user_agent = normalizeNullableText(req.headers["user-agent"], 512);

    if (visitor_id && session_id) {
      const dedupSince = new Date(Date.now() - DEDUP_WINDOW_MS);
      const duplicate = await Visit.findOne({
        event_type,
        visitor_id,
        session_id,
        path,
        created_at: { $gte: dedupSince },
      })
        .select("_id")
        .lean();

      if (duplicate) {
        return res
          .status(200)
          .json({ message: "Bo qua su kien trung lap.", duplicate: true });
      }
    }

    await Visit.create({
      event_type,
      source,
      path,
      referrer,
      visitor_id,
      session_id,
      user_agent,
    });

    return res
      .status(201)
      .json({ message: "Da ghi nhan luot truy cap.", duplicate: false });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAdminAnalytics = async (req, res) => {
  try {
    const range = ["day", "week", "month", "year"].includes(req.query.range)
      ? req.query.range
      : "month";

    const { buckets, rangeLabel } = buildBuckets(range);
    const rangeStart = buckets[0]?.start || startOfDay(new Date());
    const rangeEnd = buckets[buckets.length - 1]?.end || new Date();

    const [visits, items, users, claims] = await Promise.all([
      Visit.find({
        event_type: "page_view",
        created_at: { $gte: rangeStart, $lt: rangeEnd },
      })
        .sort({ created_at: 1 })
        .lean(),
      Item.find({}).sort({ created_at: 1 }).lean(),
      User.countDocuments({}),
      Claim.find({ created_at: { $gte: rangeStart, $lt: rangeEnd } })
        .sort({ created_at: 1 })
        .lean(),
    ]);

    visits.forEach((visit) => {
      const visitDate = toDate(visit.created_at);
      if (visitDate) placeInBucket(buckets, visitDate, "visits");
    });

    items.forEach((item) => {
      const reportedDate = toDate(item.date_lost_found);
      if (reportedDate) placeInBucket(buckets, reportedDate, "itemsReported");

      const returnedDate = toDate(
        item.returned_at || item.date_lost_found || item.created_at,
      );
      if (item.status === "RETURNED" && returnedDate) {
        placeInBucket(buckets, returnedDate, "itemsReturned");
      }
    });

    const claimTotals = claims.reduce(
      (acc, claim) => {
        acc.total += 1;
        if (claim.status === "PENDING") acc.pending += 1;
        if (claim.status === "APPROVED") acc.approved += 1;
        if (claim.status === "REJECTED") acc.rejected += 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 },
    );

    const allItems = await Item.find({}).lean();
    const allVisits = await Visit.find({ event_type: "page_view" }).lean();
    const allClaims = await Claim.find({}).lean();
    const rangeVisitorSet = new Set(
      visits.map((visit) => visit.visitor_id).filter(Boolean),
    );
    const rangeSessionSet = new Set(
      visits.map((visit) => visit.session_id).filter(Boolean),
    );
    const allVisitorSet = new Set(
      allVisits.map((visit) => visit.visitor_id).filter(Boolean),
    );
    const allSessionSet = new Set(
      allVisits.map((visit) => visit.session_id).filter(Boolean),
    );

    const overview = {
      totalUsers: await User.countDocuments({}),
      totalItems: allItems.length,
      totalFoundItems: allItems.filter((item) => item.status === "FOUND")
        .length,
      totalReturnedItems: allItems.filter((item) => item.status === "RETURNED")
        .length,
      totalVisits: allVisits.length,
      totalUniqueVisitors: allVisitorSet.size,
      totalSessions: allSessionSet.size,
      totalClaims: allClaims.length,
      pendingClaims: allClaims.filter((claim) => claim.status === "PENDING")
        .length,
      approvedClaims: allClaims.filter((claim) => claim.status === "APPROVED")
        .length,
      rejectedClaims: allClaims.filter((claim) => claim.status === "REJECTED")
        .length,
      currentRangeVisits: visits.length,
      currentRangeUniqueVisitors: rangeVisitorSet.size,
      currentRangeSessions: rangeSessionSet.size,
      currentRangeItemsReported: buckets.reduce(
        (sum, bucket) => sum + bucket.itemsReported,
        0,
      ),
      currentRangeItemsReturned: buckets.reduce(
        (sum, bucket) => sum + bucket.itemsReturned,
        0,
      ),
      currentRangeClaims: claimTotals.total,
    };

    return res.json({
      range,
      rangeLabel,
      overview,
      buckets: buckets.map(({ start, end, ...bucket }) => bucket),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAdminVisits = async (req, res) => {
  try {
    const page = toSafeInt(req.query.page, 1, 1, 1000000);
    const limit = toSafeInt(req.query.limit, 20, 1, 200);
    const sortBy = ["created_at", "path", "source"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "created_at";
    const order = req.query.order === "asc" ? 1 : -1;
    const keyword =
      typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";

    const query = { event_type: "page_view" };

    if (keyword) {
      query.$or = [
        { path: { $regex: keyword, $options: "i" } },
        { referrer: { $regex: keyword, $options: "i" } },
        { source: { $regex: keyword, $options: "i" } },
      ];
    }

    const [rows, total] = await Promise.all([
      Visit.find(query)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Visit.countDocuments(query),
    ]);

    const data = rows.map((visit) => ({
      id: visit._id.toString(),
      created_at: visit.created_at,
      path: visit.path || "/",
      source: visit.source || "web",
      referrer: visit.referrer || null,
      visitor_id: visit.visitor_id || null,
      session_id: visit.session_id || null,
      user_agent: visit.user_agent || null,
      event_type: visit.event_type || "page_view",
    }));

    return res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
