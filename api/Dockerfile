FROM node:22-alpine

ARG APP_VERSION=v1.0.0

LABEL name="compose-api"

LABEL version="${APP_VERSION}}"

WORKDIR /app

COPY package*.json .

RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production

EXPOSE 3000

USER node

CMD [ "npm","start" ]