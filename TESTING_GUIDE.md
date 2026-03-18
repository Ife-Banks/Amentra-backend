# A-Mentra API Testing Guide

## Prerequisites

### Required Tools
- **Postman** (Recommended) - [Download Postman](https://www.postman.com/downloads/)
- **Insomnia** (Alternative) - [Download Insomnia](https://insomnia.rest/download)
- **Git Bash** or **Windows Terminal** for cURL commands

### Environment Setup
1. Backend must be running on `localhost:5000`
2. MongoDB should be connected
3. Redis should be running for session management

### How to Check Backend is Running
Open your browser and visit: `http://localhost:5000/api/health`

You should see:
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "...",
  "uptime": 3600
}
```

## Quick Start (5 Steps to First Successful API Call)

### Step 1: Install Postman
Download and install Postman from [postman.com](https://www.postman.com/downloads/)

### Step 2: Import Environment
Create a new environment in Postman with these variables:

```json
{
  "name": "A-Mentra Local",
  "values": [
    { "key": "baseUrl", "value": "http://localhost:5000/api", "enabled": true },
    { "key": "token", "value": "", "enabled": true },
    { "key": "institutionId", "value": "", "enabled": true }
  ]
}
```

### Step 3: Set Environment as Active
Select "A-Mentra Local" from the environment dropdown in Postman

### Step 4: Create First Request
Create a new GET request:
- **Method:** GET
- **URL:** `{{baseUrl}}/health`
- **Headers:** None needed
- **Body:** None

Click **Send** - you should get a successful response

### Step 5: Test Authentication
Create a new POST request:
- **Method:** POST
- **URL:** `{{baseUrl}}/auth/login`
- **Headers:** 
  - `Content-Type: application/json`
- **Body:** 
  ```json
  {
    "identifier": "TEST001",
    "password": "AMENTRA@TEST001"
  }
  ```

## Test Scenarios

### Scenario 1: Register a New Institution

**Objective:** Create a complete institution setup with super admin

#### Step 1: Register Institution
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/auth/register-organization`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "institutionName": "Test University",
    "address": "123 Test Street, Lagos, Nigeria",
    "type": "University",
    "city": "Lagos",
    "state": "Lagos State",
    "website": "https://testuniversity.edu.ng",
    "adminName": "Test Super Admin",
    "adminEmail": "admin@testuniversity.edu.ng",
    "adminPassword": "Admin@12345"
  }
  ```

**Expected Response (201):**
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

#### Step 2: Check Email for OTP
- Check your email (including spam folder)
- Look for OTP code (6-digit number)
- Note: In development, OTP might be logged in console

#### Step 3: Verify OTP
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/auth/verify-otp`
- **Body:**
  ```json
  {
    "userId": "COPY_USER_ID_FROM_STEP_1",
    "otp": "123456"
  }
  ```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

#### Step 4: Login as Super Admin
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/auth/login`
- **Body:**
  ```json
  {
    "identifier": "admin@testuniversity.edu.ng",
    "password": "Admin@12345"
  }
  ```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isFirstLogin": false,
  "userId": "64abc123...",
  "user": { ... }
}
```

#### Step 5: Save Token to Environment
Copy the `token` value from response and update your Postman environment:
- Set `token` variable to the copied JWT token

---

### Scenario 2: Super Admin Creates a Department Admin

**Prerequisites:** Must be logged in as super admin with valid token

#### Step 1: Create Department (if none exists)
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/departments`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body:**
  ```json
  {
    "name": "Computer Science",
    "faculty": "Engineering"
  }
  ```

**Expected Response (201):**
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

#### Step 2: Create Admin
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/super-admin/admins`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body:**
  ```json
  {
    "name": "John Department Admin",
    "email": "john.admin@testuniversity.edu.ng",
    "staffId": "STAFF001",
    "departmentId": "COPY_DEPARTMENT_ID_FROM_STEP_1"
  }
  ```

**Expected Response (201):**
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

#### Step 3: Note Default Password
Copy the `defaultPassword` value: `AMENTRA@STAFF001`

#### Step 4: Login as New Admin
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/auth/login`
- **Body:**
  ```json
  {
    "identifier": "STAFF001",
    "password": "AMENTRA@STAFF001"
  }
  ```

#### Step 5: Complete First-Login Flow
Since this is first login, you'll get `isFirstLogin: true`. Follow Scenario 1 steps 2-3 to:
- Send OTP using `/auth/send-otp`
- Verify OTP using `/auth/verify-otp`
- Change password using `/auth/change-password-first-login`

---

### Scenario 3: Admin Creates a Student

**Prerequisites:** Logged in as admin with valid token

#### Step 1: Create Academic Session (if none exists)
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/sessions`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body:**
  ```json
  {
    "name": "2023/2024",
    "startDate": "2023-10-01",
    "endDate": "2024-06-30"
  }
  ```

