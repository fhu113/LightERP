FROM node:18-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

COPY . .

# Install root dependencies
RUN npm install

# Install backend dependencies (including devDependencies for Prisma)
RUN cd packages/backend && npm install

# Generate Prisma client using PostgreSQL schema
RUN cd packages/backend && npx prisma generate --schema=prisma/schema.postgresql.prisma

# Build the backend (with accept-data-loss to handle schema changes)
RUN cd packages/backend && npx prisma generate --schema=prisma/schema.postgresql.prisma && npx prisma db push --schema=prisma/schema.postgresql.prisma --accept-data-loss && npm run build

EXPOSE 3000

# Run db push at startup to create tables, then start the server
CMD cd /app && npx prisma db push --schema=packages/backend/prisma/schema.postgresql.prisma --skip-generate && node packages/backend/dist/server.js
