# commit

[![npm version](https://img.shields.io/badge/npm%20package-@alecsibilia/commit-red.svg)](https://www.npmjs.com/package/@alecsibilia/commit)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow.svg)](http://opensource.org/license/apache-2-0)

Interactive CLI tool for creating standardized commit messages with customizable types and scopes.

## Installation & Usage

### Option 1: One-time use with npx or bunx (Recommended)

```bash
bunx @alecsibilia/commit
```

### Option 2: Global installation

```bash
npm install -g @alecsibilia/commit
# or
bun add -g @alecsibilia/commit

# Then run:
commit
```

### Option 3: Local installation as dev dependency

```bash
npm install -D @alecsibilia/commit
# or
bun add -d @alecsibilia/commit
```

Then add to your `package.json` scripts:

```json
{
  "scripts": {
    "commit": "commit"
  }
}
```

And run:

```bash
npm run commit
# or
bun run commit
```

### Command Line Options

- `--help`, `-h` - Show help information
- `--version`, `-V` - Display version number
- `--config`, `-c <path>` - Specify custom config file
- `--dry-run` - Preview commit message without executing

### Configuration

Create a `commit.config.ts` file in your project root:

```typescript
export const commitConfig = {
  types: [
    { value: 'feat', name: '✨ feat: A new feature' },
    { value: 'fix', name: '🐛 fix: A bug fix' },
    { value: 'chore', name: '🧹 chore: Maintenance tasks' }
  ],
  scopes: ['repo', 'cli', 'config']
}
```

## Development

```bash
# Install dependencies
bun install

# Run locally
bun run dev

# Build
bun run build

# Test
bun test
```

## Release Process

This project uses automated semantic releases. See [RELEASE.md](./RELEASE.md) for details on versioning and deployment.

## License

Apache-2.0
