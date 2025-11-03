# 📦 sub-tracker – Subscription Tracker API

🔗 **[Live API](https://sub-tracker-yzxy.onrender.com)** | 📱 **[GitHub](https://github.com/negarbaharmand/sub-tracker)**

⚠️ **Note:** Free tier may take 30-60 seconds to wake up if inactive.

'sub-tracker' is a Node.js-based RESTful API that allows users to manage their personal subscriptions efficiently. Each user can create and track multiple subscriptions, with features like automated renewal reminders, secure authentication, and rate-limited access for enhanced security.

---

## Features

- **JWT-based Authentication & Authorization**
- **Rate Limiting & Security** via [Arcjet](https://arcjet.com/)
- **Subscription Management**: Create subscriptions with automated end-date calculation
- **Automated Email Alerts**: Reminders sent before subscription renewal
- **Global Error Handling**
- **Modular Middleware Architecture**

---

## **Additional Features**

- **Upstash for Workflows**:
- Used to automate the process of sending renewal reminder emails.
- Workflow logic is executed to ensure timely notifications for subscription renewals.
- **Nodemailer for Email Notifications**:
- Automated emails are sent 7, 5, 2, and 1 day(s) before the renewal date of subscriptions.
- Sends customizable emails based on subscription details to keep users informed about upcoming
  renewals.

---

## Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**
- **JWT (jsonwebtoken)**
- **Arcjet** (API protection and rate limiting)
- **Nodemailer** (or similar, for automated emails)
- **dotenv**, **bcryptjs**, **cookie-parser**, **morgan**

---

## API Endpoints

| Endpoint                    | Method | Description                   | Auth Required   |
| --------------------------- | ------ | ----------------------------- | --------------- |
| `/api/v1/auth/register`     | POST   | Register new user             | ❌              |
| `/api/v1/auth/login`        | POST   | Login and receive JWT         | ❌              |
| `/api/v1/users`             | GET    | Get authenticated user info   | ✅ Bearer token |
| `/api/v1/subscriptions`     | POST   | Create a new subscription     | ✅ Bearer token |
| `/api/v1/subscriptions`     | GET    | List subscriptions for a user | ✅ Bearer token |
| `/api/v1/subscriptions/:id` | PUT    | Update subscription           | ✅ Bearer token |

> ⚙️ End date is auto-calculated based on frequency if not provided.
> 📧 Email reminders are sent automatically before renewals.

---

## 🧪 Testing the Live API

### Base URL

[Live API](https://sub-tracker-yzxy.onrender.com)

### Example: Register a User

```bash
# Use Postman, Insomnia, or Thunder Client (curl blocked by Arcjet)
POST https://sub-tracker-yzxy.onrender.com/api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
POST https://sub-tracker-yzxy.onrender.com/api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
POST https://sub-tracker-yzxy.onrender.com/api/v1/subscriptions
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Netflix",
  "price": 139,
  "currency": "SEK",
  "renewalDate": "2025-12-01"
}
```

## ⚙️ Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/sub-tracker.git
cd sub-tracker
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory according to the .env.example file

4. **Run the app**

```bash
npm run dev
```

---

## Middleware & Error Handling

- All protected routes use a JWT authorization middleware
- Arcjet middleware is applied to rate-limit and inspect API requests
- Centralized error handler returns consistent error responses
