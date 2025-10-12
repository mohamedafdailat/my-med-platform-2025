# Use Node.js LTS version
FROM node:18-alpine

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

# Install serve to run the static frontend
RUN npm install -g serve

# Expose the port for the backend (5000) and frontend (3000)
EXPOSE 5000
EXPOSE 3000

# Start both backend and frontend (using a custom script or multi-command)
CMD sh -c "node backend/index.js & serve -s frontend/build -l 3000"