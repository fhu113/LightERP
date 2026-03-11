FROM node:18-alpine

WORKDIR /app

COPY . .

# Install all dependencies (including devDependencies for Prisma)
RUN npm install

# Generate Prisma client
RUN npx prisma generate --schema=packages/backend/prisma/schema.prisma

# Build the backend
RUN npm run build -w packages/backend

EXPOSE 3000

CMD ["node", "packages/backend/dist/server.js"]
