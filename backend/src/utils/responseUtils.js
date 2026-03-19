export const successResponse = (data, message = 'Success', statusCode = 200) => ({
  success: true, message, data, statusCode,
});

export const errorResponse = (message = 'Error', statusCode = 500, errors = []) => ({
  success: false, message, data: null, errors, statusCode,
});

export const paginatedResponse = (data, pagination, message = 'Success') => ({
  success: true, message, data, pagination,
});

export const sendSuccess = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json(successResponse(data, message, statusCode));

export const sendError = (res, message = 'Error', statusCode = 500, errors = []) =>
  res.status(statusCode).json(errorResponse(message, statusCode, errors));

export const sendPaginated = (res, data, pagination, message = 'Success') =>
  res.status(200).json(paginatedResponse(data, pagination, message));

export const sendCreated = (res, data, message = 'Created successfully') =>
  sendSuccess(res, data, message, 201);

export const sendNotFound = (res, resource = 'Resource') =>
  sendError(res, `${resource} not found`, 404);

export const sendUnauthorized = (res, message = 'Unauthorized') =>
  sendError(res, message, 401);

export const sendForbidden = (res, message = 'Forbidden') =>
  sendError(res, message, 403);

export const sendValidationError = (res, errors, message = 'Validation failed') =>
  res.status(400).json({ success: false, message, data: null, errors });

export const sendConflict = (res, message = 'Conflict') =>
  sendError(res, message, 409);

export default {
  successResponse, errorResponse, paginatedResponse, sendSuccess, sendError,
  sendPaginated, sendCreated, sendNotFound, sendUnauthorized, sendForbidden,
  sendValidationError, sendConflict,
};
