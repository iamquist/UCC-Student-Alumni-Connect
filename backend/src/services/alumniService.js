import { SavedSearch } from '../db/models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPaginationParams, formatPaginationResponse } from '../config/index.js';

export async function createSavedSearch(userId, { query, filters = {}, notifications = false }) {
  const search = await SavedSearch.create({ user: userId, query, filters, notifications });
  return search;
}

export async function listSavedSearches(userId, filters = {}, query = {}) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { user: userId };

  const [data, total] = await Promise.all([
    SavedSearch.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SavedSearch.countDocuments(filter),
  ]);
  return formatPaginationResponse(data, total, page, limit);
}

export async function deleteSavedSearch(searchId, userId) {
  const search = await SavedSearch.findOneAndDelete({ _id: searchId, user: userId });
  if (!search) throw new AppError('Saved search not found', 404);
}

export default { createSavedSearch, listSavedSearches, deleteSavedSearch };
