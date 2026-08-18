const {
  Batch,
  connectToDatabase,
  normalizeBatchPayload,
  seedBatchesIfEmpty,
  sendError,
  validateBatchPayload
} = require("./_db");

module.exports = async function handler(req, res) {
  try {
    await connectToDatabase();

    if (req.method === "GET") {
      await seedBatchesIfEmpty();
      const batches = await Batch.find().sort({ createdAt: -1 });
      return res.status(200).json(batches);
    }

    if (req.method === "POST") {
      const validationError = validateBatchPayload(req.body);
      if (validationError) {
        return sendError(res, 400, validationError);
      }

      const batch = await Batch.create(normalizeBatchPayload(req.body));
      return res.status(201).json(batch);
    }

    res.setHeader("Allow", "GET, POST");
    return sendError(res, 405, "Method not allowed");
  } catch (error) {
    console.error("Batches API error:", error);
    return sendError(res, 500, "Failed to process batches request");
  }
};
