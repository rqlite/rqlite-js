FROM node:14.15.1
WORKDIR /test
COPY package.json /test
COPY .npmrc /test
RUN npm i
COPY babel.config.json /test
COPY es6 /test/es6
RUN npm run build-all
CMD ["npm", "run", "test-build-integrations"]