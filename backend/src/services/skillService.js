import { Skill } from '../db/models/index.js';
import { AppError } from '../middleware/errorHandler.js';

export async function addOrUpdateSkill(userId, { name, category = 'General', proficiency = 'beginner', progress = 0 }) {
  const existing = await Skill.findOne({ user: userId, name: new RegExp(`^${name}$`, 'i') });
  if (existing) {
    existing.category = category;
    existing.proficiency = proficiency;
    existing.progress = progress;
    await existing.save();
    return existing;
  }
  return Skill.create({ user: userId, name, category, proficiency, progress });
}

export async function getUserSkills(userId, filters = {}) {
  const filter = { user: userId };
  if (filters.category) filter.category = filters.category;
  if (filters.proficiency) filter.proficiency = filters.proficiency;
  return Skill.find(filter).sort({ name: 1 });
}

export async function updateSkillProgress(skillId, userId, { progress, proficiency }) {
  const skill = await Skill.findOne({ _id: skillId, user: userId });
  if (!skill) throw new AppError('Skill not found', 404);
  if (progress !== undefined) skill.progress = Math.min(100, Math.max(0, progress));
  if (proficiency) skill.proficiency = proficiency;
  await skill.save();
  return skill;
}

export async function deleteSkill(skillId, userId) {
  const skill = await Skill.findOneAndDelete({ _id: skillId, user: userId });
  if (!skill) throw new AppError('Skill not found', 404);
}

export default { addOrUpdateSkill, getUserSkills, updateSkillProgress, deleteSkill };
