# Build the browser app with public Firebase configuration only.
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend --no-audit --no-fund
COPY frontend ./frontend

# Railway passes declared ARG values from the service variables.
# Never declare server credentials here: React embeds these values in public JS.
ARG REACT_APP_FIREBASE_API_KEY
ARG REACT_APP_FIREBASE_AUTH_DOMAIN
ARG REACT_APP_FIREBASE_PROJECT_ID
ARG REACT_APP_FIREBASE_STORAGE_BUCKET
ARG REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ARG REACT_APP_FIREBASE_APP_ID
ARG REACT_APP_FIREBASE_MEASUREMENT_ID

RUN node -e "const keys = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID']; const missing = keys.filter(key => !process.env['REACT_APP_FIREBASE_' + key]); if (missing.length) { console.error('Missing Firebase build variables: ' + missing.join(', ')); process.exit(1); }"
RUN GENERATE_SOURCEMAP=false npm run build --prefix frontend

# Keep build tools and frontend dependencies out of the running service.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend --omit=dev --no-audit --no-fund
COPY --chown=node:node backend ./backend
COPY --from=frontend-build --chown=node:node /app/frontend/build ./frontend/build
USER node
EXPOSE 5000

# The backend serves /api routes and the compiled React build.
CMD ["node", "backend/server.js"]
