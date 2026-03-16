import Evaluation from '../models/Evaluation.js';
import { paginateQuery } from '../utils/paginate.js';

export const createEvaluation = async (data) => {
  const evalDoc = await Evaluation.create({
    studentId: data.studentId,
    supervisorId: data.supervisorId,
    institutionId: data.institutionId,
    sessionId: data.sessionId,
    type: data.type,
    technicalSkillScore: data.technicalSkillScore,
    workEthicScore: data.workEthicScore,
    communicationScore: data.communicationScore,
    problemSolvingScore: data.problemSolvingScore,
    remarks: data.remarks || '',
  });
  return evalDoc;
};

export const getEvaluationById = async (evalId, institutionId) => {
  const evalDoc = await Evaluation.findOne({ _id: evalId, institutionId })
    .populate('studentId')
    .populate('supervisorId')
    .populate('sessionId')
    .lean();
  return evalDoc;
};

export const getEvaluationsByInstitution = async (institutionId, filters = {}, options = {}) => {
  const filter = { institutionId };
  if (filters.studentId) filter.studentId = filters.studentId;
  if (filters.supervisorId) filter.supervisorId = filters.supervisorId;
  if (filters.sessionId) filter.sessionId = filters.sessionId;
  return paginateQuery(Evaluation, filter, { ...options, populate: ['studentId', 'supervisorId', 'sessionId'] });
};

export const getEvaluationsByStudent = async (studentId, institutionId) => {
  const docs = await Evaluation.find({ studentId, institutionId })
    .populate('sessionId', 'name')
    .sort({ submittedAt: -1 })
    .lean();
  return docs;
};

export const getEvaluationsBySupervisor = async (supervisorId, institutionId, options = {}) => {
  const filter = { supervisorId, institutionId };
  return paginateQuery(Evaluation, filter, { ...options, populate: ['studentId', 'sessionId'] });
};

export const updateEvaluation = async (evalId, institutionId, data) => {
  const evalDoc = await Evaluation.findOne({ _id: evalId, institutionId });
  if (!evalDoc) return null;
  const hoursSince = (Date.now() - evalDoc.submittedAt) / (1000 * 60 * 60);
  if (hoursSince > 48) throw new Error('Evaluation can only be updated within 48 hours of submission');
  Object.assign(evalDoc, data);
  await evalDoc.save();
  return evalDoc;
};
