# commit

[![npm version](https://img.shields.io/badge/npm%20package-@alecsibilia/commit-red.svg)](https://www.npmjs.com/package/@alecsibilia/commit)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow.svg)](http://opensource.org/license/apache-2-0)

Interactive CLI tool for creating standardized commit messages with customizable types and scopes.

## Installation & Usage

### Option 1: One-time use with npx or bunx (Recommended)

```bash
bunx --bun @alecsibilia/commit
```

Or via a package.json script:

```json
{
  "scripts": {
    "commit": "bunx --bun @alecsibilia/commit"
  }
}
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

# Then run:
bun run commit
```

Or add to your `package.json` scripts:

```json
{
  "scripts": {
    "new:commit": "bun run --bun commit"
  }
}
```

> **Note** you must name your script something other than `commit` when running locally.

And run:

```bash
npm run new:commit
# or
bun run new:commit
```

### Command Line Options

- `--help`, `-h` - Show help information
- `--version`, `-V` - Display version number
- `--config`, `-c <path>` - Specify custom config file
- `--dry-run` - Preview commit message without executing

### Configuration

#### TypeScript Configuration (Recommended)

Create a `commit.config.ts` file in your project root. TypeScript config files are supported when using `bun run --bun commit`:

```typescript
import { type CommitConfig } from '@alecsibilia/commit'

export default {
  types: [
    { value: 'feat', name: '✨ feat: A new feature' },
    { value: 'fix', name: '🐛 fix: A bug fix' },
    { value: 'chore', name: '🧹 chore: Maintenance tasks' }
  ],
  scopes: ['repo', 'cli', 'config']
} satisfies CommitConfig
```

#### JavaScript Configuration

Alternatively, create a `commit.config.js` file for broader compatibility:

```javascript
export const commitConfig = {
  types: [
    { value: 'feat', name: '✨ feat: A new feature' },
    { value: 'fix', name: '🐛 fix: A bug fix' },
    { value: 'chore', name: '🧹 chore: Maintenance tasks' }
  ],
  scopes: ['repo', 'cli', 'config']
}
```

> **Note:** TypeScript configuration files (`.ts`) require using `bun run --bun commit` to leverage Bun's native TypeScript support. For Node.js environments, use JavaScript configuration files (`.js`) instead.

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
