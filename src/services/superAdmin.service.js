import mongoose from 'mongoose';
import Institution from '../models/Institution.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Supervisor from '../models/Supervisor.js';
import AcademicSession from '../models/AcademicSession.js';
import SystemConfig from '../models/SystemConfig.js';
import DefaultPassword from '../models/DefaultPassword.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import BulkImportJob from '../models/BulkImportJob.js';
import { hashPassword } from '../utils/password.js';
import { paginateQuery } from '../utils/paginate.js';
import { sendWelcomeEmail } from './email.service.js';
import { getEmailQueue } from '../queues/email.queue.js';

// Helper to convert string ID to ObjectId
const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  return null;
};

export const getDashboard = async (institutionId) => {
  const objId = toObjectId(institutionId);
  const [deptCount, userCount, activeSession, logCount] = await Promise.all([
    Department.countDocuments({ institutionId: objId, isActive: true }),
    User.countDocuments({ institutionId: objId, isActive: true }),
    AcademicSession.findOne({ institutionId: objId, isActive: true }).select('name').lean(),
    mongoose.model('LogEntry').countDocuments({ institutionId: objId }),
  ]);
  return {
    totalDepartments: deptCount,
    totalUsers: userCount,
    activeSession: activeSession?.name || null,
    totalLogs: logCount,
  };
};

export const listDepartments = async (institutionId, options = {}) => {
  const objId = toObjectId(institutionId);
  if (!objId) {
    console.error('Invalid institutionId provided to listDepartments:', institutionId);
    return { docs: [], total: 0, page: 1, pages: 1, limit: options.limit || 20 };
  }
  const filter = { institutionId: objId, isActive: true };
  console.log('listDepartments filter:', filter);
  const agg = await Department.aggregate([
    { $match: filter },
    { $lookup: { from: 'students', localField: '_id', foreignField: 'departmentId', as: 'students' } },
    { $lookup: { from: 'supervisors', localField: '_id', foreignField: 'departmentId', as: 'supervisors' } },
    { $project: { name: 1, faculty: 1, hodAdminId: 1, studentCount: { $size: '$students' }, supervisorCount: { $size: '$supervisors' } } },
    { $sort: { createdAt: -1 } },
    { $skip: ((options.page || 1) - 1) * (options.limit || 20) },
    { $limit: options.limit || 20 },
  ]);
  const total = await Department.countDocuments(filter);
  return { docs: agg, total, page: options.page || 1, pages: Math.ceil(total / (options.limit || 20)) || 1, limit: options.limit || 20 };
};

export const createDepartment = async (institutionId, data) => {
  const objId = toObjectId(institutionId);
  console.log('createDepartment with institutionId:', institutionId, 'converted to:', objId);
  const dept = await Department.create({ 
    institutionId: objId, 
    name: data.name, 
    faculty: data.faculty, 
    isActive: true,  // explicitly set to true
    hodAdminId: data.hodAdminId ? toObjectId(data.hodAdminId) : null 
  });
  return dept;
};

export const getDepartmentById = async (id, institutionId) => {
  const objId = toObjectId(institutionId);
  const dept = await Department.findOne({ _id: id, institutionId: objId }).populate('hodAdminId', 'name email').lean();
  if (!dept) return null;
  const [studentCount, supervisorCount] = await Promise.all([
    Student.countDocuments({ departmentId: id }),
    Supervisor.countDocuments({ departmentId: id }),
  ]);
  return { ...dept, studentCount, supervisorCount };
};

export const updateDepartment = async (id, institutionId, data) => {
  const objId = toObjectId(institutionId);
  const dept = await Department.findOneAndUpdate(
    { _id: id, institutionId: objId },
    { $set: data },
    { new: true }
  );
  return dept;
};

export const deleteDepartment = async (id, institutionId) => {
  const objId = toObjectId(institutionId);
  const activeStudents = await Student.countDocuments({ departmentId: id });
  if (activeStudents > 0) throw new Error('Cannot delete department with active students');
  const dept = await Department.findOneAndUpdate({ _id: id, institutionId: objId }, { isActive: false }, { new: true });
  return dept;
};

export const listSessions = async (institutionId) => {
  const docs = await AcademicSession.find({ institutionId }).sort({ createdAt: -1 }).lean();
  return docs;
};

