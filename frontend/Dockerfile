FROM node:20-alpine

WORKDIR /app

# context = repo root (см. docker-compose.yml)
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend ./

# sdk/templates кладём как _sdk/_templates чтобы alias из vite.config.js резолвился
# (на Windows эти пути сделаны junction'ами, в контейнере — реальные копии).
COPY sdk ./_sdk
COPY templates ./_templates

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
