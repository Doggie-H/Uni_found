require("dotenv").config();
const mongoose = require("mongoose");
const Visit = require("./models/visit.model");

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lostandfound";

const PATHS = ["/", "/login", "/create-item", "/items", "/item/demo", "/admin"];

const REFERRERS = [
  "facebook",
  "zalo",
  "google",
  "direct",
  "demo-campaign",
  null,
];

const createRng = (seed = 123456789) => {
  let state = seed;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;

const pickWeightedHour = (rng) => {
  const bucket = rng();
  if (bucket < 0.18) return randInt(rng, 7, 9);
  if (bucket < 0.42) return randInt(rng, 10, 12);
  if (bucket < 0.75) return randInt(rng, 13, 18);
  if (bucket < 0.92) return randInt(rng, 19, 22);
  return randInt(rng, 0, 6);
};

const buildVisits = () => {
  const rng = createRng(26032026);
  const docs = [];
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 364);
  start.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 365; dayOffset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + dayOffset);

    const weekday = day.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const trend = dayOffset / 364;
    const seasonalWave = Math.sin((dayOffset / 30) * Math.PI) * 3;
    const campaignBoost = dayOffset % 47 === 0 ? randInt(rng, 8, 18) : 0;
    const baseTraffic = isWeekend ? 9 : 16;
    const randomNoise = randInt(rng, 0, 6);

    const dailyCount = Math.max(
      6,
      Math.round(
        baseTraffic + trend * 20 + seasonalWave + campaignBoost + randomNoise,
      ),
    );

    for (let i = 0; i < dailyCount; i += 1) {
      const createdAt = new Date(day);
      createdAt.setHours(
        pickWeightedHour(rng),
        randInt(rng, 0, 59),
        randInt(rng, 0, 59),
        0,
      );

      docs.push({
        path: PATHS[randInt(rng, 0, PATHS.length - 1)],
        referrer: REFERRERS[randInt(rng, 0, REFERRERS.length - 1)],
        created_at: createdAt,
      });
    }
  }

  // Tang mat do cho 24 gio gan nhat de chart theo ngay dep hon khi demo.
  const today = new Date();
  for (let hour = 0; hour < 24; hour += 1) {
    const extraCount =
      hour >= 8 && hour <= 21 ? randInt(rng, 2, 8) : randInt(rng, 0, 2);
    for (let i = 0; i < extraCount; i += 1) {
      const createdAt = new Date(today);
      createdAt.setHours(hour, randInt(rng, 0, 59), randInt(rng, 0, 59), 0);
      docs.push({
        path: PATHS[randInt(rng, 0, PATHS.length - 1)],
        referrer: "demo-traffic",
        created_at: createdAt,
      });
    }
  }

  return docs;
};

async function seedTraffic() {
  await mongoose.connect(mongoUri);

  const docs = buildVisits();

  await Visit.deleteMany({});
  await Visit.insertMany(docs);

  const earliest = await Visit.findOne({}).sort({ created_at: 1 }).lean();
  const latest = await Visit.findOne({}).sort({ created_at: -1 }).lean();

  console.log(`Da tao ${docs.length} luot truy cap ao.`);
  console.log(`Tu: ${earliest?.created_at?.toISOString?.() || "N/A"}`);
  console.log(`Den: ${latest?.created_at?.toISOString?.() || "N/A"}`);

  await mongoose.disconnect();
}

seedTraffic().catch(async (error) => {
  console.error("Seed traffic that bai:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
