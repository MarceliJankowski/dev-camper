# WARNING: 'buildx' builder is required

##################################################
#                      BASE                      #
##################################################

FROM node:18.16.0-slim AS base

WORKDIR /usr/src/app

EXPOSE $PORT

# 'node' user doesn't have permissions to alter file-system
RUN mkdir node_modules && chown node:node ./node_modules

USER node

COPY package.json package-lock.json ./

##################################################
#                      TEST                      #
##################################################

FROM base AS test

RUN npm ci

COPY . .

CMD ["npm", "test"]

##################################################
#                  DEVELOPMENT                   #
##################################################

FROM base AS development

ENV NODE_ENV=development

# install 'curl' (used by docker-compose healthcheck)
USER root
RUN apt-get update -qq && apt-get install -qy curl
USER node

RUN npm ci

CMD ["npm", "run", "dev"]
