tar:
	curl -LO https://github.com/justwasm/go4js/releases/download/go1.27.0-go4js.1/go1.27.0-go4js.1.js-wasm.min.tar.gz

clean:
	mv go-cache/ go1.27.0-go4js.1.js-wasm.bin.tar.gz go1.27.0-go4js.1.js-wasm.src.min.tar.gz goroot/ init.wasm wasm_exec.js work/ `mktemp -d`

build:
	bash build.sh

node: build
	time node bootstrap.mjs | ts

deno: build
	time deno -A bootstrap.mjs | ts
