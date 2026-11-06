# Sara7a — Anonymous Messaging API

A REST API for an anonymous messaging platform: anyone can send a message to a user through their public link, and only the user can read their inbox. Built with **Node.js, Express 5 and MongoDB**, with a focus on authentication, account security and file handling.

## Features

**Authentication & accounts**
- Sign up with email confirmation via a 6-digit OTP (stored hashed, never in plain text)
- Google Sign-In / Sign-Up (Google OAuth ID token)
- Forgot-password flow: send OTP → verify OTP → reset password
- Access + refresh JWT tokens, signed with different secrets for `user` and `admin` roles
- Logout with token revocation (token `jti` stored in a `Token` collection)
- Brute-force protection: 5 failed logins ban the account for 5 minutes
- Profile update, password change, soft-freeze / restore / delete account (admin)
- Sensitive fields (phone) are encrypted at rest (AES)

**Messaging**
- Send anonymous messages to any user (up to 2 image attachments)
- Authenticated send, so the receiver can see who sent it
- Paginated inbox, single message lookup
- Soft delete and hard delete

**Platform**
- Image upload to **Cloudinary** (profile and cover images) with `multer` validation
- `sharp` image resizing utility
- Request validation with **Joi**
- `helmet`, `cors`, `express-rate-limit` on auth routes, `morgan` logging
- Global error handler with consistent response format
- Hourly expired-token cleanup job with `node-cron` (`src/jobs/cronJobs.js`, enable it in `src/app.controller.js`)

## Tech Stack

| Area | Technology |
|---|---|
| Runtime / framework | Node.js 22, Express 5 (ES modules) |
| Database | MongoDB + Mongoose |
| Auth | JWT, bcryptjs, Google Auth Library |
| Validation | Joi |
| Files | Multer, Cloudinary, Sharp |
| Email | Nodemailer |
| Security | Helmet, CORS, express-rate-limit, crypto-js |
| Jobs | node-cron |

## Project Structure

```
src/
├── DB/               # Connection, generic DB service, models (User, Message, Token)
├── middleware/       # authentication / authorization, Joi validation
├── modules/
│   ├── auth/         # signup, login, Google auth, OTP, password reset
│   ├── user/         # profile, images, freeze / restore / delete
│   └── message/      # send, list, get, delete
├── jobs/             # cron jobs
├── utils/            # email, events, multer, security (hash, encryption, tokens)
├── app.controller.js # app bootstrap
└── index.js
```

## API Overview

Base routes: `/auth`, `/user`, `/message`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | – | Register with email + password |
| PATCH | `/auth/confirm-Email` | – | Confirm email with OTP |
| POST | `/auth/login` | – | Login, returns access + refresh tokens |
| POST | `/auth/signup/gmail` · `/auth/login/gmail` | – | Google sign-up / login |
| PATCH | `/auth/send-forgot-password` | – | Send reset OTP |
| PATCH | `/auth/verify-forgot-password` | – | Verify reset OTP |
| PATCH | `/auth/reset-forgot-password` | – | Set a new password |
| GET | `/user` | Bearer | Current profile |
| GET | `/user/:userId` | – | Public profile (for sharing the message link) |
| GET | `/user/refresh-token` | Refresh token | Issue a new token pair |
| PATCH | `/user` · `/user/password` | Bearer | Update info / change password |
| PATCH | `/user/profile-image` · `/user/profile-cover-image` | Bearer | Upload images |
| DELETE | `/user/:userId/freeze-account` | Bearer | Freeze an account |
| PATCH | `/user/:userId/restore-account` | Admin | Restore an account |
| DELETE | `/user/:userId` | Admin | Delete an account |
| POST | `/user/logout` | Bearer | Logout (revokes the token) |
| POST | `/message/:receiverId` | – | Send an anonymous message (+ images) |
| POST | `/message/:receiverId/sender` | Bearer | Send a message with sender identity |
| GET | `/message/list/:userId` | Bearer | Paginated messages (`?page=&limit=`) |
| GET | `/message/:messageId` | Bearer | Get one message |
| DELETE | `/message/soft/:messageId` | Bearer | Soft delete |
| DELETE | `/message/hard/:messageId` | Bearer | Permanent delete |

## Getting Started

**Requirements:** Node.js 22+, a MongoDB instance, a Cloudinary account, a Google OAuth client ID, and an SMTP/Gmail account for emails.

```bash
git clone https://github.com/KhaledAli1234/Sara7a_App.git
cd Sara7a_App
npm install
```

Create `src/config/.env.prod`:

```env
PORT=5000
DB_URI=mongodb://localhost:27017/sara7a
ORIGINS=http://localhost:3000

# JWT
ACCESS_USER_TOKEN_SIGNATURE=change_me
ACCESS_SYSTEM_TOKEN_SIGNATURE=change_me
REFRESH_USER_TOKEN_SIGNATURE=change_me
REFRESH_SYSTEM_TOKEN_SIGNATURE=change_me
# Token lifetimes in seconds
ACCESS_TOKEN_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800

# Security
SALT=12
ENCRYPTION_SECRET=change_me

# Email
EMAIL=you@example.com
EMAIL_PASSWORD=app_password
APPLICATION_NAME=Sara7a

# Cloudinary
CLOUD_NAME=
API_KEY=
API_SECRET=

# Google
WEB_CLIENT_ID=
```

Run the server:

```bash
npm run start:dev
```

The API is available at `http://localhost:5000`.

## What I Learned

Designing a token lifecycle with revocation, protecting accounts against brute force, handling uploads safely, and structuring an Express app in modules (controller → service → DB layer).

## Author

**Khaled Ali** — Backend Developer · [GitHub](https://github.com/KhaledAli1234) · [LinkedIn](https://linkedin.com/in/khaled-ali)
