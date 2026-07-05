# High-Level Design (HLD) & Edge Cases Analysis
## AI-Powered IT Ticket Management System

---

## 📐 System Architecture Overview

### 1. System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  React Frontend (Vite + Tailwind CSS + DaisyUI)                │
│  - Landing Page, Login/Signup, Ticket Management UI            │
│  - Admin Dashboard, Moderator View, User Dashboard             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST API
                             │ (JWT Authentication)
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  Express.js Server (Node.js)                                    │
│  - REST API Endpoints                                           │
│  - Authentication Middleware                                    │
│  - CORS Configuration                                           │
└────────────┬───────────────────────────────┬───────────────────┘
             │                                │
    ┌────────▼────────┐            ┌─────────▼─────────┐
    │  CONTROLLERS    │            │   INNGEST         │
    │  - Ticket CRUD  │            │   Background Jobs │
    │  - User Auth    │            │   - AI Processing │
    └────────┬────────┘            └─────────┬─────────┘
             │                                │
    ┌────────▼────────────────────────────────▼────────┐
    │              BUSINESS LOGIC LAYER                 │
    │  - Ticket Creation & Management                 │
    │  - AI Analysis (Gemini API)                     │
    │  - Moderator Assignment Logic                   │
    │  - Email Notifications                          │
    └────────┬───────────────────────────────────────┘
             │
    ┌────────▼───────────────────────────────────────┐
    │              DATA LAYER                         │
    │  MongoDB Database                               │
    │  - User Collection                              │
    │  - Ticket Collection                            │
    └────────────────────────────────────────────────┘
             │
    ┌────────▼───────────────────────────────────────┐
    │         EXTERNAL SERVICES                      │
    │  - Google Gemini AI (AI Analysis)             │
    │  - Mailtrap/SMTP (Email Notifications)        │
    └────────────────────────────────────────────────┘
