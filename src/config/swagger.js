import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'A-Mentra API',
      version: '1.0.0',
      description: 'Multi-tenant SIWES activity logging and monitoring API for Nigerian universities',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token. Get it from POST /auth/login',
        },
      },
      schemas: {
        // Auth
        LoginRequest: {
          type: 'object',
          required: ['identifier', 'password'],
          properties: {
            identifier: {
              type: 'string',
              example: 'TEST001',
              description: 'Staff ID, Matric Number, or Email',
            },
            password: {
              type: 'string',
              example: 'AMENTRA@TEST001',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            isFirstLogin: { type: 'boolean' },
            userId: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },

        // User creation
        CreateAdminRequest: {
          type: 'object',
          required: ['name', 'email', 'staffId'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@university.edu.ng' },
            staffId: { type: 'string', example: 'STAFF001' },
            departmentId: { type: 'string', example: '64abc123...' },
          },
        },
        CreateSupervisorRequest: {
          type: 'object',
          required: ['name', 'email', 'staffId', 'company'],
          properties: {
            name: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', example: 'jane@techcorp.com' },
            staffId: { type: 'string', example: 'SUP001' },
            company: { type: 'string', example: 'TechCorp Nigeria' },
            phone: { type: 'string', example: '+2348012345678' },
            departmentId: { type: 'string' },
          },
        },
        CreateStudentRequest: {
          type: 'object',
          required: ['name', 'email', 'matricNumber'],
          properties: {
            name: { type: 'string', example: 'Alice Johnson' },
            email: { type: 'string', example: 'alice@student.edu.ng' },
            matricNumber: { type: 'string', example: 'CSC/2021/001' },
            departmentId: { type: 'string' },
            company: { type: 'string', example: 'TechCorp Nigeria' },
            sessionId: { type: 'string' },
          },
        },

        // OTP / First login
        SendOTPRequest: {
          type: 'object',
          required: ['userId', 'email'],
          properties: {
            userId: { type: 'string' },
            email: { type: 'string', example: 'user@university.edu.ng' },
          },
        },
        VerifyOTPRequest: {
          type: 'object',
          required: ['userId', 'otp'],
          properties: {
            userId: { type: 'string' },
            otp: { type: 'string', example: '123456' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['userId', 'newPassword'],
          properties: {
            userId: { type: 'string' },
            newPassword: { type: 'string', example: 'NewPass@123' },
          },
        },

        // Register org
        RegisterOrganizationRequest: {
          type: 'object',
          required: ['name', 'type', 'city', 'state', 'address',
                     'phone', 'email', 'adminName', 
                     'adminEmail', 'adminPassword'],
          properties: {
            name: { type: 'string', example: 'University of Lagos' },
            type: { 
              type: 'string', 
              enum: ['University', 'Polytechnic'],
              example: 'University'
            },
            city: { type: 'string', example: 'Lagos' },
            state: { type: 'string', example: 'Lagos State' },
            address: { type: 'string', example: 'Akoka, Yaba, Lagos' },
            phone: { type: 'string', example: '08012345678' },
            email: { type: 'string', example: 'contact@unilag.edu.ng' },
            website: { type: 'string', example: 'https://unilag.edu.ng' },
            adminName: { type: 'string', example: 'Super Admin' },
            adminEmail: { type: 'string', example: 'admin@unilag.edu.ng' },
            adminPassword: { type: 'string', example: 'Admin@12345' },
          },
        },

        // Generic responses
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'First Login', description: 'First-time login flow (OTP + password change)' },
      { name: 'Super Admin', description: 'Super admin management endpoints' },
      { name: 'Admin', description: 'Department admin endpoints' },
      { name: 'Supervisor', description: 'Supervisor endpoints' },
      { name: 'Student', description: 'Student endpoints' },
      { name: 'Departments', description: 'Department management' },
      { name: 'Sessions', description: 'Academic session management' },
    ],
  },
  apis: ['./src/routes/*.js'],  // reads JSDoc comments from route files
};

export const swaggerSpec = swaggerJsdoc(options);
