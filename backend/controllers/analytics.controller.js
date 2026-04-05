const Visit = require("../models/visit.model");
const Item = require("../models/item.model");
const User = require("../models/user.model");
const Claim = require("../models/claim.model");

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

exports.recordVisit = async (req, res) => {
  try {
    const path = typeof req.body?.path === "string" ? req.body.path : "/";
    const referrer =
      typeof req.body?.referrer === "string" && req.body.referrer.trim()
        ? req.body.referrer.trim()
        : null;

    await Visit.create({ path, referrer });
    return res.status(201).json({ message: "Da ghi nhan luot truy cap." });
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
      Visit.find({ created_at: { $gte: rangeStart, $lt: rangeEnd } })
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
    const allVisits = await Visit.find({}).lean();
    const allClaims = await Claim.find({}).lean();

    const overview = {
      totalUsers: await User.countDocuments({}),
      totalItems: allItems.length,
      totalFoundItems: allItems.filter((item) => item.status === "FOUND")
        .length,
      totalReturnedItems: allItems.filter((item) => item.status === "RETURNED")
        .length,
      totalVisits: allVisits.length,
      totalClaims: allClaims.length,
      pendingClaims: allClaims.filter((claim) => claim.status === "PENDING")
        .length,
      approvedClaims: allClaims.filter((claim) => claim.status === "APPROVED")
        .length,
      rejectedClaims: allClaims.filter((claim) => claim.status === "REJECTED")
        .length,
      currentRangeVisits: visits.length,
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
