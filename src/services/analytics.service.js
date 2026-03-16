import mongoose from 'mongoose';
import LogEntry from '../models/LogEntry.js';
import Evaluation from '../models/Evaluation.js';
import Student from '../models/Student.js';

export const getAdminDashboardStats = async (departmentId, institutionId, sessionId) => {
  const sessionFilter = sessionId ? { sessionId } : {};
  const studentFilter = { institutionId, departmentId, ...sessionFilter };
  const [supervisorCount, studentCount, logCount, pendingLogs, siteVisitCount] = await Promise.all([
    mongoose.model('Supervisor').countDocuments({ institutionId, departmentId }),
    Student.countDocuments(studentFilter),
    LogEntry.countDocuments({ institutionId, ...sessionFilter }),
    LogEntry.countDocuments({ institutionId, status: 'submitted', ...sessionFilter }),
    mongoose.model('SiteVisit').countDocuments({ institutionId, departmentId }),
  ]);
  const approved = await LogEntry.countDocuments({ institutionId, status: 'approved', ...sessionFilter });
  const approvalRate = logCount ? Math.round((approved / logCount) * 100) : 0;
  return {
    totalSupervisors: supervisorCount,
    totalStudents: studentCount,
    totalLogs: logCount,
    approvalRate,
    pendingLogsCount: pendingLogs,
    siteVisitsCount: siteVisitCount,
  };
};

export const getSupervisorDashboardStats = async (supervisorId, institutionId) => {
  const Assignment = mongoose.model('Assignment');
  const assigned = await Assignment.find({ supervisorId, isActive: true }).distinct('studentId');
  const [assignedCount, pendingLogs, approvedThisWeek] = await Promise.all([
    Promise.resolve(assigned.length),
    LogEntry.countDocuments({ studentId: { $in: assigned }, institutionId, status: 'submitted' }),
    LogEntry.countDocuments({
      studentId: { $in: assigned },
      institutionId,
      status: 'approved',
      submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const noRecentCount = await LogEntry.aggregate([
    { $match: { studentId: { $in: assigned }, institutionId } },
    { $group: { _id: '$studentId', lastDate: { $max: '$submittedAt' } } },
    { $match: { lastDate: { $lt: weekAgo } } },
    { $count: 'count' },
  ]);
  return {
    totalAssignedStudents: assignedCount,
    logsPendingReview: pendingLogs,
    logsApprovedThisWeek: approvedThisWeek,
    studentsWithoutRecentSubmission: (noRecentCount[0] && noRecentCount[0].count) || 0,
  };
};

export const getStudentDashboardStats = async (studentId, institutionId) => {
  const [submitted, pending, approved, rejected, supervisorAssignment] = await Promise.all([
    LogEntry.countDocuments({ studentId, institutionId, status: 'submitted' }),
    LogEntry.countDocuments({ studentId, institutionId, status: 'submitted' }),
    LogEntry.countDocuments({ studentId, institutionId, status: 'approved' }),
    LogEntry.countDocuments({ studentId, institutionId, status: 'rejected' }),
    mongoose.model('Assignment').findOne({ studentId, isActive: true }).populate('supervisorId').populate('supervisorId.userId', 'name'),
  ]);
  const student = await Student.findById(studentId).lean();
  const totalRequired = 60;
  const completionPercentage = totalRequired ? Math.min(100, Math.round((approved / totalRequired) * 100)) : 0;
  return {
    submitted,
    pending,
    approved,
    rejected,
    assignedSupervisorName: supervisorAssignment?.supervisorId?.userId?.name || null,
    siwesEndDate: student?.endDate || null,
    completionPercentage,
  };
};

export const getSuperAdminDashboardStats = async (institutionId) => {
  const [deptCount, userCount, sessionCount, logCount] = await Promise.all([
    mongoose.model('Department').countDocuments({ institutionId, isActive: true }),
    mongoose.model('User').countDocuments({ institutionId, isActive: true }),
    mongoose.model('AcademicSession').findOne({ institutionId, isActive: true }).select('name').lean(),
    LogEntry.countDocuments({ institutionId }),
  ]);
  return {
    totalDepartments: deptCount,
    totalUsers: userCount,
    activeSessionName: sessionCount?.name || null,
    totalLogsThisSession: logCount,
  };
};
