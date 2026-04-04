const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();

    if (!key || process.env[key] != null) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, ".env"));

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/functionalBatchDB";
const frontendDir = path.resolve(__dirname, "..");

app.use(cors());
app.use(express.json());
app.use(express.static(frontendDir));

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

const Batch = mongoose.model("Batch", batchSchema);

app.get("/api/health", (_req, res) => {
  res.send("Backend is working");
});

app.get("/api/batches", async (_req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });
    res.json(batches);
  } catch (error) {
    console.error("Error loading batches:", error);
    res.status(500).json({ message: "Failed to load batches" });
  }
});

app.post("/api/batches", async (req, res) => {
  try {
    const { name, exercises, musicKey } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Batch name is required" });
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ message: "At least one exercise is required" });
    }

    if (musicKey != null && (!allowedMusicKeys.has(musicKey) || typeof musicKey !== "string")) {
      return res.status(400).json({ message: "Invalid musicKey" });
    }

    const batch = await Batch.create({
      name: name.trim(),
      musicKey: typeof musicKey === "string" ? musicKey : "energetic",
      exercises
    });

    res.status(201).json(batch);
  } catch (error) {
    console.error("Error saving batch:", error);
    res.status(500).json({ message: "Failed to save batch" });
  }
});

app.put("/api/batches/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, exercises, musicKey } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Batch name is required" });
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ message: "At least one exercise is required" });
    }

    if (musicKey != null && (!allowedMusicKeys.has(musicKey) || typeof musicKey !== "string")) {
      return res.status(400).json({ message: "Invalid musicKey" });
    }

    const updated = await Batch.findByIdAndUpdate(
      id,
      { name: name.trim(), musicKey: typeof musicKey === "string" ? musicKey : "energetic", exercises },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating batch:", error);
    res.status(500).json({ message: "Failed to update batch" });
  }
});

app.delete("/api/batches/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Batch.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.json({ message: "Batch deleted" });
  } catch (error) {
    console.error("Error deleting batch:", error);
    res.status(500).json({ message: "Failed to delete batch" });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  return res.sendFile(path.join(frontendDir, "index.html"));
});

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

startServer();
