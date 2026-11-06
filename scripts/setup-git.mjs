import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { siteRoot } from './check-site.mjs';

const git = (...args) => execFileSync('git', args, { cwd:siteRoot, encoding:'utf8' }).trim();
if (path.resolve(git('rev-parse', '--show-toplevel')) !== siteRoot) {
  throw new Error('Initialize the dedicated portfolio-site repository first; the outer workspace repository must not be changed.');
}
git('config', '--local', 'core.hooksPath', '.githooks');
git('config', '--local', 'pull.ff', 'only');
git('config', '--local', 'push.default', 'simple');
// A local fallback for Codex sessions where Node is bundled but absent from PATH.
git('config', '--local', 'portfolio.nodePath', process.execPath);
console.log('Configured repository-local pre-push validation and fast-forward-only pulls. No remote or author identity was changed.');
