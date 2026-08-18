const { connectToDatabase } = require("./_db");

module.exports = async function handler(_req, res) {
  try {
    await connectToDatabase();
    return res.status(200).send("Backend is working");
  } catch (error) {
    console.error("Health check failed:", error);
    return res.status(500).json({ message: "Backend is not healthy" });
  }
};
