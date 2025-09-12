# Use the official Node.js 22 slim image as a parent image
FROM node:22-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the top-level package.json and package-lock.json
COPY package*.json ./

# Install all dependencies from the single package.json
RUN npm install

# Copy the rest of your application code into the container
COPY . .

# Make your app's port available to the outside world
EXPOSE 4000

# Define the command to run your app
CMD ["node", "backend/index.js"]