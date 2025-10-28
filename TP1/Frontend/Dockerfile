# Build stage
FROM node:12.16.3-stretch-slim AS build

WORKDIR /opt/front

# Copy package files
COPY package.json .
COPY yarn.lock .

# Install dependencies
RUN npm install

# Copy source code
COPY src/ src/
COPY public/ public/
COPY babel.config.js .
COPY .env.production .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:1.15.7-alpine

# Copy built files to nginx
COPY --from=build /opt/front/dist /usr/share/nginx/html/

# Copy nginx configuration with API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
