import * as supervisorService from '../services/supervisor.service.js';
import * as reportService from '../services/report.service.js';
import { success, error } from '../utils/apiResponse.js';

const uid = (req) => req.user.userId;

export const getDashboard = async (req, res, next) => {
  try {
    const data = await supervisorService.getDashboard(uid(req), req.institutionId);
    return success(res, data, 'Dashboard', 200);
  } catch (e) {
    next(e);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await supervisorService.getSupervisorProfile(uid(req), req.institutionId);
    if (!profile) return error(res, 'Profile not found', 404);
    return success(res, profile, 'Profile', 200);
  } catch (e) {
    next(e);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const profile = await supervisorService.updateSupervisorProfile(uid(req), req.institutionId, data);
    if (!profile) return error(res, 'Profile not found', 404);
    return success(res, profile, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const listStudents = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await supervisorService.listAssignedStudents(uid(req), req.institutionId, { page, limit });
    return success(res, result.docs, 'Students', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const getStudent = async (req, res, next) => {
  try {
    const student = await supervisorService.getStudentById(req.params.id, uid(req), req.institutionId);
    if (!student) return error(res, 'Student not found', 404);
    return success(res, student, 'Student', 200);
  } catch (e) {
    next(e);
  }
};

export const searchStudents = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const docs = await supervisorService.searchStudents(uid(req), req.institutionId, q);
    return success(res, docs, 'Search results', 200);
  } catch (e) {
    next(e);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const { student } = await supervisorService.createStudent(uid(req), req.user.departmentId, req.institutionId, data);
    return success(res, student, 'Student created', 201);
  } catch (e) {
    next(e);
  }
};

export const listLogs = async (req, res, next) => {
  try {
    const { page, limit, studentId, status, dateFrom, dateTo } = req.query;
    const result = await supervisorService.getLogs(uid(req), req.institutionId, { studentId, status, dateFrom, dateTo }, { page, limit });
    return success(res, result.docs, 'Logs', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const listPendingLogs = async (req, res, next) => {
  try {
    const docs = await supervisorService.getPendingLogs(uid(req), req.institutionId);
    return success(res, docs, 'Pending logs', 200);
  } catch (e) {
    next(e);
  }
};

export const listLogHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await supervisorService.getLogHistory(uid(req), req.institutionId, { page, limit });
    return success(res, result.docs, 'History', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const getLog = async (req, res, next) => {
  try {
    const log = await supervisorService.getLogWithMedia(req.params.id, uid(req), req.institutionId);
    if (!log) return error(res, 'Log not found', 404);
    return success(res, log, 'Log', 200);
  } catch (e) {
    next(e);
  }
};

export const approveLog = async (req, res, next) => {
  try {
    const { comment } = req.validated || req.body || {};
    const log = await supervisorService.approveLog(req.params.id, uid(req), req.institutionId, comment);
    if (!log) return error(res, 'Log not found', 404);
    return success(res, log, 'Log approved', 200);
  } catch (e) {
    next(e);
  }
};

export const rejectLog = async (req, res, next) => {
  try {
    const { comment } = req.validated || req.body;
    if (!comment) return error(res, 'Comment is required when rejecting', 400);
    const log = await supervisorService.rejectLog(req.params.id, uid(req), req.institutionId, comment);
    if (!log) return error(res, 'Log not found', 404);
    return success(res, log, 'Log rejected', 200);
  } catch (e) {
    next(e);
  }
};

export const rateLog = async (req, res, next) => {
  try {
    const { rating } = req.validated || req.body;
    const review = await supervisorService.rateLog(req.params.id, uid(req), req.institutionId, rating);
    if (!review) return error(res, 'Log not found', 404);
    return success(res, review, 'Rating saved', 200);
  } catch (e) {
    next(e);
  }
};

export const listEvaluations = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await supervisorService.getEvaluations(uid(req), req.institutionId, { page, limit });
    return success(res, result.docs, 'Evaluations', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const createEvaluation = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const evalDoc = await supervisorService.createEvaluation(uid(req), req.institutionId, data);
    return success(res, evalDoc, 'Evaluation created', 201);
  } catch (e) {
    next(e);
  }
};

export const getEvaluation = async (req, res, next) => {
  try {
    const evalDoc = await supervisorService.getEvaluationById(req.params.id, uid(req), req.institutionId);
    if (!evalDoc) return error(res, 'Evaluation not found', 404);
    return success(res, evalDoc, 'Evaluation', 200);
  } catch (e) {
    next(e);
  }
};

export const updateEvaluation = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const evalDoc = await supervisorService.updateEvaluation(req.params.id, uid(req), req.institutionId, data);
    if (!evalDoc) return error(res, 'Evaluation not found', 404);
    return success(res, evalDoc, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const getStudentReport = async (req, res, next) => {
  try {
    const data = await supervisorService.getStudentReport(req.params.id, uid(req), req.institutionId);
    if (!data) return error(res, 'Student not found', 404);
    return success(res, data, 'Report', 200);
  } catch (e) {
    next(e);
  }
};

export const exportStudentReport = async (req, res, next) => {
  try {
    const job = await reportService.createReportJob(req.institutionId, uid(req), 'student_full', 'pdf', null, null);
    return success(res, { jobId: job._id }, 'Report job queued', 202);
  } catch (e) {
    next(e);
  }
};

export const listNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await supervisorService.getNotifications(uid(req), req.institutionId, { page, limit });
    return success(res, result.docs, 'Notifications', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    await supervisorService.markNotificationRead(req.params.id, uid(req));
    return success(res, null, 'Marked read', 200);
  } catch (e) {
    next(e);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await supervisorService.markAllNotificationsRead(uid(req), req.institutionId);
    return success(res, null, 'All marked read', 200);
  } catch (e) {
    next(e);
  }
};

export const getNotificationPreferences = async (req, res, next) => {
  try {
    const prefs = await supervisorService.getPreferences(uid(req), req.institutionId);
    return success(res, prefs, 'Preferences', 200);
  } catch (e) {
    next(e);
  }
};

export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const data = req.body || {};
    const prefs = await supervisorService.updatePreferences(uid(req), req.institutionId, data);
    return success(res, prefs, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await supervisorService.getUnreadCount(uid(req), req.institutionId);
    return success(res, { count }, 'Unread count', 200);
  } catch (e) {
    next(e);
  }
};
