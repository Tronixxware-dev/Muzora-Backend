const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    bio:       { type: String, default: '' },
    imageUrl:  { type: String, default: '' },
    genres:    [{ type: String }],
    followers: { type: Number, default: 0 },
    verified:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

artistSchema.index({ name: 'text' });

module.exports = mongoose.model('Artist', artistSchema);