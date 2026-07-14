const express = require('express');
const router  = express.Router();
const Song    = require('../models/Song');
const User    = require('../models/User');
const Artist  = require('../models/Artist');
const Album   = require('../models/Album');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadSongFiles }    = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const multer     = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Artist image upload storage
const artistImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:           'muzora/artists',
    resource_type:    'image',
    transformation:   [{ width: 500, height: 500, crop: 'fill' }],
  },
});

const uploadArtistImage = multer({
  storage: artistImageStorage,
  limits:  { fileSize: 5 * 1024 * 1024 },
}).single('image');

// GET dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [
      totalSongs,
      totalUsers,
      totalArtists,
      totalAlbums,
      topSongs,
      recentUsers,
      totalPlays,
    ] = await Promise.all([
      Song.countDocuments(),
      User.countDocuments(),
      Artist.countDocuments(),
      Album.countDocuments(),
      Song.find().sort({ plays: -1 }).limit(5)
        .populate('artist', 'name'),
      User.find().sort({ createdAt: -1 }).limit(5)
        .select('name email createdAt avatar'),
      Song.aggregate([{ $group: { _id: null, total: { $sum: '$plays' } } }]),
    ]);

    res.json({
      stats: {
        totalSongs,
        totalUsers,
        totalArtists,
        totalAlbums,
        totalPlays: totalPlays[0]?.total || 0,
      },
      topSongs,
      recentUsers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all songs for admin
router.get('/songs', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = search ? { title: { $regex: search, $options: 'i' } } : {};
    const songs = await Song.find(query)
      .populate('artist', 'name')
      .populate('album',  'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Song.countDocuments(query);
    res.json({ songs, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all users for admin
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload artist image
router.post('/artist-image/:artistId', protect, adminOnly, (req, res) => {
  uploadArtistImage(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const artist = await Artist.findByIdAndUpdate(
        req.params.artistId,
        { imageUrl: req.file.path },
        { new: true }
      );
      res.json({ artist, imageUrl: req.file.path });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// Set featured song
router.post('/featured/:songId', protect, adminOnly, async (req, res) => {
  try {
    // Remove featured from all songs
    await Song.updateMany({}, { $unset: { featured: '' } });
    // Set new featured
    const song = await Song.findByIdAndUpdate(
      req.params.songId,
      { featured: true },
      { new: true }
    ).populate('artist', 'name');
    res.json({ song });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get featured song
router.get('/featured', async (req, res) => {
  try {
    const song = await Song.findOne({ featured: true })
      .populate('artist', 'name imageUrl')
      .populate('album',  'title coverUrl');
    res.json({ song });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;