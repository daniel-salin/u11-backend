const mongoose = require("mongoose");

const LogSchema = mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  images: [
    {
      path: { type: String },
      timeStamp: { type: String },
    },
  ],
});

module.exports = mongoose.model("Logs", LogSchema);
