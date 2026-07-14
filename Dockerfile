FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      chromium \
      ffmpeg \
      ca-certificates \
      dumb-init && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

USER node

EXPOSE 9798

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
