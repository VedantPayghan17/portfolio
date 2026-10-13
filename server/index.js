require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Project = require("./models/Project");
const Message = require("./models/Message");
const seed = require("./seed");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.get("/api/projects", async (_, res) => {
  try { res.json(await Project.find().sort({ order: 1 })); }
  catch { res.status(500).json({ error: "Could not load projects" }); }
});

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5,
  message: { error: "Too many messages. Please try again in a few minutes." } });

app.post("/api/contact", limiter, async (req, res) => {
  const { name = "", email = "", message = "" } = req.body || {};
  if (name.trim().length < 2) return res.status(400).json({ error: "Please enter your name." });
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return res.status(400).json({ error: "Please enter a valid email." });
  if (message.trim().length < 10) return res.status(400).json({ error: "Message should be at least 10 characters." });
  try { await Message.create({ name, email, message }); res.status(201).json({ ok: true }); }
  catch { res.status(500).json({ error: "Could not save your message." }); }
});

mongoose.connect(process.env.MONGO_URI).then(async () => {
  if (!(await Project.countDocuments())) await Project.insertMany(seed);
  app.listen(process.env.PORT || 5000, () => console.log("API running"));
}).catch(e => { console.error("MongoDB connection failed:", e.message); process.exit(1); });
