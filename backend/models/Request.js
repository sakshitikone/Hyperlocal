// models/Request.js — Help/resource request schema with geolocation
const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      enum: ['item', 'help', 'food', 'transport', 'study', 'other'],
      required: [true, 'Category is required'],
    },
    urgency: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'fulfilled', 'closed'],
      default: 'open',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        default: '',
      },
    },
    respondents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  { timestamps: true }
);

// Create 2dsphere index for geospatial queries
RequestSchema.index({ location: '2dsphere' });
RequestSchema.index({ status: 1, urgency: 1, createdAt: -1 });

module.exports = mongoose.model('Request', RequestSchema);
