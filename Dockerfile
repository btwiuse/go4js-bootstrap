FROM btwiuse/arch:bun

COPY . /app

WORKDIR /app

CMD ["bun", "bootstrap.mjs"]
