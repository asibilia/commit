/**
 * Fully resolved fields for a conventional commit message.
 */
export interface CommitFields {
    type: string
    scope: string
    subject: string
    body?: string
    breaking?: string
    trailers?: string[]
}

/**
 * Strips trailing whitespace from every line and leading/trailing blank lines
 * from the whole block.
 */
function normalizeBlock(value: string): string {
    return value
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .join('\n')
        .replace(/^\n+/, '')
        .replace(/\n+$/, '')
}

/**
 * Builds a conventional commit message from resolved fields.
 *
 * Layout:
 * - header: `type(scope): subject`, or `type(scope)!: subject` when
 *   `breaking` is set
 * - blank line + body, when a non-blank body is given
 * - blank line + footers: `BREAKING CHANGE: <description>` first, then each
 *   trailer in order, one per line
 *
 * No line has trailing whitespace and the message has no trailing newline.
 * This function does not validate; run `validateCommitFields` first.
 *
 * @param fields - Resolved commit fields
 * @returns The full commit message
 *
 * @example
 * ```typescript
 * buildCommitMessage({
 *     type: 'feat',
 *     scope: 'cli',
 *     subject: 'add flags',
 *     breaking: 'drops node 18',
 *     trailers: ['Co-Authored-By: Claude <noreply@anthropic.com>'],
 * })
 * // 'feat(cli)!: add flags\n\nBREAKING CHANGE: drops node 18\nCo-Authored-By: Claude <noreply@anthropic.com>'
 * ```
 */
export function buildCommitMessage(fields: CommitFields): string {
    const body = normalizeBlock(fields.body ?? '')
    const breaking = normalizeBlock(fields.breaking ?? '')
    const trailers = (fields.trailers ?? [])
        .map((trailer) => trailer.trim())
        .filter((trailer) => trailer !== '')

    const { type, scope } = fields
    const bang = breaking ? '!' : ''
    const subject = fields.subject.trim()
    const header = `${type}(${scope})${bang}: ${subject}`

    const footers = [
        ...(breaking ? [`BREAKING CHANGE: ${breaking}`] : []),
        ...trailers,
    ]

    const sections = [
        header,
        ...(body ? [body] : []),
        ...(footers.length > 0 ? [footers.join('\n')] : []),
    ]

    return sections.join('\n\n')
}
