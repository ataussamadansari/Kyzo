import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kyzo Social API',
      version: '1.0.0',
      description: 'API documentation for Kyzo Social application',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://kyzo.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            avatar: { type: 'string' },
            bio: { type: 'string' },
            isPrivate: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            description: { type: 'string' },
            mentions: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            images: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  public_id: { type: 'string' }
                }
              } 
            },
            videos: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  public_id: { type: 'string' }
                }
              } 
            },
            type: { type: 'string', enum: ['post', 'reel', 'story'] },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['gps', 'custom'] },
                name: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' }
                  }
                }
              }
            },
            likes: { type: 'array', items: { type: 'string' } },
            likesCount: { type: 'number' },
            commentsCount: { type: 'number' },
            shareCount: { type: 'number' },
            reportsCount: { type: 'number' },
            isDeleted: { type: 'boolean' },
            expiresAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            post: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            text: { type: 'string' },
            mentions: { type: 'array', items: { type: 'string' } },
            parent: { type: 'string' },
            likes: { type: 'array', items: { type: 'string' } },
            likesCount: { type: 'number' },
            isDeleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            recipient: { type: 'string' },
            sender: { $ref: '#/components/schemas/User' },
            type: { type: 'string', enum: ['like', 'comment', 'follow', 'mention'] },
            read: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
