# Use Node.js LTS version
FROM node:20-alpine

WORKDIR /app

# Install backend and frontend dependencies directly.
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm ci --prefix backend
RUN npm ci --prefix frontend

COPY backend ./backend
COPY frontend ./frontend

# React build-time env vars are injected by Railway during this step.
RUN npm run build --prefix frontend

ENV NODE_ENV=production
EXPOSE 5000

# The backend serves /api routes and the compiled React build.
CMD ["node", "backend/server.js"]
