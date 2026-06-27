[[ -f go1.27.0-go4js.1.js-wasm.min.tar.gz ]] || {
  curl -LO https://github.com/justwasm/go4js/releases/download/go1.27.0-go4js.1/go1.27.0-go4js.1.js-wasm.min.tar.gz
}

[[ -f main.wasm ]] || {
  curl -sL https://justwasm.github.io/hackpad/wasm/main.wasm > main.wasm
}

src=goroot
dst=work

mkdir -p $src $dst
rm -rf $src $dst

tar xf go1.27.0-go4js.1.js-wasm.min.tar.gz
mv go $dst

tar xf go1.27.0-go4js.1.js-wasm.min.tar.gz
mv go $src
