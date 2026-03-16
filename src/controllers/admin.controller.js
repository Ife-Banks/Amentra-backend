import * as adminService from '../services/admin.service.js';
import * as reportService from '../services/report.service.js';
import * as bulkImportService from '../services/bulkImport.service.js';
import LogEntry from '../models/LogEntry.js';
import Student from '../models/Student.js';
import Department from '../models/Department.js';
import { parseCSVBuffer } from '../utils/csvParser.js';
import { success, error } from '../utils/apiResponse.js';

export const getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboard(req.user.departmentId, req.institutionId);
    return success(res, data, 'Dashboard', 200);
  } catch (e) {
    next(e);
  }
};

export const listSupervisors = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.listSupervisors(req.user.departmentId, req.institutionId, { page, limit });
    return success(res, result.docs, 'Supervisors', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const createSupervisor = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const { supervisor } = await adminService.createSupervisor(req.user.departmentId, req.institutionId, data);
    return success(res, supervisor, 'Supervisor created', 201);
  } catch (e) {
    next(e);
  }
};

export const getSupervisor = async (req, res, next) => {
  try {
    const sup = await adminService.getSupervisorById(req.params.id, req.user.departmentId, req.institutionId);
    if (!sup) return error(res, 'Supervisor not found', 404);
    return success(res, sup, 'Supervisor', 200);
  } catch (e) {
    next(e);
  }
};

export const updateSupervisor = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const sup = await adminService.updateSupervisor(req.params.id, req.user.departmentId, req.institutionId, data);
    if (!sup) return error(res, 'Supervisor not found', 404);
    return success(res, sup, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const deactivateSupervisor = async (req, res, next) => {
  try {
    await adminService.deactivateSupervisor(req.params.id, req.user.departmentId, req.institutionId);
    return success(res, null, 'Supervisor deactivated', 200);
  } catch (e) {
    next(e);
  }
};

export const deleteSupervisor = async (req, res, next) => {
  try {
    await adminService.deleteSupervisor(req.params.id, req.user.departmentId, req.institutionId);
    return success(res, null, 'Supervisor deleted', 200);
  } catch (e) {
    if (e.message?.includes('assignments')) return error(res, e.message, 400);
    next(e);
  }
};

export const createSupervisorsBulkImport = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return error(res, 'CSV file required', 400);
    const rows = await parseCSVBuffer(file.buffer);
    const job = await bulkImportService.createBulkImportJob(req.institutionId, req.user.userId, 'supervisor', rows, req.user.departmentId);
    return success(res, { jobId: job._id }, 'Bulk import queued', 202);
  } catch (e) {
    next(e);
  }
};

export const listStudents = async (req, res, next) => {
  try {
    const { page, limit, sessionId, supervisorId } = req.query;
    const result = await adminService.listStudents(req.user.departmentId, req.institutionId, { sessionId, supervisorId }, { page, limit });
    return success(res, result.docs, 'Students', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const { student } = await adminService.createStudent(req.user.departmentId, req.institutionId, data);
    return success(res, student, 'Student created', 201);
  } catch (e) {
    next(e);
  }
};

export const getStudent = async (req, res, next) => {
  try {
    const student = await adminService.getStudentById(req.params.id, req.user.departmentId, req.institutionId);
    if (!student) return error(res, 'Student not found', 404);
    return success(res, student, 'Student', 200);
  } catch (e) {
    next(e);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const student = await adminService.updateStudent(req.params.id, req.user.departmentId, req.institutionId, data);
    if (!student) return error(res, 'Student not found', 404);
    return success(res, student, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const deactivateStudent = async (req, res, next) => {
  try {
    await adminService.deactivateStudent(req.params.id, req.user.departmentId, req.institutionId);
    return success(res, null, 'Student deactivated', 200);
  } catch (e) {
    next(e);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    await adminService.deleteStudent(req.params.id, req.user.departmentId, req.institutionId);
    return success(res, null, 'Student deleted', 200);
  } catch (e) {
    if (e.message?.includes('logs')) return error(res, e.message, 400);
    next(e);
  }
};

export const createStudentsBulkImport = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return error(res, 'CSV file required', 400);
    const rows = await parseCSVBuffer(file.buffer);
    const job = await bulkImportService.createBulkImportJob(req.institutionId, req.user.userId, 'student', rows, req.user.departmentId);
    return success(res, { jobId: job._id }, 'Bulk import queued', 202);
  } catch (e) {
    next(e);
  }
};

export const searchStudents = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const docs = await adminService.searchStudents(req.user.departmentId, req.institutionId, q);
    return success(res, docs, 'Search results', 200);
  } catch (e) {
    next(e);
  }
};