export const createSession = async (institutionId, data) => {
  const session = await AcademicSession.create({
    institutionId,
    name: data.name,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
  });
  return session;
};

export const updateSession = async (id, institutionId, data) => {
  const session = await AcademicSession.findOneAndUpdate(
    { _id: id, institutionId },
    { $set: { name: data.name, startDate: new Date(data.startDate), endDate: new Date(data.endDate) } },
    { new: true }
  );
  return session;
};

export const activateSession = async (id, institutionId) => {
  await AcademicSession.updateMany({ institutionId }, { isActive: false });
  const session = await AcademicSession.findOneAndUpdate({ _id: id, institutionId }, { isActive: true }, { new: true });
  return session;
};

export const lockSession = async (id, institutionId) => {
  const session = await AcademicSession.findOneAndUpdate({ _id: id, institutionId }, { isLocked: true }, { new: true });
  return session;
};

export const deleteSession = async (id, institutionId) => {
  const students = await Student.countDocuments({ sessionId: id });
  const logs = await mongoose.model('LogEntry').countDocuments({ sessionId: id });
  if (students > 0 || logs > 0) throw new Error('Cannot delete session with students or logs');
  const session = await AcademicSession.findOneAndDelete({ _id: id, institutionId });
  return session;
};

export const listAdmins = async (institutionId, options = {}) => {
  const filter = { institutionId, role: 'admin' };
  return paginateQuery(User, filter, {
    ...options,
    select: '-passwordHash -emailVerificationToken -passwordResetToken',
    populate: ['departmentId'],
  });
};

export const createAdmin = async (institutionId, data) => {
  const objId = toObjectId(institutionId);
  console.log('createAdmin with institutionId:', institutionId, 'converted to:', objId);
  
  // Fix institutionId in DefaultPassword query
  const defaultPwd = await DefaultPassword.findOne({ institutionId: objId, role: 'admin' });
  console.log('DefaultPassword found:', !!defaultPwd);
  
  const rawPassword = 'Admin@12345';
  const passwordHash = data.password ? await hashPassword(data.password) : defaultPwd?.passwordHash || await hashPassword(rawPassword);
  
  const user = await User.create({
    institutionId: objId,  // Use ObjectId
    departmentId: data.departmentId ? toObjectId(data.departmentId) : null,
    name: data.name,
    email: data.email,
    passwordHash,
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    mustChangePassword: true,
  });
  
  // Wrap email sending in try/catch
  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (emailError) {
    console.warn('Welcome email failed:', emailError.message);
  }
  
  return user;
};

export const getAdminById = async (id, institutionId) => {
  const user = await User.findOne({ _id: id, institutionId, role: 'admin' })
    .select('-passwordHash -emailVerificationToken -passwordResetToken')
    .populate('departmentId')
    .lean();
  return user;
};

export const updateAdmin = async (id, institutionId, data) => {
  const user = await User.findOneAndUpdate(
    { _id: id, institutionId, role: 'admin' },
    { $set: { name: data.name, email: data.email, departmentId: data.departmentId || null } },
    { new: true }
  ).select('-passwordHash -emailVerificationToken -passwordResetToken');
  return user;
};

export const deactivateAdmin = async (id, institutionId) => {
  const user = await User.findOneAndUpdate({ _id: id, institutionId, role: 'admin' }, { isActive: false }, { new: true });
  return user;
};

export const deleteAdmin = async (id, institutionId) => {
  const user = await User.findOneAndDelete({ _id: id, institutionId, role: 'admin' });
  return user;
};

export const listSupervisors = async (institutionId, options = {}) => {
  const filter = { institutionId };
  const docs = await Supervisor.find(filter).populate('userId', 'name email').skip(((options.page || 1) - 1) * (options.limit || 20)).limit(options.limit || 20).lean();
  const total = await Supervisor.countDocuments(filter);
  const withCounts = await Promise.all(
    docs.map(async (s) => {
      const count = await mongoose.model('Assignment').countDocuments({ supervisorId: s._id, isActive: true });
      return { ...s, assignedStudentCount: count };
    })
  );
  return { docs: withCounts, total, page: options.page || 1, pages: Math.ceil(total / (options.limit || 20)) || 1, limit: options.limit || 20 };
};

