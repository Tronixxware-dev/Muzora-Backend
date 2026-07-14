const express = require('express');
const router  = express.Router();
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');

// Get comments for a song
router.get('/:songId', async (req, res) => {
  try {
    const comments = await Comment.find({ song: req.params.songId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
router.post('/:songId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text required' });

    const comment = await Comment.create({
      song: req.params.songId,
      user: req.user._id,
      text: text.trim(),
    });

    await comment.populate('user', 'name avatar');
    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like / unlike comment
router.patch('/:commentId/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const userId   = req.user._id.toString();
    const isLiked  = comment.likes.map(String).includes(userId);

    if (isLiked) {
      comment.likes = comment.likes.filter((id) => String(id) !== userId);
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();
    res.json({ liked: !isLiked, likes: comment.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete comment
router.delete('/:commentId', protect, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      user: req.user._id,
    });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;