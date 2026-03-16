import * as superAdminService from '../services/superAdmin.service.js';
import * as bulkImportService from '../services/bulkImport.service.js';
import { parseCSVBuffer } from '../utils/csvParser.js';
import { success, error } from '../utils/apiResponse.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import DefaultPassword from '../models/DefaultPassword.js';
import { hashPassword } from '../utils/password.js';
import { sendWelcomeEmail } from '../services/email.service.js';

// Helper to convert string ID to ObjectId
const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  return null;
};

export const getDashboard = async (req, res, next) => {
  try {
    const data = await superAdminService.getDashboard(req.institutionId);
    return success(res, data, 'Dashboard', 200);
  } catch (e) {
    next(e);
  }
};

export const listDepartments = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await superAdminService.listDepartments(req.institutionId, { page, limit });
    return success(res, result.docs, 'Departments', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const dept = await superAdminService.createDepartment(req.institutionId, data);
    return success(res, dept, 'Department created', 201);
  } catch (e) {
    next(e);
  }
};

export const getDepartment = async (req, res, next) => {
  try {
    const dept = await superAdminService.getDepartmentById(req.params.id, req.institutionId);
    if (!dept) return error(res, 'Department not found', 404);
    return success(res, dept, 'Department', 200);
  } catch (e) {
    next(e);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const dept = await superAdminService.updateDepartment(req.params.id, req.institutionId, data);
    if (!dept) return error(res, 'Department not found', 404);
    return success(res, dept, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    await superAdminService.deleteDepartment(req.params.id, req.institutionId);
    return success(res, null, 'Department deactivated', 200);
  } catch (e) {
    if (e.message?.includes('active students')) return error(res, e.message, 400);
    next(e);
  }
};

export const listSessions = async (req, res, next) => {
  try {
    const docs = await superAdminService.listSessions(req.institutionId);
    return success(res, docs, 'Sessions', 200);
  } catch (e) {
    next(e);
  }
};

export const createSession = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const session = await superAdminService.createSession(req.institutionId, data);
    return success(res, session, 'Session created', 201);
  } catch (e) {
    next(e);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const session = await superAdminService.updateSession(req.params.id, req.institutionId, data);
    if (!session) return error(res, 'Session not found', 404);
    return success(res, session, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const activateSession = async (req, res, next) => {
  try {
    const session = await superAdminService.activateSession(req.params.id, req.institutionId);
    if (!session) return error(res, 'Session not found', 404);
    return success(res, session, 'Session activated', 200);
  } catch (e) {
    next(e);
  }
};

export const lockSession = async (req, res, next) => {
  try {
    const session = await superAdminService.lockSession(req.params.id, req.institutionId);
    if (!session) return error(res, 'Session not found', 404);
    return success(res, session, 'Session locked', 200);
  } catch (e) {
    next(e);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    await superAdminService.deleteSession(req.params.id, req.institutionId);
    return success(res, null, 'Session deleted', 200);
  } catch (e) {
    if (e.message?.includes('students or logs')) return error(res, e.message, 400);
    next(e);
  }
};

export const createAdminsBulkImport = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return error(res, 'CSV file required', 400);
    const rows = await parseCSVBuffer(file.buffer);
    const job = await bulkImportService.createBulkImportJob(req.institutionId, req.user.userId, 'admin', rows);
    return success(res, { jobId: job._id }, 'Bulk import queued', 202);
  } catch (e) {
    next(e);
  }
};

export const createSupervisorsBulkImport = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return error(res, 'CSV file required', 400);
    const rows = await parseCSVBuffer(file.buffer);
    const job = await bulkImportService.createBulkImportJob(req.institutionId, req.user.userId, 'supervisor', rows);
    return success(res, { jobId: job._id }, 'Bulk import queued', 202);
  } catch (e) {
    next(e);
  }
};

export const createStudentsBulkImport = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return error(res, 'CSV file required', 400);
    const rows = await parseCSVBuffer(file.buffer);
    const job = await bulkImportService.createBulkImportJob(req.institutionId, req.user.userId, 'student', rows);
    return success(res, { jobId: job._id }, 'Bulk import queued', 202);
  } catch (e) {
    next(e);
  }
};