```

---

## 🏗️ Detailed Component Design

### 2.1 Frontend Architecture

**Technology Stack:**
- React 18+ (Component-based UI)
- Vite (Build tool & dev server)
- Tailwind CSS + DaisyUI (Styling)
- React Router (Client-side routing)

**Key Pages:**
- `landing.jsx` - Public landing page
- `login.jsx` / `signup.jsx` - Authentication
- `tickets.jsx` - Ticket list view
- `ticket.jsx` - Individual ticket details
- `admin.jsx` - Admin dashboard
- `moderators.jsx` - Moderator management

**State Management:**
- Local component state
- JWT token stored in localStorage
- Context/Props for user authentication state

### 2.2 Backend Architecture

**Technology Stack:**
- Node.js + Express.js (REST API server)
- MongoDB + Mongoose (Database & ODM)
- Inngest (Background job processing)
- JWT (Authentication)
- Nodemailer (Email service)
- Google Gemini AI (AI analysis)

**API Structure:**
```
/api/auth/*
  POST   /signup          - User registration
  POST   /login           - User authentication
  POST   /logout          - User logout
  GET    /users           - Get all users (admin)
  POST   /update-user     - Update user profile
  GET    /assignable-users - Get users for assignment

/api/tickets/*
  GET    /                - List tickets (filtered by role)
  GET    /:id             - Get ticket details
  POST   /                - Create new ticket
  PUT    /:id             - Update ticket
  DELETE /:id             - Delete ticket
  GET    /moderators      - Get moderator list

/api/inngest/*
  POST   /                - Inngest webhook endpoint
```

### 2.3 Database Schema

**User Collection:**
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed with bcrypt, required),
  role: String (enum: ["user", "moderator", "admin"], default: "user"),
  skills: [String],
  createdAt: Date
}
```

**Ticket Collection:**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  status: String (default: "TODO"),
  createdBy: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User, nullable),
  priority: String,
  deadline: Date,
  helpfulNotes: String,
  relatedSkills: [String],
  createdAt: Date
}

Indexes:
- { createdBy: 1, createdAt: -1 }
- { status: 1, createdAt: -1 }
- { assignedTo: 1 }
- { createdAt: -1 }
```

### 2.4 Background Processing (Inngest)

**Function: `onTicketCreated`**
```
Event: ticket/created
Steps:
1. fetch-ticket        - Retrieve ticket from DB
2. update-ticket-status - Set status to "TODO"
3. ai-analysis         - Call Gemini API for analysis
4. ai-processing       - Update ticket with AI insights
5. assign-moderator    - Match & assign based on skills
6. send-email-notification - Notify assigned moderator
```

**Retry Strategy:**
- 2 retries on failure
- Non-retriable errors: Ticket not found

---

## 🔄 System Flow Diagrams

### 3.1 Ticket Creation Flow

```
User submits ticket form
    ↓
Frontend validates input
    ↓
POST /api/tickets (with JWT)
    ↓
Auth middleware validates token
    ↓
Controller: createTicket()
    ├─ Validate title & description
    ├─ Create ticket in MongoDB
    ├─ Trigger Inngest event (async)
    └─ Start direct AI processing (fallback, async)
    ↓
Return 201 with ticket data
    ↓
[Background Processing]
    ├─ Inngest function executes
    │   ├─ Fetch ticket
    │   ├─ AI analysis (Gemini)
    │   ├─ Update ticket with AI data
    │   ├─ Match moderator by skills
    │   ├─ Assign ticket
    │   └─ Send email notification
    └─ Direct AI processing (if Inngest fails)
        ├─ AI analysis
        └─ Update ticket
```

### 3.2 Authentication Flow

```
User submits credentials
    ↓
POST /api/auth/login
    ↓
Controller: login()
    ├─ Find user by email
    ├─ Verify password (bcrypt)
    └─ Generate JWT token
    ↓
Return token + user data
    ↓
Frontend stores token in localStorage
    ↓
Subsequent requests include: Authorization: Bearer <token>
    ↓
Auth middleware validates token
    ↓
Request proceeds to controller
```

### 3.3 Ticket Assignment Flow

```
AI Analysis completes
    ↓
Extract relatedSkills from AI response
    ↓
Query User collection:
    ├─ Find moderator with matching skill (regex)
    └─ If no match, find admin
    ↓
Update ticket.assignedTo
    ↓
Send email to assigned moderator
```

---

## 🔐 Security Architecture

### 4.1 Authentication & Authorization

**JWT Token Structure:**
- Payload: `{ _id, email, role }`
- Secret: `JWT_SECRET` from environment
- **Current Issue:** No expiration (needs `expiresIn`)

**Role-Based Access Control:**
- **User:** Can create, view own tickets, delete own tickets
- **Moderator:** Can view all tickets, update assigned tickets, reassign own tickets
- **Admin:** Full access (view all, update any, delete any, manage users)

**Password Security:**
- bcrypt hashing with 10 rounds
- Passwords never returned in API responses

### 4.2 API Security

**CORS Configuration:**
- Whitelisted origins from `CORS_ORIGINS` env var
- Credentials enabled
- Specific methods and headers allowed

**Input Validation:**
- Basic validation in controllers
- Mongoose schema validators
- **Missing:** Input sanitization, XSS protection

**Error Handling:**
- Generic error messages to clients
- Detailed errors logged server-side
- No sensitive data in error responses

---

## 📊 Data Flow & State Management

### 5.1 Ticket State Transitions

```
TODO → IN_PROGRESS → RESOLVED
  ↑         ↓
  └─────────┘ (can be reassigned)
```

**Status Values:**
- `TODO` - Initial state, awaiting processing
- `IN_PROGRESS` - AI processed, assigned to moderator
- `RESOLVED` - Ticket closed (manual update)

### 5.2 AI Processing Pipeline

```
Raw Ticket Data
    ↓
Gemini AI Analysis
    ├─ Extract summary
    ├─ Determine priority (low/medium/high)
    ├─ Generate helpful notes
    └─ Identify related skills
    ↓
JSON Response Parsing
    ├─ Remove markdown formatting
    ├─ Extract JSON object
    └─ Validate structure
    ↓
Update Ticket Document
    ├─ priority
    ├─ helpfulNotes
    ├─ relatedSkills
    └─ status: "IN_PROGRESS"
```

### 5.3 Moderator Matching Algorithm

```
AI identifies skills: ["JavaScript", "React"]
    ↓
Query: User.find({
  role: "moderator",
  skills: { $regex: "JavaScript|React", $options: "i" }
})
    ↓
If match found → Assign
If no match → Assign to admin
```

**Current Limitation:**
- Regex matching can cause false positives (e.g., "Java" matches "JavaScript")
- No exact matching or skill ranking

---

## 🚀 Scalability Considerations

### 6.1 Current Architecture Limitations

1. **Single Server Instance**
   - No horizontal scaling
   - No load balancing

2. **Database**
   - Single MongoDB instance
   - No replica set or sharding

3. **AI Processing**
   - Sequential processing
   - No rate limiting
   - No caching

4. **Email Service**
   - Direct SMTP calls
   - No queue for retries

### 6.2 Scaling Strategies

**For 10K tickets/day:**

1. **API Layer:**
   - Horizontal scaling (multiple Express instances)
   - Load balancer (Nginx/HAProxy)
   - Session stickiness for stateful operations

2. **Database:**
   - MongoDB replica set (read scaling)
   - Sharding for write scaling
   - Connection pooling
   - Additional indexes based on query patterns

3. **Background Jobs:**
   - Queue system (BullMQ/Redis)
   - Rate limiting for AI API calls
   - Batch processing
   - Priority queues

4. **Caching:**
   - Redis for frequently accessed data
   - Cache ticket lists, user data
   - TTL-based invalidation

5. **Email:**
   - Transactional email service (SendGrid/AWS SES)
   - Queue-based sending
   - Retry mechanism with exponential backoff

---

## 🐛 Edge Cases & Error Scenarios

### 7.1 Authentication Edge Cases

#### EC-1: Token Expiration (Not Currently Handled)
**Scenario:** JWT token has no expiration, but if it did expire
**Impact:** User gets 401 error mid-session
**Solution:**
- Implement refresh tokens
- Auto-refresh on 401 response
- Store refresh token in httpOnly cookie

#### EC-2: Invalid Token Format
**Scenario:** Malformed token in Authorization header
**Impact:** 401 error, user logged out
**Current Handling:** ✅ Caught in auth middleware
**Improvement:** More specific error message

#### EC-3: User Deleted While Token Valid
**Scenario:** Admin deletes user, but user still has valid token
**Impact:** User can still access system
**Solution:**
- Check user exists in DB on each request
- Maintain token blacklist (Redis)
- Or add user status field (active/inactive)

#### EC-4: Concurrent Login Sessions
**Scenario:** User logs in from multiple devices
**Impact:** Multiple valid tokens exist
**Current Handling:** ✅ Allowed (no session management)
**Consideration:** Add device tracking or single-session enforcement

### 7.2 Ticket Creation Edge Cases

#### EC-5: Missing Required Fields
**Scenario:** Frontend sends ticket without title/description
**Impact:** 400 error returned
**Current Handling:** ✅ Validated in controller
**Improvement:** More detailed validation errors

#### EC-6: Very Long Title/Description
**Scenario:** User submits 10,000 character description
**Impact:** 
- Database storage issues
- AI API token limits
- Performance degradation
**Solution:**
- Add max length validation (e.g., title: 200, description: 5000)
- Truncate for AI analysis if needed
- Store full text, analyze summary

#### EC-7: Special Characters in Ticket Data
**Scenario:** User includes HTML, SQL injection attempts, XSS payloads
**Impact:** Security vulnerabilities
**Current Handling:** ⚠️ Not sanitized
**Solution:**
- Input sanitization library (DOMPurify, validator.js)
- HTML escaping
- MongoDB injection prevention (Mongoose handles this)

#### EC-8: Duplicate Ticket Creation
**Scenario:** User accidentally submits same ticket twice
**Impact:** Duplicate tickets in system
**Current Handling:** ⚠️ No deduplication
**Solution:**
- Client-side debouncing
- Server-side duplicate detection (hash of title+description+user)
- Show warning to user

#### EC-9: Ticket Creation During Database Outage
**Scenario:** MongoDB connection lost during ticket creation
**Impact:** 500 error, ticket not created
**Current Handling:** ✅ Error caught, 500 returned
**Improvement:**
- Retry mechanism with exponential backoff
- Queue ticket creation for later processing
- Graceful degradation message

### 7.3 AI Processing Edge Cases

#### EC-10: Gemini API Timeout
**Scenario:** AI API takes > 30 seconds or times out
**Impact:** Ticket stuck in TODO status
**Current Handling:** ⚠️ Inngest retries, but may still fail
**Solution:**
- Increase timeout
- Fallback to rule-based priority assignment
- Manual trigger for failed tickets

#### EC-11: Invalid JSON from AI
**Scenario:** Gemini returns malformed JSON or markdown
**Impact:** AI analysis fails, fallback used
**Current Handling:** ✅ Try-catch with fallback
**Improvement:**
- Better JSON extraction (multiple parsing strategies)
- Retry with different prompt
- Log for monitoring

#### EC-12: AI API Rate Limiting
**Scenario:** Too many tickets created simultaneously
**Impact:** API rate limit exceeded, some tickets fail
**Current Handling:** ⚠️ No rate limiting
**Solution:**
- Queue with rate limiter (e.g., 10 requests/second)
- Batch processing
- Exponential backoff on 429 errors

#### EC-13: AI Returns Invalid Priority
**Scenario:** AI returns priority not in ["low", "medium", "high"]
**Impact:** Invalid priority stored
**Current Handling:** ✅ Validated and defaulted to "medium"
**Status:** ✅ Handled correctly

#### EC-14: AI Returns Empty Skills Array
**Scenario:** AI cannot identify skills
**Impact:** No moderator match, assigned to admin
**Current Handling:** ✅ Falls back to admin
**Status:** ✅ Handled correctly

#### EC-15: Both Inngest and Direct AI Processing Succeed
**Scenario:** Inngest event succeeds AND direct processing runs
**Impact:** Ticket updated twice, potential race condition
**Current Handling:** ⚠️ No deduplication
**Solution:**
- Add processing flag to ticket (e.g., `aiProcessing: true`)
- Check flag before processing
- Use atomic update with condition

### 7.4 Moderator Assignment Edge Cases

#### EC-16: No Moderators Available
**Scenario:** No moderators exist in system
**Impact:** Ticket assigned to admin (if exists)
**Current Handling:** ✅ Falls back to admin
**Edge Case:** What if no admin exists?
**Solution:**
- Ensure at least one admin during setup
- Validation on user creation
- Alert if no assignable users

#### EC-17: Moderator Deleted During Assignment
**Scenario:** Moderator deleted while ticket being assigned
**Impact:** Assignment fails or references invalid user
**Current Handling:** ⚠️ No validation after assignment
**Solution:**
- Validate user exists before assignment
- Handle case where assignedTo user deleted (reassign to admin)

#### EC-18: Skill Matching False Positives
**Scenario:** "Java" skill matches "JavaScript" (regex issue)
**Impact:** Wrong moderator assigned
**Current Handling:** ⚠️ Regex matching has this flaw
**Solution:**
- Exact matching with case-insensitive comparison
- Skill normalization (lowercase, trim)
- Skill ranking/priority system

#### EC-19: Moderator Already Has Max Tickets
**Scenario:** Moderator assigned 100 tickets, new ticket comes in
**Impact:** Overloaded moderator
**Current Handling:** ⚠️ No load balancing
**Solution:**
- Track ticket count per moderator
- Distribute evenly
- Priority-based assignment

#### EC-20: Concurrent Assignment Race Condition
**Scenario:** Two tickets match same moderator simultaneously
**Impact:** Both assigned, no load consideration
**Current Handling:** ⚠️ No locking mechanism
**Solution:**
- Optimistic locking with version field
- Redis distributed locks
- Database transactions

### 7.5 Email Notification Edge Cases

#### EC-21: Email Service Down
**Scenario:** SMTP server unavailable
**Impact:** Email not sent, but ticket still assigned
**Current Handling:** ✅ Non-blocking, error logged
**Status:** ✅ Handled correctly (non-critical)

#### EC-22: Invalid Email Address
**Scenario:** Moderator email is invalid/malformed
**Impact:** Email fails to send
**Current Handling:** ⚠️ Error logged but not handled
**Solution:**
- Validate email format on user creation
- Retry with different email
- Admin notification if email fails

#### EC-23: Email Rate Limiting
**Scenario:** Too many emails sent quickly
**Impact:** SMTP rate limit exceeded
**Current Handling:** ⚠️ No rate limiting
**Solution:**
- Queue emails with rate limiter
- Batch notifications
- Use transactional email service

#### EC-24: Admin Assigns Ticket to Themselves
**Scenario:** Admin manually assigns ticket to their own email
**Impact:** Unnecessary email sent
**Current Handling:** ✅ Skipped in mailer.js
**Status:** ✅ Handled correctly

### 7.6 Ticket Update Edge Cases

#### EC-25: User Tries to Update Ticket They Don't Own
**Scenario:** Regular user tries to update another user's ticket
**Impact:** 403 Forbidden
**Current Handling:** ✅ Role check in controller
**Status:** ✅ Handled correctly

#### EC-26: Update Non-Existent Ticket
**Scenario:** PUT /api/tickets/invalid-id
**Impact:** 404 Not Found
**Current Handling:** ✅ Checked in controller
**Status:** ✅ Handled correctly

#### EC-27: Assign Ticket to Deleted User
**Scenario:** Admin assigns ticket to user that was just deleted
**Impact:** Invalid reference in database
**Current Handling:** ✅ Validates user exists before assignment
**Status:** ✅ Handled correctly

#### EC-28: Assign Ticket to Regular User (Not Moderator)
**Scenario:** Admin tries to assign to user with role "user"
**Impact:** 400 Bad Request
**Current Handling:** ✅ Validates role before assignment
**Status:** ✅ Handled correctly

#### EC-29: Moderator Reassigns Ticket Not Assigned to Them
**Scenario:** Moderator tries to reassign ticket assigned to another moderator
**Impact:** 403 Forbidden
**Current Handling:** ✅ Checks current assignment
**Status:** ✅ Handled correctly

#### EC-30: Concurrent Updates to Same Ticket
**Scenario:** Two admins update ticket simultaneously
**Impact:** Last write wins, potential data loss
**Current Handling:** ⚠️ No optimistic locking
**Solution:**
- Add version field to ticket
- Check version on update
- Return conflict error if version mismatch

### 7.7 Ticket Deletion Edge Cases

#### EC-31: Delete Ticket That Doesn't Exist
**Scenario:** DELETE /api/tickets/invalid-id
**Impact:** 404 Not Found
**Current Handling:** ✅ Checked in controller
**Status:** ✅ Handled correctly

#### EC-32: User Tries to Delete Another User's Ticket
**Scenario:** Regular user tries to delete ticket they didn't create
**Impact:** 404 (appears as not found, not permission denied)
**Current Handling:** ⚠️ Could be more explicit
**Improvement:** Return 403 if ticket exists but user lacks permission

#### EC-33: Delete Ticket While Inngest Processing
**Scenario:** Ticket deleted while AI analysis in progress
**Impact:** Inngest function may fail or update deleted ticket
**Current Handling:** ⚠️ No check in Inngest function
**Solution:**
- Check ticket exists in each Inngest step
- Handle gracefully if deleted
- Cancel processing if ticket deleted

### 7.8 Database Edge Cases

#### EC-34: MongoDB Connection Lost
**Scenario:** Network issue or MongoDB down
**Impact:** All database operations fail
**Current Handling:** ⚠️ Errors returned to client
**Solution:**
- Connection retry logic
- Health check endpoint
- Graceful degradation
- Circuit breaker pattern

#### EC-35: Duplicate Email Registration
**Scenario:** Two users try to register with same email simultaneously
**Impact:** One succeeds, one gets error
**Current Handling:** ✅ Unique index prevents duplicate
**Status:** ✅ Handled correctly

#### EC-36: Database Index Corruption
**Scenario:** Index becomes corrupted or missing
**Impact:** Slow queries, potential duplicates
**Current Handling:** ⚠️ No monitoring
**Solution:**
- Index health checks
- Automated index recreation
- Monitoring and alerts

### 7.9 Frontend-Backend Integration Edge Cases

#### EC-37: CORS Error on API Call
**Scenario:** Frontend origin not in whitelist
**Impact:** Request blocked by browser
**Current Handling:** ✅ CORS configured
**Edge Case:** What if origin changes?
**Solution:**
- Environment-based CORS configuration
- Wildcard for development (not production)

#### EC-38: Network Timeout
**Scenario:** API call takes too long
**Impact:** Frontend shows loading state indefinitely
**Current Handling:** ⚠️ No timeout configuration
**Solution:**
- Set request timeout (e.g., 30s)
- Show timeout error to user
- Retry mechanism

#### EC-39: Token Stored But User Deleted
**Scenario:** User deleted, but token still in localStorage
**Impact:** 401 errors on all requests
**Current Handling:** ✅ Auth middleware rejects invalid token
**Improvement:** Clear localStorage on 401

#### EC-40: Stale Data After Update
**Scenario:** User updates ticket, but another user's view is stale
**Impact:** Inconsistent UI state
**Current Handling:** ⚠️ No real-time updates
**Solution:**
- WebSocket for real-time updates
- Polling mechanism
- Optimistic UI updates

---

## 🔧 Recommended Improvements

### 8.1 Critical Fixes

1. **JWT Expiration**
   - Add `expiresIn` to token generation
   - Implement refresh token mechanism

2. **Input Sanitization**
   - Add DOMPurify or similar for XSS protection
   - Validate and sanitize all user inputs

3. **Race Condition Prevention**
   - Add version field for optimistic locking
   - Use Redis locks for critical operations

4. **AI Processing Deduplication**
   - Add `aiProcessing` flag to prevent duplicate processing
   - Atomic updates with conditions

### 8.2 High Priority

5. **Error Handling**
   - Centralized error handler middleware
   - Structured error responses
   - Error logging service (e.g., Sentry)

6. **Rate Limiting**
   - API rate limiting (express-rate-limit)
   - AI API rate limiting
   - Email rate limiting

7. **Monitoring & Logging**
   - Structured logging (Winston/Pino)
   - Application monitoring (New Relic/DataDog)
   - Health check endpoints

8. **Testing**
   - Unit tests for controllers and utilities
   - Integration tests for API endpoints
   - E2E tests for critical flows

### 8.3 Medium Priority

9. **Caching**
   - Redis for frequently accessed data
   - Cache ticket lists
   - Cache user data

10. **Skill Matching Improvement**
    - Exact matching instead of regex
    - Skill normalization
    - Skill ranking/priority

11. **Load Balancing**
    - Track ticket count per moderator
    - Distribute assignments evenly
    - Priority-based assignment

12. **Real-time Updates**
    - WebSocket for ticket updates
    - Live notifications
    - Optimistic UI updates

---

## 📝 Summary

This HLD document provides a comprehensive overview of the AI-powered IT ticket management system, including:

- **System Architecture:** Component breakdown and interactions
- **Data Flow:** Request/response patterns and state transitions
- **Security:** Authentication, authorization, and security considerations
- **Scalability:** Current limitations and scaling strategies
- **Edge Cases:** 40+ identified edge cases with current handling and recommendations

The system demonstrates a solid MVP architecture with room for production-ready improvements in security, reliability, and scalability.

