FROM btwiuse/arch:bun

COPY . /app

WORKDIR /app

RUN bun bootstrap.mjs

CMD ["bun", "bootstrap.mjs"]
