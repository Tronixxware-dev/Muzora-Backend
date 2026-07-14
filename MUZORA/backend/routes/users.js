const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// Like / unlike song
router.patch('/likes/:songId', protect, async (req, res) => {
  try {
    const user    = await User.findById(req.user._id);
    const songId  = req.params.songId;
    const isLiked = user.likedSongs.map(String).includes(songId);
    if (isLiked) {
      user.likedSongs = user.likedSongs.filter((id) => String(id) !== songId);
    } else {
      user.likedSongs.push(songId);
    }
    await user.save();
    res.json({ liked: !isLiked, likedSongs: user.likedSongs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get liked songs
router.get('/likes', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'likedSongs',
      populate: { path: 'artist', select: 'name' },
    });
    res.json({ songs: user.likedSongs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recently played
router.get('/history', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'recentlyPlayed.song',
      populate: { path: 'artist', select: 'name' },
    });
    const history = [...user.recentlyPlayed]
      .sort((a, b) => b.playedAt - a.playedAt)
      .slice(0, 20);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, avatar, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar, bio },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Follow / unfollow artist
router.patch('/follow/:artistId', protect, async (req, res) => {
  try {
    const user       = await User.findById(req.user._id);
    const artistId   = req.params.artistId;
    const isFollowing = user.followingArtists.map(String).includes(artistId);

    if (isFollowing) {
      user.followingArtists = user.followingArtists.filter((id) => String(id) !== artistId);
    } else {
      user.followingArtists.push(artistId);
    }

    await user.save();

    // Update artist followers count
    const Artist = require('../models/Artist');
    await Artist.findByIdAndUpdate(artistId, {
      $inc: { followers: isFollowing ? -1 : 1 },
    });

    res.json({ following: !isFollowing, followingArtists: user.followingArtists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get following artists
router.get('/following', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('followingArtists');
    res.json({ artists: user.followingArtists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const notifications = [...user.notifications]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notifications as read
router.patch('/notifications/read', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'notifications.$[].read': true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;