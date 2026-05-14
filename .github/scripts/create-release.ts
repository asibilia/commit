#!/usr/bin/env bun
/**
 * Custom "publish" command for changesets/action.
 *
 * Why a custom script and not `changeset publish`?
 *   The actual `npm publish` runs in a separate `publish` job that has
 *   `id-token: write` and `environment: npm-publish` scoped to it (npm
 *   OIDC trusted publishing). This script's only job is to:
 *     1. Create a `vX.Y.Z` GitHub Release with notes from CHANGELOG.md.
 *     2. Print a `New tag: <pkg>@<version>` line so changesets/action's
 *        stdout parser sets `outputs.published=true`, which gates the
 *        downstream publish job.
 */
import { $ } from 'bun'

const pkg = await Bun.file('package.json').json()
const tag = `v${pkg.version}`
const title = `${pkg.name.replace(/^@[^/]+\//, '')}@${pkg.version}`

// changesets/action's stdout parser looks for /New tag:\s+(@scope\/name|name)@version/
const new_tag_line = `New tag: ${pkg.name}@${pkg.version}`

const exists = await $`gh release view ${tag}`.quiet().nothrow()
if (exists.exitCode === 0) {
    console.log(`Release ${tag} already exists, skipping creation`)
    // Still emit so the publish job runs. `npm publish` will fail
    // gracefully if the npm version already exists — correct behavior
    // for a re-run after a partial failure.
    console.log(new_tag_line)
    process.exit(0)
}

const changelog = await Bun.file('CHANGELOG.md')
    .text()
    .catch(() => '')
const sections = changelog.split(/^## /m)
const latest = sections[1]?.trim() ?? ''
const notes = latest ? `## ${latest}` : `Release ${tag}`

const run_id = process.env.GITHUB_RUN_ID ?? process.pid
const notes_file = `${import.meta.dir}/../../.release-notes-${tag}-${run_id}.md`
await Bun.write(notes_file, notes)
try {
    await $`gh release create ${tag} --title ${title} --notes-file ${notes_file}`
} finally {
    ;(await Bun.file(notes_file).exists()) &&
        (await $`rm ${notes_file}`.quiet().nothrow())
}
console.log(`Created release ${tag}`)
console.log(new_tag_line)
