import ReportJob from '../models/ReportJob.js';
import { getReportQueue } from '../queues/report.queue.js';

export const createReportJob = async (institutionId, requestedById, reportType, format, dateRangeStart, dateRangeEnd) => {
  const job = await ReportJob.create({
    institutionId,
    requestedById,
    reportType,
    format,
    status: 'queued',
    dateRangeStart: dateRangeStart ? new Date(dateRangeStart) : null,
    dateRangeEnd: dateRangeEnd ? new Date(dateRangeEnd) : null,
  });
  const queue = getReportQueue();
  await queue.add({
    jobId: job._id.toString(),
    reportType,
    format,
    institutionId: institutionId.toString(),
    requestedById: requestedById.toString(),
    dateFrom: dateRangeStart,
    dateTo: dateRangeEnd,
  });
  return job;
};

export const getReportJobStatus = async (jobId, userId, institutionId) => {
  const job = await ReportJob.findOne({ _id: jobId, institutionId, requestedById: userId }).lean();
  return job;
};

export const getReportTemplates = () => {
  return [
    { type: 'progress', name: 'Progress Report' },
    { type: 'engagement', name: 'Engagement Report' },
    { type: 'performance', name: 'Performance Report' },
    { type: 'student_full', name: 'Student Full Report' },
  ];
};
