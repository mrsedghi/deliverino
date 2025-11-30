# API Testing Guide

## Authentication API Routes

### 1. Request OTP

**Endpoint:** `POST /api/auth/request-otp`

**Request Body:**
```json
{
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Response (429 - Rate Limited):**
```json
{
  "error": "Too many requests. Please try again later."
}
```

**Testing:**
```bash
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

**Note:** In development, the OTP will be logged to the console.

---

### 2. Verify OTP

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "phone": "+1234567890",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx...",
    "phone": "+1234567890",
    "name": "User 7890",
    "role": "CUSTOMER"
  }
}
```

**Response (401 - Invalid OTP):**
```json
{
  "error": "Invalid or expired OTP"
}
```

**Testing:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456"}'
```

---

### 3. Get Current User (Protected)

**Endpoint:** `GET /api/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "phone": "+1234567890",
    "name": "User 7890",
    "role": "CUSTOMER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (401 - No Token):**
```json
{
  "error": "Authorization token required"
}
```

**Response (401 - Invalid Token):**
```json
{
  "error": "Invalid or expired token"
}
```

**Testing:**
```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Complete Flow Example

1. **Request OTP:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/request-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+1234567890"}'
   ```
   
   Check console for OTP code (e.g., `🔐 OTP for +1234567890: 123456`)

2. **Verify OTP:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+1234567890", "code": "123456"}'
   ```
   
   Save the returned `token`

3. **Access Protected Route:**
   ```bash
   curl -X GET http://localhost:3000/api/me \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

---

## Environment Variables Required

Make sure your `.env` file has:
```env
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://...
```

---

## Rate Limiting

- Maximum 3 OTP requests per phone number per minute
- OTP expires after 5 minutes
- OTP can only be used once (deleted after verification)

---

## Notes

- OTPs are hashed using bcrypt before storage
- JWT tokens expire after 30 days
- Users are automatically created on first OTP verification
- SMS sending is stubbed (logs to console in development)

