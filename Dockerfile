FROM node:18-alpine as builder

WORKDIR /var/www
COPY . /var/www/

ENV PATH=$PATH:/var/www/node_modules/.bin
RUN yarn install
RUN yarn build

FROM node:18-alpine
WORKDIR /var/www
COPY --from=builder /var/www/build /var/www/build
COPY --from=builder /var/www/node_modules /var/www/node_modules
COPY --from=builder /var/www/package.json /var/www/
COPY --from=builder /var/www/remix.config.js /var/www/
COPY --from=builder /var/www/public /var/www/public
ENV PATH=$PATH:/var/www/node_modules/.bin

EXPOSE 3000
CMD ["npm", "start"]
