# ---------- Build stage ----------
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build React app
COPY . .
RUN npm run build

# ---------- Production stage ----------
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy React build output
COPY --from=builder /usr/src/app/build ./

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose container port (still 80 inside)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
