FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install -f

COPY . .

ENV NODE_ENV=production

RUN npm run build


FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "start"]
