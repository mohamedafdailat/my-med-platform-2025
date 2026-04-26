# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies using npm install (this runs postinstall scripts)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend application
RUN npm run build

# Expose the app port
EXPOSE 5000

# Start the backend. It serves /api routes and the compiled frontend build.
CMD ["node", "backend/server.js"]
