# Quick Interview Reference - AI Ticket System

## 🎯 Project in 30 Seconds
Full-stack IT ticket management system with AI-powered triage. Users create tickets → AI analyzes → Auto-assigns to moderators → Email notifications.

**Stack:** Node.js/Express, MongoDB, React, Inngest, Google Gemini AI

---

## 🔑 Key Technical Decisions

| Decision | Why | Trade-off |
|----------|-----|-----------|
| **Inngest** for background jobs | Great DX, built-in retries, step functions | Less control than Bull/BullMQ |
| **Dual AI processing** (Inngest + direct) | Reliability fallback | Potential duplicate processing |
| **JWT without expiration** | MVP simplicity | Security risk (needs fix) |
| **Regex skill matching** | Fast implementation | Less accurate (needs exact match) |
| **Non-blocking emails** | Better UX | No guaranteed delivery |

---

## 🏗️ Architecture Flow

```
User creates ticket
  ↓
Ticket saved to MongoDB
  ↓
Inngest event triggered
  ↓
Background job:
  1. Fetch ticket
  2. AI analysis (Gemini)
  3. Update ticket with AI insights
  4. Match moderator by skills
  5. Assign ticket
  6. Send email notification
```

---

## 🔐 Security Highlights

✅ **Good:**
- JWT authentication
- bcrypt password hashing (10 rounds)
- Role-based access control
- CORS configuration

⚠️ **Needs Improvement:**
- JWT expiration (add `expiresIn`)
- Refresh tokens
- Input sanitization
- CSRF protection
- Rate limiting

---

## 📊 Database Design

**Ticket Schema:**
- Indexes on: `createdBy`, `status`, `assignedTo`, `createdAt`
- References: `createdBy` → User, `assignedTo` → User

**Why these indexes?**
- Based on actual query patterns
- Compound indexes for filtering + sorting

---

## 🚀 Scaling to 10K tickets/day

1. **Database:** Replica set, sharding, more indexes
2. **API:** Horizontal scaling (load balancer + multiple instances)
3. **AI:** Queue with rate limiting, caching, batch processing
4. **Email:** Transactional service (SendGrid/SES)
5. **Caching:** Redis for tickets, sessions

---

## 🐛 Common Questions & Answers

### Q: Why both Inngest and direct AI processing?
**A:** Fallback mechanism. If Inngest fails, direct processing ensures tickets still get analyzed. Trade-off: potential duplicates (can add locks).

### Q: How does skill matching work?
**A:** Regex match on moderator skills array. Finds first moderator with matching skill, falls back to admin. **Issue:** "Java" matches "JavaScript" - needs exact matching.

### Q: What if email sending fails?
**A:** Non-blocking - failures logged but don't break API. Emails can be retried later via queue.

### Q: How do you handle concurrent assignments?
**A:** Currently no protection. **Solution:** Optimistic locking with version field or Redis distributed locks.

---

## 🧪 Testing Strategy (Missing - What to Add)

1. **Unit Tests (70%):** Controllers, utilities, middleware
2. **Integration Tests (20%):** API endpoints, Inngest functions
3. **E2E Tests (10%):** Critical user flows

**Tools:** Jest, Supertest, MongoDB Memory Server

---

## 📈 Performance Optimizations

**Current:**
- Database indexes
- Async processing
- Non-blocking operations

**To Add:**
- Response caching (Redis)
- Query optimization (`.select()`)
- Compression middleware
- CDN for static assets

---

## 🎤 Interview Talking Points

### Strengths:
- Full-stack experience
- Modern tech stack
- AI integration
- Background job processing
- Security awareness

### Growth Areas (Show Self-Awareness):
- "Testing is missing - I'd add comprehensive tests"
- "JWT expiration needs to be added"
- "Would add proper monitoring/logging"
- "Current design works for MVP, but I've thought about scaling"

---

## 🔍 Code Locations

- **Server:** `ai-ticket-assistant/index.js`
- **Ticket Logic:** `ai-ticket-assistant/controllers/ticket.js`
- **AI Analysis:** `ai-ticket-assistant/utils/ai.js`
- **Background Job:** `ai-ticket-assistant/inngest/functions/on-ticket-create.js`
- **Auth:** `ai-ticket-assistant/middlewares/auth.js`

---

## 💡 Quick Answers

**Q: Why MongoDB?**
A: Document-based, flexible schema, good for ticket metadata. Could use PostgreSQL for ACID transactions if needed.

**Q: Why Inngest over queues?**
A: Better developer experience, built-in retries, step functions for observability. For high scale, might use BullMQ.

**Q: How do you ensure data consistency?**
A: Mongoose validators, `runValidators: true`. For critical ops, would use MongoDB transactions.

**Q: What's your error handling strategy?**
A: Try-catch in controllers, generic user messages, detailed logs. Would add centralized error handler.

---

## 🎯 Questions to Ask Interviewer

1. "What's your current tech stack?"
2. "How do you handle background jobs?"
3. "What's your testing strategy?"
4. "How do you monitor production?"

---

**Remember:** Be honest, show problem-solving, acknowledge trade-offs, ask questions!

Good luck! 🚀