export const createSupervisor = async (institutionId, data) => {
  const defaultPwd = await DefaultPassword.findOne({ institutionId, role: 'supervisor' });
  const passwordHash = data.password ? await hashPassword(data.password) : defaultPwd?.passwordHash || await hashPassword('Supervisor@123');
  const user = await User.create({
    institutionId,
    departmentId: data.departmentId,
    name: data.name,
    email: data.email,
    passwordHash,
    role: 'supervisor',
    isActive: true,
    isEmailVerified: true,
    mustChangePassword: true,
  });
  const supervisor = await Supervisor.create({
    userId: user._id,
    institutionId,
    departmentId: data.departmentId,
    company: data.company || '',
    companyAddress: data.companyAddress || '',
  });
  await sendWelcomeEmail(user.email, user.name);
  return { user, supervisor };
};

export const getSupervisorById = async (id, institutionId) => {
  const sup = await Supervisor.findOne({ _id: id, institutionId }).populate('userId', 'name email').lean();
  return sup;
};

export const updateSupervisor = async (id, institutionId, data) => {
  const sup = await Supervisor.findOne({ _id: id, institutionId });
  if (!sup) return null;
  const user = await User.findById(sup.userId);
  if (data.name) user.name = data.name;
  if (data.email) user.email = data.email;
  if (data.departmentId) user.departmentId = data.departmentId;
  if (data.company !== undefined) sup.company = data.company;
  if (data.companyAddress !== undefined) sup.companyAddress = data.companyAddress;
  await user.save();
  await sup.save();
  return sup;
};

export const deactivateSupervisor = async (id, institutionId) => {
  const sup = await Supervisor.findOne({ _id: id, institutionId });
  if (!sup) return null;
  await User.findByIdAndUpdate(sup.userId, { isActive: false });
  return sup;
};

export const deleteSupervisor = async (id, institutionId) => {
  const sup = await Supervisor.findOne({ _id: id, institutionId });
  if (!sup) return null;
  const activeAssignments = await mongoose.model('Assignment').countDocuments({ supervisorId: id, isActive: true });
  if (activeAssignments > 0) throw new Error('Cannot delete supervisor with active assignments');
  await User.findByIdAndDelete(sup.userId);
  await Supervisor.findByIdAndDelete(id);
  return sup;
};

export const listStudents = async (institutionId, options = {}) => {
  const filter = { institutionId };
  if (options.departmentId) filter.departmentId = options.departmentId;
  if (options.sessionId) filter.sessionId = options.sessionId;
  return paginateQuery(Student, filter, { ...options, populate: ['userId', 'departmentId', 'sessionId'] });
};

export const createStudent = async (institutionId, data) => {
  const defaultPwd = await DefaultPassword.findOne({ institutionId, role: 'student' });
  const passwordHash = data.password ? await hashPassword(data.password) : defaultPwd?.passwordHash || await hashPassword('Student@123');
  const user = await User.create({
    institutionId,
    departmentId: data.departmentId,
    name: data.name,
    email: data.email,
    passwordHash,
    role: 'student',
    isActive: true,
    isEmailVerified: true,
    mustChangePassword: true,
  });
  const student = await Student.create({
    userId: user._id,
    institutionId,
    departmentId: data.departmentId,
    matricNumber: data.matricNumber,
    company: data.company || '',
    companyAddress: data.companyAddress || '',
    companyState: data.companyState || '',
    companyCity: data.companyCity || '',
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    sessionId: data.sessionId,
  });
  await sendWelcomeEmail(user.email, user.name);
  return { user, student };
};

export const getStudentById = async (id, institutionId) => {
  const student = await Student.findOne({ _id: id, institutionId }).populate('userId', 'name email').populate('departmentId').populate('sessionId').lean();
  return student;
};