export const listAdmins = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await superAdminService.listAdmins(req.institutionId, { page, limit });
    return success(res, result.docs, 'Admins', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const createAdmin = async (req, res, next) => {
  try {
    // Debug logs for troubleshooting
    console.log('User role from JWT:', req.user?.role);
    console.log('Required role: super_admin');
    console.log('institutionId from req.user:', req.user?.institutionId);
    console.log('institutionId from req:', req.institutionId);
    
    const { name, email, staffId, departmentId } = req.body;
    const institutionId = req.user?.institutionId || req.institutionId;
    
    console.log('Create admin payload:', { name, email, staffId, departmentId });
    
    // Generate default password: AMENTRA@<staffId>
    const defaultPassword = `AMENTRA@${staffId}`;
    console.log('Hashing password for staffId:', staffId);
    console.log('Plain password being hashed:', defaultPassword);
    
    // Always hash the AMENTRA@staffId format - don't use DefaultPassword hash
    const passwordHash = await hashPassword(defaultPassword);
    console.log('Generated password hash for AMENTRA@staffId format');
    
    // Check if staffId already exists in this institution
    const existingStaffId = await User.findOne({ 
      institutionId: toObjectId(institutionId), 
      staffId 
    });
    if (existingStaffId) {
      return res.status(409).json({ 
        success: false, 
        message: 'Staff ID already exists in this institution' 
      });
    }
    
    // Check if email already exists in this institution
    const existingEmail = await User.findOne({ 
      institutionId: toObjectId(institutionId), 
      email: email.toLowerCase().trim() 
    });
    if (existingEmail) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already exists in this institution' 
      });
    }
    
    const user = await User.create({
      institutionId: toObjectId(institutionId),
      name,
      email: email.toLowerCase().trim(),
      staffId,
      passwordHash,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      mustChangePassword: false, // Will be handled by first login flow
      isFirstLogin: true,
      departmentId: departmentId ? toObjectId(departmentId) : null,
    });
    
    console.log('User created with passwordHash:', !!passwordHash);
    console.log('User staffId after creation:', user.staffId);
    
    // Send welcome email - non-blocking
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailErr) {
      console.warn('Welcome email failed:', emailErr.message);
    }
    
    // Return user with default password for admin to share
    return success(res, {
      ...user.toJSON(),
      defaultPassword // Include plain password for admin communication
    }, 'Admin created', 201);
  } catch (e) {
    console.error('createAdmin error:', e);
    next(e);
  }
};

export const getAdmin = async (req, res, next) => {
  try {
    const user = await superAdminService.getAdminById(req.params.id, req.institutionId);
    if (!user) return error(res, 'Admin not found', 404);
    return success(res, user, 'Admin', 200);
  } catch (e) {
    next(e);
  }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const user = await superAdminService.updateAdmin(req.params.id, req.institutionId, data);
    if (!user) return error(res, 'Admin not found', 404);
    return success(res, user, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const deactivateAdmin = async (req, res, next) => {
  try {
    await superAdminService.deactivateAdmin(req.params.id, req.institutionId);
    return success(res, null, 'Admin deactivated', 200);
  } catch (e) {
    next(e);
  }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    await superAdminService.deleteAdmin(req.params.id, req.institutionId);
    return success(res, null, 'Admin deleted', 200);
  } catch (e) {
    next(e);
  }
};

export const listSupervisors = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await superAdminService.listSupervisors(req.institutionId, { page, limit });
    return success(res, result.docs, 'Supervisors', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const createSupervisor = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const { supervisor } = await superAdminService.createSupervisor(req.institutionId, data);
    return success(res, supervisor, 'Supervisor created', 201);
  } catch (e) {
    next(e);
  }
};

export const getSupervisor = async (req, res, next) => {
  try {
    const sup = await superAdminService.getSupervisorById(req.params.id, req.institutionId);
    if (!sup) return error(res, 'Supervisor not found', 404);
    return success(res, sup, 'Supervisor', 200);
  } catch (e) {
    next(e);
  }
};

