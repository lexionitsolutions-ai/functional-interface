const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const allowedMusicKeys = new Set([
  "energetic",
  "peaceful",
  "meditation",
  "yoga",
  "nature"
]);

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    videoId: { type: String, required: true, trim: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    reps: { type: Number, required: true, min: 1 },
    repTime: { type: Number, required: true, min: 0.1 }
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    musicKey: { type: String, trim: true, default: "energetic" },
    exercises: { type: [exerciseSchema], default: [] }
  },
  { timestamps: true }
);

const Batch = mongoose.models.Batch || mongoose.model("Batch", batchSchema);

async function connectToDatabase() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
}

function validateBatchPayload(body) {
  const { name, exercises, musicKey } = body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return "Batch name is required";
  }

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return "At least one exercise is required";
  }

  if (musicKey != null && (typeof musicKey !== "string" || !allowedMusicKeys.has(musicKey))) {
    return "Invalid musicKey";
  }

  return "";
}

function normalizeBatchPayload(body) {
  const { name, exercises, musicKey } = body || {};
  return {
    name: name.trim(),
    musicKey: typeof musicKey === "string" ? musicKey : "energetic",
    exercises
  };
}

async function seedBatchesIfEmpty() {
  const existingCount = await Batch.countDocuments();
  if (existingCount > 0) {
    return;
  }

  const seedPath = path.join(process.cwd(), "seed-batches.json");
  if (!fs.existsSync(seedPath)) {
    return;
  }

  const seedBatches = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  if (!Array.isArray(seedBatches) || seedBatches.length === 0) {
    return;
  }

  const cleanBatches = seedBatches
    .filter(batch => batch && batch.name && Array.isArray(batch.exercises) && batch.exercises.length > 0)
    .map(batch => ({
      name: batch.name,
      musicKey: typeof batch.musicKey === "string" ? batch.musicKey : "energetic",
      exercises: batch.exercises
    }));

  if (cleanBatches.length > 0) {
    await Batch.insertMany(cleanBatches);
  }
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ message });
}

module.exports = {
  Batch,
  connectToDatabase,
  normalizeBatchPayload,
  seedBatchesIfEmpty,
  sendError,
  validateBatchPayload
};
