import { ApiError } from '../utils/apiError.js';
import multer from 'multer';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert standard Error to ApiError
  if (!(error instanceof ApiError)) {
    let statusCode = 500;
    let message = error.message || 'Internal Server Error';
    let errors = [];

    // Mongoose Validation Error
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Database validation failed';
      errors = Object.values(error.errors).map((el) => ({
        field: el.path,
        message: el.message,
      }));
    }

    // Mongoose duplicate key error (code 11000)
    if (error.code === 11000) {
      statusCode = 400;
      message = 'Duplicate field value entered';
      const keyName = Object.keys(error.keyValue)[0];
      errors = [{
        field: keyName,
        message: `A record with this ${keyName} already exists`,
      }];
    }

    // Mongoose Cast Error (invalid ObjectId)
    if (error.name === 'CastError') {
      statusCode = 400;
      message = `Invalid format for field '${error.path}'`;
    }

    // Multer upload errors
    if (error instanceof multer.MulterError) {
      statusCode = 400;
      message = 'File upload error';
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'File size is too large. Max limit is 5MB.';
      } else if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        message = 'A project cannot have more than 3 attachments.';
      }
    }

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  // Response structure
  const response = {
    success: false,
    message: error.message,
    errors: error.errors || [],
  };

  // Stack trace for development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    console.error(`🔴 Error Log: ${error.message}\n`, error.stack);
  }

  return res.status(error.statusCode || 500).json(response);
};

export default errorHandler;
