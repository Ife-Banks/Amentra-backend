import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Supervisor from '../models/Supervisor.js';
import Assignment from '../models/Assignment.js';
import LogEntry from '../models/LogEntry.js';
import Evaluation from '../models/Evaluation.js';
import SiteVisit from '../models/SiteVisit.js';
import Department from '../models/Department.js';
import AcademicSession from '../models/AcademicSession.js';
import { paginateQuery } from '../utils/paginate.js';
import { hashPassword } from '../utils/password.js';
import DefaultPassword from '../models/DefaultPassword.js';
import { sendWelcomeEmail } from './email.service.js';
import * as analyticsService from './analytics.service.js';
import * as reportService from './report.service.js';
import * as bulkImportService from './bulkImport.service.js';
import cloudinary from '../config/cloudinary.js';

export const getDashboard = async (departmentId, institutionId) => {
  const session = await AcademicSession.findOne({ institutionId, isActive: true }).select('_id');
  return analyticsService.getAdminDashboardStats(departmentId, institutionId, session?._id);
};

export const listSupervisors = async (departmentId, institutionId, options = {}) => {
  const filter = { institutionId, departmentId };
  const docs = await Supervisor.find(filter)
    .populate('userId', 'name email')
    .skip(((options.page || 1) - 1) * (options.limit || 20))
    .limit(options.limit || 20)
    .lean();
  const total = await Supervisor.countDocuments(filter);
  const withCounts = await Promise.all(
    docs.map(async (s) => {
      const count = await Assignment.countDocuments({ supervisorId: s._id, isActive: true });
      return { ...s, assignedStudentCount: count };
    })
  );
  return { docs: withCounts, total, page: options.page || 1, pages: Math.ceil(total / (options.limit || 20)) || 1, limit: options.limit || 20 };
};

export const createSupervisor = async (departmentId, institutionId, data) => {
  // Generate default password: AMENTRA@<staffId>
  const defaultPassword = `AMENTRA@${data.staffId}`;
  
  // Always hash the AMENTRA@staffId format - don't use DefaultPassword hash
  const passwordHash = data.password ? await hashPassword(data.password) : await hashPassword(defaultPassword);
  
  const user = await User.create({
    institutionId,
    departmentId,
    name: data.name,
    email: data.email,
    staffId: data.staffId,
    passwordHash,
    role: 'supervisor',
    isActive: true,
    isEmailVerified: true,
    mustChangePassword: false,
    isFirstLogin: true,
  });
  const supervisor = await Supervisor.create({
    userId: user._id,
    institutionId,
    departmentId,
    company: data.company || '',
    companyAddress: data.companyAddress || '',
  });
  await sendWelcomeEmail(user.email, user.name);
  return { user, supervisor, defaultPassword };
};

export const getSupervisorById = async (id, departmentId, institutionId) => {
  const sup = await Supervisor.findOne({ _id: id, institutionId, departmentId }).populate('userId', 'name email').lean();
  if (!sup) return null;
  const assigned = await Assignment.find({ supervisorId: id, isActive: true }).populate('studentId').lean();
  return { ...sup, assignedStudents: assigned };
};

export const updateSupervisor = async (id, departmentId, institutionId, data) => {
  const sup = await Supervisor.findOne({ _id: id, institutionId, departmentId });
  if (!sup) return null;
  const user = await User.findById(sup.userId);
  if (data.name) user.name = data.name;
  if (data.email) user.email = data.email;
  if (data.company !== undefined) sup.company = data.company;
  if (data.companyAddress !== undefined) sup.companyAddress = data.companyAddress;
  await user.save();
  await sup.save();
  return sup;
};

export const deactivateSupervisor = async (id, departmentId, institutionId) => {
  const sup = await Supervisor.findOne({ _id: id, institutionId, departmentId });
  if (!sup) return null;
  await User.findByIdAndUpdate(sup.userId, { isActive: false });
  return sup;
};

export const deleteSupervisor = async (id, departmentId, institutionId) => {
  const sup = await Supervisor.findOne({ _id: id, institutionId, departmentId });
  if (!sup) return null;
  const activeAssignments = await Assignment.countDocuments({ supervisorId: id, isActive: true });
  if (activeAssignments > 0) throw new Error('Cannot delete supervisor with active assignments');
  await User.findByIdAndDelete(sup.userId);
  await Supervisor.findByIdAndDelete(id);
  return sup;
};

