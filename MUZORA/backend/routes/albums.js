const express = require('express');
const router = express.Router();
const Album = require('../models/Album');
const Song = require('../models/Song');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const albums = await Album.find({ isPublished: true })
      .populate('artist', 'name imageUrl')
      .sort({ releaseDate: -1 })
      .limit(30);
    res.json({ albums });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate('artist', 'name imageUrl');
    if (!album) return res.status(404).json({ error: 'Album not found' });
    const songs = await Song.find({ album: req.params.id, isPublished: true })
      .populate('artist', 'name')
      .sort({ trackNumber: 1 });
    res.json({ album, songs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const album = await Album.create(req.body);
    res.status(201).json({ album });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const album = await Album.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!album) return res.status(404).json({ error: 'Album not found' });
    res.json({ album });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Album.findByIdAndDelete(req.params.id);
    res.json({ message: 'Album deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;