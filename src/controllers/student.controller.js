import * as studentService from '../services/student.service.js';
import * as notificationService from '../services/notification.service.js';
import * as logService from '../services/log.service.js';
import cloudinary from '../config/cloudinary.js';
import SystemConfig from '../models/SystemConfig.js';
import { success, error } from '../utils/apiResponse.js';

const uid = (req) => req.user.userId;

export const getDashboard = async (req, res, next) => {
  try {
    const data = await studentService.getDashboard(uid(req), req.institutionId);
    if (!data) return error(res, 'Student not found', 404);
    return success(res, data, 'Dashboard', 200);
  } catch (e) {
    next(e);
  }
};

export const getStreak = async (req, res, next) => {
  try {
    const data = await studentService.getStreak(uid(req), req.institutionId);
    return success(res, data, 'Streak', 200);
  } catch (e) {
    next(e);
  }
};

export const getWeeklyChart = async (req, res, next) => {
  try {
    const data = await studentService.getWeeklyChart(uid(req), req.institutionId);
    return success(res, data, 'Weekly chart', 200);
  } catch (e) {
    next(e);
  }
};

export const listLogs = async (req, res, next) => {
  try {
    const { page, limit, status, dateFrom, dateTo } = req.query;
    const result = await studentService.getLogs(uid(req), req.institutionId, { status, dateFrom, dateTo }, { page, limit });
    return success(res, result.docs, 'Logs', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const createLog = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const student = await studentService.getStudentByUserId(uid(req), req.institutionId);
    if (!student?.sessionId) return error(res, 'Student session not set', 400);
    const log = await studentService.createLog(uid(req), req.institutionId, student.sessionId, data);
    if (!log) return error(res, 'Student not found', 404);
    return success(res, log, 'Log created', 201);
  } catch (e) {
    next(e);
  }
};

export const getLog = async (req, res, next) => {
  try {
    const log = await studentService.getLogWithMedia(req.params.id, uid(req), req.institutionId);
    if (!log) return error(res, 'Log not found', 404);
    return success(res, log, 'Log', 200);
  } catch (e) {
    next(e);
  }
};

export const updateLog = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const log = await studentService.updateLog(req.params.id, uid(req), req.institutionId, data);
    if (!log) return error(res, 'Log not found', 404);
    return success(res, log, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const deleteLog = async (req, res, next) => {
  try {
    await studentService.deleteLog(req.params.id, uid(req), req.institutionId);
    return success(res, null, 'Log deleted', 200);
  } catch (e) {
    next(e);
  }
};

export const submitLog = async (req, res, next) => {
  try {
    const log = await studentService.submitLog(req.params.id, uid(req), req.institutionId);
    if (!log) return error(res, 'Log not found', 404);
    return success(res, log, 'Log submitted', 200);
  } catch (e) {
    if (e.message?.includes('at least')) return error(res, e.message, 400);
    next(e);
  }
};

export const uploadLogMedia = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return error(res, 'No files', 400);
    const student = await studentService.getStudentByUserId(uid(req), req.institutionId);
    if (!student) return error(res, 'Student not found', 404);
    const config = await SystemConfig.findOne({ institutionId: req.institutionId });
    const maxSize = (config?.maxFileSizeMb ?? 5) * 1024 * 1024;
    const allowed = config?.allowedFileTypes ?? ['image/jpeg', 'image/png', 'application/pdf'];
    const { Readable } = await import('stream');
    const uploaded = [];
    for (const f of files) {
      if (f.size > maxSize) return error(res, 'File too large', 400);
      if (!allowed.includes(f.mimetype)) return error(res, 'File type not allowed', 400);
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (err, res) => (err ? reject(err) : resolve(res)));
        Readable.from(f.buffer).pipe(stream);
      });
      uploaded.push({
        publicId: result.public_id,
        url: result.secure_url,
        fileType: f.mimetype.startsWith('image/') ? 'image' : 'document',
        originalName: f.originalname,
        sizeBytes: f.size,
      });
    }
    const count = await logService.getMediaCount(req.params.id);
    if (count + uploaded.length > 5) return error(res, 'Maximum 5 media per log', 400);
    await logService.addLogMedia(
      req.params.id,
      req.institutionId,
      uid(req),
      uploaded.map((u) => ({ publicId: u.publicId, url: u.url, fileType: u.fileType, originalName: u.originalName, sizeBytes: u.sizeBytes }))
    );
    return success(res, { uploaded: uploaded.length }, 'Media added', 200);
  } catch (e) {
    next(e);
  }
};

export const deleteLogMedia = async (req, res, next) => {
  try {
    await logService.removeLogMedia(req.params.id, req.params.mediaId, req.institutionId);
    return success(res, null, 'Media removed', 200);
  } catch (e) {
    next(e);
  }
};

export const listEvaluations = async (req, res, next) => {
  try {
    const docs = await studentService.getEvaluations(uid(req), req.institutionId);
    return success(res, docs, 'Evaluations', 200);
  } catch (e) {
    next(e);
  }
};

export const getProgress = async (req, res, next) => {
  try {
    const data = await studentService.getProgress(uid(req), req.institutionId);
    if (!data) return error(res, 'Student not found', 404);
    return success(res, data, 'Progress', 200);
  } catch (e) {
    next(e);
  }
};

export const listNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await notificationService.getNotifications(uid(req), req.institutionId, { page, limit });
    return success(res, result.docs, 'Notifications', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, uid(req));
    return success(res, null, 'Marked read', 200);
  } catch (e) {
    next(e);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(uid(req), req.institutionId);
    return success(res, null, 'All marked read', 200);
  } catch (e) {
    next(e);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await studentService.getProfile(uid(req), req.institutionId);
    if (!profile) return error(res, 'Profile not found', 404);
    return success(res, profile, 'Profile', 200);
  } catch (e) {
    next(e);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const data = req.body || {};
    const profile = await studentService.updateProfile(uid(req), req.institutionId, data);
    if (!profile) return error(res, 'Profile not found', 404);
    return success(res, profile, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const exportData = async (req, res, next) => {
  try {
    const job = await studentService.createReportJob(uid(req), req.institutionId);
    if (!job) return error(res, 'Student not found', 404);
    return success(res, { jobId: job._id }, 'Export job queued', 202);
  } catch (e) {
    next(e);
  }
};
