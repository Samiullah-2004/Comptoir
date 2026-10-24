FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "start"]
