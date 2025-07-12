const Notification = require('../models/Notification');

class NotificationService {
  static async createNotification(data) {
    try {
      const notification = await Notification.createNotification(data);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async notifyQuestionAnswered(questionId, answerId, questionOwnerId, answerAuthorId, answerAuthorName) {
    if (questionOwnerId.toString() === answerAuthorId.toString()) {
      return; // Don't notify if user answers their own question
    }

    const notification = await this.createNotification({
      recipientId: questionOwnerId,
      senderId: answerAuthorId,
      type: 'answer',
      title: 'New Answer',
      message: `${answerAuthorName} answered your question`,
      link: `/question/${questionId}#answer-${answerId}`,
      questionId,
      answerId
    });

    return notification;
  }

  static async notifyAnswerAccepted(answerId, questionId, answerAuthorId, questionOwnerName) {
    const notification = await this.createNotification({
      recipientId: answerAuthorId,
      senderId: answerAuthorId, // System notification
      type: 'accept',
      title: 'Answer Accepted',
      message: `${questionOwnerName} accepted your answer`,
      link: `/question/${questionId}#answer-${answerId}`,
      questionId,
      answerId
    });

    return notification;
  }

  static async notifyVoteReceived(itemId, itemType, voterId, itemOwnerId, voterName, isUpvote) {
    if (voterId.toString() === itemOwnerId.toString()) {
      return; // Don't notify if user votes on their own content
    }

    const voteType = isUpvote ? 'upvoted' : 'downvoted';
    const link = itemType === 'question' ? `/question/${itemId}` : `/question/${itemId}#answer-${itemId}`;

    const notification = await this.createNotification({
      recipientId: itemOwnerId,
      senderId: voterId,
      type: 'vote',
      title: 'Vote Received',
      message: `${voterName} ${voteType} your ${itemType}`,
      link,
      questionId: itemType === 'question' ? itemId : null,
      answerId: itemType === 'answer' ? itemId : null
    });

    return notification;
  }

  static async notifyMention(userId, mentionedUserId, questionId, answerId, mentionerName) {
    const notification = await this.createNotification({
      recipientId: mentionedUserId,
      senderId: userId,
      type: 'mention',
      title: 'Mentioned in Answer',
      message: `${mentionerName} mentioned you in an answer`,
      link: `/question/${questionId}#answer-${answerId}`,
      questionId,
      answerId
    });

    return notification;
  }

  static async getNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ recipientId: userId })
      .populate('senderId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipientId: userId });

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { read: true },
      { new: true }
    );

    return notification;
  }

  static async markAllAsRead(userId) {
    const result = await Notification.markAllAsRead(userId);
    return result;
  }

  static async getUnreadCount(userId) {
    const count = await Notification.getUnreadCount(userId);
    return count;
  }

  static async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: userId
    });

    return notification;
  }
}

module.exports = NotificationService; 