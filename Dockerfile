FROM alpine:3.24.2

WORKDIR /app

RUN apk add nodejs && \
    apk add npm && \
    apk add curl

COPY . .

RUN npm i

CMD ["npm", "start"]
