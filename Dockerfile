FROM btwiuse/arch:bun

COPY . /app

WORKDIR /app

RUN bash build.sh

RUN deno -A bootstrap.mjs

CMD ["deno", "-A", "bootstrap.mjs"]
