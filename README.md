# Vedant Payghan: MERN Portfolio

## Run locally
```bash
# 1) API
cd server && cp .env.example .env   # add your MongoDB Atlas URI
npm install && npm run dev

# 2) Website (new terminal)
cd client && cp .env.example .env
npm install && npm run dev          # opens http://localhost:5173
```
The site works even if the API is off (projects load from `src/data.js`); only the contact form needs the server.

## Edit your content
- Text, skills, education: `client/src/data.js`
- Projects in the database: `server/seed.js` (seeds once when the collection is empty)
- Colors: CSS variables at the top of `client/src/styles.css`

## Deploy
Client to Vercel/Netlify (set `VITE_API_URL`), server to Render/Railway (set `MONGO_URI`, `CLIENT_URL`), database on MongoDB Atlas.
