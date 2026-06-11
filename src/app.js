import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurations
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';

// Middlewares & Routers
import routes from './routes/index.js';
import errorHandler from './middleware/error.middleware.js';
import { ApiError } from './utils/apiError.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, env.CORS_ORIGIN);

// Get directory name (for static uploads)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows static local file loading on frontend
}));

app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);

app.use(mongoSanitize());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1', apiLimiter);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads Folder Statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mapping
app.use('/api/v1', routes);

// Handle 404 Route Not Found
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

// Global Error Handler
app.use(errorHandler);

// Database Connection & Server Listening (Only listen if NOT in test environment)
if (env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    const PORT = env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
  });
}

export { app, server };
