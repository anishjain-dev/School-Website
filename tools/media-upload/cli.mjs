#!/usr/bin/env node
// Cloudflare Images upload CLI — the ONLY path media takes into the store
// (git never holds binaries; Keystatic has no image fields).
//
//   pnpm media upload <file> --alt "description"           interactive gate
//   pnpm media upload <file> --alt "..." --no-child        gate answered
//   pnpm media upload <file> --alt "..." --dry-run         no credentials needed
//
// Requires CF_ACCOUNT_ID + CF_IMAGES_TOKEN in the environment (.env is
// gitignored) unless --dry-run. Prints the image ID + ready-to-paste YAML.
import { createInterface } from 'node:readline/promises';
import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { gate } from './gate.mjs';

const args = process.argv.slice(2);
const [command, file] = args;
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : undefined;
};

if (command !== 'upload' || !file) {
  console.log('usage: pnpm media upload <file> --alt "description" [--no-child] [--dry-run]');
  process.exit(1);
}

const alt = opt('alt');
if (alt === undefined) {
  console.error('An --alt description is required (empty string only for decorative images).');
  process.exit(1);
}

let containsIdentifiableChild;
if (flag('no-child')) {
  containsIdentifiableChild = false;
} else if (flag('contains-child')) {
  containsIdentifiableChild = true;
} else {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Does this image contain an IDENTIFIABLE CHILD? (yes/no) ');
  rl.close();
  containsIdentifiableChild = !/^n(o)?$/i.test(answer.trim());
}

const verdict = gate({ containsIdentifiableChild, filename: basename(file) });
if (!verdict.allowed) {
  console.error(`\n${verdict.message}`);
  process.exit(2);
}

const size = statSync(file).size;
if (flag('dry-run')) {
  console.log(`dry-run: would upload ${file} (${size} bytes) to Cloudflare Images with alt "${alt}".`);
  process.exit(0);
}

const accountId = process.env.CF_ACCOUNT_ID;
const token = process.env.CF_IMAGES_TOKEN;
if (!accountId || !token) {
  console.error('CF_ACCOUNT_ID and CF_IMAGES_TOKEN must be set (see .env.example). Use --dry-run without credentials.');
  process.exit(1);
}

const form = new FormData();
form.append('file', new Blob([readFileSync(file)]), basename(file));
const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
const json = await res.json();
if (!json.success) {
  console.error('upload failed:', JSON.stringify(json.errors));
  process.exit(1);
}

const id = json.result.id;
console.log(`\nuploaded: ${id}\n\npaste into content:\n  ref:\n    id: "${id}"\n    alt: "${alt}"`);
