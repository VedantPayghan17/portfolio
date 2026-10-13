const mongoose = require("mongoose");
module.exports = mongoose.model("Message", new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true }));
