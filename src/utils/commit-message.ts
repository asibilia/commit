/**
 * Fully resolved fields for a conventional commit message.
 */
export interface CommitFields {
    type: string
    scope: string
    subject: string
    /**
     * Body text, or several paragraphs (one per `--body`). Paragraphs are
     * joined by a blank line; blank ones are dropped.
     */
    body?: string | string[]
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
 * Joins body paragraphs with one blank line, after normalizing each one.
 * Blank or whitespace-only paragraphs are dropped. A single string is
 * treated as one paragraph, so it may still contain its own newlines.
 *
 * @param body - One body string, or one string per paragraph
 * @returns The normalized body, or `''` when nothing is left
 *
 * @example
 * ```typescript
 * joinBodyParagraphs(['one', '  ', 'two\nmore']) // 'one\n\ntwo\nmore'
 * ```
 */
export function joinBodyParagraphs(body?: string | string[]): string {
    return [body ?? []]
        .flat()
        .map(normalizeBlock)
        .filter((paragraph) => paragraph !== '')
        .join('\n\n')
}

/**
 * Builds a conventional commit message from resolved fields.
 *
 * Layout:
 * - header: `type(scope): subject`, or `type(scope)!: subject` when
 *   `breaking` is set
 * - blank line + body, when a non-blank body is given; an array of
 *   paragraphs is joined by blank lines, skipping blank ones
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
    const body = joinBodyParagraphs(fields.body)
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
