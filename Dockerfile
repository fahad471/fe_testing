# Step 1: Use Node.js image to build the app
FROM node:18-alpine AS build

# Set working directory in the container
WORKDIR /app

# Copy only the package.json to install dependencies
COPY package.json ./

# Install dependencies

RUN npm install -upgrade


RUN npm install node-fetch

RUN npm install node-polyfill-webpack-plugin

RUN npm install path-browserify stream-browserify url util browserify-zlib



# Copy the rest of the application code (including your React app)
COPY . .

# Expose environment variables
ENV PORT=3000

# Install dependencies and start the app
CMD ["npm", "start"]
