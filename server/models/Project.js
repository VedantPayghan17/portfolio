const mongoose = require("mongoose");
module.exports = mongoose.model("Project", new mongoose.Schema({
  title: { type: String, required: true }, tagline: String, points: [String], stack: [String],
  github: String, live: String, order: { type: Number, default: 0 },
}, { timestamps: true }));