export const listStudents = async (departmentId, institutionId, filters = {}, options = {}) => {
  const filter = { institutionId, departmentId };
  if (filters.sessionId) filter.sessionId = filters.sessionId;
  if (filters.supervisorId) {
    const assigned = await Assignment.find({ supervisorId: filters.supervisorId, isActive: true }).distinct('studentId');
    filter._id = { $in: assigned };
  }
  return paginateQuery(Student, filter, { ...options, populate: ['userId', 'sessionId'] });
};

export const createStudent = async (departmentId, institutionId, data) => {
  const defaultPwd = await DefaultPassword.findOne({ institutionId, role: 'student' });
  const passwordHash = data.password ? await hashPassword(data.password) : defaultPwd?.passwordHash || await hashPassword('Student@123');
  const user = await User.create({
    institutionId,
    departmentId,
    name: data.name,
    email: data.email,
    passwordHash,
    role: 'student',
  });
  const student = await Student.create({
    userId: user._id,
    institutionId,
    departmentId,
    matricNumber: data.matricNumber,
    company: data.company || '',
    companyAddress: data.companyAddress || '',
    sessionId: data.sessionId,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
  });
  await sendWelcomeEmail(user.email, user.name);
  return { user, student };
};

export const getStudentById = async (id, departmentId, institutionId) => {
  const student = await Student.findOne({ _id: id, institutionId, departmentId })
    .populate('userId', 'name email')
    .populate('sessionId', 'name')
    .lean();
  if (!student) return null;
  const [logCount, assignment] = await Promise.all([
    LogEntry.countDocuments({ studentId: id }),
    Assignment.findOne({ studentId: id, isActive: true }).populate('supervisorId').populate('supervisorId.userId', 'name'),
  ]);
  return { ...student, logCount, assignedSupervisor: assignment };
};

export const updateStudent = async (id, departmentId, institutionId, data) => {
  const student = await Student.findOne({ _id: id, institutionId, departmentId });
  if (!student) return null;
  const user = await User.findById(student.userId);
  if (data.name) user.name = data.name;
  if (data.email) user.email = data.email;
  if (data.matricNumber) student.matricNumber = data.matricNumber;
  if (data.company !== undefined) student.company = data.company;
  if (data.companyAddress !== undefined) student.companyAddress = data.companyAddress;
  if (data.companyState !== undefined) student.companyState = data.companyState;
  if (data.companyCity !== undefined) student.companyCity = data.companyCity;
  if (data.startDate) student.startDate = new Date(data.startDate);
  if (data.endDate) student.endDate = new Date(data.endDate);
  if (data.sessionId) student.sessionId = data.sessionId;
  await user.save();
  await student.save();
  return student;
};

export const deactivateStudent = async (id, departmentId, institutionId) => {
  const student = await Student.findOne({ _id: id, institutionId, departmentId });
  if (!student) return null;
  await User.findByIdAndUpdate(student.userId, { isActive: false });
  return student;
};

export const deleteStudent = async (id, departmentId, institutionId) => {
  const student = await Student.findOne({ _id: id, institutionId, departmentId });
  if (!student) return null;
  const logCount = await LogEntry.countDocuments({ studentId: id });
  if (logCount > 0) throw new Error('Cannot delete student with logs');
  await User.findByIdAndDelete(student.userId);
  await Student.findByIdAndDelete(id);
  return student;
};

export const searchStudents = async (departmentId, institutionId, q) => {
  const users = await User.find({ institutionId, departmentId, role: 'student', $or: [{ name: new RegExp(q, 'i') }] }).select('_id').lean();
  const userIds = users.map((u) => u._id);
  const students = await Student.find({ institutionId, departmentId, userId: { $in: userIds } })
    .populate('userId', 'name email')
    .lean();
  const byMatric = await Student.find({ institutionId, departmentId, matricNumber: new RegExp(q, 'i') }).populate('userId', 'name email').lean();
  const seen = new Set(students.map((s) => s._id.toString()));
  for (const s of byMatric) {
    if (!seen.has(s._id.toString())) students.push(s);
  }
  return students;
};

