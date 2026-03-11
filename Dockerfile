FROM node:18-alpine

WORKDIR /app

COPY . .

ENV NODE_ENV=development
RUN npm install --include=dev
RUN npx prisma generate --schema=packages/backend/prisma/schema.prisma
RUN npm run build -w packages/backend

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "packages/backend"]