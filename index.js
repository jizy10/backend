// Backend: Modified API endpoints (Express/MongoDB)
const express = require("express");
const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const uri = "mongodb+srv://jizyjizy10:jizyjizy10@tender.q40dy.mongodb.net/?retryWrites=true&w=majority&appName=Tender";
const client = new MongoClient(uri);
app.use(express.json());
app.use(cors());

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB Atlas", error);
    throw error;
  }
}

(async () => {
  try {
    await connectToDatabase();
    const db = client.db("TenderDatabase");
    const collection = db.collection("tenders");

    // Modified to sort by published date descending
    app.get("/api/tenders", async (req, res) => {
      try {
        const tenders = await collection
          .find({})
          .sort({ "Published on": -1 })
          .toArray();
        res.json({ success: true, data: tenders });
      } catch (error) {
        console.error("Error fetching all tenders:", error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    app.get("/api/tenders/:id", async (req, res) => {
      try {
        const tenderId = req.params.id;
        if (!ObjectId.isValid(tenderId)) {
          return res.status(400).json({ success: false, message: "Invalid Tender ID" });
        }
        const tender = await collection.findOne({ _id: new ObjectId(tenderId) });
        if (!tender) {
          return res.status(404).json({ success: false, message: "Tender not found" });
        }
        res.json({ success: true, data: tender });
      } catch (error) {
        console.error("Error fetching tender by ID:", error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // Modified paginated endpoint to sort by published date
    app.get("/api/tenders/page/:page", async (req, res) => {
      try {
        let page = parseInt(req.params.page) || 1;
        let limit = 10;
        let skip = (page - 1) * limit;

        const tenders = await collection
          .find({})
          .sort({ "Published on": -1 }) // Sort by published date descending
          .skip(skip)
          .limit(limit)
          .toArray();

        const totalTenders = await collection.countDocuments();
        const totalPages = Math.ceil(totalTenders / limit);

        res.json({
          success: true,
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalTenders,
          data: tenders
        });
      } catch (error) {
        console.error("Error fetching paginated tenders:", error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    const port = process.env.PORT || 8000;
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
})();