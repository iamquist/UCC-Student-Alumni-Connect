import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin, requireStudentOrAlumni } from '../middleware/roleCheck.js';
import { uploadImage, handleUploadError } from '../middleware/upload.js';
import { sendSuccess } from '../utils/responseUtils.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  mentorshipController, questionController, skillController,
  settingController, alumniController,
} from '../controllers/extendedControllers.js';

const router = Router();

// ── Mentorship routes ──────────────────────────────────────────
const mentorship = Router();
mentorship.post('/request', requireAuth, mentorshipController.sendRequest);
mentorship.get('/requests', requireAuth, mentorshipController.getRequests);
mentorship.get('/my-requests', requireAuth, mentorshipController.getMyRequests);
mentorship.put('/:id/accept', requireAuth, mentorshipController.acceptRequest);
mentorship.put('/:id/decline', requireAuth, mentorshipController.declineRequest);

// ── Question routes ────────────────────────────────────────────
const questions = Router();
questions.get('/', requireAuth, questionController.getQuestions);
questions.post('/', requireAuth, questionController.askQuestion);
questions.get('/:id', requireAuth, questionController.getQuestionById);
questions.post('/:id/respond', requireAuth, questionController.respondToQuestion);
questions.post('/:id/like', requireAuth, questionController.likeQuestion);
questions.put('/:id/resolve', requireAuth, questionController.markResolved);

// ── Skill routes ───────────────────────────────────────────────
const skills = Router();
skills.get('/', requireAuth, skillController.getSkills);
skills.post('/', requireAuth, skillController.addSkill);
skills.put('/:id/progress', requireAuth, skillController.updateProgress);
skills.delete('/:id', requireAuth, skillController.deleteSkill);

// ── Settings routes ────────────────────────────────────────────
const settings = Router();
settings.get('/', requireAuth, requireAdmin, settingController.getSettings);
settings.put('/', requireAuth, requireAdmin, settingController.updateSettings);

// ── Alumni saved searches ──────────────────────────────────────
const alumni = Router();
alumni.get('/searches', requireAuth, alumniController.getSavedSearches);
alumni.post('/searches', requireAuth, alumniController.saveSearch);
alumni.delete('/searches/:id', requireAuth, alumniController.deleteSavedSearch);

// ── Upload routes ──────────────────────────────────────────────
const upload = Router();
upload.post('/image', requireAuth, uploadImage('image'), handleUploadError,
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded', data: null });
    const url = `/uploads/images/${req.file.filename}`;
    sendSuccess(res, { url, filename: req.file.filename, size: req.file.size });
  })
);

// Mount all extended routes
router.use('/mentorship', mentorship);
router.use('/questions', questions);
router.use('/skills', skills);
router.use('/settings', settings);
router.use('/alumni', alumni);
router.use('/upload', upload);

export default router;
