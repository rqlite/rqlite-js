FROM node:24-bookworm
WORKDIR /test
COPY package.json package-lock.json .npmrc /test/
RUN npm ci
COPY babel.config.json /test
COPY es6 /test/es6
RUN npm run build-all
CMD ["npm", "run", "test-build-integrations"]
