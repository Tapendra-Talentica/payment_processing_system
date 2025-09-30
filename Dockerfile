FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Remove any existing .npmrc and install without authentication
RUN rm -f .npmrc && \
    npm config set registry https://registry.npmjs.org/ && \
    npm install --no-audit --no-fund

COPY . .

RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 5000

CMD ["npm", "run", "start:prod"]
