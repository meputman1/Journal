# 📖 Journal App Server

A secure, scalable backend server for the Journal App built with Node.js, Express, and SQLite.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Edit `.env` and set your JWT secret:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

3. **Start the server:**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - API Health Check: http://localhost:3000/api/health

## 🏗️ Architecture

### Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (with option to switch to PostgreSQL/MySQL)
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcryptjs, helmet, rate limiting
- **CORS:** Cross-origin resource sharing enabled

### Project Structure
```
Journal-main/
├── server.js          # Main server file
├── api-client.js      # Frontend API client
├── package.json       # Dependencies and scripts
├── env.example        # Environment variables template
├── journal.db         # SQLite database (created automatically)
├── index.html         # Frontend application
├── script.js          # Frontend JavaScript
├── styles.css         # Frontend styles
└── server-README.md   # This file
```

## 🔐 Security Features

### Authentication & Authorization
- **JWT-based authentication** with 24-hour token expiration
- **Password hashing** using bcryptjs with 12 salt rounds
- **Rate limiting** to prevent brute force attacks
- **Input validation** and sanitization
- **CORS protection** with configurable origins

### Data Protection
- **SQL injection prevention** using parameterized queries
- **XSS protection** with helmet middleware
- **Request size limiting** (10MB max)
- **Secure headers** with helmet

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Journal Entries Table
```sql
CREATE TABLE journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  mood TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile

### Journal Entries
- `GET /api/entries` - Get all entries (with pagination and filters)
- `GET /api/entries/:id` - Get single entry
- `POST /api/entries` - Create new entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry
- `GET /api/entries/stats` - Get entry statistics

### System
- `GET /api/health` - Health check

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
PORT=3000                    # Server port
NODE_ENV=development         # Environment (development/production)

# JWT Configuration
JWT_SECRET=your-secret-key   # JWT signing secret

# Database Configuration
# DATABASE_URL=postgresql://user:password@localhost:5432/journal_db

# CORS Configuration
# ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting
# RATE_LIMIT_WINDOW_MS=900000
# RATE_LIMIT_MAX_REQUESTS=100
```

### API Query Parameters

#### Get Entries
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `search` - Search in entry text
- `mood` - Filter by mood
- `tag` - Filter by tag
- `startDate` - Filter entries from date (ISO format)
- `endDate` - Filter entries to date (ISO format)

#### Get Statistics
- `startDate` - Start date for statistics (ISO format)
- `endDate` - End date for statistics (ISO format)

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup for Production
1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure `ALLOWED_ORIGINS` for your domain
4. Consider using PostgreSQL or MySQL instead of SQLite
5. Set up proper logging and monitoring
6. Use HTTPS in production

## 🔄 Frontend Integration

The frontend has been updated to use the new API client. Key changes:

1. **API Client:** `api-client.js` handles all server communication
2. **Authentication:** JWT tokens stored in localStorage
3. **Error Handling:** Improved error handling and user feedback
4. **Data Persistence:** All data now stored in the database

### Migration from LocalStorage
If you have existing data in localStorage, you can create a migration script:

```javascript
// Example migration script
const oldEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
for (const entry of oldEntries) {
  await api.createEntry({
    text: entry.text,
    mood: entry.mood,
    tags: entry.tags
  });
}
```

## 🧪 Testing

### Manual Testing
1. **Health Check:** `curl http://localhost:3000/api/health`
2. **Register:** `curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}'`
3. **Login:** `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}'`

### API Testing Tools
- **Postman:** Import the API endpoints
- **Insomnia:** Test the REST API
- **curl:** Command-line testing

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process
   kill -9 <PID>
   ```

2. **Database errors:**
   ```bash
   # Remove and recreate database
   rm journal.db
   npm start
   ```

3. **CORS errors:**
   - Check `ALLOWED_ORIGINS` in environment variables
   - Ensure frontend URL is included

4. **JWT errors:**
   - Verify `JWT_SECRET` is set
   - Check token expiration

### Logs
- Server logs are output to console
- Database errors are logged with stack traces
- API requests are logged with timestamps

## 📈 Performance

### Optimization Tips
1. **Database Indexes:** Already created for common queries
2. **Pagination:** Implemented for large datasets
3. **Rate Limiting:** Prevents abuse
4. **Caching:** Consider adding Redis for session storage
5. **Compression:** Enable gzip compression for production

### Monitoring
- Health check endpoint for uptime monitoring
- Error logging for debugging
- Request/response logging for analytics

## 🔮 Future Enhancements

### Planned Features
- [ ] User profile management
- [ ] Entry categories and tags
- [ ] Export/import functionality
- [ ] Rich text editor
- [ ] Image uploads
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] API documentation with Swagger

### Scalability Improvements
- [ ] Database connection pooling
- [ ] Redis for session storage
- [ ] CDN for static assets
- [ ] Load balancing
- [ ] Microservices architecture

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Coding! 🚀✨** 