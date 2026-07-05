# Interview Preparation Guide - AI Ticket Management System

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Deep Technical Questions & Answers](#deep-technical-questions--answers)
4. [Design Decisions & Trade-offs](#design-decisions--trade-offs)
5. [Security Questions](#security-questions)
6. [Scalability Questions](#scalability-questions)
7. [Performance Optimization](#performance-optimization)
8. [Error Handling & Resilience](#error-handling--resilience)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Future Improvements](#future-improvements)

---

## Project Overview

**What is this project?**
- A full-stack IT ticket management system with AI-powered triage
- Users create tickets, AI analyzes them, and moderators/admin handle resolution
- Features: Role-based access control, automated ticket assignment, email notifications

**Key Features:**
- User authentication (JWT-based)
- Ticket CRUD operations
- AI-powered ticket analysis using Google Gemini
- Automated ticket assignment based on skills matching
- Email notifications
- Role-based permissions (user, moderator, admin)
- Background job processing with Inngest

---

## Architecture & Tech Stack

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 5.x
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt (10 rounds)
- **Background Jobs:** Inngest
- **AI Integration:** Google Gemini via @inngest/agent-kit
- **Email:** Nodemailer (Mailtrap/SMTP)

### Frontend
- **Framework:** React
- **Build Tool:** Vite
- **Routing:** React Router
- **Styling:** Inline styles (modern gradient design)

### Infrastructure
- **Development:** Nodemon for hot reload
- **Environment:** dotenv for configuration

---

## Deep Technical Questions & Answers

### 1. **Why did you choose Inngest for background jobs instead of alternatives like Bull, BullMQ, or AWS SQS?**

**Answer:**
- **Developer Experience:** Inngest provides a great local development experience with `inngest-cli dev`
- **Built-in Retries:** Automatic retry logic with configurable retry strategies
- **Step Functions:** The `step.run()` pattern allows for better observability and debugging
- **Type Safety:** Better TypeScript support and event-driven architecture
- **Serverless-Friendly:** Works well with serverless deployments
- **Alternative Consideration:** For high-scale production, I'd consider BullMQ with Redis for more control over queue management

**Trade-off:** Inngest is newer and has less community support compared to Bull/BullMQ, but offers better DX for this use case.

---

### 2. **I see you have both Inngest and direct AI processing in `createTicket`. Why the dual approach?**

**Answer:**
This is a **fallback mechanism** for resilience:

1. **Primary Path:** Inngest event is sent for async processing (better for scalability)
2. **Fallback Path:** Direct AI processing with `setTimeout` ensures ticket gets processed even if Inngest fails

**Why this design?**
- **Reliability:** If Inngest service is down, tickets still get processed
- **User Experience:** Users don't wait for AI analysis, but it happens eventually
- **Graceful Degradation:** System continues to function even if background job service fails

**Improvement:** In production, I'd add a flag to prevent duplicate processing and use a distributed lock (Redis) to ensure only one process handles the ticket.

---

### 3. **How does your AI ticket analysis work? Walk me through the flow.**

**Answer:**

**Flow:**
1. User creates ticket → `createTicket` controller
2. Ticket saved to MongoDB
3. Inngest event `ticket/created` triggered
4. Inngest function `onTicketCreated` executes:
   - **Step 1:** Fetch ticket from DB
   - **Step 2:** Update status to "TODO"
   - **Step 3:** Run AI analysis via `analyzeTicket()`:
     - Uses Gemini 1.5 Flash model
     - Sends ticket title + description
     - AI returns JSON: `{summary, priority, helpfulNotes, relatedSkills}`
   - **Step 4:** Update ticket with AI insights
   - **Step 5:** Find matching moderator by skills (regex match)
   - **Step 6:** Assign ticket to moderator
   - **Step 7:** Send email notification

**AI Prompt Engineering:**
- System prompt defines the AI's role as "expert AI assistant"
- Explicit JSON format requirement
- Handles markdown stripping and JSON parsing with fallbacks

---

### 4. **How do you handle JSON parsing from AI responses? I see multiple parsing attempts.**

**Answer:**

**Problem:** LLMs sometimes return markdown-wrapped JSON or extra text

**Solution (Multi-layer parsing):**
```javascript
1. Remove markdown code fences: ```json ... ```
2. Extract JSON object using regex: /\{[\s\S]*\}/
3. Parse with JSON.parse()
4. Fallback: Return default analysis if parsing fails
```

**Why this approach?**
- **Robustness:** Handles various AI response formats
- **User Experience:** Never fails completely - always provides some analysis
- **Observability:** Logs raw response for debugging

**Improvement:** Could use a more sophisticated parser or ask AI to return only JSON in a separate call.

---

### 5. **Explain your database schema design. Why these indexes?**

**Answer:**

**Ticket Schema:**
```javascript
- title, description, category, priority, deadline
- createdBy (ObjectId ref to User)
- assignedTo (ObjectId ref to User, nullable)
- status (default: "TODO")
- helpfulNotes (AI-generated)
- relatedSkills (array)
- createdAt (indexed)
```

**Indexes:**
1. `{ createdBy: 1, createdAt: -1 }` - User's ticket queries (most common)
2. `{ status: 1, createdAt: -1 }` - Status filtering + sorting
3. `{ assignedTo: 1 }` - Assignment queries
4. `{ createdAt: -1 }` - General sorting

**Why these indexes?**
- **Query Patterns:** Based on actual query patterns in controllers
- **Compound Indexes:** Support both filtering and sorting efficiently
- **Coverage:** Covers all major query paths

**Missing Index:** Could add `{ priority: 1, status: 1 }` for priority-based filtering

---

### 6. **How does your authentication middleware work? Security concerns?**

**Answer:**

**Current Implementation:**
```javascript
1. Extract token from Authorization header: "Bearer <token>"
2. Verify JWT with JWT_SECRET
3. Attach decoded user to req.user
4. Continue to next middleware
```

**Security Concerns & Solutions:**

**✅ Good:**
- Token verification before processing
- Environment variable for secret

**⚠️ Improvements Needed:**
1. **Token Expiration:** Current tokens don't expire - add `expiresIn` in JWT sign
2. **Refresh Tokens:** Implement refresh token rotation
3. **Rate Limiting:** Add rate limiting to prevent brute force
4. **Token Blacklist:** Store revoked tokens (Redis) for logout
5. **HTTPS Only:** Ensure tokens only sent over HTTPS in production
6. **Token Storage:** Frontend uses localStorage (XSS risk) - consider httpOnly cookies

**Production Solution:**
```javascript
// Token with expiration
const token = jwt.sign(
  { _id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m' } // Short-lived access token
);

// Refresh token (longer-lived, stored in httpOnly cookie)
const refreshToken = jwt.sign(
  { _id: user._id, type: 'refresh' },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);
```

---

### 7. **How does role-based access control work in your system?**

**Answer:**

**Roles:**
- **user:** Can create/view own tickets, delete own tickets
- **moderator:** Can view all tickets, update tickets, assign tickets (only reassign their own)
- **admin:** Full access - can delete any ticket, update users, view all data

**Implementation:**
- Role stored in JWT token (verified in auth middleware)
- Role checked in controllers before operations
- Different query filters based on role

**Example:**
```javascript
// Users see only their tickets
if (user.role === "user") {
  tickets = await Ticket.find({ createdBy: user._id });
} else {
  // Moderators/admins see all
  tickets = await Ticket.find({});
}
```

**Security:** Role is in JWT, but also verified against DB in sensitive operations (like user updates).

---

### 8. **How do you match moderators to tickets? Explain the skills matching algorithm.**

**Answer:**

**Algorithm:**
1. Extract `relatedSkills` from AI analysis (e.g., ["JavaScript", "React", "Node.js"])
2. Find moderator with matching skills using MongoDB regex:
   ```javascript
   User.findOne({
     role: "moderator",
     skills: {
       $elemMatch: {
         $regex: relatedSkills.join("|"), // "JavaScript|React|Node.js"
         $options: "i" // case-insensitive
       }
     }
   })
   ```
3. If no match, assign to admin (fallback)
4. If no admin, assign to null (unassigned)

**Issues with Current Approach:**
- **Regex Matching:** `"JavaScript"` matches `"Java"` (false positive)
- **No Skill Ranking:** Doesn't consider skill proficiency
- **No Load Balancing:** Doesn't consider moderator's current ticket count

**Better Approach:**
```javascript
// Exact match with priority scoring
const moderators = await User.find({ role: "moderator" });
const scored = moderators.map(mod => ({
  user: mod,
  score: mod.skills.filter(skill => 
    relatedSkills.some(rs => 
      skill.toLowerCase() === rs.toLowerCase()
    )
  ).length
}));
const bestMatch = scored.sort((a, b) => b.score - a.score)[0];
```

---

### 9. **How do you handle email sending? What if it fails?**

**Answer:**

**Current Implementation:**
- Uses Nodemailer with SMTP (Mailtrap for dev)
- Email sending wrapped in try-catch
- **Non-blocking:** Email failures don't fail the API response

**Email Scenarios:**
1. **Welcome Email (Signup):** Sent directly, failures logged but don't block signup
2. **Assignment Email (Inngest):** Sent in Inngest step, failures logged but don't fail job
3. **Manual Assignment:** Sent in updateTicket, failures logged

**Why Non-blocking?**
- **User Experience:** Users shouldn't wait for email delivery
- **Resilience:** Email service issues shouldn't break core functionality

**Improvements:**
1. **Retry Queue:** Failed emails go to retry queue (Inngest/Bull)
2. **Email Templates:** Use template engine (Handlebars/EJS)
3. **Email Service:** Use transactional email service (SendGrid, AWS SES)
4. **Webhooks:** Track email delivery status

---

### 10. **What happens if MongoDB connection fails? How do you handle it?**

**Answer:**

**Current Handling:**
```javascript
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT))
  .catch((err) => console.error("MongoDB error: ", err));
```

**Issues:**
- Server doesn't start if DB fails (good for startup)
- But no reconnection logic for runtime failures
- No connection pooling configuration

**Production Solution:**
```javascript
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  // Could trigger alerting system
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting reconnect...');
  mongoose.connect(process.env.MONGO_URI);
});
```

---

### 11. **How would you scale this system to handle 10,000 tickets per day?**

**Answer:**

**Bottlenecks & Solutions:**

1. **Database:**
   - **Problem:** Single MongoDB instance
   - **Solution:** 
     - MongoDB replica set (read scaling)
     - Sharding for write scaling
     - Connection pooling (already using Mongoose default)
     - Add more indexes for query optimization

2. **AI Processing:**
   - **Problem:** Sequential AI calls, rate limits
   - **Solution:**
     - Batch processing
     - Queue with rate limiting (BullMQ)
     - Caching similar tickets
     - Use faster/cheaper model for initial triage

3. **API Server:**
   - **Problem:** Single Express instance
   - **Solution:**
     - Horizontal scaling (multiple instances behind load balancer)
     - Stateless design (already stateless with JWT)
     - Add Redis for session/token caching

4. **Inngest:**
   - **Problem:** Single function processing
   - **Solution:**
     - Increase concurrency limits
     - Split functions by priority
     - Use Inngest's built-in scaling

5. **Email:**
   - **Problem:** SMTP rate limits
   - **Solution:**
     - Use transactional email service (SendGrid, AWS SES)
     - Queue emails with rate limiting
     - Batch notifications

**Architecture Changes:**
```
Load Balancer
  ├── Express App (3+ instances)
  ├── MongoDB Replica Set
  ├── Redis (caching, sessions)
  ├── Inngest (background jobs)
  └── Email Service (SendGrid/SES)
```

---

### 12. **How do you ensure data consistency when updating tickets?**

**Answer:**

**Current Approach:**
- Mongoose validators
- `runValidators: true` in `findByIdAndUpdate`
- No explicit transactions

**Potential Issues:**
- Race conditions in assignment (two moderators assigned same ticket)
- No optimistic locking

**Solution:**
```javascript
// Optimistic locking with version field
const ticket = await Ticket.findById(id);
const updated = await Ticket.findByIdAndUpdate(
  id,
  { ...updates, version: ticket.version + 1 },
  { 
    runValidators: true,
    // Only update if version matches
    $where: `this.version === ${ticket.version}`
  }
);
if (!updated) throw new Error('Ticket was modified, please retry');
```

**For Critical Operations:**
- Use MongoDB transactions for multi-document updates
- Example: Assigning ticket + updating moderator's workload

---

### 13. **What testing strategy would you implement?**

**Answer:**

**Testing Pyramid:**

1. **Unit Tests (70%):**
   - Controllers (mocked DB)
   - AI utility functions
   - Authentication middleware
   - Models validation
   - **Tools:** Jest, Supertest

2. **Integration Tests (20%):**
   - API endpoints with test DB
   - Inngest functions
   - Email sending (mocked)
   - **Tools:** Jest, MongoDB Memory Server

3. **E2E Tests (10%):**
   - Critical user flows
   - Ticket creation → assignment → resolution
   - **Tools:** Playwright, Cypress

**Example Test:**
```javascript
describe('createTicket', () => {
  it('should create ticket and trigger Inngest event', async () => {
    const ticket = await createTicket(mockReq, mockRes);
    expect(ticket).toBeDefined();
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'ticket/created',
      data: { ticketId: ticket._id }
    });
  });
});
```

**Missing:** Currently no tests - would add comprehensive test suite.

---

### 14. **How do you handle CORS? Why this configuration?**

**Answer:**

**Current Config:**
```javascript
cors({
  origin: process.env.CORS_ORIGINS?.split(',') || localhost origins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
})
```

**Why:**
- **Environment-based:** Different origins for dev/prod
- **Credentials:** Allows cookies/auth headers
- **Explicit Methods:** Security best practice

**Production Improvements:**
- Strict origin whitelist (no wildcards)
- Add `maxAge` for preflight caching
- Consider CORS middleware per route if needed

---

### 15. **What monitoring and logging would you add?**

**Answer:**

**Current:** Console.log statements

**Production Monitoring:**

1. **Application Monitoring:**
   - **APM:** New Relic, Datadog, or Sentry
   - Track: Response times, error rates, request volume

2. **Logging:**
   - **Structured Logging:** Winston or Pino
   - **Log Aggregation:** ELK Stack, CloudWatch, or Datadog
   - **Log Levels:** Error, Warn, Info, Debug

3. **Metrics:**
   - Ticket creation rate
   - AI processing time
   - Email delivery success rate
   - Database query performance

4. **Alerts:**
   - High error rate
   - Slow API responses
   - Database connection failures
   - Inngest function failures

**Example:**
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## Design Decisions & Trade-offs

### 1. **Why Inngest over Bull/BullMQ?**
- **Trade-off:** Less control, better DX
- **Decision:** Chose developer experience for MVP, can migrate later

### 2. **Dual AI Processing (Inngest + Direct)?**
- **Trade-off:** Potential duplicate processing vs. reliability
- **Decision:** Reliability over perfect idempotency (can add locks later)

### 3. **JWT without expiration?**
- **Trade-off:** Simplicity vs. security
- **Decision:** MVP simplicity, needs improvement for production

### 4. **Regex skill matching?**
- **Trade-off:** Fast implementation vs. accuracy
- **Decision:** MVP speed, needs exact matching for production

### 5. **Email failures non-blocking?**
- **Trade-off:** User experience vs. guaranteed delivery
- **Decision:** UX first, emails can be retried

---

## Security Questions

### Q: How do you prevent SQL injection?
**A:** Using Mongoose ODM which parameterizes queries. No raw queries.

### Q: How do you prevent XSS?
**A:** 
- Frontend: React escapes by default
- Backend: Should sanitize user input (currently missing - would add `validator` or `sanitize-html`)

### Q: How do you handle password security?
**A:**
- bcrypt with 10 rounds (good)
- Passwords never logged
- **Missing:** Password strength validation, password reset flow

### Q: How do you prevent CSRF?
**A:** 
- Currently relying on CORS (not sufficient)
- **Solution:** Add CSRF tokens or use SameSite cookies

### Q: How do you handle sensitive data in logs?
**A:**
- Passwords are hashed (never logged)
- **Missing:** Should redact emails, tokens from logs in production

---

## Scalability Questions

### Q: How would you handle 1 million tickets?
**A:**
1. **Database Sharding:** Shard by `createdAt` or `createdBy`
2. **Archiving:** Move old tickets to cold storage
3. **Pagination:** Implement cursor-based pagination
4. **Caching:** Cache frequently accessed tickets (Redis)
5. **Read Replicas:** Scale reads with MongoDB replicas

### Q: How would you handle AI rate limits?
**A:**
1. **Queue with Rate Limiting:** BullMQ with rate limiter
2. **Caching:** Cache similar ticket analyses
3. **Batch Processing:** Process multiple tickets in one AI call
4. **Fallback Models:** Use cheaper/faster model for initial triage

### Q: How would you handle concurrent ticket assignments?
**A:**
1. **Optimistic Locking:** Version field in ticket
2. **Distributed Locks:** Redis locks for assignment
3. **Idempotency Keys:** Ensure assignments are idempotent

---

## Performance Optimization

### Current Optimizations:
- ✅ Database indexes on frequently queried fields
- ✅ Non-blocking email sending
- ✅ Async AI processing

### Additional Optimizations:
1. **Response Caching:** Cache ticket lists (Redis, 5min TTL)
2. **Database Query Optimization:** Use `.select()` to limit fields
3. **Connection Pooling:** Configure MongoDB pool size
4. **Compression:** Add gzip compression middleware
5. **CDN:** Serve static assets via CDN
6. **Lazy Loading:** Frontend pagination/virtual scrolling

---

## Error Handling & Resilience

### Current Approach:
- Try-catch blocks in controllers
- Generic error messages to users
- Detailed errors in console logs

### Improvements:
```javascript
// Centralized error handler
app.use((err, req, res, next) => {
  logger.error(err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    requestId: req.id // For tracking
  });
});
```

---

## Testing & Quality Assurance

### Missing Tests - What to Add:

1. **Unit Tests:**
   - Controllers (mocked dependencies)
   - AI utility functions
   - Authentication middleware
   - Models validation

2. **Integration Tests:**
   - API endpoints
   - Database operations
   - Inngest functions

3. **E2E Tests:**
   - User signup → ticket creation → assignment flow
   - Role-based access control

4. **Load Tests:**
   - API performance under load
   - Database query performance

---

## Future Improvements

### Short-term (Next Sprint):
1. ✅ Add JWT expiration and refresh tokens
2. ✅ Implement proper error handling middleware
3. ✅ Add input validation and sanitization
4. ✅ Add logging library (Winston/Pino)
5. ✅ Improve skill matching algorithm

### Medium-term (Next Quarter):
1. ✅ Add comprehensive test suite
2. ✅ Implement caching layer (Redis)
3. ✅ Add monitoring and alerting
4. ✅ Improve email system (templates, retry queue)
5. ✅ Add password reset flow

### Long-term (Next Year):
1. ✅ Microservices architecture (if needed)
2. ✅ Real-time updates (WebSockets)
3. ✅ Advanced analytics dashboard
4. ✅ Multi-tenant support
5. ✅ Mobile app (React Native)

---

## Key Talking Points for Interview

### Strengths to Highlight:
1. **Full-Stack Experience:** Both frontend and backend
2. **Modern Tech Stack:** Latest versions, best practices
3. **AI Integration:** Real-world AI application
4. **Background Jobs:** Understanding of async processing
5. **Security Awareness:** JWT, bcrypt, role-based access
6. **Database Design:** Thoughtful indexing and schema

### Areas to Acknowledge (Show Growth Mindset):
1. **Testing:** "I recognize testing is missing - I'd add comprehensive tests"
2. **Security:** "JWT expiration needs to be added for production"
3. **Monitoring:** "Would add proper logging and monitoring"
4. **Scalability:** "Current design works for MVP, but I've thought about scaling"

### Questions to Ask Interviewer:
1. "What's your current tech stack?"
2. "How do you handle background jobs?"
3. "What's your testing strategy?"
4. "How do you monitor production systems?"

---

## Quick Reference: Code Locations

- **Server Entry:** `ai-ticket-assistant/index.js`
- **Ticket Controller:** `ai-ticket-assistant/controllers/ticket.js`
- **User Controller:** `ai-ticket-assistant/controllers/user.js`
- **Auth Middleware:** `ai-ticket-assistant/middlewares/auth.js`
- **AI Utility:** `ai-ticket-assistant/utils/ai.js`
- **Inngest Function:** `ai-ticket-assistant/inngest/functions/on-ticket-create.js`
- **Models:** `ai-ticket-assistant/models/`
- **Frontend:** `ai-ticket-frontend/src/pages/tickets.jsx`

---

## Final Tips

1. **Be Honest:** If you don't know something, say so and explain how you'd find out
2. **Show Problem-Solving:** Walk through your thought process
3. **Acknowledge Trade-offs:** Show you understand there are no perfect solutions
4. **Ask Questions:** Shows engagement and curiosity
5. **Be Confident:** You built this - own it!

**Good luck with your interview! 🚀**

