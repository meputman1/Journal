const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://journal-6q0v.onrender.com', 'https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('./journal.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Journal entries table
    db.run(`CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      mood TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Create indexes for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_user_id ON journal_entries(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_created_at ON journal_entries(created_at)');
    db.run('CREATE INDEX IF NOT EXISTS idx_email ON users(email)');
  });
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Validation middleware
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI;
let useMongo = false;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      useMongo = true;
      console.log('Connected to MongoDB Atlas');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

// Mongoose models
let UserModel, EntryModel;
if (MONGODB_URI) {
  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  });

  const entrySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    mood: { type: String },
    tags: { type: [String], default: [] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  });

  UserModel = mongoose.model('User', userSchema);
  EntryModel = mongoose.model('Entry', entrySchema);
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (row) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', 
        [email, passwordHash], function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: this.lastID, email }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
          message: 'User created successfully',
          token,
          user: { id: this.lastID, email }
        });
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user
  db.get('SELECT id, email, password_hash FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!row) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, row.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: row.id, email: row.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: row.id, email: row.email }
    });
  });
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, email, created_at FROM users WHERE id = ?', [req.user.userId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: row });
  });
});

// Journal entries routes

// Get all entries for a user
app.get('/api/entries', authenticateToken, async (req, res) => {
  const { page = 1, limit = 50, search, mood, tag, startDate, endDate } = req.query;
  if (useMongo) {
    // MongoDB logic
    const query = { user_id: req.user.userId };
    if (search) query.text = { $regex: search, $options: 'i' };
    if (mood) query.mood = mood;
    if (tag) query.tags = tag;
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      EntryModel.find(query).sort({ created_at: -1 }).skip(skip).limit(Number(limit)),
      EntryModel.countDocuments(query)
    ]);
    return res.json({
      entries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } else {
    // SQLite logic
    let query = 'SELECT * FROM journal_entries WHERE user_id = ?';
    let params = [req.user.userId];

    // Add search filter
    if (search) {
      query += ' AND text LIKE ?';
      params.push(`%${search}%`);
    }

    // Add mood filter
    if (mood) {
      query += ' AND mood = ?';
      params.push(mood);
    }

    // Add tag filter
    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }

    // Add date range filter
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * limit);

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM journal_entries WHERE user_id = ?';
      let countParams = [req.user.userId];

      if (search) {
        countQuery += ' AND text LIKE ?';
        countParams.push(`%${search}%`);
      }
      if (mood) {
        countQuery += ' AND mood = ?';
        countParams.push(mood);
      }
      if (tag) {
        countQuery += ' AND tags LIKE ?';
        countParams.push(`%${tag}%`);
      }
      if (startDate) {
        countQuery += ' AND created_at >= ?';
        countParams.push(startDate);
      }
      if (endDate) {
        countQuery += ' AND created_at <= ?';
        countParams.push(endDate);
      }

      db.get(countQuery, countParams, (err, countRow) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({
          entries: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countRow.total,
            pages: Math.ceil(countRow.total / limit)
          }
        });
      });
    });
  }
});

// Get single entry
app.get('/api/entries/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (useMongo) {
    const entry = await EntryModel.findOne({ _id: id, user_id: req.user.userId });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    return res.json({ entry });
  } else {
    // SQLite logic
    db.get('SELECT * FROM journal_entries WHERE id = ? AND user_id = ?', [id, req.user.userId], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({ entry: row });
    });
  }
});

// Create new entry
app.post('/api/entries', authenticateToken, async (req, res) => {
  const { text, mood, tags } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Entry text is required' });
  }
  if (useMongo) {
    const entry = await EntryModel.create({
      user_id: req.user.userId,
      text: text.trim(),
      mood,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
    });
    return res.status(201).json({ message: 'Entry created successfully', entry });
  } else {
    // SQLite logic
    const tagsString = tags && Array.isArray(tags) ? tags.join(',') : tags;

    db.run('INSERT INTO journal_entries (user_id, text, mood, tags) VALUES (?, ?, ?, ?)',
      [req.user.userId, text.trim(), mood, tagsString], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Get the created entry
      db.get('SELECT * FROM journal_entries WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.status(201).json({
          message: 'Entry created successfully',
          entry: row
        });
      });
    });
  }
});

// Update entry
app.put('/api/entries/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { text, mood, tags } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Entry text is required' });
  }
  if (useMongo) {
    const entry = await EntryModel.findOneAndUpdate(
      { _id: id, user_id: req.user.userId },
      { text: text.trim(), mood, tags: Array.isArray(tags) ? tags : (tags ? [tags] : []), updated_at: new Date() },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    return res.json({ message: 'Entry updated successfully', entry });
  } else {
    // SQLite logic
    const tagsString = tags && Array.isArray(tags) ? tags.join(',') : tags;

    db.run('UPDATE journal_entries SET text = ?, mood = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [text.trim(), mood, tagsString, id, req.user.userId], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      // Get the updated entry
      db.get('SELECT * FROM journal_entries WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({
          message: 'Entry updated successfully',
          entry: row
        });
      });
    });
  }
});

// Delete entry
app.delete('/api/entries/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (useMongo) {
    const result = await EntryModel.deleteOne({ _id: id, user_id: req.user.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Entry not found' });
    return res.json({ message: 'Entry deleted successfully' });
  } else {
    // SQLite logic
    db.run('DELETE FROM journal_entries WHERE id = ? AND user_id = ?', [id, req.user.userId], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({ message: 'Entry deleted successfully' });
    });
  }
});

// Get entry statistics
app.get('/api/entries/stats', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  if (useMongo) {
    const match = { user_id: req.user.userId };
    if (startDate || endDate) {
      match.created_at = {};
      if (startDate) match.created_at.$gte = new Date(startDate);
      if (endDate) match.created_at.$lte = new Date(endDate);
    }
    // Mood stats
    const moodStats = await EntryModel.aggregate([
      { $match: match },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    // Tag stats
    const tagStats = await EntryModel.aggregate([
      { $match: match },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    // Total count
    const totalEntries = await EntryModel.countDocuments(match);
    return res.json({
      totalEntries,
      moodStats,
      tagStats
    });
  } else {
    // SQLite logic
    let dateFilter = '';
    let params = [req.user.userId];
    
    if (startDate && endDate) {
      dateFilter = ' AND created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Get mood statistics
    db.all(`SELECT mood, COUNT(*) as count FROM journal_entries 
            WHERE user_id = ? AND mood IS NOT NULL ${dateFilter}
            GROUP BY mood ORDER BY count DESC`, params, (err, moodStats) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Get tag statistics
      db.all(`SELECT tags, COUNT(*) as count FROM journal_entries 
              WHERE user_id = ? AND tags IS NOT NULL AND tags != '' ${dateFilter}
              GROUP BY tags ORDER BY count DESC`, params, (err, tagStats) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Get total entries count
        db.get(`SELECT COUNT(*) as total FROM journal_entries WHERE user_id = ? ${dateFilter}`, params, (err, totalRow) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          res.json({
            totalEntries: totalRow.total,
            moodStats,
            tagStats
          });
        });
      });
    });
  }
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Journal App Server running on port ${PORT}`);
  console.log(`📖 Open http://localhost:${PORT} in your browser`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
}); 