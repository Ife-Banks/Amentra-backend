import Assignment from '../models/Assignment.js';
import Supervisor from '../models/Supervisor.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import LogEntry from '../models/LogEntry.js';
import LogReview from '../models/LogReview.js';
import Evaluation from '../models/Evaluation.js';
import * as logService from './log.service.js';
import * as evaluationService from './evaluation.service.js';
import * as notificationService from './notification.service.js';
import * as analyticsService from './analytics.service.js';
import { get } from './cache.service.js';
import { set } from './cache.service.js';
import { paginateQuery } from '../utils/paginate.js';
import { hashPassword } from '../utils/password.js';
import DefaultPassword from '../models/DefaultPassword.js';
import { sendWelcomeEmail } from './email.service.js';

const CACHE_TTL = 300;

export const getDashboard = async (supervisorUserId, institutionId) => {
  const cacheKey = `supervisor:dashboard:${supervisorUserId}`;
  const cached = await get(cacheKey);
  if (cached) return cached;
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return { totalAssignedStudents: 0, logsPendingReview: 0, logsApprovedThisWeek: 0, studentsWithoutRecentSubmission: 0 };
  const stats = await analyticsService.getSupervisorDashboardStats(sup._id, institutionId);
  await set(cacheKey, stats, CACHE_TTL);
  return stats;
};

export const getSupervisorProfile = async (supervisorUserId, institutionId) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId }).populate('userId', 'name email').lean();
  return sup;
};

export const updateSupervisorProfile = async (supervisorUserId, institutionId, data) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return null;
  if (data.company !== undefined) sup.company = data.company;
  if (data.companyAddress !== undefined) sup.companyAddress = data.companyAddress;
  await sup.save();
  return sup;
};

export const listAssignedStudents = async (supervisorUserId, institutionId, options = {}) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return { docs: [], total: 0, page: 1, pages: 0, limit: options.limit || 20 };
  const assignments = await Assignment.find({ supervisorId: sup._id, isActive: true }).distinct('studentId');
  const filter = { _id: { $in: assignments }, institutionId };
  return paginateQuery(Student, filter, { ...options, populate: ['userId', 'sessionId'] });
};

export const getStudentById = async (studentId, supervisorUserId, institutionId) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return null;
  const assigned = await Assignment.findOne({ studentId, supervisorId: sup._id, isActive: true });
  if (!assigned) return null;
  const student = await Student.findById(studentId).populate('userId').populate('sessionId').populate('departmentId').lean();
  const logCount = await LogEntry.countDocuments({ studentId });
  return { ...student, logCount };
};

export const searchStudents = async (supervisorUserId, institutionId, q) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return [];
  const assignments = await Assignment.find({ supervisorId: sup._id, isActive: true }).distinct('studentId');
  const students = await Student.find({ _id: { $in: assignments }, institutionId })
    .populate('userId', 'name email')
    .lean();
  const filtered = q
    ? students.filter(
        (s) =>
          s.userId?.name?.toLowerCase().includes(q.toLowerCase()) ||
          s.matricNumber?.toLowerCase().includes(q.toLowerCase())
      )
    : students;
  return filtered;
};

export const createStudent = async (supervisorUserId, departmentId, institutionId, data) => {
  const supervisorDoc = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!supervisorDoc) return null;
  
  // Generate default password: AMENTRA@<matricNumber>
  const defaultPassword = `AMENTRA@${data.matricNumber}`;
  
  // Always hash the AMENTRA@matricNumber format - don't use DefaultPassword hash
  const passwordHash = data.password ? await hashPassword(data.password) : await hashPassword(defaultPassword);
  
  const user = await User.create({
    institutionId,
    departmentId,
    name: data.name,
    email: data.email,
    passwordHash,
    role: 'student',
    isActive: true,
    isEmailVerified: true,
    mustChangePassword: false,
    isFirstLogin: true,
  });
  const student = await Student.create({
    userId: user._id,
    institutionId,
    departmentId,
    matricNumber: data.matricNumber,
    company: data.company || '',
    companyAddress: data.companyAddress || '',
    companyState: data.companyState || '',
    companyCity: data.companyCity || '',
    sessionId: data.sessionId,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
  });
  await Assignment.create({ studentId: student._id, supervisorId: supervisorDoc._id, institutionId, assignedById: supervisorUserId });
  await sendWelcomeEmail(user.email, user.name);
  return { user, student, defaultPassword };
};

export const getLogs = async (supervisorUserId, institutionId, filters, options) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return { docs: [], total: 0, page: 1, pages: 0, limit: options.limit || 20 };
  const assigned = await Assignment.find({ supervisorId: sup._id, isActive: true }).distinct('studentId');
  const filter = { institutionId, studentId: { $in: assigned } };
  if (filters.studentId) filter.studentId = filters.studentId;
  if (filters.status) filter.status = filters.status;
  if (filters.dateFrom) filter.date = { $gte: new Date(filters.dateFrom) };
  if (filters.dateTo) filter.date = { ...filter.date, $lte: new Date(filters.dateTo) };
  return paginateQuery(LogEntry, filter, { ...options, populate: ['studentId', 'sessionId'] });
};

