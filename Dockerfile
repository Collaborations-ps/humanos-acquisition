### NODE CACHE
FROM node:dubnium-alpine AS node_cache

WORKDIR /cache

COPY package.json yarn.lock .yarnrc ./

RUN apk --no-cache add --virtual builds-deps build-base python curl git

RUN yarn install --no-cache

### RELEASE
FROM node:dubnium-alpine

WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV ${node_env}

ARG api_host
ENV API_HOST ${api_host}

ARG web_url
ENV WEB_URL ${web_url}

ARG google_client_id
ENV GOOGLE_CLIENT_ID ${google_client_id}

ARG sentry_dsn
ENV SENTRY_DSN ${sentry_dsn}

COPY --from=node_cache /cache/ .

COPY pages ./pages/
COPY utils ./utils/
COPY public ./public/
COPY components ./components/
COPY next.config.js ./next.config.js
COPY tsconfig.json ./tsconfig.json
COPY next-env.d.ts ./next-env.d.ts

RUN yarn build

EXPOSE 80

CMD yarn serve -p 80
