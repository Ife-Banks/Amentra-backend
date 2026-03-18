# A-Mentra API Documentation

## Overview
A-Mentra is a comprehensive SIWES (Student Industrial Work Experience Scheme) management platform designed for Nigerian universities and polytechnics. The system enables institutions to manage student internships, track activity logs, supervise students, and generate reports.

**Base URL:** `http://localhost:5000/api`  
**Authentication:** Bearer JWT token  
**Content-Type:** `application/json`

## Authentication

### Getting a Token
Use your Staff ID, Matric Number, or Email as the identifier:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "TEST001", "password": "AMENTRA@TEST001"}'
```

### Using the Token
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Token Expiry
- **Access Token:** 15 minutes
- **Refresh Token:** 7 days
- Use `/auth/refresh-token` to get a new access token

### First-Login Flow
New users must complete the first-login flow:
1. Login with default password
2. Receive OTP via email
3. Verify OTP using `/auth/verify-otp`
4. Set new password using `/auth/change-password-first-login`

## Status Indicators
✅ **COMPLETE** — tested and working  
🔧 **PARTIAL** — implemented but has known issues  
🚧 **NOT STARTED** — planned but not built yet  
⚠️ **NEEDS TESTING** — built but not yet verified

---

## 1. Authentication Endpoints

### POST /auth/register-organization
**Status:** ✅ COMPLETE  
**Auth Required:** No  
**Role Required:** None

**Description:** Register a new institution and create the super admin account.

**Request Body:**
```json
{
  "institutionName": "University of Lagos",     // required — Institution name
  "address": "Akoka, Yaba, Lagos",         // required — Physical address
  "type": "University",                     // required — Institution type
  "city": "Lagos",                          // optional — City
  "state": "Lagos State",                    // optional — State
  "website": "https://unilag.edu.ng",        // optional — Website URL
  "adminName": "Super Admin",                 // required — Admin's full name
  "adminEmail": "admin@unilag.edu.ng",        // required — Admin's email
  "adminPassword": "Admin@12345"              // required — Admin's password
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Organization registered successfully",
  "data": {
    "institution": { ... },
    "admin": { ... }
  }
}
```

**Error Responses:**
| Status | Message | Cause |
|--------|---------|-------|
| 400 | Validation failed | Missing required fields |
| 409 | Institution already exists | Email or name already registered |

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register-organization \
  -H "Content-Type: application/json" \
  -d '{
    "institutionName": "University of Lagos",
    "address": "Akoka, Yaba, Lagos",
    "type": "University",
    "adminName": "Super Admin",
    "adminEmail": "admin@unilag.edu.ng",
    "adminPassword": "Admin@12345"
  }'
```

---

### POST /auth/login
**Status:** ✅ COMPLETE  
**Auth Required:** No  
**Role Required:** None

**Description:** Login with Staff ID, Matric Number, or Email.

**Request Body:**
```json
{
  "identifier": "TEST001",     // required — Staff ID/Matric/Email
  "password": "AMENTRA@TEST001" // required — User password
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isFirstLogin": true,
  "userId": "64abc123...",
  "user": {
    "id": "64abc123...",
    "name": "John Doe",
    "email": "john@university.edu.ng",
    "role": "admin"
  }
}
```

**Error Responses:**
| Status | Message | Cause |
|--------|---------|-------|
| 400 | Validation failed | Missing identifier or password |
| 401 | Invalid credentials | Wrong credentials |
| 500 | Internal server error | Database connection issue |

---

### POST /auth/send-otp
**Status:** ✅ COMPLETE  
**Auth Required:** No  
**Role Required:** None

**Description:** Send OTP to user email for first-login verification.

