const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    artist:      { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
    coverUrl:    { type: String, default: '' },
    releaseDate: { type: Date },
    genre:       { type: String },
    songs:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    description: { type: String },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

albumSchema.index({ title: 'text' });

module.exports = mongoose.model('Album', albumSchema);