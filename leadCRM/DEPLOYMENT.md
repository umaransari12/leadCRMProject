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
- The frontend builds warning-free in CI mode (`CI=true`), which is how Vercel builds.
- Leads belong to the user that created them (`owner`). Leads created before ownership existed have no owner and are not returned by the API.
- MongoDB Atlas must allow connections from Vercel (Network Access `0.0.0.0/0` on Hobby, which has no fixed IPs); keep the demo database user restricted to the demo database.

## Tests

- Frontend: `cd myapp && CI=true npx react-scripts test --watchAll=false`
- Backend unit tests: `cd leadcrm_backend && npm test`
- Live end-to-end smoke test (creates a throwaway user and dummy lead, then deletes the lead): `cd leadcrm_backend && BASE_URL=https://<your-app>.vercel.app npm run smoke`

## Google sign-in

Not enabled. The sign-up page shows a disabled "coming soon" button. To build it you need (1) a Google Cloud OAuth client ID with your Vercel domain under *Authorized JavaScript origins*, and (2) a backend endpoint that verifies the Google token (check its audience matches your client ID) before issuing the app JWT. Do not accept an unverified token.

## Known limitations

- Only the Dashboard, Leads and Add Lead pages exist; there are no Users, Analytics, Settings or password-reset pages yet.
- No login rate limiting. Add it before exposing the app beyond a demo.
