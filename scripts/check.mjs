import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Packaging checks only: behavioral quality is evaluated separately.
export async function checkSkill(directory) {
  const names = await readdir(directory);
  if (names.length !== 1 || names[0] !== 'SKILL.md') {
    throw new Error('The runtime package must contain only SKILL.md.');
  }
  const content = await readFile(path.join(directory, 'SKILL.md'), 'utf8');
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) throw new Error('Missing YAML frontmatter.');
  const name = frontmatter[1].match(/^name: ([a-z0-9]+(?:-[a-z0-9]+)*)$/m)?.[1];
  if (!name || name.length > 64 || name !== path.basename(directory)) {
    throw new Error('Skill name must match its directory and use kebab-case.');
  }
  const descriptionBlock = frontmatter[1].match(/^description: >-\r?\n((?:  [^\r\n]+(?:\r?\n|$))+)/m)?.[1];
  const description = descriptionBlock?.split(/\r?\n/).map(line => line.trim()).filter(Boolean).join(' ');
  if (!description || [...description].length > 1024) throw new Error('Description must contain 1–1024 characters.');
  if (/^allowed-tools:/m.test(frontmatter[1])) throw new Error('This skill must not narrow the host tool set.');
  const lines = content.trimEnd().split(/\r?\n/).length;
  const bytes = Buffer.byteLength(content);
  if (lines > 120 || bytes > 12000) throw new Error('Runtime guidance exceeds the project size budget.');
  if (!content.slice(frontmatter[0].length).trim()) throw new Error('Missing skill body.');
  return { name, lines, bytes, descriptionCharacters: [...description].length };
}

export async function checkLocalLinks(file) {
  const content = await readFile(file, 'utf8');
  for (const [, raw] of content.matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    if (/^(?:https?:|mailto:|#)/.test(raw)) continue;
    const target = raw.split('#')[0];
    if (!target) continue;
    await stat(path.resolve(path.dirname(file), decodeURIComponent(target)));
  }
}

async function main() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const skill = await checkSkill(path.join(root, 'skills/lark-work-context'));
  for (const file of ['README.md', 'AGENTS.md', 'docs/evaluation.md', 'docs/evaluation-results.md', 'skills/lark-work-context/SKILL.md']) {
    await checkLocalLinks(path.join(root, file));
  }
  const cases = JSON.parse(await readFile(path.join(root, 'evals/cases.json'), 'utf8'));
  if (cases.version !== 1 || !Array.isArray(cases.cases) || cases.cases.length === 0) throw new Error('Invalid evaluation suite.');
  const ids = new Set();
  for (const item of cases.cases) {
    if (!item.id || ids.has(item.id) || !item.prompt || !item.expected?.length || !Array.isArray(item.evidence)) {
      throw new Error('Each evaluation case needs a unique id, prompt, evidence array and expected outcomes.');
    }
    ids.add(item.id);
  }
  console.log(JSON.stringify({ result: 'pass', skill, evaluationCases: ids.size, checks: ['runtime package', 'metadata', 'local links', 'evaluation schema'] }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
