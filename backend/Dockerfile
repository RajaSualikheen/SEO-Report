# Use the official Node.js 22 slim image as a parent image
FROM node:22-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the backend's package.json and package-lock.json
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of the backend's source code
COPY . .

# Make your app's port available
EXPOSE 4000

# Define the command to run your app
CMD ["node", "index.js"]