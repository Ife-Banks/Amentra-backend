import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';
import { get, set, del } from './cache.service.js';
import { getRedisClient } from '../config/redis.js';

export const createNotification = async ({ userId, institutionId, type, title, body, relatedEntityType, relatedEntityId }) => {
  const doc = await Notification.create({
    userId,
    institutionId,
    type,
    title,
    body,
    relatedEntityType: relatedEntityType || null,
    relatedEntityId: relatedEntityId || null,
  });
  await del(`notifications:unread:${userId}`);
  return doc;
};

export const getUnreadCount = async (userId) => {
  const cached = await get(`notifications:unread:${userId}`);
  if (cached !== null) return cached;
  const count = await Notification.countDocuments({ userId, isRead: false });
  await set(`notifications:unread:${userId}`, count, 300);
  return count;
};

export const getNotifications = async (userId, institutionId, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Notification.find({ userId, institutionId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments({ userId, institutionId }),
  ]);
  return { docs, total, page, pages: Math.ceil(total / limit) || 1, limit };
};

export const markAsRead = async (notificationId, userId) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
  if (notif) await del(`notifications:unread:${userId}`);
  return notif;
};

export const markAllAsRead = async (userId, institutionId) => {
  await Notification.updateMany({ userId, institutionId, isRead: false }, { isRead: true });
  await del(`notifications:unread:${userId}`);
};

export const getPreferences = async (userId, institutionId) => {
  let prefs = await NotificationPreference.findOne({ userId, institutionId });
  if (!prefs) {
    prefs = await NotificationPreference.create({ userId, institutionId });
  }
  return prefs;
};

export const updatePreferences = async (userId, institutionId, data) => {
  const prefs = await NotificationPreference.findOneAndUpdate(
    { userId, institutionId },
    { $set: data },
    { new: true, upsert: true }
  );
  return prefs;
};
