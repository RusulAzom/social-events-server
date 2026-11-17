# Social Development Events Platform — Server

Express.js + MongoDB (native driver) REST API for the Social Development Events Platform.

## Setup

```bash
npm install
npm run dev   # development with watch
npm start     # production
```

Requires a `.env` file with:

```
PORT=5000
MONGODB_URI=<mongodb atlas uri>
JWT_SECRET=<secret>
CLIENT_URL=http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | `/api/jwt` | Public | Signs and returns a JWT for `{ email }` |
| GET | `/api/events/recent` | Public | 6 upcoming events sorted by `eventDate` ascending |
| GET | `/api/events` | Public | All upcoming events; optional `?search=` (title) and `?type=` filters |
| GET | `/api/events/:id` | Public | Single event details |
| POST | `/api/events` | Private (JWT) | Create event; `creatorEmail` must match token email, future `eventDate` required |
| GET | `/api/my-events?email=` | Private (JWT) | Events created by the authenticated user |
| PUT | `/api/events/:id` | Private (JWT) | Update event (owner only, future `eventDate`) |
| DELETE | `/api/events/:id` | Private (JWT) | Delete event (owner only) |
| POST | `/api/joined-events` | Private (JWT) | Join an event (duplicate join prevented) |
| GET | `/api/joined-events?email=` | Private (JWT) | Joined events sorted by `eventDate` ascending |

Protected routes require header `Authorization: Bearer <token>`.
