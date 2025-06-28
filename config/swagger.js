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
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['OK', 'healthy', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', description: 'Server uptime in seconds' },
            version: { type: 'string' },
            environment: { type: 'string' }
          }
        },
        DetailedHealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            responseTime: { type: 'string', description: 'Response time in milliseconds' },
            system: {
              type: 'object',
              properties: {
                uptime: { type: 'number' },
                version: { type: 'string' },
                environment: { type: 'string' },
                nodeVersion: { type: 'string' },
                platform: { type: 'string' },
                arch: { type: 'string' }
              }
            },
            dependencies: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    responseTime: { type: 'number' },
                    details: { type: 'object' }
                  }
                },
                memory: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    details: { type: 'object' }
                  }
                }
              }
            }
          }
        },
        MetricsResponse: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            memory: {
              type: 'object',
              properties: {
                heapUsed: { type: 'string' },
                heapTotal: { type: 'string' },
                external: { type: 'string' }
              }
            },
            nodeVersion: { type: 'string' },
            environment: { type: 'string' },
            requests: { type: 'number' },
            errors: { type: 'number' },
            errorRate: { type: 'string' },
            averageResponseTime: { type: 'number' },
            activeConnections: { type: 'number' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'System health monitoring endpoints'
      },
      {
        name: 'Metrics',
        description: 'Performance and monitoring metrics'
      },
      {
        name: 'Content',
        description: 'Blog, news, and content management'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      }
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Basic health check',
          description: 'Returns basic server health status for load balancers',
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthStatus' }
                }
              }
            }
          }
        }
      },
      '/health/detailed': {
        get: {
          tags: ['Health'],
          summary: 'Detailed health check',
          description: 'Returns comprehensive system health including database and memory status',
          responses: {
            '200': {
              description: 'Detailed health information',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DetailedHealthStatus' }
                }
              }
            }
          }
        }
      },
      '/health/ready': {
        get: {
          tags: ['Health'],
          summary: 'Readiness probe',
          description: 'Kubernetes readiness probe endpoint',
          responses: {
            '200': {
              description: 'Service is ready to receive traffic',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthStatus' }
                }
              }
            },
            '503': {
              description: 'Service is not ready'
            }
          }
        }
      },
      '/health/live': {
        get: {
          tags: ['Health'],
          summary: 'Liveness probe',
          description: 'Kubernetes liveness probe endpoint',
          responses: {
            '200': {
              description: 'Service is alive',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthStatus' }
                }
              }
            },
            '503': {
              description: 'Service is not responding'
            }
          }
        }
      },
      '/metrics': {
        get: {
          tags: ['Metrics'],
          summary: 'Performance metrics',
          description: 'Returns real-time performance metrics and system statistics',
          responses: {
            '200': {
              description: 'Performance metrics data',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MetricsResponse' }
                }
              }
            }
          }
        }
      }
    }
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

/**
 * Setup Swagger UI for API documentation
 * @param {Object} app - Express app instance
 */
export const setupSwagger = (app) => {
  // Swagger documentation endpoint
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions_UI));
  
  // JSON specification endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  console.log('📚 API Documentation available at /api-docs');
};
