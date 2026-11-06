import type { CommitFields } from './commit-message'

/**
 * Commit fields that may be partially provided (from flags or programmatic
 * options) before any prompting happens.
 */
export interface CommitFieldsInput {
    type?: string
    scope?: string
    subject?: string
    body?: string
    breaking?: string
    trailers?: string[]
}

/**
 * Values permitted by the loaded `commit.config.ts`.
 */
export interface AllowedValues {
    types: string[]
    scopes: string[]
}

/**
 * Fields that must be known before a commit message can be built.
 */
export type RequiredField = 'type' | 'scope' | 'subject'

/**
 * CLI flag for each required field, in the order they are reported.
 */
export const REQUIRED_FIELD_FLAGS: Record<RequiredField, string> = {
    type: '--type',
    scope: '--scope',
    subject: '--subject',
}

const REQUIRED_FIELDS = Object.keys(REQUIRED_FIELD_FLAGS) as RequiredField[]

/**
 * Trailer format: `Token: value`, where the token is letters, digits and
 * hyphens and the value is a non-empty single line.
 */
const TRAILER_PATTERN = /^[A-Za-z0-9-]+: \S.*$/

/**
 * Result of a pure validation step. Never throws; callers decide how to
 * surface errors (exit codes, prompts, return values).
 */
export type ValidationResult =
    | { success: true }
    | { success: false; errors: string[] }

/**
 * Validates a commit subject (the header description).
 *
 * @param subject - Subject text as entered or passed via `--subject`
 * @returns An error message, or `undefined` when valid
 *
 * @example
 * ```typescript
 * validateSubject('   ') // 'Subject must not be empty'
 * validateSubject('add flags') // undefined
 * ```
 */
export function validateSubject(subject: string): string | undefined {
    if (subject.trim() === '') return 'Subject must not be empty'
    if (/[\r\n]/.test(subject)) {
        return 'Subject must be a single line (use --body for details)'
    }
    return undefined
}

/**
 * Validates a single `--trailer` value against the `Token: value` format.
 *
 * @param trailer - Raw trailer, e.g. `Co-Authored-By: Claude <noreply@anthropic.com>`
 * @returns An error message, or `undefined` when valid
 *
 * @example
 * ```typescript
 * validateTrailer('Refs: #123') // undefined
 * validateTrailer('not a trailer') // 'Invalid trailer "not a trailer". ...'
 * ```
 */
export function validateTrailer(trailer: string): string | undefined {
    if (TRAILER_PATTERN.test(trailer.trim())) return undefined
    return `Invalid trailer "${trailer}". Expected "Token: value" (token: letters, digits, hyphens), e.g. "Co-Authored-By: Name <email>"`
}

function unknownValueError(
    kind: 'type' | 'scope',
    value: string,
    allowedValues: string[]
): string {
    return `Unknown ${kind} "${value}". Allowed: ${allowedValues.join(', ')}`
}

/**
 * Validates whichever commit fields are present against the loaded config.
 *
 * Missing required fields are not errors here; use {@link findMissingFields}
 * for that. Checks:
 * - `type` / `scope` must be one of the configured values (error lists them)
 * - `subject` must be non-blank and single-line
 * - `breaking`, when given, must be non-blank
 * - every trailer must match `Token: value`
 *
 * @param fields - Partially or fully resolved fields
 * @param allowed - Allowed types and scopes from the config
 * @returns `{ success: true }` or `{ success: false, errors }`
 *
 * @example
 * ```typescript
 * validateCommitFields({ type: 'foo' }, { types: ['feat', 'fix'], scopes: [] })
 * // { success: false, errors: ['Unknown type "foo". Allowed: feat, fix'] }
 * ```
 */
export function validateCommitFields(
    fields: CommitFieldsInput,
    allowed: AllowedValues
): ValidationResult {
    const errors: string[] = []

    if (fields.type !== undefined && !allowed.types.includes(fields.type)) {
        errors.push(unknownValueError('type', fields.type, allowed.types))
    }

    if (fields.scope !== undefined && !allowed.scopes.includes(fields.scope)) {
        errors.push(unknownValueError('scope', fields.scope, allowed.scopes))
    }

    if (fields.subject !== undefined) {
        const subjectError = validateSubject(fields.subject)
        if (subjectError) errors.push(subjectError)
    }

    if (fields.breaking !== undefined && fields.breaking.trim() === '') {
        errors.push('--breaking requires a non-empty description')
    }

    for (const trailer of fields.trailers ?? []) {
        const trailerError = validateTrailer(trailer)
        if (trailerError) errors.push(trailerError)
    }

    return errors.length === 0 ? { success: true } : { success: false, errors }
}

/**
 * Lists required fields that have not been provided.
 *
 * Only `undefined` counts as missing; an empty string is "provided" and is
 * rejected by {@link validateCommitFields} instead.
 *
 * @param fields - Partially resolved fields
 * @returns Missing fields in `type`, `scope`, `subject` order
 *
 * @example
 * ```typescript
 * findMissingFields({ type: 'feat' }) // ['scope', 'subject']
 * ```
 */
export function findMissingFields(fields: CommitFieldsInput): RequiredField[] {
    return REQUIRED_FIELDS.filter((field) => fields[field] === undefined)
}

/**
 * Formats the error shown when required fields are missing and prompting is
 * not possible (stdin is not a TTY).
 *
 * @param missing - Output of {@link findMissingFields}
 * @returns e.g. `Missing required flags for non-interactive use: --scope, --subject`
 */
export function formatMissingFlagsError(missing: RequiredField[]): string {
    const flags = missing.map((field) => REQUIRED_FIELD_FLAGS[field])
    return `Missing required flags for non-interactive use: ${flags.join(', ')}`
}

/**
 * Type guard: true when every required field is present.
 *
 * @param fields - Partially resolved fields
 * @returns Whether `fields` can be passed to `buildCommitMessage`
 */
export function isCompleteFields(
    fields: CommitFieldsInput
): fields is CommitFields {
    return findMissingFields(fields).length === 0
}
