const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title:             { type: String, required: true, trim: true },
    artist:            { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
    album:             { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
    duration:          { type: Number, default: 0 },
    audioUrl:          { type: String, required: true },
    coverUrl:          { type: String, default: '' },
    cloudinaryAudioId: { type: String },
    genre:             { type: String },
    releaseDate:       { type: Date },
    plays:             { type: Number, default: 0 },
    likes:             { type: Number, default: 0 },
    isPublished:       { type: Boolean, default: true },
    trackNumber:       { type: Number },
    lyrics:            { type: String },
    tags:              [{ type: String }],
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

songSchema.index({ title: 'text', genre: 'text' });
songSchema.index({ artist: 1 });
songSchema.index({ album: 1 });

module.exports = mongoose.model('Song', songSchema);