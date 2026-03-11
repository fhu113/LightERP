FROM node:18-alpine

WORKDIR /app

COPY . .

# Install root dependencies
RUN npm install

# Install backend dependencies (including devDependencies for Prisma)
RUN cd packages/backend && npm install

# Generate Prisma client
RUN cd packages/backend && npx prisma generate --schema=prisma/schema.postgresql.prisma

# Build the backend
RUN cd packages/backend && npm run build

EXPOSE 3000

CMD ["node", "packages/backend/dist/server.js"]
