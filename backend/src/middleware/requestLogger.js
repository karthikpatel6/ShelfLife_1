/**
 * requestLogger middleware - Logs HTTP requests with method, URL, status, and response time.
 * Format: [YYYY-MM-DD HH:MM:SS] METHOD /path STATUS XXXms
 *
 * This is a custom logger; morgan is also installed and can replace this
 * by swapping to app.use(morgan('dev')) in app.js.
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Listen for the response to finish so we can log the final status code
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const status = res.statusCode;
    const color =
      status >= 500 ? '\x1b[31m' : // red for 5xx
      status >= 400 ? '\x1b[33m' : // yellow for 4xx
      status >= 300 ? '\x1b[36m' : // cyan for 3xx
      '\x1b[32m';                  // green for 2xx
    const reset = '\x1b[0m';

    console.log(
      `${color}[${timestamp}] ${req.method} ${req.originalUrl} ${status} ${duration}ms${reset}`
    );
  });

  next();
};
