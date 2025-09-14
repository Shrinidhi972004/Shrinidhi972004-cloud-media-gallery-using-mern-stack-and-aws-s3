# ---------- Build stage ----------
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files & install deps
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# ---------- Runtime stage ----------
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only node_modules from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy app source (no dev junk like node_modules, .env)
COPY --from=builder /usr/src/app ./

# Expose backend port
EXPOSE 5002

# Run backend
CMD ["node", "app.js"]
