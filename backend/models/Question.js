const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 15,
    maxlength: 300
  },
  description: {
    type: String,
    required: true,
    minlength: 30
  },
  tags: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }],
  askedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    default: null
  },
  voteHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['up', 'down']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ title: 'text', description: 'text' });
questionSchema.index({ tags: 1 });
questionSchema.index({ askedBy: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ votes: -1 });
questionSchema.index({ views: -1 });

// Virtual for answer count
questionSchema.virtual('answerCount', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'questionId',
  count: true
});

// Method to increment views
questionSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to handle voting
questionSchema.methods.vote = function(userId, voteType) {
  const existingVoteIndex = this.voteHistory.findIndex(
    vote => vote.user.toString() === userId.toString()
  );

  if (existingVoteIndex > -1) {
    const existingVote = this.voteHistory[existingVoteIndex];
    if (existingVote.vote === voteType) {
      // Remove vote if same type
      this.votes -= existingVote.vote === 'up' ? 1 : -1;
      this.voteHistory.splice(existingVoteIndex, 1);
    } else {
      // Change vote
      this.votes += voteType === 'up' ? 2 : -2;
      existingVote.vote = voteType;
      existingVote.createdAt = new Date();
    }
  } else {
    // New vote
    this.votes += voteType === 'up' ? 1 : -1;
    this.voteHistory.push({
      user: userId,
      vote: voteType,
      createdAt: new Date()
    });
  }

  return this.save();
};

// Method to get user's vote
questionSchema.methods.getUserVote = function(userId) {
  const vote = this.voteHistory.find(
    vote => vote.user.toString() === userId.toString()
  );
  return vote ? vote.vote : null;
};

// Ensure virtuals are serialized
questionSchema.set('toJSON', { virtuals: true });
questionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Question', questionSchema); 