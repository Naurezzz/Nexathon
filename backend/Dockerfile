# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all backend code
COPY . .

# Expose port 4000
EXPOSE 4000

# Start the server
CMD ["npm", "start"]
