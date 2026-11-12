import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSkill, checkLocalLinks } from '../scripts/check.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const valid = '---\nname: sample-skill\ndescription: >-\n  Use only for the requested task.\ncompatibility: Terminal available.\n---\n\n# Task\nRead relevant evidence.\n';

async function fixture(t, content = valid) {
  await mkdir(path.join(root, '.local'), { recursive: true });
  const base = await mkdtemp(path.join(root, '.local/check-test-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const dir = path.join(base, 'sample-skill');
  await mkdir(dir);
  await writeFile(path.join(dir, 'SKILL.md'), content);
  return { base, dir };
}

test('accepts a compact single-file skill', async t => {
  const { dir } = await fixture(t);
  assert.equal((await checkSkill(dir)).name, 'sample-skill');
});

test('accepts Windows CRLF line endings', async t => {
  const { dir } = await fixture(t, valid.replaceAll('\n', '\r\n'));
  assert.equal((await checkSkill(dir)).name, 'sample-skill');
});

test('rejects missing frontmatter', async t => {
  const { dir } = await fixture(t, '# Task\nBody');
  await assert.rejects(checkSkill(dir), /frontmatter/);
});

test('rejects a different declared name', async t => {
  const { dir } = await fixture(t, valid.replace('name: sample-skill', 'name: other-skill'));
  await assert.rejects(checkSkill(dir), /name must match/);
});

test('rejects missing description', async t => {
  const { dir } = await fixture(t, valid.replace('description: >-\n  Use only for the requested task.\n', ''));
  await assert.rejects(checkSkill(dir), /Description/);
});

test('rejects overlong descriptions', async t => {
  const { dir } = await fixture(t, valid.replace('Use only for the requested task.', '字'.repeat(1025)));
  await assert.rejects(checkSkill(dir), /Description/);
});

test('rejects a tool restriction field', async t => {
  const { dir } = await fixture(t, valid.replace('compatibility:', 'allowed-tools: Bash\ncompatibility:'));
  await assert.rejects(checkSkill(dir), /tool set/);
});

test('rejects an empty body', async t => {
  const { dir } = await fixture(t, valid.slice(0, valid.indexOf('# Task')));
  await assert.rejects(checkSkill(dir), /body/);
});

test('rejects oversized runtime text', async t => {
  const { dir } = await fixture(t, valid + 'Long guidance\n'.repeat(121));
  await assert.rejects(checkSkill(dir), /size budget/);
});

test('rejects extra installed documentation', async t => {
  const { dir } = await fixture(t);
  await writeFile(path.join(dir, 'README.md'), 'Maintainer guide');
  await assert.rejects(checkSkill(dir), /only SKILL.md/);
});

test('checks local links and ignores external links and anchors', async t => {
  const { base } = await fixture(t);
  const file = path.join(base, 'README.md');
  await writeFile(file, '[skill](sample-skill/SKILL.md#task) [web](https://example.invalid/docs) [section](#local)');
  await checkLocalLinks(file);
});

test('rejects broken local links', async t => {
  const { base } = await fixture(t);
  const file = path.join(base, 'README.md');
  await writeFile(file, '[missing](missing.md)');
  await assert.rejects(checkLocalLinks(file), /ENOENT/);
});
