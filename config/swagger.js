// Production-ready API documentation with Swagger
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ishaazi Livestock Services API',
      version: '1.0.0',
      description: 'Comprehensive farming magazine and livestock services platform API',
      contact: {
        name: 'API Support',
        email: 'support@ishaazilivestockservices.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://ishaazilivestockservices.com/license'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://ishaazi-livestock-services-production.up.railway.app/api'
          : 'http://localhost:5000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Blog: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'objectId' },
            title: { type: 'string', maxLength: 200 },
            content: { type: 'string' },
            author: { type: 'string', maxLength: 100 },
            category: { type: 'string', enum: ['farming', 'livestock', 'technology', 'business'] },
            published: { type: 'boolean', default: false },
            views: { type: 'number', minimum: 0 },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        News: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'objectId' },
            title: { type: 'string', maxLength: 200 },
            content: { type: 'string' },
            category: { type: 'string', enum: ['market', 'weather', 'technology', 'policy'] },
            isBreaking: { type: 'boolean', default: false },
            published: { type: 'boolean', default: false },
            views: { type: 'number', minimum: 0 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'objectId' },
            title: { type: 'string', maxLength: 200 },
            description: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            location: { type: 'string', maxLength: 200 },
            maxAttendees: { type: 'number', minimum: 1 },
            ticketPrice: { type: 'number', minimum: 0 },
            published: { type: 'boolean', default: false },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            error: { type: 'string', nullable: true }
          }
        },
        PaginatedResponse: {
          type: 'object',
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    page: { type: 'number' },
                    limit: { type: 'number' },
                    totalPages: { type: 'number' }
                  }
                }
              }
            }
          ]
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);

// Custom CSS for better documentation appearance
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info .title { color: #22c55e; }
  .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; }
  .swagger-ui .scheme-container .schemes-title { color: #1f2937; }
`;

const swaggerOptions_UI = {
  customCss,
  customSiteTitle: 'Ishaazi Livestock API Docs',
  customfavIcon: '/images/ishaazi.jpg',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
};

// Health check endpoint documentation
/**
 * @swagger
 * /health:
 *   get:
 *     summary: System health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

// Performance monitoring endpoint documentation
/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get system performance metrics
 *     tags: [System]
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
 *                 uptime:
 *                   type: number
 *                 memory:
 *                   type: object
 *                 performance:
 *                   type: object
 */

export { specs, swaggerOptions_UI };
