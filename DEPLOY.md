# Deploy Functional Batch Interface

This project is ready to deploy as a single public web app:

- Express serves the frontend and API from one service.
- MongoDB runs separately, ideally on MongoDB Atlas.

## Recommended stack

- App hosting: Render Web Service
- Database: MongoDB Atlas

## Files added for deployment

- `render.yaml`
- `functional-batch-web/backend/.env.example`

## 1. Put the code in GitHub

Render deploys from a Git repository. Push this project to GitHub, GitLab, or Bitbucket.

## 2. Create a MongoDB Atlas database

Create an Atlas cluster and copy your driver connection string.

Example format:

```text
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/functionalBatchDB?retryWrites=true&w=majority
```

Make sure:

- you replace `USERNAME` and `PASSWORD`
- the password is URL-escaped if it contains special characters
- Atlas Network Access allows connections from the internet, or from Render specifically if you later tighten it

## 3. Deploy on Render

### Option A: Use `render.yaml`

1. Push this repo to GitHub.
2. In Render, choose `New` -> `Blueprint`.
3. Select the repo.
4. Render will detect `render.yaml`.
5. Set the `MONGO_URI` secret when prompted.
6. Create the service.

### Option B: Create the web service manually

Use these values:

- Runtime: `Node`
- Root Directory: `functional-batch-web`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Environment variables:

- `NODE_ENV=production`
- `MONGO_URI=<your Atlas connection string>`

## 4. After deploy

Your app will be available at:

```text
https://<your-service-name>.onrender.com/
```

Useful checks:

- App: `/`
- Health: `/api/health`
- API: `/api/batches`

## Local run

From `functional-batch-web/backend`:

```powershell
$env:MONGO_URI="mongodb://127.0.0.1:27017/functionalBatchDB"
npm start
```

## Notes

- The frontend now uses same-origin API calls in production.
- If you open `index.html` directly from disk, it falls back to `http://127.0.0.1:5000`.
- Render gives the app a public `.onrender.com` URL automatically.
