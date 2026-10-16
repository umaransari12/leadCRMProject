# LeadCRM – Vercel deployment notes

One Vercel project serves everything:

- **Frontend:** `myapp` (Create React App). Built by `vercel.json` -> `outputDirectory: myapp/build`.
- **API:** `api/index.js` re-exports the Express app in `leadcrm_backend/app.js` as a single serverless function. `vercel.json` rewrites `/api/*` to it and every other path to `index.html` (React Router refresh support).
- **Same origin:** the browser calls relative `/api/...` URLs (`myapp/.env.production` sets `REACT_APP_API_URL=` to empty), so no CORS configuration is needed in production.

## Environment variables (set in the Vercel project, never committed)

| Name | Required | Notes |
|---|---|---|
| `MONGO_URI` | yes | Connection string of the **demo** database (a separate database + a database user limited to it). |
| `JWT_SECRET` | yes | Random string of at least 32 characters. The app refuses to start without it. |
| `NODE_ENV` | set by Vercel | `production` |
| `CLIENT_URL` | no | Only if a different origin must call the API. |

## Local development

1. `leadcrm_backend/.env` (see `.env.example`): `PORT`, `MONGO_URI` (your dev database), `JWT_SECRET`.
2. `cd leadcrm_backend && npm install && npm start` (port 5000).
3. `cd myapp && npm install && npm start` (port 3000; talks to `http://localhost:5000` unless `REACT_APP_API_URL` is set).

## Notes

- Root `package.json` dependencies must match `leadcrm_backend/package.json` (the serverless function resolves packages from the project root).
- The frontend builds warning-free in CI mode (`CI=true`), which is how Vercel builds. Three pre-existing unused-variable lint warnings (dashboardSec.js, signinPage.js) were removed for this.
- Leads belong to the user that created them (`owner`). Leads created before ownership existed have no owner and are not returned by the API.
- MongoDB Atlas must allow connections from Vercel (Network Access `0.0.0.0/0` on Hobby, which has no fixed IPs); keep the demo database user restricted to the demo database.
