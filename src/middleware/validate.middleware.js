import { ApiError } from '../utils/apiError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const errorsList = result.error.errors.map((err) => {
      // path is like ['body', 'title'] or ['params', 'id']. We slice 'body'/'params' out
      const fieldPath = err.path.length > 1 ? err.path.slice(1).join('.') : err.path[0];
      return {
        field: fieldPath,
        message: err.message,
      };
    });

    return next(new ApiError(400, 'Request validation failed', errorsList));
  }

  // Inject sanitized, parsed data
  if (result.data.body) req.body = result.data.body;
  if (result.data.query) req.query = result.data.query;
  if (result.data.params) req.params = result.data.params;

  next();
};

export default validate;
