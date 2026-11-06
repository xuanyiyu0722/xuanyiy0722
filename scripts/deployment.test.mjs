import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { checkSite, siteRoot } from './check-site.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alicia-deploy-test-'));
  t.after(() => fs.rmSync(root, { recursive:true, force:true }));
  for (const directory of ['projects', 'assets', 'scripts']) fs.mkdirSync(path.join(root, directory));
  for (const page of ['index.html', 'about.html', 'gallery.html', 'projects/naborfood.html',
    'projects/fridgekey.html', 'projects/project-03.html', 'projects/project-04.html']) {
    fs.writeFileSync(path.join(root, page), '<!doctype html><html lang="en"><title>Fixture</title></html>');
  }
  for (const file of ['check-site.mjs', 'build-site.mjs', 'check-push.mjs']) {
    fs.copyFileSync(path.join(siteRoot, 'scripts', file), path.join(root, 'scripts', file));
  }
  return root;
}

test('resource names must match Linux filename case', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'assets', 'Cover.png'), 'fixture');
  fs.writeFileSync(path.join(root, 'index.html'), '<img src="assets/Cover.png">');
  assert.doesNotThrow(() => checkSite(root, { quiet:true }));
  fs.writeFileSync(path.join(root, 'index.html'), '<img src="assets/cover.png">');
  assert.throws(() => checkSite(root, { quiet:true }), /filename case mismatch/);
});

test('missing CSS resources, local paths, and invalid JavaScript stop deployment', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'style.css'), 'body { background:url(assets/missing.png) }');
  assert.throws(() => checkSite(root, { quiet:true }), /missing resource/);
  fs.writeFileSync(path.join(root, 'style.css'), '');
  fs.writeFileSync(path.join(root, 'index.html'), '<img src="file:///private/cover.png">');
  assert.throws(() => checkSite(root, { quiet:true }), /local machine|filesystem path/);
  fs.writeFileSync(path.join(root, 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(root, 'broken.js'), 'const incomplete = ;');
  assert.throws(() => checkSite(root, { quiet:true }), /JavaScript syntax/);
});

test('private files and likely credentials cannot enter the public output', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'assets', '.env'), 'LOCAL_TEST=true');
  assert.throws(() => checkSite(root, { quiet:true }), /Private or backup file/);
  fs.unlinkSync(path.join(root, 'assets', '.env'));
  fs.writeFileSync(path.join(root, '.env.js'), 'const secret = true;');
  assert.throws(() => checkSite(root, { quiet:true }), /Private file/);
  fs.unlinkSync(path.join(root, '.env.js'));
  fs.writeFileSync(path.join(root, 'data.js'), `const fakeCredential = '${'ghp_' + 'a'.repeat(36)}';`);
  assert.throws(() => checkSite(root, { quiet:true }), /possible credential/);
});

test('build refuses to replace an unowned dist directory', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'dist'));
  fs.writeFileSync(path.join(root, 'dist', 'keep.txt'), 'preserve existing work');
  const result = spawnSync(process.execPath, ['scripts/build-site.mjs'], { cwd:root, encoding:'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to replace/);
  assert.equal(fs.readFileSync(path.join(root, 'dist', 'keep.txt'), 'utf8'), 'preserve existing work');
});

test('push gate checks only committed main and rejects remote divergence or deletion', t => {
  const root = fixture(t);
  const runGit = (...args) => {
    const result = spawnSync('git', args, { cwd:root, encoding:'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  // All commits below are disposable test fixtures, never the user's repository.
  runGit('init', '-b', 'main');
  fs.writeFileSync(path.join(root, '.gitignore'), 'dist/\n');
  runGit('add', '.');
  runGit('-c', 'user.name=Deployment Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'Test fixture');
  const sha = runGit('rev-parse', 'HEAD');
  const zeros = '0'.repeat(40);
  const push = input => spawnSync(process.execPath, ['scripts/check-push.mjs', 'origin', 'https://example.invalid/repo.git'], {
    cwd:root, input, encoding:'utf8'
  });
  const first = push(`refs/heads/main ${sha} refs/heads/main ${zeros}\n`);
  assert.equal(first.status, 0, first.stderr);
  const divergent = push(`refs/heads/main ${sha} refs/heads/main ${'1'.repeat(40)}\n`);
  assert.notEqual(divergent.status, 0);
  assert.match(divergent.stderr, /Remote main has changes/);
  const deletion = push(`(delete) ${zeros} refs/heads/main ${sha}\n`);
  assert.notEqual(deletion.status, 0);
  assert.match(deletion.stderr, /deletions and other refs are blocked/);
  fs.writeFileSync(path.join(root, 'unfinished.js'), 'const unfinished = true;');
  const dirty = push(`refs/heads/main ${sha} refs/heads/main ${sha}\n`);
  assert.notEqual(dirty.status, 0);
  assert.match(dirty.stderr, /clean working tree/);
});
