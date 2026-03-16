import * as bulkImportService from '../services/bulkImport.service.js';
import { success, error } from '../utils/apiResponse.js';

export const validateCsv = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return error(res, 'CSV file required', 400);
    const importType = req.body.importType || req.query.importType || 'student';
    if (!['admin', 'supervisor', 'student'].includes(importType)) return error(res, 'Invalid importType', 400);
    const result = await bulkImportService.validateCsv(file.buffer, importType, req.institutionId);
    return success(res, result, 'Validation complete', 200);
  } catch (e) {
    next(e);
  }
};

export const getJobStatus = async (req, res, next) => {
  try {
    const job = await bulkImportService.getJobStatus(req.params.jobId, req.institutionId);
    if (!job) return error(res, 'Job not found', 404);
    return success(res, job, 'Job status', 200);
  } catch (e) {
    next(e);
  }
};

export const getJobErrors = async (req, res, next) => {
  try {
    const job = await bulkImportService.getJobStatus(req.params.jobId, req.institutionId);
    if (!job) return error(res, 'Job not found', 404);
    if (!job.errorFileUrl) return error(res, 'No error file available', 404);
    return res.redirect(job.errorFileUrl);
  } catch (e) {
    next(e);
  }
};
