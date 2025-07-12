const express = require('express');
const Question = require('../models/Question');

const router = express.Router();

// @route   GET /api/tags
// @desc    Get all tags with usage count
// @access  Public
router.get('/', async (req, res) => {
  try {
    const tags = await Question.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 100 }
    ]);

    const tagList = tags.map(tag => tag._id);

    res.json({
      tags: tagList,
      tagStats: tags
    });

  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tags/popular
// @desc    Get popular tags
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const popularTags = await Question.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          questions: { $addToSet: '$_id' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          name: '$_id',
          count: 1,
          questionCount: { $size: '$questions' }
        }
      }
    ]);

    res.json({
      tags: popularTags
    });

  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tags/:tag
// @desc    Get questions by tag
// @access  Public
router.get('/:tag', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const tag = req.params.tag.toLowerCase();

    const questions = await Question.find({
      tags: tag,
      isDeleted: false
    })
      .populate('askedBy', 'username reputation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Question.countDocuments({
      tags: tag,
      isDeleted: false
    });

    // Get tag stats
    const tagStats = await Question.aggregate([
      { $match: { tags: tag, isDeleted: false } },
      { $unwind: '$tags' },
      { $match: { tags: tag } },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          totalVotes: { $sum: '$votes' },
          totalViews: { $sum: '$views' }
        }
      }
    ]);

    res.json({
      tag,
      questions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: tagStats[0] || { count: 0, totalVotes: 0, totalViews: 0 }
    });

  } catch (error) {
    console.error('Get questions by tag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tags/search/:query
// @desc    Search tags
// @access  Public
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const limit = parseInt(req.query.limit) || 10;

    const tags = await Question.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$tags' },
      { $match: { tags: { $regex: query, $options: 'i' } } },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    const tagList = tags.map(tag => tag._id);

    res.json({
      tags: tagList,
      query
    });

  } catch (error) {
    console.error('Search tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 