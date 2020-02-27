### NODE CACHE
FROM node:dubnium-alpine AS node_cache

WORKDIR /cache

COPY package.json yarn.lock .yarnrc ./

RUN apk --no-cache add --virtual builds-deps build-base python curl git

RUN yarn install --no-cache

### RELEASE
FROM node:dubnium-alpine

WORKDIR /app

COPY --from=node_cache /cache/ .

COPY pages ./pages/
COPY server ./server/
COPY utils ./utils/
COPY public ./public/
COPY next.config.js ./next.config.js
COPY tsconfig.json ./tsconfig.json
COPY next-env.d.ts ./next-env.d.ts

RUN yarn build

EXPOSE 80

CMD ["yarn", "serve"]
