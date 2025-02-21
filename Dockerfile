FROM node:alpine

WORKDIR /app

COPY . .

RUN npm config set registry https://registry.npmmirror.com

RUN npm install -f

RUN npm run build
RUN npm run start:prod
EXPOSE 3010
CMD ["npm", "run", "start:prod"]
# CMD ["npm", "start"]

# FROM node:20-alpine AS builder

# WORKDIR /app
# COPY package*.json ./
# # RUN npm ci
# COPY . .
# RUN npm run build

# FROM node:20-alpine
# WORKDIR /app

# COPY --from=builder /app/package*.json ./
# RUN npm ci --omit=dev
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/server.mjs ./

# ENV NODE_ENV production
# EXPOSE 1213

# USER node
# CMD ["npm", "run", "start:prod"]