#### Step 2: Create Student
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/admin/students`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body:**
  ```json
  {
    "name": "Alice Student",
    "email": "alice.student@testuniversity.edu.ng",
    "matricNumber": "CSC/2021/001",
    "departmentId": "COPY_DEPARTMENT_ID",
    "company": "TechCorp Nigeria",
    "companyAddress": "Ikoyi, Lagos",
    "companyState": "Lagos",
    "companyCity": "Lagos",
    "sessionId": "COPY_SESSION_ID",
    "startDate": "2024-01-15",
    "endDate": "2024-06-15"
  }
  ```

**Expected Response (201):**
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

#### Step 3: Note Default Password
Copy the default password: `AMENTRA@CSC/2021/001`

#### Step 4: Login as Student
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/auth/login`
- **Body:**
  ```json
  {
    "identifier": "CSC/2021/001",
    "password": "AMENTRA@CSC/2021/001"
  }
  ```

#### Step 5: Complete First-Login Flow
Follow the same OTP verification process as Scenario 1

---

### Scenario 4: Student Submits Activity Log

**Prerequisites:** Logged in as student, first-login complete

#### Step 1: Submit Activity Log
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/student/logs`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body:**
  ```json
  {
    "date": "2024-03-18",
    "title": "Web Development Activities",
    "description": "Today I worked on implementing user authentication system using JWT tokens. I created login and logout functionality, implemented password hashing using bcrypt, and set up middleware for route protection. I also learned about session management and token refresh mechanisms.",
    "hoursWorked": 8,
    "skillsLearned": ["React", "JWT", "Node.js", "bcrypt"],
    "challenges": "Understanding token refresh flow was challenging at first"
  }
  ```

**Expected Response (201):**
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

#### Step 2: View Submitted Logs
**Request:**
- **Method:** GET
- **URL:** `{{baseUrl}}/student/logs`
- **Headers:** `Authorization: Bearer {{token}}`

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64ijk123...",
      "date": "2024-03-18",
      "title": "Web Development Activities",
      "description": "...",
      "hoursWorked": 8,
      "skillsLearned": ["React", "JWT", "Node.js", "bcrypt"],
      "challenges": "Understanding token refresh flow",
      "status": "pending"
    }
  ]
}
```

#### Step 3: Submit Log for Review
**Request:**
- **Method:** POST
- **URL:** `{{baseUrl}}/student/logs/64ijk123/submit`
- **Headers:** `Authorization: Bearer {{token}}`

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Log submitted for review"
}
```

---

### Scenario 5: Supervisor Reviews a Log

**Prerequisites:** Logged in as supervisor

#### Step 1: View Assigned Students
**Request:**
- **Method:** GET
- **URL:** `{{baseUrl}}/supervisor/students`
- **Headers:** `Authorization: Bearer {{token}}`

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64ijk123...",
      "name": "Alice Student",
      "matricNumber": "CSC/2021/001",
      "company": "TechCorp Nigeria"
    }
  ]
}
```

#### Step 2: View Pending Logs
**Request:**
- **Method:** GET
- **URL:** `{{baseUrl}}/supervisor/logs/pending`
- **Headers:** `Authorization: Bearer {{token}}`

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64ijk123...",
      "student": { ... },
      "date": "2024-03-18",
      "title": "Web Development Activities",
      "description": "...",
      "hoursWorked": 8,
      "status": "pending"
    }
  ]
}
```

#### Step 3: Approve Log
**Request:**
- **Method:** PUT
- **URL:** `{{baseUrl}}/supervisor/logs/64ijk123/approve`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body:**
  ```json
  {
    "comment": "Good work on implementing authentication. The description is detailed and shows good understanding of JWT concepts."
  }
  ```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Log approved successfully"
}
```

#### Step 4: Reject Log (Alternative)
**Request:**
- **Method:** PUT
- **URL:** `{{baseUrl}}/supervisor/logs/64ijk123/reject`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer {{token}}`
- **Body:**
  ```json
  {
    "comment": "Please provide more specific examples of the challenges you faced and how you overcame them."
  }
  ```

## How to Use JWT in Postman

### Method 1: Manual Token Management

#### Step 1: Get Token
1. Make a login request
2. Copy the `token` value from response
3. Go to Postman environment variables
4. Update the `token` variable with the copied value

#### Step 2: Use Token in Requests
1. Open any protected endpoint request
2. Go to **Authorization** tab
3. Select **Bearer Token** from Type dropdown
4. In the Token field, enter: `{{token}}`
5. Postman will automatically replace `{{token}}` with your environment variable

### Method 2: Automatic Token Collection (Recommended)

#### Step 1: Create Collection
1. Create a new collection called "A-Mentra API"
2. Move all A-Mentra requests into this collection

#### Step 2: Set Collection Variables
1. Right-click collection → **Edit**
2. Go to **Variables** tab
3. Add these variables:
   - `baseUrl`: `http://localhost:5000/api`
   - `token`: (leave empty initially)

