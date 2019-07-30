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

ADD . .

EXPOSE 80

CMD ["yarn", "start"]
