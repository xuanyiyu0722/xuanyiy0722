# Alicia portfolio maintenance

- This is the active website, copied unchanged from v78. Preserve its existing
  HTML/CSS/JavaScript structure and the original project content and assets.
- Edit source files here, never generated `dist/`. The old workspace and ZIP
  versions remain separate backups; do not update multiple copies after a change.
- Before editing, inspect `git status` and the relevant diff. Preserve unrelated
  user changes. Never stage unrelated changes or ignored credential/local files.
- Run `npm run build` after changes. It checks all pages, resource paths and exact
  filename case, JavaScript syntax, JSON, likely credentials in public files, and
  GitHub's per-file size limit, then copies the unchanged runtime files to `dist/`.
  Run targeted interaction/browser checks when the change needs them. Report if
  browser access is unavailable; do not bypass a disabled browser setting.
- No dependencies are needed. Node.js 24 LTS is the deployment runtime. If the
  current Codex shell has no `node`, the bundled executable may be used at
  `${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.
  In that environment run `node scripts/build-site.mjs` with the full executable
  path. Do not commit machine paths into public runtime files.
- Run `npm run setup:git` after a new clone to install the repository-local
  pre-push hook and fast-forward-only pull behavior. Use the same Node fallback
  for `scripts/setup-git.mjs` when necessary.
- Standing user authorization: once the intended GitHub remote and account access
  have been established, complete each requested website change by reviewing its
  diff, committing only the task's changes, and pushing `main` to `origin` after
  validation. A separate approval is not required for each routine update.
- Fetch and inspect `origin/main` before publishing. If local and remote histories
  diverge, preserve both and resolve deliberately. Never force-push, reset away
  user work, delete existing source files, or overwrite remote code without the
  user's confirmation. A nonempty remote must be inspected before the first import.
- Never bypass the pre-push hook. It rejects dirty working trees, ref deletions,
  non-fast-forward main updates, and a failing site build.
- GitHub/Vercel connection is not complete until the repository URL, account
  authorization, and Vercel Git integration are verified. Do not fabricate those
  values or deployment results. Do not put tokens in files, command arguments,
  commit messages, or chat responses.
- A Git push is not evidence that Vercel succeeded. Report the commit and the
  verified deployment result/URL, or clearly state that deployment is pending.
