const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

const router = express.Router();

// @route   GET /api/users/questions
// @desc    Get current user's questions
// @access  Private
router.get('/questions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const questions = await Question.find({ 
      askedBy: req.user._id, 
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Question.countDocuments({ 
      askedBy: req.user._id, 
      isDeleted: false 
    });

    res.json({
      questions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get user questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/answers
// @desc    Get current user's answers
// @access  Private
router.get('/answers', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const answers = await Answer.find({ 
      answeredBy: req.user._id, 
      isDeleted: false 
    })
      .populate('questionId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Answer.countDocuments({ 
      answeredBy: req.user._id, 
      isDeleted: false 
    });

    res.json({
      answers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get user answers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get current user's statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const [
      totalQuestions,
      totalAnswers,
      totalVotes,
      totalViews
    ] = await Promise.all([
      Question.countDocuments({ askedBy: req.user._id, isDeleted: false }),
      Answer.countDocuments({ answeredBy: req.user._id, isDeleted: false }),
      Question.aggregate([
        { $match: { askedBy: req.user._id, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$votes' } } }
      ]).then(result => result[0]?.total || 0),
      Question.aggregate([
        { $match: { askedBy: req.user._id, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    res.json({
      stats: {
        totalQuestions,
        totalAnswers,
        totalVotes,
        totalViews
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('questionCount')
      .populate('answerCount');

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/questions
// @desc    Get user's questions by ID
// @access  Public
router.get('/:id/questions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    const questions = await Question.find({ 
      askedBy: req.params.id, 
      isDeleted: false 
    })
      .populate('askedBy', 'username reputation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Question.countDocuments({ 
      askedBy: req.params.id, 
      isDeleted: false 
    });

    res.json({
      questions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get user questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/answers
// @desc    Get user's answers by ID
// @access  Public
router.get('/:id/answers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    const answers = await Answer.find({ 
      answeredBy: req.params.id, 
      isDeleted: false 
    })
      .populate('answeredBy', 'username reputation')
      .populate('questionId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Answer.countDocuments({ 
      answeredBy: req.params.id, 
      isDeleted: false 
    });

    res.json({
      answers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get user answers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 