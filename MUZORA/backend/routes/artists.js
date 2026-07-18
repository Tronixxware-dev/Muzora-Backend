const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist');
const Song = require('../models/Song');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadArtistImage } = require('../middleware/upload');

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? { $text: { $search: search } } : {};
    const artists = await Artist.find(query).sort({ followers: -1 }).limit(50);
    res.json({ artists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ error: 'Artist not found' });
    const songs = await Song.find({ artist: req.params.id, isPublished: true })
      .populate('album', 'title coverUrl')
      .sort({ plays: -1 })
      .limit(10);
    res.json({ artist, songs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', protect, adminOnly, (req, res, next) => {
  uploadArtistImage(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { name, bio, genres, verified } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const artistData = {
      name: name.trim(),
      bio: bio || '',
      genres: genres
        ? genres.split(',').map((g) => g.trim()).filter(Boolean)
        : [],
      verified: verified === 'true' || verified === true,
    };

    if (req.file) artistData.imageUrl = req.file.path;

    const artist = await Artist.create(artistData);
    res.status(201).json({ artist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', protect, adminOnly, (req, res, next) => {
  uploadArtistImage(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.genres && typeof updates.genres === 'string') {
      updates.genres = updates.genres.split(',').map((g) => g.trim()).filter(Boolean);
    }
    if (updates.verified !== undefined) {
      updates.verified = updates.verified === 'true' || updates.verified === true;
    }
    if (req.file) updates.imageUrl = req.file.path;

    const artist = await Artist.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!artist) return res.status(404).json({ error: 'Artist not found' });
    res.json({ artist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Artist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Artist deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk create artists
router.post('/bulk', protect, adminOnly, async (req, res) => {
  try {
    const artists = await Artist.insertMany(req.body.artists);
    res.status(201).json({ artists, count: artists.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;