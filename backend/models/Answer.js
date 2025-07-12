const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    minlength: 30
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votes: {
    type: Number,
    default: 0
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
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
answerSchema.index({ questionId: 1 });
answerSchema.index({ answeredBy: 1 });
answerSchema.index({ createdAt: -1 });
answerSchema.index({ votes: -1 });
answerSchema.index({ isAccepted: 1 });

// Method to handle voting
answerSchema.methods.vote = function(userId, voteType) {
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
answerSchema.methods.getUserVote = function(userId) {
  const vote = this.voteHistory.find(
    vote => vote.user.toString() === userId.toString()
  );
  return vote ? vote.vote : null;
};

// Method to accept answer
answerSchema.methods.accept = function() {
  this.isAccepted = true;
  return this.save();
};

// Method to unaccept answer
answerSchema.methods.unaccept = function() {
  this.isAccepted = false;
  return this.save();
};

module.exports = mongoose.model('Answer', answerSchema); 