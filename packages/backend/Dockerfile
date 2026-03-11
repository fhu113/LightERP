FROM node:18-alpine

WORKDIR /app

# Copy package files from packages/backend
COPY package*.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.postgresql.prisma

# Build the project
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "dist/server.js"]
