FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 make g++

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Second stage: production image
FROM node:20-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Install dependencies required by bcrypt
RUN apk add --no-cache python3 make g++

# Copy built assets from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Install only production dependencies
RUN npm ci --only=production

# Expose the port the app will run on
EXPOSE 3000

# Command to run the application
CMD ["node", "build"]