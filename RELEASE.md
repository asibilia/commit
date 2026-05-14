# Release Process

This project uses [changesets](https://github.com/changesets/changesets) for versioning and changelog generation, and publishes to npm via [OIDC Trusted Publishing](https://docs.npmjs.com/trusted-publishers) — no long-lived `NPM_TOKEN` is stored as a GitHub secret.

## Adding a changeset

When your PR contains a change worth releasing:

```bash
bun run changeset
```

Pick the bump type (patch / minor / major) and write a short summary. The CLI writes a `.changeset/<name>.md` file — commit that alongside your code.

| Bump | When to use | Example |
|------|-------------|---------|
| `patch` | Bug fix, internal refactor, perf, docs that affect users | "fix: handle empty config" |
| `minor` | New feature, additive change | "feat: add `--scope` flag" |
| `major` | Breaking API change | "feat!: rename `--type` to `--kind`" |

PRs without changesets are fine for changes that don't need a release (CI tweaks, internal docs, etc.).

## What happens on merge to `main`

The `Release` workflow (`.github/workflows/release.yml`) runs and:

1. **If pending changesets exist:** opens (or updates) a `chore(release): version package (...)` PR that bumps `package.json` and rewrites `CHANGELOG.md`.
2. **If no pending changesets exist** (because the version PR just merged): creates a `vX.Y.Z` GitHub Release and publishes `@alecsibilia/commit` to npm via OIDC trusted publishing.

The release job opens the Version PR; a separate `publish` job (scoped to `environment: npm-publish` with `id-token: write` permission) does the actual npm publish. This isolates publish credentials to a single short-lived step.

## First-time setup (one-time)

The OIDC trusted publisher must be configured before the workflow can publish.

On <https://www.npmjs.com/package/@alecsibilia/commit/access>:

1. **Publishing access** → "Require two-factor authentication or trusted publishers"
2. **Add trusted publisher**:
   - Publisher: GitHub Actions
   - Organization or user: `asibilia`
   - Repository: `commit`
   - Workflow filename: `release.yml`
   - Environment name: `npm-publish`

On GitHub (this repo): **Settings → Environments → New environment → `npm-publish`**. (Optionally add required reviewers for a manual approval gate before publish.)

## Local testing

```bash
# See what would be versioned without writing anything
bunx changeset status

# Apply versions locally (writes to working tree but doesn't tag/push)
bun run version
```

To roll back: revert the version PR commit. Don't unpublish from npm.
