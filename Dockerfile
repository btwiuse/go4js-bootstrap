FROM btwiuse/arch:bun

COPY . /app

WORKDIR /app

RUN bash build.sh

RUN bun bootstrap.mjs

CMD ["bun", "bootstrap.mjs"]
