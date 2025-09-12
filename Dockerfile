# Use the official Node.js 22 image as a base
FROM node:22-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies for the root, backend, and frontend
RUN npm install
RUN npm install --prefix backend
RUN npm install --prefix frontend

# Copy the rest of your application code
COPY . .

# -- IMPORTANT PART --
# Install Playwright browsers and their system dependencies inside the Docker build
RUN npx playwright install --with-deps chromium

# Build the frontend (if you have a build step)
RUN npm run build --prefix frontend

# Expose the port your backend runs on
EXPOSE 5000

# The command to start your backend server
CMD [ "npm", "start", "--prefix", "backend" ]