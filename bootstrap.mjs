#!/usr/bin/env bun

// Example: running hackpad WASM in Node.js with overlayNodefs + overlayMemFS
// + spawning a child Go WASM process.
//
// Build:
//   PATH=cache/go/bin:cache/go/misc/wasm:$PATH GOOS=js GOARCH=wasm \
//     go build -o examples/node/init.wasm ./cmd/init/
//   PATH=cache/go/bin:cache/go/misc/wasm:$PATH GOOS=js GOARCH=wasm \
//     go build -o examples/node/info.wasm ./examples/node/info/
//   cp server/public/wasm/wasm_exec.js examples/node/
//
// Run:
//   node examples/node/run.mjs

import { readFileSync, writeFileSync, mkdirSync, statSync, lstatSync, readdirSync,
         unlinkSync, rmdirSync, rmSync, renameSync, chmodSync, utimesSync,
         readlinkSync, accessSync, symlinkSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ========================= SETUP =========================
function withLogging(obj, prefix = "") {

  return new Proxy(obj, {

    get(target, prop, receiver) {

      const orig = target[prop];

      if (typeof orig !== "function") return orig;

      return function (...args) {

        const name = prefix + String(prop);

        // console.log(`[nodefs] → ${name}`, args);

        try {

          const ret = orig.apply(this, args);

          // console.log(`[nodefs] ← ${name}`, ret);

          return ret;

        } catch (err) {

          console.log(`[nodefs] ✖ ${name}`, err);

          throw err;

        }

      };

    }

  });

}

// 1. Inject __nodefs bridge (required by overlayNodefs)
globalThis.__nodefs = withLogging((() => {
  const statToObj = s => ({
    dev: s.dev, ino: s.ino, mode: s.mode, nlink: s.nlink,
    uid: s.uid, gid: s.gid, rdev: s.rdev, size: s.size,
    blksize: s.blksize, blocks: s.blocks,
    isDirectory: s.isDirectory(), isFile: s.isFile(),
    isSymbolicLink: s.isSymbolicLink(),
    atimeMs: s.atimeMs, mtimeMs: s.mtimeMs,
  });
  return {
    readFileSync(p) {
      try { return { data: new Uint8Array(readFileSync(p)).buffer, err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    writeFileSync(p, b) {
      try { writeFileSync(p, Buffer.from(b)); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    statSync(p) {
      try { return { stat: statToObj(statSync(p)), err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    lstatSync(p) {
      try { return { stat: statToObj(lstatSync(p)), err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    mkdirSync(p, m) {
      try { mkdirSync(p, { mode: m }); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    mkdirAllSync(p, m) {
      try { mkdirSync(p, { recursive: true, mode: m }); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    readdirSync(p) {
      try { const e = readdirSync(p, { withFileTypes: true }); return { entries: e.map(d => ({ name: d.name, isDirectory: d.isDirectory(), isSymbolicLink: d.isSymbolicLink() })), err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    unlinkSync(p) {
      try { unlinkSync(p); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    rmdirSync(p) {
      try { rmdirSync(p); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    rmSync(p, r) {
      try { rmSync(p, { recursive: r, force: true }); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    renameSync(o, n) {
      try { renameSync(o, n); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    chmodSync(p, m) {
      try { chmodSync(p, m); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    utimesSync(p, a, m) {
      try { utimesSync(p, a, m); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    symlinkSync(t, p) {
      try { symlinkSync(t, p); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    readlinkSync(p) {
      try { return { link: readlinkSync(p), err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
    accessSync(p, m) {
      try { accessSync(p, m); return { err: null }; }
      catch (e) { return { err: e.code ? { code: e.code, message: e.message } : e.message }; }
    },
  };
})());

// 2. Load Go's wasm_exec.js runtime
const require = createRequire(import.meta.url);
require(join(__dirname, 'wasm_exec.js'));

// ========================= MAIN =========================

async function main() {
  // 3. Load and run Go WASM (cmd/init)
  const go = new globalThis.Go();
  const { instance } = await WebAssembly.instantiate(
    readFileSync(join(__dirname, 'init.wasm')),
    go.importObject,
  );
  go.run(instance);

  // Wait for Go init to finish
  while (!globalThis.hackpad?.ready) {
    await new Promise(r => setTimeout(r, 10));
  }

  const { hackpad, fs: vfs, child_process } = globalThis;
  const O = vfs.constants;

  globalThis.child_process = withLogging(child_process);

  // ====== overlayMemFS ======
  console.log('\n=== overlayMemFS ===');
  // vfs.mkdirSync('/tmp/', 0o755);
  // await hackpad.overlayMemFS('/tmp/');

  // ====== overlayNodefs ======
  console.log('\n=== overlayNodefs ===');
  vfs.mkdirSync('/mnt', 0o755);
  vfs.mkdirSync('/mnt/host', 0o755);
  await hackpad.overlayNodefs('/mnt/host', __dirname, 'readwrite');

  const entries = vfs.readdirSync('/mnt/host');
  // console.log('host dir:', entries.filter(e => e.endsWith('.mjs') || e.endsWith('.wasm')));
  console.log('host dir:', entries);

  // ====== spawn Go WASM child process ======
  console.log('\n=== Spawning child Go WASM ===');

/*
  const subprocess3 = child_process.spawn('/mnt/host/go/bin/go', ['install', '-x', 'std'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: '/mnt/host/',
    env: {
      PATH: '/bin',
      HOME: '/mnt/host',
      USER: 'me',
      TMPDIR: '/tmp',
      GOTMPDIR: '/tmp',
      GOCACHE: '/tmp/cache',
      GOPATH: '/tmp/go',
    },
  });
*/

/*
  await new Promise(r => setTimeout(r, 1600)); // wait for inherited stdout to flush
  const subprocess2 = child_process.spawn('/mnt/host/goroot/bin/go', ['env'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: '/mnt/host/work/src',
    env: {
      PATH: '/bin',
      HOME: '/home/me',
      USER: 'me',
      TMPDIR: '/tmp',
      GOTMPDIR: '/tmp',
      GOCACHE: '/tmp/cache',
    },
  });
  await new Promise(r => setTimeout(r, 3600)); // wait for inherited stdout to flush

  const subprocess7 = child_process.spawn('/mnt/host/go/bin/go', ['install', '-x', 'std'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: '/mnt/host/work/src/',
    env: {
      PATH: '/mnt/host/bin',
      HOME: '/home/me',
      USER: 'me',
      CGO_ENABLED: '0',
      TMPDIR: '/tmp',
      GOTMPDIR: '/tmp',
      GOCACHE: '/tmp/cache',
    },
  });
  // child_process.waitSync(subprocess7.pid);
*/

  // Spawn it — stdout/stderr inherit to let output appear here
  const subprocess = child_process.spawn('/mnt/host/goroot/bin/go', ['run', './cmd/dist', 'bootstrap', '-d', '-v'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: '/mnt/host/work/src/',
    env: {
      PATH: '/mnt/host/bin',
      HOME: '/mnt/host',
      USER: 'me',
      CGO_ENABLED: '0',
      TMPDIR: '/tmp',
      GOTMPDIR: '/tmp',
      GOCACHE: '/mnt/host/go-cache',
      GOROOT_BOOTSTRAP: '/mnt/host/goroot',
      GOTOOLDIR: '/mnt/host/goroot/pkg/tool/js_wasm',
      GOROOT: '/mnt/host/work',
    },
  });
  await new Promise(r => setTimeout(r, 600)); // wait for inherited stdout to flush
  console.log('child pid:', subprocess.pid);

  // Wait for it
  // const result = child_process.waitSync(subprocess.pid);
  // console.log('exit result:', JSON.stringify(result));

  // ====== Mounts ======
  console.log('\n=== Mounts ===');
  console.log(hackpad.getMounts());

  console.log('\nAll OK — exiting');
  // Give child stdout pipes a moment to flush, then exit
  // setTimeout(() => process.exit(0), 500);
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
