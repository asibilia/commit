#!/usr/bin/env bun
/**
 * Computes a conventional-commit title for the changesets Version PR
 * by inspecting the bump that will be applied.
 *
 * Output examples:
 *   with changesets: chore(release): version package (commit@1.1.0)
 *   no changesets:   chore(release): version package
 *
 * Prints the computed title to stdout. The workflow captures it and forwards
 * it to changesets/action via $GITHUB_OUTPUT.
 */
import { $ } from 'bun'

const STATUS_FILE = '/tmp/changeset-status.json'
const FALLBACK = 'chore(release): version package'

await $`bunx changeset status --output=${STATUS_FILE}`.quiet().nothrow()

type Release = { name: string; oldVersion: string; newVersion: string }
type Status = { releases?: Release[] }

const status: Status = await Bun.file(STATUS_FILE)
    .json()
    .catch(() => ({}))

const bumped = (status.releases ?? []).filter(
    (r) => r.newVersion !== r.oldVersion
)

const title = bumped.length
    ? `${FALLBACK} (${bumped
          .map((r) => `${r.name.replace(/^@[^/]+\//, '')}@${r.newVersion}`)
          .join(', ')})`
    : FALLBACK

console.log(title)
