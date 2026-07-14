const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    avatar:   { type: String, default: '' },
    bio:      { type: String, default: '' },
    role:     { type: String, enum: ['user', 'admin'], default: 'user' },
    likedSongs:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    followingArtists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
    notifications: [
      {
        message:   { type: String },
        type:      { type: String, enum: ['new_song', 'new_album', 'system'], default: 'system' },
        read:      { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        link:      { type: String, default: '' },
      }
    ],
    recentlyPlayed: [
      {
        song:     { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
        playedAt: { type: Date, default: Date.now },
      },
    ],
    playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);