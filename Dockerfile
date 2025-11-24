# Use an official Node.js 20 lightweight image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json .
COPY package-lock.json .

# Install dependencies
RUN npm install

# Copy the rest of your project code into the container
COPY . .

# Vite uses port 3000, so we expose it
EXPOSE 3000

# The command to run your app
CMD ["npm", "run", "dev"]