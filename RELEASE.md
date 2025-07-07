# Release Process

This project uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning, changelog generation, and publishing.

## Conventional Commits

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types and Version Bumps

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | **Minor** (1.1.0) |
| `fix` | Bug fix | **Patch** (1.0.1) |
| `perf` | Performance improvement | **Patch** (1.0.1) |
| `refactor` | Code refactoring | **Patch** (1.0.1) |
| `build` | Build system changes | **Patch** (1.0.1) |
| `revert` | Reverting changes | **Patch** (1.0.1) |
| `docs` | Documentation only | **No release** |
| `style` | Code style changes | **No release** |
| `test` | Test changes | **No release** |
| `chore` | Maintenance tasks | **No release** |
| `ci` | CI/CD changes | **No release** |

### Breaking Changes

For **major** version bumps (2.0.0), include `BREAKING CHANGE:` in the commit footer:

```
feat: remove deprecated CLI flags

BREAKING CHANGE: --old-flag has been removed, use --new-flag instead
```

## Release Workflow

### Automated Releases

1. **Push to main branch** - Any push to `main` triggers the release workflow
2. **Commit Analysis** - Semantic-release analyzes commit messages since the last release
3. **Version Calculation** - Determines the next version based on commit types
4. **Changelog Generation** - Creates/updates `CHANGELOG.md` with release notes
5. **NPM Publishing** - Publishes the package to npm registry
6. **GitHub Release** - Creates a GitHub release with compiled binary
7. **Git Tagging** - Tags the release commit with the new version

### Manual Release Testing

Test the release process locally (without publishing):

```bash
# Test release configuration
bun run release:dry

# Test commit analysis only  
npx semantic-release --dry-run --no-ci
```

### Local Development

When developing locally, you can:

1. **Preview version bump**:

   ```bash
   bun run release:dry
   ```

2. **Check what would be released**:

   ```bash
   npx semantic-release --dry-run --no-ci
   ```

## Configuration Files

- `.releaserc.json` - Main semantic-release configuration
- `.github/workflows/release.yml` - GitHub Actions workflow
- `package.json` - Contains release scripts and npm configuration

## Environment Variables

The following secrets must be configured in GitHub repository settings:

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- `NPM_TOKEN` - NPM authentication token for publishing

## Version Badge

The current version is automatically displayed in the README:

[![npm version](https://badge.fury.io/js/%40alecsibilia%2Fcommit.svg)](https://badge.fury.io/js/%40alecsibilia%2Fcommit)

## Release Notes

All releases include:

- 📋 **Changelog** - Automatically generated from commit messages
- 🏷️ **Git Tag** - Semantic version tag (e.g., `v1.2.0`)
- 📦 **NPM Package** - Published to npm registry
- 🎯 **GitHub Release** - With compiled binary attachment
- 🔗 **Release Notes** - Organized by commit type with emojis

## Troubleshooting

### Release Failed

- Check commit message format follows conventional commits
- Verify all required secrets are configured
- Check build process completes successfully

### Version Not Bumped

- Ensure commits include release-triggering types (`feat`, `fix`, etc.)
- Check if commits are on the `main` branch
- Verify no `[skip ci]` or `[skip release]` in commit messages

### NPM Publishing Failed

- Verify `NPM_TOKEN` secret is valid
- Check package name availability
- Ensure version doesn't already exist
