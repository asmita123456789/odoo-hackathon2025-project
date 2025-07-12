const express = require('express');
const { body, validationResult } = require('express-validator');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { auth, optionalAuth } = require('../middleware/auth');
const NotificationService = require('../utils/notificationService');

const router = express.Router();

// @route   GET /api/questions
// @desc    Get all questions with filters and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = req.query.filter || 'newest';
    const search = req.query.search || '';
    const tag = req.query.tag || '';

    const skip = (page - 1) * limit;

    // Build query
    let query = { isDeleted: false };

    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Add tag filter
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    // Build sort
    let sort = {};
    switch (filter) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'most-voted':
        sort = { votes: -1, createdAt: -1 };
        break;
      case 'unanswered':
        query.answerCount = { $exists: false };
        sort = { createdAt: -1 };
        break;
      case 'most-viewed':
        sort = { views: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Get questions with populated user data
    const questions = await Question.find(query)
      .populate('askedBy', 'username reputation')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Question.countDocuments(query);

    // Add user vote information if authenticated
    if (req.user) {
      for (let question of questions) {
        question.userVote = question.voteHistory?.find(
          vote => vote.user.toString() === req.user._id.toString()
        )?.vote || null;
        delete question.voteHistory; // Remove vote history from response
      }
    }

    res.json({
      questions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions/:id
// @desc    Get a specific question with answers
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('askedBy', 'username reputation')
      .populate('acceptedAnswer');

    if (!question || question.isDeleted) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Increment views
    await question.incrementViews();

    // Get answers
    const answers = await Answer.find({ 
      questionId: req.params.id, 
      isDeleted: false 
    })
      .populate('answeredBy', 'username reputation')
      .sort({ isAccepted: -1, votes: -1, createdAt: 1 })
      .lean();

    // Add user vote information if authenticated
    if (req.user) {
      question.userVote = question.getUserVote(req.user._id);
      delete question.voteHistory;

      for (let answer of answers) {
        answer.userVote = answer.voteHistory?.find(
          vote => vote.user.toString() === req.user._id.toString()
        )?.vote || null;
        delete answer.voteHistory;
      }
    }

    res.json({
      question,
      answers
    });

  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private
router.post('/', auth, [
  body('title')
    .isLength({ min: 15, max: 300 })
    .withMessage('Title must be between 15 and 300 characters'),
  body('description')
    .isLength({ min: 30 })
    .withMessage('Description must be at least 30 characters long'),
  body('tags')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must provide 1-5 tags'),
  body('tags.*')
    .isLength({ min: 1, max: 20 })
    .withMessage('Each tag must be between 1 and 20 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, tags } = req.body;

    // Clean and validate tags
    const cleanTags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);

    if (cleanTags.length === 0) {
      return res.status(400).json({ message: 'At least one valid tag is required' });
    }

    // Create question
    const question = new Question({
      title: title.trim(),
      description,
      tags: cleanTags,
      askedBy: req.user._id
    });

    await question.save();

    // Populate user data
    await question.populate('askedBy', 'username reputation');

    res.status(201).json({
      message: 'Question created successfully',
      question
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question
// @access  Private
router.put('/:id', auth, [
  body('title')
    .optional()
    .isLength({ min: 15, max: 300 })
    .withMessage('Title must be between 15 and 300 characters'),
  body('description')
    .optional()
    .isLength({ min: 30 })
    .withMessage('Description must be at least 30 characters long'),
  body('tags')
    .optional()
    .isArray({ min: 1, max: 5 })
    .withMessage('Must provide 1-5 tags')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const question = await Question.findById(req.params.id);
    
    if (!question || question.isDeleted) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user owns the question or is admin
    if (question.askedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this question' });
    }

    const { title, description, tags } = req.body;

    // Update fields
    if (title) question.title = title.trim();
    if (description) question.description = description;
    if (tags) {
      const cleanTags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      if (cleanTags.length > 0) {
        question.tags = cleanTags;
      }
    }

    await question.save();
    await question.populate('askedBy', 'username reputation');

    res.json({
      message: 'Question updated successfully',
      question
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question || question.isDeleted) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user owns the question or is admin
    if (question.askedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this question' });
    }

    // Soft delete
    question.isDeleted = true;
    await question.save();

    res.json({ message: 'Question deleted successfully' });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions/:id/vote
// @desc    Vote on a question
// @access  Private
router.post('/:id/vote', auth, [
  body('vote')
    .isIn(['up', 'down'])
    .withMessage('Vote must be either "up" or "down"')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const question = await Question.findById(req.params.id);
    
    if (!question || question.isDeleted) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is voting on their own question
    if (question.askedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot vote on your own question' });
    }

    const { vote } = req.body;

    // Handle voting
    await question.vote(req.user._id, vote);

    // Send notification
    try {
      await NotificationService.notifyVoteReceived(
        question._id,
        'question',
        req.user._id,
        question.askedBy,
        req.user.username,
        vote === 'up'
      );
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      message: 'Vote recorded successfully',
      votes: question.votes
    });

  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions/:id/answers
// @desc    Add an answer to a question
// @access  Private
router.post('/:id/answers', auth, [
  body('content')
    .isLength({ min: 30 })
    .withMessage('Answer must be at least 30 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const question = await Question.findById(req.params.id);
    
    if (!question || question.isDeleted) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.isClosed) {
      return res.status(400).json({ message: 'This question is closed for answers' });
    }

    const { content } = req.body;

    // Create answer
    const answer = new Answer({
      content,
      questionId: question._id,
      answeredBy: req.user._id
    });

    await answer.save();
    await answer.populate('answeredBy', 'username reputation');

    // Send notification to question owner
    try {
      await NotificationService.notifyQuestionAnswered(
        question._id,
        answer._id,
        question.askedBy,
        req.user._id,
        req.user.username
      );
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.status(201).json({
      message: 'Answer posted successfully',
      answer
    });

  } catch (error) {
    console.error('Post answer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 