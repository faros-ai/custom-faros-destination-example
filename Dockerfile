FROM node:18-alpine

WORKDIR /home/node/airbyte

COPY lerna.json .tsconfig.json package.json package-lock.json ./
RUN sed -i "/jest\|mockttp/d" package.json
COPY ./destinations ./destinations

RUN apk -U upgrade
RUN apk add --no-cache --virtual .gyp python3 py3-setuptools make g++ \
    && npm install -g npm lerna @lerna/legacy-package-management tsc
RUN lerna bootstrap --hoist

ARG version
RUN test -n "$version" || (echo "'version' argument is not set, e.g --build-arg version=x.y.z" && false)
ENV CONNECTOR_VERSION $version

RUN apk del .gyp

ARG path
RUN test -n "$path" || (echo "'path' argument is not set, e.g --build-arg path=destinations/example-destination" && false)
ENV CONNECTOR_PATH $path

RUN ln -s "/home/node/airbyte/$CONNECTOR_PATH/bin/main" "/home/node/airbyte/main"

ENV AIRBYTE_ENTRYPOINT "/home/node/airbyte/main"
ENTRYPOINT ["/home/node/airbyte/main"]
