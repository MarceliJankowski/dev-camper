##################################################
#                      BASE                      #
##################################################

FROM node:18.16.0-slim AS base

WORKDIR /usr/src/app

EXPOSE $PORT

ENV NODE_ENV=production

RUN mkdir node_modules && chown -R node:node ./node_modules

USER node

COPY --chown=node:node package.json package-lock.json ./

RUN npm ci && npm cache clean --force

##################################################
#                  DEVELOPMENT                   #
##################################################

FROM base AS development

ENV NODE_ENV=development

RUN npm install

CMD ["npm", "run", "dev"]