**Request Body:**
```json
{
  "userId": "64abc123...",     // required — User ID
  "email": "user@university.edu.ng" // required — User email
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

---

### POST /auth/verify-otp
**Status:** ✅ COMPLETE  
**Auth Required:** No  
**Role Required:** None

**Description:** Verify OTP code entered by user.

**Request Body:**
```json
{
  "userId": "64abc123...",  // required — User ID
  "otp": "123456"          // required — 6-digit OTP code
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

---

### POST /auth/change-password-first-login
**Status:** ✅ COMPLETE  
**Auth Required:** No  
**Role Required:** None

**Description:** Set new password after OTP verification.

**Request Body:**
```json
{
  "userId": "64abc123...",      // required — User ID
  "newPassword": "NewPass@123"   // required — New password (min 8 chars, 1 uppercase, 1 number)
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### POST /auth/logout
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** Any

**Description:** Logout current user and invalidate tokens.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /auth/refresh-token
**Status:** ✅ COMPLETE  
**Auth Required:** No  
**Role Required:** None

**Description:** Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // required — Valid refresh token
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### GET /auth/me
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** Any

**Description:** Get current user profile information.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "64abc123...",
    "name": "John Doe",
    "email": "john@university.edu.ng",
    "role": "admin",
    "isFirstLogin": false
  }
}
```

---

## 2. Super Admin Endpoints

### POST /super-admin/admins
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** super_admin

**Description:** Create a new department admin account.

**Request Body:**
```json
{
  "name": "Jane Smith",                    // required — Admin's full name
  "email": "jane@university.edu.ng",        // required — Admin's email
  "staffId": "STAFF001",                   // required — Unique staff ID
  "departmentId": "64def456..."             // required — Department ID
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "user": { ... },
    "defaultPassword": "AMENTRA@STAFF001"
  }
}
```

---

### POST /super-admin/supervisors
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** super_admin

**Description:** Create a new supervisor account.

**Request Body:**
```json
{
  "name": "John Supervisor",               // required — Supervisor's full name
  "email": "john@company.com",            // required — Supervisor's email
  "staffId": "SUP001",                   // required — Unique staff ID
  "departmentId": "64def456...",           // required — Department ID
  "company": "TechCorp Nigeria",           // optional — Company name
  "companyAddress": "Ikoyi, Lagos"        // optional — Company address
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Supervisor created successfully",
  "data": {
    "user": { ... },
    "defaultPassword": "AMENTRA@SUP001"
  }
}
```

---

### POST /super-admin/students
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** super_admin

**Description:** Create a new student account.

**Request Body:**
```json
{
  "name": "Alice Student",                // required — Student's full name
  "email": "alice@student.edu.ng",          // required — Student's email
  "matricNumber": "CSC/2021/001",        // required — Matriculation number
  "departmentId": "64def456...",           // required — Department ID
  "company": "TechCorp Nigeria",           // optional — Company name
  "companyAddress": "Ikoyi, Lagos",        // optional — Company address
  "companyState": "Lagos",                // optional — Company state
  "companyCity": "Lagos",                 // optional — Company city
  "sessionId": "64ghi789...",             // required — Academic session ID
  "startDate": "2024-01-15",            // optional — Internship start date
  "endDate": "2024-06-15"              // optional — Internship end date
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "user": { ... },
    "defaultPassword": "AMENTRA@CSC/2021/001"
  }
}
```

---

### GET /super-admin/users
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** super_admin

**Description:** Get all users in the institution with optional filtering.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| role | string | No | - | Filter by role: admin, supervisor, student |
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 20 | Number of items per page |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "64abc123...",
        "name": "John Doe",
        "email": "john@university.edu.ng",
        "role": "admin",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### POST /departments
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** super_admin

**Description:** Create a new academic department.

**Request Body:**
```json
{
  "name": "Computer Science",         // required — Department name
  "faculty": "Engineering",           // required — Faculty name
  "hodAdminId": "64abc123..."      // optional — HOD user ID
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Department created successfully",
  "data": {
    "id": "64def456...",
    "name": "Computer Science",
    "faculty": "Engineering"
  }
}
```

---

### GET /departments
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** super_admin

**Description:** Get all departments in the institution.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64def456...",
      "name": "Computer Science",
      "faculty": "Engineering",
      "hod": {
        "id": "64abc123...",
        "name": "Prof. John Doe"
      }
    }
  ]
}
```

---

### POST /sessions
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** super_admin

**Description:** Create a new academic session.

**Request Body:**
```json
{
  "name": "2023/2024",            // required — Session name
  "startDate": "2023-10-01",       // required — Session start date
  "endDate": "2024-06-30"          // required — Session end date
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "id": "64ghi789...",
    "name": "2023/2024",
    "isActive": true
  }
}
```

---

## 3. Admin Endpoints

### GET /admin/dashboard
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** admin

**Description:** Get department dashboard statistics and analytics.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "activeStudents": 142,
    "pendingLogs": 25,
    "approvedLogs": 1250,
    "submissionTrends": [ ... ],
    "companyDistribution": [ ... ]
  }
}
```

---

### GET /admin/students
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** admin

**Description:** Get list of students in the department.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |
| status | string | No | - | Filter by status |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "students": [ ... ],
    "pagination": { ... }
  }
}
```

---

### POST /admin/students
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** admin

**Description:** Create a new student in the department.

**Request Body:** Same as super-admin student creation

---

### GET /admin/logs
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** admin

**Description:** Get student activity logs for department oversight.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | - | Filter: pending, approved, rejected |
| studentId | string | No | - | Filter by specific student |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "64ijk123...",
        "student": { ... },
        "date": "2024-03-15",
        "title": "Web Development Activities",
        "status": "pending",
        "submittedAt": "2024-03-15T10:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### POST /admin/assignments
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** admin

**Description:** Assign a supervisor to a student.

**Request Body:**
```json
{
  "studentId": "64ijk123...",     // required — Student ID
  "supervisorId": "64lmn456..."   // required — Supervisor ID
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "id": "64opq789...",
    "student": { ... },
    "supervisor": { ... }
  }
}
```

---

## 4. Supervisor Endpoints

### GET /supervisor/dashboard
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** supervisor

**Description:** Get supervisor dashboard with assigned students statistics.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "assignedStudents": 25,
    "activeStudents": 23,
    "pendingReviews": 8,
    "completedReviews": 150,
    "recentActivity": [ ... ]
  }
}
```

---

### GET /supervisor/students
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** supervisor

