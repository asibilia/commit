---
'@alecsibilia/commit': minor
---

Add non-interactive flags for scripts, CI and AI agents: `--type/-t`, `--scope/-s`, `--subject/-m`, `--body/-b`, `--breaking <description>` and a repeatable `--trailer "Key: value"`. When `--type`, `--scope` and `--subject` are all given, the CLI never prompts. Values are checked against `commit.config.ts`, and an unknown type or scope fails with a list of the allowed values.
`--body` is repeatable like `git commit -m`: each value becomes its own paragraph, separated by a blank line.

Fix silent failures: without a TTY the CLI used to draw a prompt and exit 0 without committing. It now exits 1 and names the missing flags. Cancelling a prompt exits 130, and any failed git step (`add`, `commit` including "nothing to commit", `push`) exits non-zero. The CLI exits 0 only when a commit was created or a dry run succeeded.

`commit()` now accepts the same fields programmatically and returns a result object (`{ success, message }` or `{ success: false, exitCode, errors }`) instead of `undefined`.