export const getPendingLogs = async (supervisorUserId, institutionId) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return [];
  const assigned = await Assignment.find({ supervisorId: sup._id, isActive: true }).distinct('studentId');
  const docs = await LogEntry.find({ institutionId, studentId: { $in: assigned }, status: 'submitted' })
    .populate('studentId')
    .populate('sessionId')
    .sort({ submittedAt: 1 })
    .lean();
  return docs;
};

export const getLogHistory = async (supervisorUserId, institutionId, options) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return { docs: [], total: 0, page: 1, pages: 0, limit: options.limit || 20 };
  const assigned = await Assignment.find({ supervisorId: sup._id, isActive: true }).distinct('studentId');
  const filter = { institutionId, studentId: { $in: assigned }, status: { $in: ['approved', 'rejected'] } };
  return paginateQuery(LogEntry, filter, { ...options, populate: ['studentId', 'sessionId'] });
};

export const getLogWithMedia = async (logId, supervisorUserId, institutionId) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return null;
  const assigned = await Assignment.find({ supervisorId: sup._id, isActive: true }).distinct('studentId');
  const log = await LogEntry.findOne({ _id: logId, institutionId, studentId: { $in: assigned } });
  if (!log) return null;
  return logService.getLogWithMediaAndReview(logId, institutionId);
};

export const approveLog = async (logId, supervisorUserId, institutionId, comment) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return null;
  const assigned = await Assignment.find({ supervisorId: sup._id, isActive: true }).distinct('studentId');
  const log = await LogEntry.findOne({ _id: logId, institutionId, studentId: { $in: assigned } });
  if (!log) return null;
  return logService.approveLog(logId, supervisorUserId, institutionId, comment);
};

export const rejectLog = async (logId, supervisorUserId, institutionId, comment) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return null;
  const assigned = await Assignment.find({ supervisorId: sup._id, isActive: true }).distinct('studentId');
  const log = await LogEntry.findOne({ _id: logId, institutionId, studentId: { $in: assigned } });
  if (!log) return null;
  return logService.rejectLog(logId, supervisorUserId, institutionId, comment);
};

export const rateLog = async (logId, supervisorId, institutionId, rating) => {
  return logService.rateLog(logId, supervisorId, institutionId, rating);
};

export const getEvaluations = async (supervisorUserId, institutionId, options) => {
  return evaluationService.getEvaluationsBySupervisor(supervisorUserId, institutionId, options);
};

export const getEvaluationById = async (evalId, supervisorUserId, institutionId) => {
  const evalDoc = await evaluationService.getEvaluationById(evalId, institutionId);
  if (!evalDoc || evalDoc.supervisorId?.toString() !== supervisorUserId.toString()) return null;
  return evalDoc;
};

export const createEvaluation = async (supervisorUserId, institutionId, data) => {
  return evaluationService.createEvaluation({
    ...data,
    supervisorId: supervisorUserId,
    institutionId,
  });
};

export const updateEvaluation = async (evalId, supervisorUserId, institutionId, data) => {
  const evalDoc = await Evaluation.findOne({ _id: evalId, institutionId });
  if (!evalDoc || evalDoc.supervisorId?.toString() !== supervisorUserId.toString()) return null;
  return evaluationService.updateEvaluation(evalId, institutionId, data);
};

export const getStudentReport = async (studentId, supervisorUserId, institutionId) => {
  const sup = await Supervisor.findOne({ userId: supervisorUserId, institutionId });
  if (!sup) return null;
  const assigned = await Assignment.findOne({ studentId, supervisorId: sup._id, isActive: true });
  if (!assigned) return null;
  const [logs, evals] = await Promise.all([
    LogEntry.find({ studentId, institutionId }).lean(),
    Evaluation.find({ studentId, institutionId }).lean(),
  ]);
  const approved = logs.filter((l) => l.status === 'approved').length;
  const totalHours = logs.reduce((s, l) => s + (l.hoursWorked || 0), 0);
  const approvalRate = logs.length ? Math.round((approved / logs.length) * 100) : 0;
  const avgEval = evals.length
    ? evals.reduce((s, e) => s + (e.technicalSkillScore + e.workEthicScore + e.communicationScore + e.problemSolvingScore) / 4, 0) / evals.length
    : null;
  return { logCount: logs.length, approved, totalHours, approvalRate, evaluations: evals.length, avgEvalScore: avgEval };
};

export const getNotifications = async (userId, institutionId, options) => {
  return notificationService.getNotifications(userId, institutionId, options);
};

export const markNotificationRead = async (notificationId, userId) => {
  return notificationService.markAsRead(notificationId, userId);
};

export const markAllNotificationsRead = async (userId, institutionId) => {
  return notificationService.markAllAsRead(userId, institutionId);
};

export const getPreferences = async (userId, institutionId) => {
  return notificationService.getPreferences(userId, institutionId);
};

export const updatePreferences = async (userId, institutionId, data) => {
  return notificationService.updatePreferences(userId, institutionId, data);
};
