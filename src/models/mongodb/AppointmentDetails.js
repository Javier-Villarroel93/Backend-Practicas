const mongoose = require("mongoose")

const appointmentDetailsSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: Number,
      required: true,
      unique: true,
    },
    services: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        subcategoryId: {
          type: String,
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    followUp: {
      required: {
        type: Boolean,
        default: false,
      },
      date: {
        type: Date,
      },
      notes: {
        type: String,
        default: "",
      },
    },
    diagnosis: {
      type: String,
      default: "",
    },
    treatment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("AppointmentDetails", appointmentDetailsSchema)
