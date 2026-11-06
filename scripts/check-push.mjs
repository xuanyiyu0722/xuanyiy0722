import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { siteRoot } from './check-site.mjs';

const git = (...args) => execFileSync('git', args, { cwd:siteRoot, encoding:'utf8', stdio:['ignore', 'pipe', 'pipe'] }).trim();
try {
  if (process.argv[2] !== 'origin') throw new Error('Production pushes must use the reviewed origin remote.');
  if (git('branch', '--show-current') !== 'main') throw new Error('Switch to main before publishing the completed website change.');
  if (git('status', '--porcelain')) throw new Error('Review and commit the intended changes first; publishing requires a clean working tree.');
  const updates = fs.readFileSync(0, 'utf8').trim();
  if (!updates) process.exit(0);
  for (const line of updates.split('\n')) {
    const [localRef, localSha, remoteRef, remoteSha] = line.trim().split(/\s+/);
    if (localRef !== 'refs/heads/main' || remoteRef !== 'refs/heads/main' || localSha !== git('rev-parse', 'HEAD')) {
      throw new Error('This publishing hook permits only the current main commit to origin/main; deletions and other refs are blocked.');
    }
    if (!/^0+$/.test(remoteSha)) {
      try { git('merge-base', '--is-ancestor', remoteSha, localSha); }
      catch { throw new Error('Remote main has changes that are not in local main. Fetch and inspect them; never force-push.'); }
    }
  }
  execFileSync(process.execPath, ['scripts/build-site.mjs'], { cwd:siteRoot, stdio:'inherit' });
} catch (error) {
  console.error(`Push stopped: ${error.message}`);
  process.exitCode = 1;
}
