[[ -f go1.27.0-go4js.1.js-wasm.min.tar.gz ]] || {
  curl -LO https://github.com/justwasm/go4js/releases/download/go1.27.0-go4js.1/go1.27.0-go4js.1.js-wasm.min.tar.gz
}

[[ -f go1.27.0-go4js.1.js-wasm.src.min.tar.gz ]] || {
  curl -LO https://github.com/justwasm/go4js/releases/download/go1.27.0-go4js.1/go1.27.0-go4js.1.js-wasm.src.min.tar.gz
}

[[ -f main.wasm ]] || {
  curl -sL https://justwasm.github.io/hackpad/wasm/init.wasm > main.wasm
}

boot=goroot
target=work

mkdir -p $boot $target
rm -rf $boot $target

tar xf go1.27.0-go4js.1.js-wasm.min.tar.gz
mv go $boot

tar xf go1.27.0-go4js.1.js-wasm.src.min.tar.gz
mv go $target
