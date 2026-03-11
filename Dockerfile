FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install
RUN npx prisma generate --schema=packages/backend/prisma/schema.prisma
RUN npm run build -w packages/backend

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "packages/backend"]