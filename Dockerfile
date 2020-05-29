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

ARG microsoft_teams_client_id
ENV MICROSOFT_TEAMS_CLIENT_ID ${microsoft_teams_client_id}

ARG microsoft_teams_authority
ENV MICROSOFT_TEAMS_AUTHORITY ${microsoft_teams_authority}

ARG microsoft_teams_redirect_uri
ENV MICROSOFT_TEAMS_REDIRECT_URI ${microsoft_teams_redirect_uri}

COPY --from=node_cache /cache/ .

COPY pages ./pages/
COPY utils ./utils/
COPY services ./services/
COPY public ./public/
COPY components ./components/
COPY next.config.js ./next.config.js
COPY tsconfig.json ./tsconfig.json
COPY next-env.d.ts ./next-env.d.ts

RUN yarn build

EXPOSE 80

CMD yarn serve -p 80
