FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY api ./api
COPY index.html app.js style.css ./
COPY vendor ./vendor
EXPOSE 8080
CMD ["node", "api/server.js"]
