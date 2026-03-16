import LogEntry from '../models/LogEntry.js';
import LogMedia from '../models/LogMedia.js';
import LogReview from '../models/LogReview.js';
import { paginateQuery } from '../utils/paginate.js';

export const createLog = async (studentId, institutionId, sessionId, data) => {
  const log = await LogEntry.create({
    studentId,
    institutionId,
    sessionId,
    date: new Date(data.date),
    title: data.title,
    description: data.description,
    hoursWorked: data.hoursWorked,
    skillsLearned: data.skillsLearned || [],
    challenges: data.challenges || '',
    status: 'draft',
  });
  return log;
};

export const getLogById = async (logId, institutionId) => {
  const log = await LogEntry.findOne({ _id: logId, institutionId })
    .populate('studentId')
    .populate('sessionId', 'name')
    .lean();
  return log;
};

export const getLogWithMediaAndReview = async (logId, institutionId) => {
  const log = await LogEntry.findOne({ _id: logId, institutionId }).lean();
  if (!log) return null;
  const [media, review] = await Promise.all([
    LogMedia.find({ logEntryId: logId, institutionId }).lean(),
    LogReview.findOne({ logEntryId: logId, institutionId }).lean(),
  ]);
  return { ...log, media, review };
};

export const getLogsByStudent = async (studentId, institutionId, filters = {}, options = {}) => {
  const filter = { studentId, institutionId };
  if (filters.status) filter.status = filters.status;
  if (filters.dateFrom) filter.date = { ...filter.date, $gte: new Date(filters.dateFrom) };
  if (filters.dateTo) filter.date = { ...filter.date, $lte: new Date(filters.dateTo) };
  return paginateQuery(LogEntry, filter, { ...options, populate: ['sessionId'] });
};

export const getLogsByInstitution = async (institutionId, filters = {}, options = {}) => {
  const filter = { institutionId };
  if (filters.studentId) filter.studentId = filters.studentId;
  if (filters.status) filter.status = filters.status;
  if (filters.dateFrom) filter.date = { $gte: new Date(filters.dateFrom) };
  if (filters.dateTo) filter.date = { ...filter.date, $lte: new Date(filters.dateTo) };
  return paginateQuery(LogEntry, filter, { ...options, populate: ['studentId', 'sessionId'] });
};

export const updateLog = async (logId, institutionId, data) => {
  const log = await LogEntry.findOne({ _id: logId, institutionId, status: 'draft' });
  if (!log) return null;
  Object.assign(log, data);
  if (data.date) log.date = new Date(data.date);
  await log.save();
  return log;
};

export const deleteLog = async (logId, institutionId) => {
  const log = await LogEntry.findOneAndDelete({ _id: logId, institutionId, status: 'draft' });
  return log;
};

export const submitLog = async (logId, institutionId, minLength) => {
  const log = await LogEntry.findOne({ _id: logId, institutionId, status: 'draft' });
  if (!log) return null;
  if (log.description.length < minLength) throw new Error(`Description must be at least ${minLength} characters`);
  log.status = 'submitted';
  log.submittedAt = new Date();
  await log.save();
  return log;
};

export const approveLog = async (logId, supervisorId, institutionId, comment = '') => {
  const log = await LogEntry.findOne({ _id: logId, institutionId });
  if (!log) return null;
  log.status = 'approved';
  await log.save();
  await LogReview.findOneAndUpdate(
    { logEntryId: logId },
    { $set: { supervisorId, institutionId, decision: 'approved', comment, reviewedAt: new Date() } },
    { upsert: true }
  );
  return log;
};

export const rejectLog = async (logId, supervisorId, institutionId, comment) => {
  const log = await LogEntry.findOne({ _id: logId, institutionId });
  if (!log) return null;
  log.status = 'rejected';
  await log.save();
  await LogReview.findOneAndUpdate(
    { logEntryId: logId },
    { $set: { supervisorId, institutionId, decision: 'rejected', comment, reviewedAt: new Date() } },
    { upsert: true }
  );
  return log;
};

export const rateLog = async (logId, supervisorId, institutionId, rating) => {
  const review = await LogReview.findOneAndUpdate(
    { logEntryId: logId, institutionId },
    { $set: { supervisorId, rating } },
    { new: true, upsert: true }
  );
  return review;
};

export const getMediaCount = async (logEntryId) => {
  return LogMedia.countDocuments({ logEntryId });
};

export const addLogMedia = async (logEntryId, institutionId, uploaderId, files) => {
  const existing = await LogMedia.countDocuments({ logEntryId });
  if (existing + files.length > 5) throw new Error('Maximum 5 media files per log');
  const docs = files.map((f) => ({
    logEntryId,
    institutionId,
    uploader: uploaderId,
    cloudinaryPublicId: f.publicId,
    url: f.url,
    fileType: f.fileType || 'image',
    originalName: f.originalName,
    sizeBytes: f.sizeBytes,
  }));
  await LogMedia.insertMany(docs);
  return docs;
};

export const removeLogMedia = async (logEntryId, mediaId, institutionId) => {
  const media = await LogMedia.findOneAndDelete({ _id: mediaId, logEntryId, institutionId });
  return media;
};
