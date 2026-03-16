import { getBulkImportQueue } from '../bulkImport.queue.js';
import BulkImportJob from '../../models/BulkImportJob.js';
import User from '../../models/User.js';
import Student from '../../models/Student.js';
import Supervisor from '../../models/Supervisor.js';
import DefaultPassword from '../../models/DefaultPassword.js';
import Department from '../../models/Department.js';
import AcademicSession from '../../models/AcademicSession.js';
import { hashPassword } from '../../utils/password.js';
import { getEmailQueue } from '../email.queue.js';
import cloudinary from '../../config/cloudinary.js';
import { Readable } from 'stream';

const queue = getBulkImportQueue();

queue.process(async (job) => {
  const { jobId, importType, csvRows, institutionId, departmentId, initiatedById } = job.data;
  const bulkJob = await BulkImportJob.findById(jobId);
  if (!bulkJob || bulkJob.status !== 'pending') return;
  await BulkImportJob.findByIdAndUpdate(jobId, { status: 'processing' });
  let succeeded = 0;
  let failed = 0;
  const errors = [];
  const emailQueue = getEmailQueue();
  for (let i = 0; i < csvRows.length; i++) {
    const row = csvRows[i];
    try {
      const existing = await User.findOne({ email: row.email?.trim(), institutionId });
      if (existing) {
        errors.push({ row: i + 2, email: row.email, message: 'Email already exists' });
        failed++;
        continue;
      }
      const defaultPwd = await DefaultPassword.findOne({ institutionId, role: importType });
      const passwordHash = defaultPwd?.passwordHash || (await hashPassword(importType === 'student' ? 'Student@123' : importType === 'supervisor' ? 'Supervisor@123' : 'Admin@123'));
      const deptId = row.departmentId?.trim() || departmentId;
      const user = await User.create({
        institutionId,
        departmentId: deptId,
        name: row.name?.trim(),
        email: row.email?.trim(),
        passwordHash,
        role: importType,
      });
      if (importType === 'student') {
        const sessionId = row.sessionId?.trim();
        await Student.create({
          userId: user._id,
          institutionId,
          departmentId: deptId,
          matricNumber: row.matricNumber?.trim(),
          company: row.company?.trim() || '',
          companyAddress: row.companyAddress?.trim() || '',
          sessionId: sessionId || undefined,
        });
      } else if (importType === 'supervisor') {
        await Supervisor.create({
          userId: user._id,
          institutionId,
          departmentId: deptId,
          company: row.company?.trim() || '',
          companyAddress: row.companyAddress?.trim() || '',
        });
      }
      await emailQueue.add({ to: user.email, subject: 'Welcome to A-Mentra', templateName: 'welcome', templateVars: { name: user.name } });
      succeeded++;
    } catch (err) {
      errors.push({ row: i + 2, email: row.email, message: err.message || 'Error' });
      failed++;
    }
    await BulkImportJob.findByIdAndUpdate(jobId, { rowsProcessed: i + 1, rowsSucceeded: succeeded, rowsFailed: failed });
  }
  let errorFileUrl = null;
  if (errors.length > 0) {
    const csv = ['row,email,message', ...errors.map((e) => `${e.row},${e.email},${e.message}`)].join('\n');
    errorFileUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'amentra-errors' },
        (err, res) => (err ? reject(err) : resolve(res?.secure_url))
      );
      Readable.from([csv]).pipe(uploadStream);
    });
  }
  await BulkImportJob.findByIdAndUpdate(jobId, {
    status: failed === csvRows.length ? 'failed' : 'completed',
    completedAt: new Date(),
    errorFileUrl: errorFileUrl || undefined,
  });
});

export default queue;
