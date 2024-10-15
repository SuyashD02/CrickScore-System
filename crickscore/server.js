const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const Match = require("./models/Score");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

app.get("/score", async (req, res) => {
  try {
    const match = await Match.findOne({});
    res.json(match);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching score", error: err.message });
  }
});

app.post("/update", async (req, res) => {
  try {
    const { runs, isOut, ballNumber, overNumber } = req.body;

    if (
      typeof runs !== "number" ||
      typeof ballNumber !== "number" ||
      typeof overNumber !== "number"
    ) {
      throw new Error("Invalid input data");
    }

    let match = await Match.findOne({});
    if (!match) {
      match = new Match({ currentScore: { runs: 0, wickets: 0 }, overs: [] });
    }

    let over = match.overs.find((o) => o.overNumber === overNumber);
    if (!over) {
      over = { overNumber, balls: [] };
      match.overs.push(over);
    }

    over.balls.push({ ballNumber, run: runs, isOut });
    match.currentScore.runs += runs;
    if (isOut) match.currentScore.wickets += 1;

    await match.save();

    const newOverData = { runs: over.balls };
    io.emit("scoreUpdate", {
      currentScore: match.currentScore,
      currentOverData: newOverData,
      currentBall: { run: runs, isOut },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating score:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/reset", async (req, res) => {
  try {
    await Match.deleteMany({});
    res.json({ success: true, message: "All data has been reset" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
