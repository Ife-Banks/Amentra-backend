import Student from '../models/Student.js';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import LogEntry from '../models/LogEntry.js';
import Evaluation from '../models/Evaluation.js';
import SystemConfig from '../models/SystemConfig.js';
import * as logService from './log.service.js';
import * as notificationService from './notification.service.js';
import * as analyticsService from './analytics.service.js';
import * as reportService from './report.service.js';

export const getStudentByUserId = async (userId, institutionId) => {
  const student = await Student.findOne({ userId, institutionId }).populate('userId', 'name email').populate('departmentId').populate('sessionId').lean();
  return student;
};

export const getDashboard = async (studentUserId, institutionId) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return null;
  return analyticsService.getStudentDashboardStats(student._id, institutionId);
};

export const getStreak = async (studentUserId, institutionId) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return { current: 0, longest: 0 };
  const logs = await LogEntry.find({ studentId: student._id, status: 'submitted' })
    .sort({ date: 1 })
    .select('date')
    .lean();
  const dates = [...new Set(logs.map((l) => l.date.toISOString().slice(0, 10)))].sort();
  let current = 0;
  let longest = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = dates.length - 1; i >= 0; i--) {
    const expected = new Date();
    expected.setDate(expected.getDate() - (dates.length - 1 - i));
    const expStr = expected.toISOString().slice(0, 10);
    if (dates[i] === expStr) {
      current++;
      if (i === dates.length - 1 && dates[i] === today) continue;
    } else break;
  }
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr - prev) / (24 * 60 * 60 * 1000);
    if (diff === 1) run++;
    else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);
  return { current, longest };
};

export const getWeeklyChart = async (studentUserId, institutionId) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return [];
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  const logs = await LogEntry.find({ studentId: student._id, date: { $gte: twelveWeeksAgo } }).select('date status').lean();
  const weekMap = {};
  for (let w = 0; w < 12; w++) {
    const start = new Date();
    start.setDate(start.getDate() - (12 - w) * 7);
    const key = start.toISOString().slice(0, 10);
    weekMap[key] = { week: key, submitted: 0, approved: 0 };
  }
  for (const l of logs) {
    const weekStart = new Date(l.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!weekMap[key]) weekMap[key] = { week: key, submitted: 0, approved: 0 };
    weekMap[key].submitted++;
    if (l.status === 'approved') weekMap[key].approved++;
  }
  return Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));
};

export const getLogs = async (studentUserId, institutionId, filters, options) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return { docs: [], total: 0, page: 1, pages: 0, limit: options?.limit || 20 };
  return logService.getLogsByStudent(student._id, institutionId, filters, options);
};

export const getLogWithMedia = async (logId, studentUserId, institutionId) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return null;
  const log = await LogEntry.findOne({ _id: logId, studentId: student._id, institutionId });
  if (!log) return null;
  return logService.getLogWithMediaAndReview(logId, institutionId);
};

export const createLog = async (studentUserId, institutionId, sessionId, data) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return null;
  return logService.createLog(student._id, institutionId, sessionId, data);
};

export const updateLog = async (logId, studentUserId, institutionId, data) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return null;
  return logService.updateLog(logId, institutionId, data);
};

export const deleteLog = async (logId, studentUserId, institutionId) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return null;
  return logService.deleteLog(logId, institutionId);
};

export const submitLog = async (logId, studentUserId, institutionId) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return null;
  const config = await SystemConfig.findOne({ institutionId });
  const minLen = config?.minLogDescriptionLength ?? 50;
  return logService.submitLog(logId, institutionId, minLen);
};

export const getEvaluations = async (studentUserId, institutionId) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return [];
  return evaluationService.getEvaluationsByStudent(student._id, institutionId);
};

export const getProgress = async (studentUserId, institutionId) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return null;
  const config = await SystemConfig.findOne({ institutionId });
  const totalRequired = config?.requiredLogCount ?? 60;
  const [submitted, approved, rejected, logs] = await Promise.all([
    LogEntry.countDocuments({ studentId: student._id, institutionId, status: 'submitted' }),
    LogEntry.countDocuments({ studentId: student._id, institutionId, status: 'approved' }),
    LogEntry.countDocuments({ studentId: student._id, institutionId, status: 'rejected' }),
    LogEntry.find({ studentId: student._id, institutionId }).select('hoursWorked').lean(),
  ]);
  const totalHours = logs.reduce((s, l) => s + (l.hoursWorked || 0), 0);
  const completionPercentage = totalRequired ? Math.min(100, Math.round((approved / totalRequired) * 100)) : 0;
  return {
    totalRequired,
    submitted,
    approved,
    rejected,
    totalHours,
    completionPercentage,
  };
};

export const getProfile = async (studentUserId, institutionId) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId })
    .populate('userId', 'name email')
    .populate('departmentId')
    .populate('sessionId')
    .lean();
  if (!student) return null;
  const assignment = await Assignment.findOne({ studentId: student._id, isActive: true })
    .populate('supervisorId')
    .populate('supervisorId.userId', 'name email');
  return { ...student, assignedSupervisor: assignment };
};

export const updateProfile = async (studentUserId, institutionId, data) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return null;
  if (data.company !== undefined) student.company = data.company;
  if (data.companyAddress !== undefined) student.companyAddress = data.companyAddress;
  if (data.companyState !== undefined) student.companyState = data.companyState;
  if (data.companyCity !== undefined) student.companyCity = data.companyCity;
  await student.save();
  return student;
};

export const createReportJob = async (studentUserId, institutionId) => {
  const student = await Student.findOne({ userId: studentUserId, institutionId });
  if (!student) return null;
  return reportService.createReportJob(institutionId, studentUserId, 'student_full', 'pdf', null, null);
};
