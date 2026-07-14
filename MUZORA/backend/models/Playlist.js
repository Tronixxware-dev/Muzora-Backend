const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    coverUrl:    { type: String, default: '' },
    owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    songs:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    isPublic:    { type: Boolean, default: false },
    followers:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Playlist', playlistSchema);