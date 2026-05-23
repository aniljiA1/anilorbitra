const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const dayActivitySchema = new mongoose.Schema({
  time: String,
  activity: String,
  location: String,
  notes: String,
  type: {
    type: String,
    enum: ['transport', 'accommodation', 'food', 'sightseeing', 'leisure', 'other'],
    default: 'other',
  },
});

const daySchema = new mongoose.Schema({
  day: Number,
  date: String,
  title: String,
  activities: [dayActivitySchema],
});

const extractedDataSchema = new mongoose.Schema({
  type: String, // 'flight', 'hotel', 'train', 'bus', etc.
  from: String,
  to: String,
  departureDate: String,
  departureTime: String,
  arrivalDate: String,
  arrivalTime: String,
  passengerName: String,
  bookingRef: String,
  carrier: String,
  flightNumber: String,
  seatNumber: String,
  checkIn: String,
  checkOut: String,
  hotelName: String,
  roomType: String,
  raw: String,
});

const uploadSchema = new mongoose.Schema({
  originalName: String,
  mimeType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

const itinerarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      trim: true,
    },
    startDate: String,
    endDate: String,
    duration: Number, // in days
    travelers: Number,
    uploads: [uploadSchema],
    extractedData: [extractedDataSchema],
    summary: String,
    days: [daySchema],
    tips: [String],
    emergencyInfo: {
      localEmergency: String,
      embassy: String,
      nearestHospital: String,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
      default: () => nanoid(12),
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedAt: Date,
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    errorMessage: String,
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
itinerarySchema.index({ user: 1, createdAt: -1 });
itinerarySchema.index({ shareToken: 1 });

module.exports = mongoose.model('Itinerary', itinerarySchema);
