FROM node:alpine

WORKDIR /app

COPY . .

# تنظیم رجیستری NPM به npmmirror.com
RUN npm config set registry https://registry.npmmirror.com

# نصب وابستگی‌ها با استفاده از --force برای غیرفعال کردن محافظت‌های توصیه‌شده
RUN npm install -f

# ساخت پروژه
RUN npm run build

# شروع پروژه در حالت تولید
RUN npm run start:prod

# نمایان‌سازی پورت 3010
EXPOSE 3010

# اجرای پروژه در حالت تولید
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