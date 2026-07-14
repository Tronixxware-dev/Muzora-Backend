const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const { protect } = require('../middleware/auth');

router.get('/mine', protect, async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .populate('songs', 'title artist coverUrl duration')
      .sort({ updatedAt: -1 });
    res.json({ playlists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate({ path: 'songs', populate: { path: 'artist', select: 'name' } })
      .populate('owner', 'name avatar');
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ playlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const playlist = await Playlist.create({ name, description, isPublic, owner: req.user._id });
    res.status(201).json({ playlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/songs', protect, async (req, res) => {
  try {
    const { songId, action } = req.body;
    const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user._id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (action === 'add') {
      if (!playlist.songs.includes(songId)) playlist.songs.push(songId);
    } else {
      playlist.songs = playlist.songs.filter((s) => String(s) !== songId);
    }
    await playlist.save();
    res.json({ playlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ playlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;