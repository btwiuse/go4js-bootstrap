FROM btwiuse/arch:bun

COPY . /app

WORKDIR /app

RUN bash build.sh

RUN node bootstrap.mjs

CMD ["node", "bootstrap.mjs"]
