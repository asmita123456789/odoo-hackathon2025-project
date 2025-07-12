const express = require('express');
const { body, validationResult } = require('express-validator');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const { auth } = require('../middleware/auth');
const NotificationService = require('../utils/notificationService');

const router = express.Router();

// @route   POST /api/answers/:id/vote
// @desc    Vote on an answer
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

    const answer = await Answer.findById(req.params.id);
    
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user is voting on their own answer
    if (answer.answeredBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot vote on your own answer' });
    }

    const { vote } = req.body;

    // Handle voting
    await answer.vote(req.user._id, vote);

    // Send notification
    try {
      await NotificationService.notifyVoteReceived(
        answer._id,
        'answer',
        req.user._id,
        answer.answeredBy,
        req.user.username,
        vote === 'up'
      );
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      message: 'Vote recorded successfully',
      votes: answer.votes
    });

  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/answers/:id/accept
// @desc    Accept an answer
// @access  Private
router.patch('/:id/accept', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const question = await Question.findById(answer.questionId);
    
    if (!question || question.isDeleted) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user owns the question
    if (question.askedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the question owner can accept answers' });
    }

    // Unaccept previously accepted answer if any
    if (question.acceptedAnswer) {
      const previousAnswer = await Answer.findById(question.acceptedAnswer);
      if (previousAnswer) {
        await previousAnswer.unaccept();
      }
    }

    // Accept the new answer
    await answer.accept();
    
    // Update question's accepted answer
    question.acceptedAnswer = answer._id;
    await question.save();

    // Send notification
    try {
      await NotificationService.notifyAnswerAccepted(
        answer._id,
        question._id,
        answer.answeredBy,
        req.user.username
      );
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      message: 'Answer accepted successfully',
      answer
    });

  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/answers/:id/unaccept
// @desc    Unaccept an answer
// @access  Private
router.patch('/:id/unaccept', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const question = await Question.findById(answer.questionId);
    
    if (!question || question.isDeleted) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user owns the question
    if (question.askedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the question owner can unaccept answers' });
    }

    // Check if this answer is currently accepted
    if (!answer.isAccepted) {
      return res.status(400).json({ message: 'This answer is not currently accepted' });
    }

    // Unaccept the answer
    await answer.unaccept();
    
    // Remove accepted answer from question
    question.acceptedAnswer = null;
    await question.save();

    res.json({
      message: 'Answer unaccepted successfully',
      answer
    });

  } catch (error) {
    console.error('Unaccept answer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/answers/:id
// @desc    Update an answer
// @access  Private
router.put('/:id', auth, [
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

    const answer = await Answer.findById(req.params.id);
    
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user owns the answer or is admin
    if (answer.answeredBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this answer' });
    }

    const { content } = req.body;

    // Update answer
    answer.content = content;
    await answer.save();
    await answer.populate('answeredBy', 'username reputation');

    res.json({
      message: 'Answer updated successfully',
      answer
    });

  } catch (error) {
    console.error('Update answer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/answers/:id
// @desc    Delete an answer
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user owns the answer or is admin
    if (answer.answeredBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this answer' });
    }

    // Check if answer is accepted
    if (answer.isAccepted) {
      return res.status(400).json({ message: 'Cannot delete an accepted answer' });
    }

    // Soft delete
    answer.isDeleted = true;
    await answer.save();

    res.json({ message: 'Answer deleted successfully' });

  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 