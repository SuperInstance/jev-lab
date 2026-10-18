#!/usr/bin/env node
// Enumerate the test directory and pass explicit paths.
//
// `node --test "test/*.test.mjs"` works on node 21+ (node expands the
// glob) and FAILS on node 20 (node treats the quoted glob as a literal
// path and finds no file). The CI matrix caught exactly that. Enumerating
// the directory works on every version and every platform, and it also
// means a test file that no script names is impossible.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(HERE).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => join(HERE, f));
if (!files.length) { console.error('no test files'); process.exit(1); }
console.log(`running ${files.length} test file(s)`);
process.exit(spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' }).status ?? 1);
