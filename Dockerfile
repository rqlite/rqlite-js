FROM node:10
WORKDIR /test
COPY . /test
RUN npm i
RUN npm run build-integrations
CMD ["npm", "run", "test-build-integrations"]