const {
  Batch,
  connectToDatabase,
  normalizeBatchPayload,
  sendError,
  validateBatchPayload
} = require("../_db");

module.exports = async function handler(req, res) {
  try {
    await connectToDatabase();

    const { id } = req.query || {};
    if (!id) {
      return sendError(res, 400, "Batch id is required");
    }

    if (req.method === "PUT") {
      const validationError = validateBatchPayload(req.body);
      if (validationError) {
        return sendError(res, 400, validationError);
      }

      const updated = await Batch.findByIdAndUpdate(
        id,
        normalizeBatchPayload(req.body),
        { new: true, runValidators: true }
      );

      if (!updated) {
        return sendError(res, 404, "Batch not found");
      }

      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      const deleted = await Batch.findByIdAndDelete(id);

      if (!deleted) {
        return sendError(res, 404, "Batch not found");
      }

      return res.status(200).json({ message: "Batch deleted" });
    }

    res.setHeader("Allow", "PUT, DELETE");
    return sendError(res, 405, "Method not allowed");
  } catch (error) {
    console.error("Batch detail API error:", error);
    return sendError(res, 500, "Failed to process batch request");
  }
};
