---
"@alecsibilia/commit": patch
---

Migrate release pipeline from semantic-release to changesets, and switch npm publishing to OIDC trusted publishing. No runtime or API change to the CLI — this only affects how releases are cut.

- Releases are now driven by `.changeset/*.md` files instead of conventional-commit parsing.
- `npm publish` runs in a separate workflow job scoped to `environment: npm-publish` with `id-token: write`; no long-lived `NPM_TOKEN` secret is used.
- Adds `bunfig.toml` with `minimumReleaseAge` and `blockExoticSubdeps` as supply-chain defenses (post Shai-Hulud TanStack wave, May 2026).
