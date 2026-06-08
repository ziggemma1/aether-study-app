import express from 'express';
import { Notification } from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/unread', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const unreadCount = await Notification.countDocuments({ userId, read: false });
    const recentNotifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Format human-friendly time labels (e.g. "2 min ago", "1 hour ago", "Yesterday")
    const formatTimeAgo = (date: Date) => {
      const now = new Date();
      const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
      
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return interval === 1 ? '1 year ago' : `${interval} years ago`;
      
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return interval === 1 ? '1 month ago' : `${interval} months ago`;
      
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return interval === 1 ? '1 day ago' : `${interval} days ago`;
      
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
      
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return interval === 1 ? '1 min ago' : `${interval} mins ago`;
      
      return seconds < 10 ? 'Just now' : `${Math.floor(seconds)} secs ago`;
    };

    const formattedNotifications = recentNotifications.map(n => ({
      id: n._id || n.id,
      message: n.message,
      time: formatTimeAgo(n.createdAt),
      read: n.read,
      type: n.type
    }));

    res.json({
      unreadCount,
      notifications: formattedNotifications
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/mark-read', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.body;

    if (notificationId) {
      await Notification.updateOne({ _id: notificationId, userId }, { read: true });
    } else {
      await Notification.updateMany({ userId, read: false }, { read: true });
    }

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Helper endpoint to create some dummy notifications for initial test
router.post('/seed', async (req, res) => {
  try {
    const userId = (req as any).userId;
    const count = await Notification.countDocuments({ userId });
    if (count === 0) {
      await Notification.create([
        {
          userId,
          message: 'Welcome to Aether Study! Your active study journey starts here. 📚',
          type: 'general',
          read: false,
          createdAt: new Date(Date.now() - 3 * 3600 * 1000)
        },
        {
          userId,
          message: 'Akeredolu sent you a friend request. Accept to join his live sessions!',
          type: 'friend_request',
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 1000)
        }
      ]);
    }
    res.json({ success: true, message: 'Notifications seeded to kickstart dashboard integrations!' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
