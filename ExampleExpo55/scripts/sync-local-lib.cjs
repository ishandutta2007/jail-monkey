#!/usr/bin/env node
/**
 * `file:..` installs use symlinks; Expo iOS autolinking skips symlinked *.podspec
 * (dirent.isFile() is false). Copy the real library artifacts into node_modules.
 */
const fs = require('fs');
const path = require('path');

const exRoot = path.join(__dirname, '..');
const libRoot = path.join(exRoot, '..');
const dest = path.join(exRoot, 'node_modules', 'jail-monkey');

/** Match what ships in the npm tarball (native + JS entrypoints only) */
const WHITELIST = [
  'JailMonkey',
  'android',
  'specs',
  'index.tsx',
  'package.json',
  'jail-monkey.podspec',
  'jailmonkey.d.ts',
];

function copyRecursive(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, ent.name);
    const out = path.join(dstDir, ent.name);
    if (ent.isDirectory()) {
      copyRecursive(src, out);
    } else if (ent.isFile()) {
      fs.copyFileSync(src, out);
    } else if (ent.isSymbolicLink()) {
      let target = fs.readlinkSync(src);
      if (!path.isAbsolute(target)) {
        target = path.resolve(path.dirname(src), target);
      }
      if (!fs.existsSync(target)) {
        continue;
      }
      const st = fs.statSync(target);
      if (st.isDirectory()) {
        copyRecursive(target, out);
      } else {
        fs.copyFileSync(target, out);
      }
    }
  }
}

if (!fs.existsSync(path.join(libRoot, 'jail-monkey.podspec'))) {
  process.stderr.write('sync-local-lib: no jail-monkey.podspec in parent, skip\n');
  process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
fs.mkdirSync(dest, { recursive: true });

for (const name of WHITELIST) {
  const src = path.join(libRoot, name);
  if (!fs.existsSync(src)) {
    continue;
  }
  const out = path.join(dest, name);
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    copyRecursive(src, out);
  } else {
    fs.copyFileSync(src, out);
  }
}

process.stdout.write('sync-local-lib: copied jail-monkey into node_modules/jail-monkey\n');
