const mongoose = require("mongoose")

const petMedicalHistorySchema = new mongoose.Schema(
  {
    petId: {
      type: Number,
      required: true,
      unique: true,
    },
    medicalHistory: [
      {
        date: {
          type: Date,
          required: true,
        },
        diagnosis: {
          type: String,
          required: true,
        },
        treatment: {
          type: String,
          required: true,
        },
        observations: {
          type: String,
          default: "",
        },
        veterinarianId: {
          type: Number,
          required: true,
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
      },
    ],
    vaccinations: [
      {
        name: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          required: true,
        },
        nextDue: {
          type: Date,
        },
        veterinarianId: {
          type: Number,
          required: true,
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
      },
    ],
    allergies: [
      {
        allergen: {
          type: String,
          required: true,
        },
        severity: {
          type: String,
          enum: ["Leve", "Moderada", "Severa"],
          required: true,
        },
        notes: {
          type: String,
          default: "",
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("PetMedicalHistory", petMedicalHistorySchema)
