const mongoose = require("mongoose")

const userDetailsSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      default: null,
    },
    preferences: {
      type: Object,
      default: {},
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    activityLog: [
      {
        action: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: Object,
      },
    ],
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("UserDetails", userDetailsSchema)
