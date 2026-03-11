FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN cd packages/backend && npm install

# Copy source code
COPY . .

# Build
RUN cd packages/backend && npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["sh", "-c", "cd packages/backend && node dist/server.js"]
