const Song = require('../models/Song');
const User = require('../models/User');
const Album = require('../models/Album');
const cloudinary = require('../config/cloudinary');

exports.getAllSongs = async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, search } = req.query;
    const query = { isPublished: true };
    if (genre) query.genre = genre;
    if (search) query.$text = { $search: search };

    const songs = await Song.find(query)
      .populate('artist', 'name imageUrl')
      .populate('album', 'title coverUrl')
      .sort({ plays: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Song.countDocuments(query);
    res.json({ songs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id)
      .populate('artist', 'name imageUrl bio')
      .populate('album', 'title coverUrl releaseDate');
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json({ song });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadSong = async (req, res) => {
  try {
    const { title, artistId, albumId, genre, trackNumber, lyrics } = req.body;

    if (!req.files || !req.files['audio']) 
      return res.status(400).json({ error: 'Audio file required' });
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!artistId) return res.status(400).json({ error: 'Artist is required' });

    let album = null;
    if (albumId) {
      album = await Album.findById(albumId);
      if (!album) return res.status(400).json({ error: 'Album not found' });
      if (String(album.artist) !== String(artistId)) {
        return res.status(400).json({ error: 'Album does not belong to this artist' });
      }
    }

    const audioFile = req.files['audio'][0];
    const coverFile = req.files['cover'] ? req.files['cover'][0] : null;

    const song = await Song.create({
      title,
      artist: artistId,
      album: albumId || undefined,
      duration: 0,
      audioUrl: audioFile.path,
      cloudinaryAudioId: audioFile.filename,
      coverUrl: coverFile ? coverFile.path : '',
      genre,
      trackNumber: trackNumber ? Number(trackNumber) : undefined,
      lyrics,
    });

    if (album) {
      album.songs.push(song._id);
      await album.save();
    }

    await song.populate('artist', 'name');
    res.status(201).json({ song });
  } catch (err) {
    console.error('Upload song error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSong = async (req, res) => {
  try {
    const existing = await Song.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Song not found' });

    const oldAlbumId = existing.album ? String(existing.album) : null;
    const newAlbumId = req.body.album !== undefined ? req.body.album || null : oldAlbumId;

    const song = await Song.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('artist', 'name')
      .populate('album', 'title');

    // Keep Album.songs in sync if the album assignment changed
    if (newAlbumId !== oldAlbumId) {
      if (oldAlbumId) {
        await Album.findByIdAndUpdate(oldAlbumId, { $pull: { songs: song._id } });
      }
      if (newAlbumId) {
        await Album.findByIdAndUpdate(newAlbumId, { $addToSet: { songs: song._id } });
      }
    }

    res.json({ song });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });

    if (song.cloudinaryAudioId) {
      await cloudinary.uploader.destroy(song.cloudinaryAudioId, { resource_type: 'video' });
    }

    if (song.album) {
      await Album.findByIdAndUpdate(song.album, { $pull: { songs: song._id } });
    }

    await song.deleteOne();
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.incrementPlays = async (req, res) => {
  try {
    await Song.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } });
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          recentlyPlayed: {
            $each: [{ song: req.params.id, playedAt: new Date() }],
            $slice: -50,
          },
        },
      });
    }
    res.json({ message: 'Play recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};