export const updateSupervisor = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const sup = await superAdminService.updateSupervisor(req.params.id, req.institutionId, data);
    if (!sup) return error(res, 'Supervisor not found', 404);
    return success(res, sup, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const deactivateSupervisor = async (req, res, next) => {
  try {
    await superAdminService.deactivateSupervisor(req.params.id, req.institutionId);
    return success(res, null, 'Supervisor deactivated', 200);
  } catch (e) {
    next(e);
  }
};

export const listStudents = async (req, res, next) => {
  try {
    const { page, limit, departmentId, sessionId } = req.query;
    const result = await superAdminService.listStudents(req.institutionId, { page, limit, departmentId, sessionId });
    return success(res, result.docs, 'Students', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const { student } = await superAdminService.createStudent(req.institutionId, data);
    return success(res, student, 'Student created', 201);
  } catch (e) {
    next(e);
  }
};

export const getStudent = async (req, res, next) => {
  try {
    const student = await superAdminService.getStudentById(req.params.id, req.institutionId);
    if (!student) return error(res, 'Student not found', 404);
    return success(res, student, 'Student', 200);
  } catch (e) {
    next(e);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const student = await superAdminService.updateStudent(req.params.id, req.institutionId, data);
    if (!student) return error(res, 'Student not found', 404);
    return success(res, student, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const deactivateStudent = async (req, res, next) => {
  try {
    await superAdminService.deactivateStudent(req.params.id, req.institutionId);
    return success(res, null, 'Student deactivated', 200);
  } catch (e) {
    next(e);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const { page, limit, role } = req.query;
    const result = await superAdminService.listUsers(req.institutionId, { page, limit, role });
    return success(res, result.docs, 'Users', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.validated || req.body;
    const user = await superAdminService.updateUserRole(req.params.id, req.institutionId, role);
    if (!user) return error(res, 'User not found', 404);
    return success(res, user, 'Role updated', 200);
  } catch (e) {
    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await superAdminService.deleteUser(req.params.id, req.institutionId);
    return success(res, null, 'User deleted', 200);
  } catch (e) {
    if (e.message?.includes('logs')) return error(res, e.message, 400);
    next(e);
  }
};

export const getConfig = async (req, res, next) => {
  try {
    const config = await superAdminService.getSystemConfig(req.institutionId);
    return success(res, config, 'Config', 200);
  } catch (e) {
    next(e);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const config = await superAdminService.updateSystemConfig(req.institutionId, data);
    return success(res, config, 'Config updated', 200);
  } catch (e) {
    next(e);
  }
};

export const getDefaultPasswords = async (req, res, next) => {
  try {
    const docs = await superAdminService.getDefaultPasswords(req.institutionId);
    return success(res, docs, 'Default passwords', 200);
  } catch (e) {
    next(e);
  }
};

export const updateDefaultPassword = async (req, res, next) => {
  console.log('updateDefaultPassword called');
  console.log('role param:', req.params.role);
  console.log('body:', req.body);
  console.log('user institutionId:', req.user?.institutionId);
  
  try {
    const { role } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password is required' 
      });
    }
    
    const { hashPassword } = await import('../utils/password.js');
    const passwordHash = await hashPassword(password);
    
    const updated = await superAdminService.updateDefaultPassword(
      req.user?.institutionId || req.institutionId, 
      role.toLowerCase(), 
      passwordHash
    );
    
    console.log('Updated:', updated);
    
    return success(res, updated, `${role} default password updated`, 200);
  } catch (e) {
    console.error('updateDefaultPassword error:', e);
    next(e);
  }
};

export const listNotificationTemplates = async (req, res, next) => {
  try {
    const docs = await superAdminService.listNotificationTemplates(req.institutionId);
    return success(res, docs, 'Templates', 200);
  } catch (e) {
    next(e);
  }
};

export const updateNotificationTemplate = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const template = await superAdminService.updateNotificationTemplate(req.params.id, req.institutionId, data);
    if (!template) return error(res, 'Template not found', 404);
    return success(res, template, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const broadcast = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const result = await superAdminService.broadcastNotification(req.institutionId, data);
    return success(res, result, 'Broadcast sent', 200);
  } catch (e) {
    next(e);
  }
};

export const listAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, actorUserId, action, dateFrom, dateTo } = req.query;
    const result = await superAdminService.listAuditLogs(req.institutionId, { page, limit, actorUserId, action, dateFrom, dateTo });
    return success(res, result.docs, 'Audit logs', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const triggerBackup = async (req, res, next) => {
  try {
    const job = await superAdminService.triggerBackup(req.institutionId, req.user.userId);
    return success(res, { jobId: job._id }, 'Backup job queued', 202);
  } catch (e) {
    next(e);
  }
};

export const streamExport = async (req, res, next) => {
  try {
    const data = await superAdminService.streamExport(req.institutionId);
    return success(res, data, 'Export', 200);
  } catch (e) {
    next(e);
  }
};
