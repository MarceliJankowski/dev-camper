#*************************************************
                      #BASE
#*************************************************

FROM node:18.0.0 as base

# vi.mock requires WORKDIR to start with: '/usr', otherwise it fails to mock correctly
WORKDIR /usr/src/app

EXPOSE $PORT

ENV NODE_ENV=production

RUN mkdir node_modules && chown -R node:node ./node_modules

# node user (from node base image) will be used for: RUN, ENTRYPOINT and CMD instructions (and for docker exec)
USER node

COPY --chown=node:node package.json package-lock.json ./

RUN npm ci && npm cache clean --force

#*************************************************
                   #DEVELOPMENT
#*************************************************

FROM base as development

ENV NODE_ENV=development

RUN npm install && npm cache clean --force

CMD ["npm", "run", "dev"]