**Description:** Get list of students assigned to this supervisor.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64ijk123...",
      "name": "Alice Student",
      "matricNumber": "CSC/2021/001",
      "company": "TechCorp Nigeria",
      "assignmentDate": "2024-01-15"
    }
  ]
}
```

---

### GET /supervisor/logs/pending
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** supervisor

**Description:** Get activity logs pending review from assigned students.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64ijk123...",
      "student": { ... },
      "date": "2024-03-15",
      "title": "Database Design",
      "description": "Designed database schema for...",
      "hoursWorked": 8,
      "submittedAt": "2024-03-15T14:30:00Z"
    }
  ]
}
```

---

### PUT /supervisor/logs/:id/approve
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** supervisor

**Description:** Approve a student's activity log.

**Request Body:**
```json
{
  "comment": "Good work on the database design" // optional — Supervisor's feedback
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Log approved successfully"
}
```

---

### PUT /supervisor/logs/:id/reject
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** supervisor

**Description:** Reject a student's activity log with feedback.

**Request Body:**
```json
{
  "comment": "Please provide more technical details about the implementation" // required — Rejection reason
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Log rejected successfully"
}
```

---

## 5. Student Endpoints

### GET /student/dashboard
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** student

**Description:** Get student dashboard with log statistics and progress.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalLogs": 45,
    "approvedLogs": 42,
    "pendingLogs": 3,
    "currentStreak": 7,
    "weeklyProgress": [ ... ],
    "requiredLogs": 60,
    "completionRate": 75
  }
}
```

---

### GET /student/logs
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** student

**Description:** Get student's own activity logs.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64ijk123...",
      "date": "2024-03-15",
      "title": "Web Development",
      "description": "Implemented user authentication system...",
      "hoursWorked": 8,
      "skillsLearned": ["React", "JWT", "Node.js"],
      "challenges": "Complex state management",
      "status": "approved",
      "supervisorFeedback": "Good implementation"
    }
  ]
}
```

---

### POST /student/logs
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** student

**Description:** Submit a new activity log.

**Request Body:**
```json
{
  "date": "2024-03-15",                    // required — Log date (YYYY-MM-DD)
  "title": "Web Development Activities",        // required — Log title
  "description": "Implemented user authentication system with JWT tokens. Created login and logout functionality. Worked on password hashing and validation.", // required — Min 50 characters
  "hoursWorked": 8,                         // required — 1-24 hours
  "skillsLearned": ["React", "JWT", "Node.js"], // optional — List of skills
  "challenges": "Complex state management"       // optional — Challenges faced
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Log submitted successfully",
  "data": {
    "id": "64ijk123...",
    "status": "pending"
  }
}
```

---

### PUT /student/logs/:id
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** student

**Description:** Update an existing activity log (only if not yet reviewed).

**Request Body:** Same as create log (all fields optional)

---

### POST /student/logs/:id/submit
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** student

**Description:** Submit a draft log for supervisor review.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Log submitted for review"
}
```

---

## 6. Shared/Common Endpoints

### GET /health
**Status:** ✅ COMPLETE  
**Auth Required:** No  
**Role Required:** None

**Description:** Health check endpoint to verify API is running.

**Success Response (200):**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-03-18T13:00:00Z",
  "uptime": 3600
}
```

---

### GET /search
**Status:** ✅ COMPLETE  
**Auth Required:** Yes  
**Role Required:** Any

**Description:** Global search across users, logs, and departments.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | Yes | - | Search query |
| type | string | No | all | Filter: users, logs, departments |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [ ... ],
    "logs": [ ... ],
    "departments": [ ... ]
  }
}
```

---

## Default Password Format

| Role | Login Identifier | Default Password |
|------|-----------------|-----------------|
| Super Admin | Email | Set at registration |
| Admin | Staff ID | `AMENTRA@{staffId}` |
| Supervisor | Staff ID | `AMENTRA@{staffId}` |
| Student | Matric Number | `AMENTRA@{matricNumber}` |

## Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- Can include special characters

## File Upload Limits
- **Max file size:** 10MB per file
- **Allowed types:** JPG, PNG, PDF, DOC, DOCX
- **Max files per log:** 5 media files

## Pagination
All list endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- Response includes pagination metadata

## Error Response Format
All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // Only for validation errors
}
```

## Known Issues & Limitations
1. **Bulk Import**: CSV import functionality exists but needs testing for large files
2. **File Upload**: Media upload endpoints work but file size validation needs improvement
3. **Email Service**: OTP emails may be delayed during high traffic
4. **Search Performance**: Global search can be slow with large datasets
5. **Report Generation**: PDF reports sometimes fail for very large datasets

## Changelog

### v1.0.0 — Initial Implementation
- ✅ Complete authentication flow with staffId/matric login
- ✅ First-login OTP verification system
- ✅ User creation for all roles (admin, supervisor, student)
- ✅ Default password generation with AMENTRA@ prefix
- ✅ Activity log submission and review workflow
- ✅ Department and session management
- ✅ Role-based access control
- ✅ Dashboard analytics for all user types
- ✅ File upload support for log media
- ✅ Global search functionality
- ✅ Health check and monitoring endpoints
