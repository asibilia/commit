# commit

[![npm version](https://img.shields.io/badge/npm%20package-@alecsibilia/commit-red.svg)](https://www.npmjs.com/package/@alecsibilia/commit)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow.svg)](http://opensource.org/license/apache-2-0)

CLI tool for creating standardized [conventional commit](https://www.conventionalcommits.org/) messages with customizable types and scopes. Use it interactively (prompts) or fully non-interactively via flags, which suits scripts, CI and AI agents.

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
- `--type`, `-t`, `--scope`, `-s`, `--subject`, `-m`, `--body`, `-b`, `--breaking`, `--trailer` - Provide commit fields up front (see below)

Run with no field flags in a terminal and you get the interactive prompts. Any field you pass as a flag is not prompted for.

### Non-interactive / agent usage

Pass `--type`, `--scope` and `--subject` and the CLI never prompts, with or without a TTY:

| Flag | Required | Description |
| --- | --- | --- |
| `-t, --type <type>` | yes | Commit type. Must be one of the `types` values in `commit.config.ts` |
| `-s, --scope <scope>` | yes | Commit scope. Must be one of the `scopes` values in `commit.config.ts` |
| `-m, --subject <text>` | yes | Header description. Must be a non-empty single line |
| `-b, --body <text>` | no | Commit body paragraph, repeatable. Each `-b` becomes its own paragraph, joined by a blank line; blank values are dropped. A value may contain real newlines (bash `$'...'`) |
| `--breaking <description>` | no | Header becomes `type(scope)!: subject` and a `BREAKING CHANGE: <description>` footer is added |
| `--trailer <"Key: value">` | no | Footer trailer, repeatable. Format `Token: value` (token: letters, digits, hyphens) |
| `--dry-run` | no | Print the full message and run no git commands |
| `-c, --config <path>` | no | Config file (defaults to `commit.config.ts` in the current directory) |

```bash
bunx --bun @alecsibilia/commit \
  --type feat --scope cli \
  --subject "add non-interactive flags" \
  --body "Agents can now commit without prompts." \
  --body "Values are validated against commit.config.ts." \
  --trailer "Refs: #42" \
  --trailer "Co-Authored-By: Claude <noreply@anthropic.com>"
```

This produces:

```text
feat(cli): add non-interactive flags

Agents can now commit without prompts.

Values are validated against commit.config.ts.

Refs: #42
Co-Authored-By: Claude <noreply@anthropic.com>
```

Message layout: header, then a blank line and the body (if given), then a blank line and the footers (`BREAKING CHANGE` first, then trailers in the order given). Like `git commit -m`, `--body` can be given more than once: each value is its own paragraph, paragraphs are joined by one blank line, and blank values are dropped. Each value is used as-is, so pass real newlines inside a paragraph with e.g. bash `$'...'`. A literal `\n` is not converted.

**Validation.** `--type` and `--scope` are checked against `commit.config.ts`. An unknown value fails and lists the allowed ones, e.g. `✗ Unknown type "foo". Allowed: feat, fix, docs`. Empty subjects and malformed trailers are rejected too.

**No TTY.** When stdin is not a TTY (as when an agent or CI runs the command) and `--type`, `--scope` or `--subject` is missing, the CLI does not prompt. It exits with code 1 and names the missing flags:

```text
✗ Missing required flags for non-interactive use: --scope, --subject
```

**Exit codes.** The CLI exits `0` only when a commit was created (and pushed, if `git.auto_push` is on) or a dry run succeeded.

| Code | Meaning |
| --- | --- |
| `0` | Committed (and pushed if `auto_push`), or dry run succeeded |
| `1` | Missing/invalid input, or any git step failed: `git add`, `git commit` (including "nothing to commit"), or `git push` |
| `130` | Interactive prompt cancelled (Ctrl+C) |

`git.auto_add_all` and `git.auto_push` from the config still apply in non-interactive mode. Set `auto_push: false` if an agent should not push.

#### Programmatic use

```typescript
import { commit } from '@alecsibilia/commit'

const result = await commit({
  type: 'feat',
  scope: 'cli',
  subject: 'add non-interactive flags',
  body: ['First paragraph.', 'Second paragraph.'], // or a single string
  trailers: ['Co-Authored-By: Claude <noreply@anthropic.com>'],
  interactive: false, // defaults to process.stdin.isTTY
})

if (!result.success) {
  console.error(result.errors.join('\n'))
  process.exit(result.exitCode)
}
```

### Configuration

#### TypeScript Configuration (Recommended)

Create a `commit.config.ts` file in your project root. TypeScript config files are supported when using `bun run --bun commit`:

```typescript
import { type CommitConfig } from '@alecsibilia/commit'

export default {
  types: [
    { value: 'feat', label: '✨ feat: A new feature' },
    { value: 'fix', label: '🐛 fix: A bug fix' },
    { value: 'chore', label: '🧹 chore: Maintenance tasks' }
  ],
  scopes: [
    { value: 'repo', label: 'Repository' },
    { value: 'cli', label: 'Command line interface' },
    { value: 'config', label: 'Configuration' }
  ],
  git: {
    auto_add_all: true, // run `git add .` before committing
    auto_push: true // run `git push` after committing
  }
} satisfies CommitConfig
```

#### JavaScript Configuration

Alternatively, create a `commit.config.js` file for broader compatibility and point the CLI at it with `-c commit.config.js`:

```javascript
export default {
  types: [
    { value: 'feat', label: '✨ feat: A new feature' },
    { value: 'fix', label: '🐛 fix: A bug fix' },
    { value: 'chore', label: '🧹 chore: Maintenance tasks' }
  ],
  scopes: [
    { value: 'repo', label: 'Repository' },
    { value: 'cli', label: 'Command line interface' },
    { value: 'config', label: 'Configuration' }
  ]
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
