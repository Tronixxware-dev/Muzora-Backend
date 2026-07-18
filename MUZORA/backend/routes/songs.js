const express = require('express');
const router  = express.Router();
const {
  getAllSongs, getSong, uploadSong,
  updateSong, deleteSong, incrementPlays,
} = require('../controllers/songController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadSongFiles, uploadSongCover } = require('../middleware/upload');

router.get('/', getAllSongs);
router.get('/trending', async (req, res) => {
  try {
    const Song = require('../models/Song');
    const songs = await Song.find({ isPublished: true })
      .populate('artist', 'name imageUrl')
      .populate('album',  'title coverUrl')
      .sort({ plays: -1 })
      .limit(10);
    res.json({ songs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/new-releases', async (req, res) => {
  try {
    const Song = require('../models/Song');
    const songs = await Song.find({ isPublished: true })
      .populate('artist', 'name imageUrl')
      .populate('album',  'title coverUrl')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ songs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/genre/:genre', async (req, res) => {
  try {
    const Song = require('../models/Song');
    const songs = await Song.find({
      isPublished: true,
      genre: { $regex: req.params.genre, $options: 'i' },
    })
      .populate('artist', 'name imageUrl')
      .populate('album',  'title coverUrl')
      .sort({ plays: -1 })
      .limit(20);
    res.json({ songs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommended', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const Song = require('../models/Song');

    const user = await User.findById(req.user._id).populate('recentlyPlayed.song');
    const recentSongs = user.recentlyPlayed
      .slice(0, 5)
      .map((r) => r.song)
      .filter(Boolean);

    const genres = [...new Set(recentSongs.map((s) => s.genre).filter(Boolean))];
    const likedIds = user.likedSongs.map(String);
    const recentIds = recentSongs.map((s) => String(s._id));
    const excludeIds = [...likedIds, ...recentIds];

    let songs = [];
    if (genres.length > 0) {
      songs = await Song.find({
        isPublished: true,
        genre: { $in: genres },
        _id: { $nin: excludeIds },
      })
        .populate('artist', 'name imageUrl')
        .populate('album',  'title coverUrl')
        .sort({ plays: -1 })
        .limit(10);
    }

    if (songs.length < 5) {
      const trending = await Song.find({
        isPublished: true,
        _id: { $nin: excludeIds },
      })
        .populate('artist', 'name imageUrl')
        .populate('album',  'title coverUrl')
        .sort({ plays: -1 })
        .limit(10);
      songs = [...songs, ...trending].slice(0, 10);
    }

    res.json({ songs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', getSong);
router.post('/:id/play', protect, incrementPlays);

router.post('/', protect, adminOnly, (req, res, next) => {
  uploadSongFiles(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, uploadSong);

router.patch('/:id', protect, adminOnly, (req, res, next) => {
  uploadSongCover(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, updateSong);

router.delete('/:id', protect, adminOnly, deleteSong);

module.exports = router;