export const updateStudent = async (id, institutionId, data) => {
  const student = await Student.findOne({ _id: id, institutionId });
  if (!student) return null;
  const user = await User.findById(student.userId);
  if (data.name) user.name = data.name;
  if (data.email) user.email = data.email;
  if (data.departmentId) user.departmentId = data.departmentId;
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

export const deactivateStudent = async (id, institutionId) => {
  const student = await Student.findOne({ _id: id, institutionId });
  if (!student) return null;
  await User.findByIdAndUpdate(student.userId, { isActive: false });
  return student;
};

export const deleteStudent = async (id, institutionId) => {
  const student = await Student.findOne({ _id: id, institutionId });
  if (!student) return null;
  const logCount = await mongoose.model('LogEntry').countDocuments({ studentId: id });
  if (logCount > 0) throw new Error('Cannot delete student with logs');
  await User.findByIdAndDelete(student.userId);
  await Student.findByIdAndDelete(id);
  return student;
};

export const listUsers = async (institutionId, options = {}) => {
  const filter = { institutionId };
  if (options.role) filter.role = options.role;
  return paginateQuery(User, filter, {
    ...options,
    select: '-passwordHash -emailVerificationToken -passwordResetToken',
    populate: ['departmentId'],
  });
};

export const updateUserRole = async (userId, institutionId, role) => {
  const user = await User.findOneAndUpdate({ _id: userId, institutionId }, { role }, { new: true });
  return user;
};

export const deleteUser = async (userId, institutionId) => {
  const user = await User.findOne({ _id: userId, institutionId });
  if (!user) return null;
  if (user.role === 'student') {
    const logCount = await mongoose.model('LogEntry').countDocuments({ studentId: await Student.findOne({ userId: user._id }).select('_id') });
    if (logCount > 0) throw new Error('Cannot delete user with logs');
  }
  await User.findByIdAndDelete(userId);
  return user;
};

export const getSystemConfig = async (institutionId) => {
  let config = await SystemConfig.findOne({ institutionId }).lean();
  if (!config) config = await SystemConfig.create({ institutionId });
  return config;
};

export const updateSystemConfig = async (institutionId, data) => {
  const config = await SystemConfig.findOneAndUpdate({ institutionId }, { $set: data }, { new: true });
  return config;
};

export const getDefaultPasswords = async (institutionId) => {
  const docs = await DefaultPassword.find({ institutionId }).select('role updatedAt').lean();
  return docs;
};

export const updateDefaultPassword = async (institutionId, role, passwordHash) => {
  const objId = toObjectId(institutionId);
  const doc = await DefaultPassword.findOneAndUpdate(
    { institutionId: objId, role },
    { $set: { passwordHash } },
    { new: true, upsert: true }
  );
  return doc;
};

export const listNotificationTemplates = async (institutionId) => {
  const docs = await NotificationTemplate.find({ institutionId }).lean();
  return docs;
};

export const updateNotificationTemplate = async (id, institutionId, data) => {
  const template = await NotificationTemplate.findOneAndUpdate(
    { _id: id, institutionId },
    { $set: data },
    { new: true }
  );
  return template;
};

export const broadcastNotification = async (institutionId, data) => {
  const filter = { institutionId, isActive: true };
  if (data.role) filter.role = data.role;
  const users = await User.find(filter).select('_id').lean();
  const queue = getEmailQueue();
  for (const u of users) {
    await Notification.create({
      userId: u._id,
      institutionId,
      type: 'broadcast',
      title: data.title,
      body: data.body,
    });
  }
  return { count: users.length };
};

export const listAuditLogs = async (institutionId, options = {}) => {
  const filter = { institutionId };
  if (options.actorUserId) filter.actorUserId = options.actorUserId;
  if (options.action) filter.action = options.action;
  if (options.dateFrom) filter.occurredAt = { ...filter.occurredAt, $gte: new Date(options.dateFrom) };
  if (options.dateTo) filter.occurredAt = { ...filter.occurredAt, $lte: new Date(options.dateTo) };
  return paginateQuery(AuditLog, filter, { ...options, sort: { occurredAt: -1 }, populate: ['actorUserId'] });
};

export const triggerBackup = async (institutionId, requestedById) => {
  const job = await BulkImportJob.create({
    institutionId,
    initiatedById: requestedById,
    importType: 'admin',
    status: 'pending',
    totalRows: 0,
  });
  return job;
};

export const streamExport = async (institutionId) => {
  const [institution, departments, sessions, users, students, supervisors] = await Promise.all([
    Institution.findById(institutionId).lean(),
    Department.find({ institutionId }).lean(),
    AcademicSession.find({ institutionId }).lean(),
    User.find({ institutionId }).select('-passwordHash -emailVerificationToken -passwordResetToken').lean(),
    Student.find({ institutionId }).populate('userId', 'name email').lean(),
    Supervisor.find({ institutionId }).populate('userId', 'name email').lean(),
  ]);
  return { institution, departments, sessions, users, students, supervisors };
};
