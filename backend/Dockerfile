FROM node:20-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --production

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

# Apply the Prisma schema and start server
CMD ["sh", "-c", "npx prisma db push && node src/utils/seed.js && node src/index.js"]
