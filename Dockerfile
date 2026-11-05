# Production image: Next.js standalone output + Payload CMS.
# The home page is prerendered, so the build must be able to reach MongoDB: pass MONGODB_URI as a
# build argument (see docker-compose.yml and docs/DEPLOYMENT.md).
FROM node:22-alpine AS source
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

FROM source AS build
ARG MONGODB_URI
ARG NEXT_PUBLIC_SERVER_URL=http://localhost:3000
ENV MONGODB_URI=$MONGODB_URI
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV PAYLOAD_SECRET=build-time-only
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV MEDIA_DIR=/data/media
RUN addgroup -S app && adduser -S app -G app && mkdir -p /data/media && chown -R app:app /data
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
VOLUME ["/data/media"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
