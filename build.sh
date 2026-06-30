mkdir -p bin
curl -L https://w9y.up.railway.app/go/github.com/justwasm/hackpad/cmd/init@main > bin/init
curl -L https://w9y.up.railway.app/go/github.com/btwiuse/hush/cmd/sh@v0.5.3 > bin/sh
curl -L https://w9y.up.railway.app/go/github.com/btwiuse/dl/go4js@v0.1.3 > bin/go
curl -L https://w9y.up.railway.app/go/github.com/btwiuse/dl/gotip@v0.1.3 > bin/gotip
chmod +x bin/*

exit 0

[[ -f go1.27.0-go4js.1.js-wasm.bin.tar.gz ]] || {
  curl -LO https://github.com/justwasm/go4js/releases/download/go1.27.0-go4js.1/go1.27.0-go4js.1.js-wasm.bin.tar.gz
}

[[ -f go1.27.0-go4js.1.js-wasm.src.min.tar.gz ]] || {
  curl -LO https://github.com/justwasm/go4js/releases/download/go1.27.0-go4js.1/go1.27.0-go4js.1.js-wasm.src.min.tar.gz
}

[[ -f init.wasm ]] || {
  curl -sL https://justwasm.github.io/hackpad/wasm/init.wasm > init.wasm
}

boot=goroot
target=work

mkdir -p $boot $target
rm -rf $boot $target

tar xf go1.27.0-go4js.1.js-wasm.bin.tar.gz
tar xf go1.27.0-go4js.1.js-wasm.src.min.tar.gz
mv go $boot

tar xf go1.27.0-go4js.1.js-wasm.src.min.tar.gz
mv go $target

cp $target/lib/wasm/wasm_exec.js .
