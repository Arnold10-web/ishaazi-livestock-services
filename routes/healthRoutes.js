/**
 * @file Health Check Routes
 * @description Routes for health monitoring and system status
 * @module routes/healthRoutes
 */

import express from 'express';
import {
  basicHealthCheck,
  detailedHealthCheck,
  performanceMetrics,
  readinessCheck,
  livenessCheck
} from '../controllers/healthController.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [OK, ERROR, healthy, unhealthy, warning]
 *         timestamp:
 *           type: string
 *           format: date-time
 *         uptime:
 *           type: number
 *           description: Application uptime in seconds
 *     
 *     DetailedHealth:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, unhealthy, warning]
 *         timestamp:
 *           type: string
 *           format: date-time
 *         responseTime:
 *           type: string
 *           description: Health check response time
 *         system:
 *           type: object
 *           properties:
 *             uptime:
 *               type: number
 *             version:
 *               type: string
 *             environment:
 *               type: string
 *             nodeVersion:
 *               type: string
 *             platform:
 *               type: string
 *             arch:
 *               type: string
 *         dependencies:
 *           type: object
 *           description: Status of external dependencies
 *         performance:
 *           type: object
 *           description: Application performance metrics
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic application health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *       500:
 *         description: Application error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ERROR
 *                 error:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', basicHealthCheck);

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns comprehensive health status including dependencies and performance metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System status (healthy or warning)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DetailedHealth'
 *       503:
 *         description: System unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DetailedHealth'
 */
router.get('/detailed', detailedHealthCheck);

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Performance metrics
 *     description: Returns application performance metrics
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     requests:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         success:
 *                           type: number
 *                         errors:
 *                           type: number
 *                         avgResponseTime:
 *                           type: number
 *                     memory:
 *                       type: object
 *                     database:
 *                       type: object
 *                     uptime:
 *                       type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/metrics', performanceMetrics);

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes readiness probe - checks if app is ready to serve traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Application not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: not ready
 *                 reason:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/ready', readinessCheck);

/**
 * @swagger
 * /live:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes liveness probe - checks if app is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 */
router.get('/live', livenessCheck);

export default router;
