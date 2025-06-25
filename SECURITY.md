# Security Guide for Personal Journal App

## Overview
This is a **single-user personal journal application** designed for private use. The app has been configured with security measures appropriate for personal use while maintaining functionality.

## Security Features Implemented

### 1. **Single-User Access**
- ✅ Sign-up form removed from UI
- ✅ Only one user account allowed (first-time setup creates initial user)
- ✅ No public registration endpoint
- ✅ Login-only interface

### 2. **Authentication & Session Management**
- ✅ JWT-based authentication with configurable expiry (24 hours)
- ✅ Password hashing using SHA-256 with salt
- ✅ Rate limiting on login attempts (5 attempts per 15 minutes)
- ✅ Session management with automatic cleanup
- ✅ Secure logout functionality

### 3. **Content Security Policy (CSP)**
- ✅ Strict CSP headers configured
- ✅ Inline scripts blocked (event handlers moved to external JS)
- ✅ External resources restricted to trusted sources
- ✅ XSS protection enabled

### 4. **CORS Configuration**
- ✅ Restricted to specific domains only
- ✅ Production: `https://journal-6q0v.onrender.com`
- ✅ Development: `http://localhost:3000`
- ✅ Credentials handling configured

### 5. **Data Storage**
- ✅ Client-side: localStorage with user-specific keys
- ✅ Server-side: SQLite database with proper indexing
- ✅ Data isolation between users (if multiple users exist)

### 6. **Input Validation & Sanitization**
- ✅ Email format validation
- ✅ Password strength requirements (8+ chars, uppercase, lowercase, number)
- ✅ Input sanitization to prevent XSS
- ✅ SQL injection protection via parameterized queries

## Security Recommendations

### For Production Deployment

1. **Set Strong JWT Secret**
   ```bash
   # Generate a secure JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Set this in your environment variables.

2. **Use HTTPS Only**
   - Ensure your hosting provider uses HTTPS
   - Never access the app over HTTP in production

3. **Regular Backups**
   - Backup your SQLite database file (`journal.db`)
   - Backup localStorage data if needed

4. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

5. **Monitor Logs**
   - Check server logs for suspicious activity
   - Monitor failed login attempts

### Environment Variables to Set

```env
NODE_ENV=production
JWT_SECRET=your-generated-secret-here
ALLOWED_ORIGINS=https://yourdomain.com
```

## Security Limitations

### What This App Does NOT Protect Against:
- **Physical Access**: If someone has access to your device, they can access your data
- **Browser Vulnerabilities**: Client-side storage is vulnerable to browser exploits
- **Network Attacks**: While HTTPS helps, sophisticated attacks may still be possible
- **Server Compromise**: If the server is compromised, data could be exposed

### For Maximum Security:
- Use a dedicated device for journaling
- Consider using a password manager for the login
- Regularly clear browser cache and localStorage
- Use a VPN when accessing from public networks

## Data Privacy

### What Data is Stored:
- **Client-side (localStorage)**:
  - User credentials (hashed)
  - Journal entries
  - User preferences
  - Session data

- **Server-side (SQLite)**:
  - User accounts (hashed passwords)
  - Journal entries (if using server storage)

### Data Retention:
- Data persists until manually deleted
- No automatic data deletion
- Session data expires after 24 hours

## Incident Response

If you suspect a security breach:

1. **Immediate Actions**:
   - Change your password immediately
   - Clear all browser data for the site
   - Check for unauthorized entries

2. **Investigation**:
   - Review server logs
   - Check for unusual login patterns
   - Verify data integrity

3. **Recovery**:
   - Restore from backup if needed
   - Update all passwords
   - Consider additional security measures

## Support

For security concerns or questions:
- Review this document
- Check the main README.md
- Consider the security implications of any modifications

---

**Remember**: This is a personal journal app. The security measures are appropriate for personal use but may not be sufficient for sensitive or confidential information. Consider your specific security needs and adjust accordingly. 