#### Step 3: Set Authorization at Collection Level
1. In collection edit, go to **Authorization** tab
2. Select **Bearer Token**
3. In Token field: `{{token}}`
4. Save collection

#### Step 4: Test Script for Auto Token
In the login request, go to **Tests** tab and add:

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.token) {
        pm.collectionVariables.set('token', response.token);
        pm.collectionVariables.set('userId', response.userId);
        console.log('Token saved to collection variables');
    }
}
```

Now when you login, the token will be automatically saved and used for all requests in the collection!

## Common Errors & Fixes

| Error | Status | Cause | Fix |
|-------|--------|-------|-----|
| "Validation failed" | 400 | Missing required field or invalid data | Check request body against schema documentation |
| "Invalid credentials" | 401 | Wrong password/identifier | Verify staffId/matric format and default password |
| "Unauthorized" | 401 | Missing/expired token | Re-login and get new token |
| "Forbidden" | 403 | Wrong role for endpoint | Use correct account type (admin vs super_admin) |
| "User not found" | 404 | User ID doesn't exist | Check user ID in database |
| "Email already exists" | 409 | Duplicate email registration | Use different email address |
| "Internal server error" | 500 | Backend crash or database issue | Check server console logs |
| "OTP expired" | 400 | OTP code too old | Request new OTP |
| "Invalid OTP" | 400 | Wrong OTP code | Check email for correct code |

## Default Password Format

| Role | Login Identifier | Default Password |
|------|-----------------|-----------------|
| Super Admin | Email | Set during registration |
| Admin | Staff ID | `AMENTRA@{staffId}` |
| Supervisor | Staff ID | `AMENTRA@{staffId}` |
| Student | Matric Number | `AMENTRA@{matricNumber}` |

**Examples:**
- Admin with staffId "STAFF001" → Password: `AMENTRA@STAFF001`
- Student with matric "CSC/2021/001" → Password: `AMENTRA@CSC/2021/001`

## Environment Setup for Postman

Copy this JSON and import into Postman (File → Import → Raw text):

```json
{
  "info": {
    "name": "A-Mentra Testing Environment",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api",
      "type": "string"
    },
    {
      "key": "token",
      "value": "",
      "type": "string"
    },
    {
      "key": "institutionId",
      "value": "",
      "type": "string"
    },
    {
      "key": "departmentId",
      "value": "",
      "type": "string"
    },
    {
      "key": "sessionId",
      "value": "",
      "type": "string"
    }
  ]
}
```

## Testing Checklist

### Before Starting Tests
- [ ] Backend is running (`localhost:5000`)
- [ ] MongoDB is connected
- [ ] Redis is running
- [ ] Environment variables are set
- [ ] Postman environment is configured

### Authentication Testing
- [ ] Register new institution
- [ ] Receive OTP via email
- [ ] Verify OTP
- [ ] Login with default password
- [ ] Complete first-login flow
- [ ] Login with new password
- [ ] Refresh expired token
- [ ] Logout successfully

### User Management Testing
- [ ] Super admin creates department
- [ ] Super admin creates admin
- [ ] Admin creates supervisor
- [ ] Admin creates student
- [ ] All users can login with default passwords
- [ ] All users complete first-login flow

### Activity Log Testing
- [ ] Student submits log
- [ ] Student views own logs
- [ ] Student edits draft log
- [ ] Student submits log for review
- [ ] Supervisor views pending logs
- [ ] Supervisor approves log
- [ ] Supervisor rejects log
- [ ] Student sees approved/rejected status

### File Upload Testing
- [ ] Student uploads images with log
- [ ] Student uploads PDF with log
- [ ] File size validation works
- [ ] File type validation works

### Error Handling Testing
- [ ] Invalid credentials return 401
- [ ] Missing fields return 400
- [ ] Expired token returns 401
- [ ] Wrong role returns 403
- [ ] Server errors return 500

## Tips for Effective Testing

1. **Use the Console:** Always check browser console and Postman console for errors
2. **Test Edge Cases:** Try empty fields, very long strings, special characters
3. **Verify Database:** Check MongoDB directly to confirm data changes
4. **Test Performance:** Use large datasets to test pagination
5. **Security Testing:** Try SQL injection, XSS in text fields
6. **File Testing:** Upload various file types and sizes
7. **Token Testing:** Test expired tokens, invalid tokens, missing tokens
8. **Role Testing:** Try accessing endpoints with wrong user roles

## Troubleshooting

### Backend Won't Start
- Check if port 5000 is available
- Verify MongoDB connection string
- Check environment variables

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure network connectivity

### OTP Not Received
- Check email configuration in .env
- Verify SendGrid API key
- Check spam folder

### File Upload Fails
- Check file size limits
- Verify Cloudinary configuration
- Check file type restrictions

### Token Issues
- Verify JWT secrets in .env
- Check token expiry settings
- Ensure proper Authorization header format

Happy Testing! 🚀
