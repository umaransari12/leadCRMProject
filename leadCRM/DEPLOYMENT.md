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
- Backend (unit + real API tests against an in-memory MongoDB, no Atlas needed): `cd leadcrm_backend && npm test`
- Try the whole app locally without Atlas: `cd leadcrm_backend && npm run dev:memory` (API on :5000, data is lost on exit) and `cd myapp && npm start`
- Live end-to-end smoke test (creates a throwaway user and dummy lead, then deletes the lead): `cd leadcrm_backend && BASE_URL=https://<your-app>.vercel.app npm run smoke`

## Google sign-in

The code is complete: the sign-in/sign-up screens show Google's button, the browser sends Google's ID token to `POST /api/auth/google`, and the server verifies it (signature and expiry through Google, audience against your client ID, issuer, verified email) before creating or signing in a user. It stays disabled ("not configured") until you provide a client ID:

1. Google Cloud Console -> create/select a project -> **APIs & Services -> OAuth consent screen**: choose *External*, fill in the app name and support email, save. (While the app is in *Testing*, add your Google account under *Test users*.)
2. **APIs & Services -> Credentials -> Create credentials -> OAuth client ID -> Web application**.
3. Under **Authorized JavaScript origins** add `https://leadcrm-project-lovat.vercel.app` (and `http://localhost:3000` for local development). No redirect URI is needed for this flow.
4. Copy the **Client ID** (it looks like `123456-abc.apps.googleusercontent.com`). It is public; there is no client secret to store.
5. Vercel -> Project -> Settings -> Environment Variables (Production), add the same value twice: `GOOGLE_CLIENT_ID` (used by the API) and `REACT_APP_GOOGLE_CLIENT_ID` (baked into the frontend build).
6. **Redeploy** (the frontend variable only takes effect in a new build), then try *Continue with Google* on the sign-in page.

An existing account with the same verified Google email is linked automatically; its password keeps working.

## Known limitations

- Pages: Dashboard, Leads, Add Lead, Analytics and Settings (profile + password). There is no multi-user "Users" page: every account sees only its own leads. There is no "forgot password" email flow yet.
- Auth endpoints have a small in-memory rate limit per IP. On serverless each instance keeps its own counter, so it slows guessing but is not a hard global limit.
- Notifications are derived from your own leads (recent additions, leads left "New" for 3+ days); there is no separate notification feed.
