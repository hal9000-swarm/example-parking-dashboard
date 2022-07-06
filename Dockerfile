FROM node:16
RUN apt-get update && apt-get install -y libsecret-1-0 libsecret-1-dev

WORKDIR /app

COPY app .
RUN npm ci --only=production

EXPOSE 8080

CMD [ "node", "app.js"]
