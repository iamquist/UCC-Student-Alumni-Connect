import { StudentQuestion } from '../db/models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPaginationParams, formatPaginationResponse } from '../config/index.js';
import { createNotification } from './notificationService.js';

export async function askQuestion(studentId, { title, content, tags = [] }) {
  const question = await StudentQuestion.create({ student: studentId, title, content, tags });
  await question.populate('student', 'firstName lastName profilePicture');
  return question;
}

export async function getQuestions(filters = {}, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};
  if (filters.tags) filter.tags = { $in: Array.isArray(filters.tags) ? filters.tags : [filters.tags] };
  if (filters.resolved !== undefined) filter.isResolved = filters.resolved === 'true';
  if (filters.q) filter.$or = [
    { title: new RegExp(filters.q, 'i') },
    { content: new RegExp(filters.q, 'i') },
  ];

  const [data, total] = await Promise.all([
    StudentQuestion.find(filter)
      .populate('student', 'firstName lastName profilePicture')
      .populate('responses.alumni', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    StudentQuestion.countDocuments(filter),
  ]);
  return formatPaginationResponse(data, total, page, limit);
}

export async function getQuestionById(questionId) {
  const question = await StudentQuestion.findById(questionId)
    .populate('student', 'firstName lastName profilePicture bio')
    .populate('responses.alumni', 'firstName lastName profilePicture bio');
  if (!question) throw new AppError('Question not found', 404);
  return question;
}

export async function respondToQuestion(questionId, alumniId, content) {
  const question = await StudentQuestion.findById(questionId);
  if (!question) throw new AppError('Question not found', 404);

  question.responses.push({ alumni: alumniId, content });
  await question.save();
  await StudentQuestion.populate(question, { path: 'responses.alumni', select: 'firstName lastName profilePicture' });

  await createNotification({
    recipient: question.student,
    sender: alumniId,
    type: 'system',
    title: 'New Answer',
    message: 'answered your question',
    data: { questionId },
  });

  return question.responses[question.responses.length - 1];
}

export async function toggleQuestionLike(questionId, userId) {
  const question = await StudentQuestion.findById(questionId);
  if (!question) throw new AppError('Question not found', 404);
  const liked = question.likes.includes(userId);
  if (liked) question.likes.pull(userId);
  else question.likes.push(userId);
  await question.save();
  return { liked: !liked };
}

export async function markQuestionResolved(questionId, studentId) {
  const question = await StudentQuestion.findOneAndUpdate(
    { _id: questionId, student: studentId },
    { isResolved: true },
    { new: true }
  );
  if (!question) throw new AppError('Question not found or not authorized', 404);
  return question;
}

export default {
  askQuestion, getQuestions, getQuestionById, respondToQuestion,
  toggleQuestionLike, markQuestionResolved,
};
