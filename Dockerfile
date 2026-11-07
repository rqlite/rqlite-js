FROM node:24-bookworm
WORKDIR /test
COPY package.json package-lock.json .npmrc /test/
RUN npm ci
COPY tsconfig.json tsdown.config.ts jest.config.cjs .eslintrc.cjs /test/
COPY src /test/src
RUN npm run build
CMD ["npm", "run", "test-build-integrations"]