export const createAssignment = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const assignment = await adminService.createAssignment(req.user.departmentId, req.institutionId, req.user.userId, data);
    return success(res, assignment, 'Assignment created', 201);
  } catch (e) {
    next(e);
  }
};

export const listAssignments = async (req, res, next) => {
  try {
    const docs = await adminService.listAssignments(req.user.departmentId, req.institutionId);
    return success(res, docs, 'Assignments', 200);
  } catch (e) {
    next(e);
  }
};

export const reassign = async (req, res, next) => {
  try {
    const { newSupervisorId } = req.validated || req.body;
    const assignment = await adminService.reassign(req.params.id, req.user.departmentId, req.institutionId, newSupervisorId);
    if (!assignment) return error(res, 'Assignment not found', 404);
    return success(res, assignment, 'Reassigned', 200);
  } catch (e) {
    next(e);
  }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    await adminService.unassign(req.params.id, req.user.departmentId, req.institutionId);
    return success(res, null, 'Unassigned', 200);
  } catch (e) {
    next(e);
  }
};

export const listLogs = async (req, res, next) => {
  try {
    const { page, limit, studentId, status, dateFrom, dateTo } = req.query;
    const result = await adminService.listLogs(
      req.user.departmentId,
      req.institutionId,
      { studentId, status, dateFrom, dateTo },
      { page, limit }
    );
    return success(res, result.docs, 'Logs', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const getLog = async (req, res, next) => {
  try {
    const log = await adminService.getLogById(req.params.id, req.user.departmentId, req.institutionId);
    if (!log) return error(res, 'Log not found', 404);
    return success(res, log, 'Log', 200);
  } catch (e) {
    next(e);
  }
};

export const listPendingLogs = async (req, res, next) => {
  try {
    const docs = await adminService.listPendingLogs(req.user.departmentId, req.institutionId);
    return success(res, docs, 'Pending logs', 200);
  } catch (e) {
    next(e);
  }
};

export const listEvaluations = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.listEvaluations(req.user.departmentId, req.institutionId, { page, limit });
    return success(res, result.docs, 'Evaluations', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const getEvaluation = async (req, res, next) => {
  try {
    const evalDoc = await adminService.getEvaluationById(req.params.id, req.user.departmentId, req.institutionId);
    if (!evalDoc) return error(res, 'Evaluation not found', 404);
    return success(res, evalDoc, 'Evaluation', 200);
  } catch (e) {
    next(e);
  }
};

export const listSiteVisits = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.listSiteVisits(req.user.departmentId, req.institutionId, { page, limit });
    return success(res, result.docs, 'Site visits', 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (e) {
    next(e);
  }
};

export const createSiteVisit = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const visit = await adminService.createSiteVisit(req.user.userId, req.user.departmentId, req.institutionId, data);
    return success(res, visit, 'Site visit created', 201);
  } catch (e) {
    next(e);
  }
};

export const getSiteVisit = async (req, res, next) => {
  try {
    const visit = await adminService.getSiteVisitById(req.params.id, req.user.departmentId, req.institutionId);
    if (!visit) return error(res, 'Site visit not found', 404);
    return success(res, visit, 'Site visit', 200);
  } catch (e) {
    next(e);
  }
};

export const updateSiteVisit = async (req, res, next) => {
  try {
    const data = req.validated || req.body;
    const visit = await adminService.updateSiteVisit(req.params.id, req.user.departmentId, req.institutionId, data);
    if (!visit) return error(res, 'Site visit not found', 404);
    return success(res, visit, 'Updated', 200);
  } catch (e) {
    next(e);
  }
};

export const deleteSiteVisit = async (req, res, next) => {
  try {
    await adminService.deleteSiteVisit(req.params.id, req.user.departmentId, req.institutionId);
    return success(res, null, 'Site visit deleted', 200);
  } catch (e) {
    next(e);
  }
};

export const addSiteVisitMedia = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return error(res, 'No files uploaded', 400);
    const visit = await adminService.addSiteVisitMedia(req.params.id, req.user.departmentId, req.institutionId, files);
    if (!visit) return error(res, 'Site visit not found', 404);
    return success(res, visit, 'Media added', 200);
  } catch (e) {
    next(e);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getAnalytics(req.user.departmentId, req.institutionId);
    return success(res, data, 'Analytics', 200);
  } catch (e) {
    next(e);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const templates = adminService.getReportTemplates();
    return success(res, templates, 'Report templates', 200);
  } catch (e) {
    next(e);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const { type, dateFrom, dateTo, format } = req.validated || req.body;
    const job = await adminService.createReportJob(req.institutionId, req.user.userId, type, format, dateFrom, dateTo, req.user.departmentId);
    return success(res, { jobId: job._id }, 'Report job queued', 202);
  } catch (e) {
    next(e);
  }
};

