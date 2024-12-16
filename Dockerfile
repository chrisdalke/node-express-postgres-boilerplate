FROM node:18

# Set up pm2 process manager.
RUN npm install pm2 pm2-logrotate -g \
    && pm2 set pm2-logrotate:retain 5 \
    && pm2 set pm2-logrotate:max_size 50M

# Install dependencies
WORKDIR /app
COPY ./package.json .
RUN npm install --loglevel verbose

# Copy in the api files
WORKDIR /app
COPY ./config ./config
COPY ./migrations ./migrations
COPY ./src ./src
COPY ./.babelrc .
COPY ./.eslintrc.json .
COPY ./.nycrc .
COPY ./ecosystem.config.json .

# transpile the app.
RUN npm run build

ENV NODE_ENV 'development'

CMD ["pm2-runtime", "start", "ecosystem.config.json"]