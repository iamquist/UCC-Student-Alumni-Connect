import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess, sendCreated } from '../utils/responseUtils.js';
import * as mentorshipService from '../services/mentorshipService.js';
import * as questionService from '../services/questionService.js';
import * as skillService from '../services/skillService.js';
import * as settingService from '../services/settingService.js';
import * as alumniService from '../services/alumniService.js';

// ── Mentorship Controller ──────────────────────────────────────
export const mentorshipController = {
  sendRequest: asyncHandler(async (req, res) => {
    const request = await mentorshipService.sendMentorshipRequest(req.user._id, req.body);
    sendCreated(res, request, 'Mentorship request sent');
  }),
  getRequests: asyncHandler(async (req, res) => {
    const result = await mentorshipService.getMentorshipRequests(req.user._id, req.query, req.query);
    res.json({ success: true, message: 'OK', ...result });
  }),
  getMyRequests: asyncHandler(async (req, res) => {
    const result = await mentorshipService.getMyMentorshipRequests(req.user._id, req.query, req.query);
    res.json({ success: true, message: 'OK', ...result });
  }),
  acceptRequest: asyncHandler(async (req, res) => {
    const request = await mentorshipService.acceptMentorshipRequest(req.params.id, req.user._id, req.body);
    sendSuccess(res, request, 'Mentorship request accepted');
  }),
  declineRequest: asyncHandler(async (req, res) => {
    await mentorshipService.declineMentorshipRequest(req.params.id, req.user._id, req.body.responseMessage);
    sendSuccess(res, null, 'Mentorship request declined');
  }),
};

// ── Question Controller ────────────────────────────────────────
export const questionController = {
  askQuestion: asyncHandler(async (req, res) => {
    const question = await questionService.askQuestion(req.user._id, req.body);
    sendCreated(res, question, 'Question posted');
  }),
  getQuestions: asyncHandler(async (req, res) => {
    const result = await questionService.getQuestions(req.query, req.query);
    res.json({ success: true, message: 'OK', ...result });
  }),
  getQuestionById: asyncHandler(async (req, res) => {
    const question = await questionService.getQuestionById(req.params.id);
    sendSuccess(res, question);
  }),
  respondToQuestion: asyncHandler(async (req, res) => {
    const response = await questionService.respondToQuestion(req.params.id, req.user._id, req.body.content);
    sendCreated(res, response, 'Response added');
  }),
  likeQuestion: asyncHandler(async (req, res) => {
    const result = await questionService.toggleQuestionLike(req.params.id, req.user._id);
    sendSuccess(res, result);
  }),
  markResolved: asyncHandler(async (req, res) => {
    const question = await questionService.markQuestionResolved(req.params.id, req.user._id);
    sendSuccess(res, question, 'Question marked as resolved');
  }),
};

// ── Skill Controller ───────────────────────────────────────────
export const skillController = {
  addSkill: asyncHandler(async (req, res) => {
    const skill = await skillService.addOrUpdateSkill(req.user._id, req.body);
    sendCreated(res, skill, 'Skill added');
  }),
  getSkills: asyncHandler(async (req, res) => {
    const skills = await skillService.getUserSkills(req.user._id, req.query);
    sendSuccess(res, skills);
  }),
  updateProgress: asyncHandler(async (req, res) => {
    const skill = await skillService.updateSkillProgress(req.params.id, req.user._id, req.body);
    sendSuccess(res, skill, 'Progress updated');
  }),
  deleteSkill: asyncHandler(async (req, res) => {
    await skillService.deleteSkill(req.params.id, req.user._id);
    sendSuccess(res, null, 'Skill deleted');
  }),
};

// ── Setting Controller ─────────────────────────────────────────
export const settingController = {
  getSettings: asyncHandler(async (req, res) => {
    const settings = await settingService.getSettings();
    sendSuccess(res, settings);
  }),
  updateSettings: asyncHandler(async (req, res) => {
    const settings = await settingService.updateSettings(req.body);
    sendSuccess(res, settings, 'Settings updated');
  }),
};

// ── Alumni Controller (saved searches) ────────────────────────
export const alumniController = {
  saveSearch: asyncHandler(async (req, res) => {
    const search = await alumniService.createSavedSearch(req.user._id, req.body);
    sendCreated(res, search, 'Search saved');
  }),
  getSavedSearches: asyncHandler(async (req, res) => {
    const result = await alumniService.listSavedSearches(req.user._id, req.query, req.query);
    res.json({ success: true, message: 'OK', ...result });
  }),
  deleteSavedSearch: asyncHandler(async (req, res) => {
    await alumniService.deleteSavedSearch(req.params.id, req.user._id);
    sendSuccess(res, null, 'Search deleted');
  }),
};
