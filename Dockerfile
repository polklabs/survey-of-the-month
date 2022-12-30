FROM node:16
ENV IS_DOCKER 'true'

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3080
CMD ["node", "server.bundle.js"]