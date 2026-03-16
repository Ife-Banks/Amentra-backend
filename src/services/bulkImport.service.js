import BulkImportJob from '../models/BulkImportJob.js';
import { parseCSVBuffer } from '../utils/csvParser.js';
import { getBulkImportQueue } from '../queues/bulkImport.queue.js';

export const validateCsv = async (buffer, importType, institutionId) => {
  const rows = await parseCSVBuffer(buffer);
  const required = {
    admin: ['name', 'email', 'departmentId'],
    supervisor: ['name', 'email', 'departmentId', 'company'],
    student: ['name', 'email', 'matricNumber', 'departmentId', 'company', 'sessionId'],
  };
  const requiredCols = required[importType] || [];
  const errors = [];
  const seenEmails = new Set();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (const col of requiredCols) {
      if (!row[col] || String(row[col]).trim() === '') {
        errors.push({ row: i + 2, field: col, message: 'Required' });
      }
    }
    if (row.email) {
      if (seenEmails.has(row.email.trim().toLowerCase())) {
        errors.push({ row: i + 2, field: 'email', message: 'Duplicate in CSV' });
      }
      seenEmails.add(row.email.trim().toLowerCase());
    }
  }
  const preview = rows.slice(0, 10);
  return { preview, errors, totalRows: rows.length };
};

export const createBulkImportJob = async (institutionId, initiatedById, importType, csvRows, departmentId = null) => {
  const job = await BulkImportJob.create({
    institutionId,
    initiatedById,
    importType,
    status: 'pending',
    totalRows: csvRows.length,
  });
  const queue = getBulkImportQueue();
  await queue.add(
    {
      jobId: job._id.toString(),
      importType,
      csvRows,
      institutionId: institutionId.toString(),
      initiatedById: initiatedById.toString(),
      departmentId: departmentId?.toString() || null,
    },
    { attempts: 1 }
  );
  return job;
};

export const getJobStatus = async (jobId, institutionId) => {
  const job = await BulkImportJob.findOne({ _id: jobId, institutionId }).lean();
  return job;
};