export const createAssignment = async (departmentId, institutionId, assignedById, data) => {
  await Assignment.updateMany({ studentId: data.studentId, isActive: true }, { isActive: false, unassignedAt: new Date() });
  const supervisor = await Supervisor.findOne({ _id: data.supervisorId, institutionId, departmentId });
  if (!supervisor) throw new Error('Supervisor not found');
  const assignment = await Assignment.create({
    studentId: data.studentId,
    supervisorId: data.supervisorId,
    institutionId,
    assignedById,
  });
  return assignment;
};

export const listAssignments = async (departmentId, institutionId) => {
  const docs = await Assignment.find({ institutionId, isActive: true })
    .populate('studentId')
    .populate('supervisorId')
    .populate('studentId.userId', 'name email')
    .populate('supervisorId.userId', 'name email')
    .lean();
  const inDept = docs.filter((d) => d.studentId && d.studentId.departmentId?.toString() === departmentId.toString());
  return inDept;
};

export const reassign = async (assignmentId, departmentId, institutionId, newSupervisorId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, institutionId, isActive: true });
  if (!assignment) return null;
  const studentDept = await Student.findById(assignment.studentId).select('departmentId');
  if (studentDept?.departmentId?.toString() !== departmentId.toString()) return null;
  assignment.isActive = false;
  assignment.unassignedAt = new Date();
  await assignment.save();
  const newAssignment = await Assignment.create({
    studentId: assignment.studentId,
    supervisorId: newSupervisorId,
    institutionId,
    assignedById: assignment.assignedById,
  });
  return newAssignment;
};

export const unassign = async (assignmentId, departmentId, institutionId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, institutionId });
  if (!assignment) return null;
  const studentDept = await Student.findById(assignment.studentId).select('departmentId');
  if (studentDept?.departmentId?.toString() !== departmentId.toString()) return null;
  assignment.isActive = false;
  assignment.unassignedAt = new Date();
  await assignment.save();
  return assignment;
};

export const listLogs = async (departmentId, institutionId, filters, options) => {
  const studentIds = await Student.find({ institutionId, departmentId }).distinct('_id');
  const filter = { institutionId, studentId: { $in: studentIds } };
  if (filters.studentId) filter.studentId = filters.studentId;
  if (filters.status) filter.status = filters.status;
  if (filters.dateFrom) filter.date = { $gte: new Date(filters.dateFrom) };
  if (filters.dateTo) filter.date = { ...filter.date, $lte: new Date(filters.dateTo) };
  return paginateQuery(LogEntry, filter, { ...options, populate: ['studentId', 'sessionId'] });
};

export const getLogById = async (logId, departmentId, institutionId) => {
  const log = await LogEntry.findOne({ _id: logId, institutionId }).populate('studentId').populate('sessionId').lean();
  if (!log) return null;
  const studentDept = await Student.findById(log.studentId?._id).select('departmentId');
  if (studentDept?.departmentId?.toString() !== departmentId.toString()) return null;
  return log;
};

export const listPendingLogs = async (departmentId, institutionId) => {
  const studentIds = await Student.find({ institutionId, departmentId }).distinct('_id');
  const docs = await LogEntry.find({ institutionId, studentId: { $in: studentIds }, status: 'submitted' })
    .populate('studentId')
    .populate('sessionId')
    .sort({ submittedAt: 1 })
    .lean();
  return docs;
};

export const listEvaluations = async (departmentId, institutionId, options) => {
  const studentIds = await Student.find({ institutionId, departmentId }).distinct('_id');
  const filter = { institutionId, studentId: { $in: studentIds } };
  return paginateQuery(Evaluation, filter, { ...options, populate: ['studentId', 'supervisorId', 'sessionId'] });
};

export const getEvaluationById = async (evalId, departmentId, institutionId) => {
  const evalDoc = await Evaluation.findOne({ _id: evalId, institutionId }).populate('studentId').populate('supervisorId').populate('sessionId').lean();
  if (!evalDoc) return null;
  const studentDept = await Student.findById(evalDoc.studentId?._id).select('departmentId');
  if (studentDept?.departmentId?.toString() !== departmentId.toString()) return null;
  return evalDoc;
};

export const listSiteVisits = async (departmentId, institutionId, options) => {
  const filter = { institutionId, departmentId };
  return paginateQuery(SiteVisit, filter, { ...options, populate: ['adminId', 'studentIds'] });
};

