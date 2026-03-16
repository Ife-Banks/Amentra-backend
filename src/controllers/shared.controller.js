import mongoose from 'mongoose';
import getRedisClient from '../config/redis.js';
import * as reportService from '../services/report.service.js';
import { success, error } from '../utils/apiResponse.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

export const health = async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  return res.status(200).json({
    success: true,
    status: 'ok',
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
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

export const globalSearch = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    const { institutionId, role } = req.user;
    
    if (!q || q.length < 2) {
      return res.status(200).json({ 
        success: true, 
        data: { users: [], departments: [] } 
      });
    }

    const searchRegex = new RegExp(q, 'i');
    const results = {};

    // Search users (name or email)
    if (!type || type === 'users') {
      const users = await User.find({
        institutionId,
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).limit(10).select('name email role');
      results.users = users;
    }

    // Search departments (super_admin and admin only)
    if ((!type || type === 'departments') && 
        ['super_admin', 'admin'].includes(role)) {
      const departments = await Department.find({
        institutionId,
        name: searchRegex,
        isActive: true
      }).limit(5);
      results.departments = departments;
    }

    return res.status(200).json({ 
      success: true, 
      data: results 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
