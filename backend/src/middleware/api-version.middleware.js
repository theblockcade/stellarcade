/**
 * API Versioning Middleware
 *
 * This middleware handles API version negotiation.
 * It checks for the 'X-API-Version' header and attaches the version to the request.
 * If no header is provided, it defaults to 'v1'.
 */
const apiVersionMiddleware = (req, res, next) => {
  // Extract version from header or default to 'v1'
  const version = req.headers['x-api-version'] || 'v1';

  // Attach to request object for use in controllers/routes if needed
  req.apiVersion = version;

  // Also set a response header to confirm the version being used
  res.setHeader('X-API-Version', version);

  next();
};

module.exports = apiVersionMiddleware;