export const createSiteVisit = async (adminId, departmentId, institutionId, data) => {
  const visit = await SiteVisit.create({
    adminId,
    institutionId,
    departmentId,
    company: data.company,
    address: data.address || '',
    visitDate: new Date(data.visitDate),
    notes: data.notes || '',
    studentIds: data.studentIds || [],
  });
  return visit;
};

export const getSiteVisitById = async (id, departmentId, institutionId) => {
  const visit = await SiteVisit.findOne({ _id: id, institutionId, departmentId }).populate('adminId', 'name').populate('studentIds').lean();
  return visit;
};

export const updateSiteVisit = async (id, departmentId, institutionId, data) => {
  const visit = await SiteVisit.findOneAndUpdate(
    { _id: id, institutionId, departmentId },
    { $set: { company: data.company, address: data.address, visitDate: data.visitDate ? new Date(data.visitDate) : undefined, notes: data.notes, studentIds: data.studentIds } },
    { new: true }
  );
  return visit;
};

export const deleteSiteVisit = async (id, departmentId, institutionId) => {
  const visit = await SiteVisit.findOne({ _id: id, institutionId, departmentId });
  if (!visit) return null;
  for (const m of visit.mediaUrls || []) {
    if (m.cloudinaryPublicId) try { await cloudinary.uploader.destroy(m.cloudinaryPublicId); } catch (_) {}
  }
  await SiteVisit.findByIdAndDelete(id);
  return visit;
};

export const addSiteVisitMedia = async (id, departmentId, institutionId, files) => {
  const visit = await SiteVisit.findOne({ _id: id, institutionId, departmentId });
  if (!visit) return null;
  const { Readable } = await import('stream');
  visit.mediaUrls = visit.mediaUrls || [];
  for (const f of files) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, (err, res) => (err ? reject(err) : resolve(res)));
      Readable.from(f.buffer).pipe(stream);
    });
    visit.mediaUrls.push({ cloudinaryPublicId: result.public_id, url: result.secure_url });
  }
  await visit.save();
  return visit;
};

export const getAnalytics = async (departmentId, institutionId) => {
  const session = await AcademicSession.findOne({ institutionId, isActive: true }).select('_id');
  const studentIds = await Student.find({ institutionId, departmentId }).distinct('_id');
  const logs = await LogEntry.aggregate([
    { $match: { institutionId, studentId: { $in: studentIds }, ...(session && { sessionId: session._id }) } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const evals = await Evaluation.aggregate([
    { $match: { institutionId, studentId: { $in: studentIds } } },
    { $group: { _id: null, avgTech: { $avg: '$technicalSkillScore' }, avgEthic: { $avg: '$workEthicScore' }, avgComm: { $avg: '$communicationScore' }, avgProb: { $avg: '$problemSolvingScore' } } },
  ]);
  const approved = await LogEntry.countDocuments({ institutionId, studentId: { $in: studentIds }, status: 'approved', ...(session && { sessionId: session._id }) });
  const total = await LogEntry.countDocuments({ institutionId, studentId: { $in: studentIds }, ...(session && { sessionId: session._id }) });
  const topStudents = await LogEntry.aggregate([
    { $match: { institutionId, studentId: { $in: studentIds }, status: 'approved', ...(session && { sessionId: session._id }) } },
    { $group: { _id: '$studentId', count: { $sum: 1 }, hours: { $sum: '$hoursWorked' } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    { $lookup: { from: 'users', localField: 'student.userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { studentName: '$user.name', count: 1, hours: 1 } },
  ]);
  return {
    submissionByMonth: logs,
    avgEvalScores: evals[0] || {},
    approvalRate: total ? Math.round((approved / total) * 100) : 0,
    topStudents,
  };
};

export const getReportTemplates = () => reportService.getReportTemplates();

export const createReportJob = async (institutionId, requestedById, reportType, format, dateFrom, dateTo, departmentId) => {
  return reportService.createReportJob(institutionId, requestedById, reportType, format, dateFrom, dateTo);
};

export const createBulkImportJob = async (institutionId, departmentId, initiatedById, importType, csvRows) => {
  return bulkImportService.createBulkImportJob(institutionId, initiatedById, importType, csvRows);
};