export const getReportJobStatus = async (req, res, next) => {
  try {
    const job = await reportService.getReportJobStatus(req.params.jobId, req.user.userId, req.institutionId);
    if (!job) return error(res, 'Job not found', 404);
    return success(res, job, 'Job status', 200);
  } catch (e) {
    next(e);
  }
};

export const downloadReport = async (req, res, next) => {
  try {
    const job = await reportService.getReportJobStatus(req.params.jobId, req.user.userId, req.institutionId);
    if (!job) return error(res, 'Job not found', 404);
    if (job.status !== 'completed' || !job.fileUrl) return error(res, 'Report not ready', 404);
    return res.redirect(job.fileUrl);
  } catch (e) {
    next(e);
  }
};

export const getSubmissionTrends = async (req, res, next) => {
  try {
    const institutionId = req.institutionId;
    const departmentId = req.user?.departmentId;

    // Get last 8 weeks of log submissions
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const filter = {
        institutionId,
        createdAt: { $gte: weekStart, $lt: weekEnd }
      };
      
      if (departmentId) {
        // Get students in this department
        const students = await Student.find({ 
          institutionId, 
          departmentId 
        }).select('_id');
        const studentIds = students.map(s => s._id);
        filter.studentId = { $in: studentIds };
      }

      const [submitted, approved] = await Promise.all([
        LogEntry.countDocuments(filter),
        LogEntry.countDocuments({ ...filter, status: 'approved' })
      ]);

      weeks.push({
        week: `Week ${8 - i}`,
        weekStart: weekStart.toISOString(),
        submitted,
        approved
      });
    }

    return success(res, weeks, 'Submission trends', 200);
  } catch (e) {
    next(e);
  }
};

export const getCompanyDistribution = async (req, res, next) => {
  try {
    const institutionId = req.institutionId;
    const departmentId = req.user?.departmentId;

    const filter = { institutionId };
    if (departmentId) filter.departmentId = departmentId;

    // Group students by company
    const distribution = await Student.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: '$company', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          company: { $ifNull: ['$_id', 'Unknown'] },
          count: 1,
          _id: 0
        }
      }
    ]);

    return success(res, distribution, 'Company distribution', 200);
  } catch (e) {
    next(e);
  }
};
