/**
 * Annadhara AI — Conversation & Multi-Turn History Model
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Stores user conversations, message turns, citations, and language preferences.
 */

const mongoose = require('mongoose');

const aiCitationSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    domain: { type: String, default: '' },
    isOfficial: { type: Boolean, default: false },
  },
  { _id: false }
);

const aiMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 4000,
  },
  intent: {
    type: String,
    default: 'GENERAL_CHAT',
  },
  citations: [aiCitationSchema],
  actions: [
    {
      actionType: { type: String, default: 'NAVIGATE' },
      label: { type: String, default: '' },
      path: { type: String, default: '' },
      icon: { type: String, default: '' },
    },
  ],
  feedback: {
    rating: {
      type: String,
      enum: ['helpful', 'unhelpful'],
    },
    createdAt: {
      type: Date,
    },
  },
  hasPlatformData: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const aiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      enum: ['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN', 'MEMBER'],
      default: 'MEMBER',
    },
    language: {
      type: String,
      enum: ['en', 'kn', 'hi'],
      default: 'en',
    },
    messages: [aiMessageSchema],
  },
  {
    timestamps: true,
  }
);

aiConversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);
