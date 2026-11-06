import { isCancel, select, text } from '@clack/prompts'

import {
    type CommitFieldsInput,
    type RequiredField,
    validateSubject,
} from './commit-fields'
import { type OptionConfig } from './schemas/config'

/**
 * Outcome of interactive prompting.
 */
export type PromptResult =
    | { cancelled: false; fields: CommitFieldsInput }
    | { cancelled: true }

/**
 * Prompts (via @clack/prompts) for the given missing required fields only,
 * in `type`, `scope`, `subject` order. Fields already present are kept.
 *
 * Must only be called when stdin is a TTY; the caller is responsible for
 * that check.
 *
 * @param fields - Fields resolved so far (from flags / options)
 * @param missing - Required fields to prompt for
 * @param choices - Configured type and scope options
 * @returns Merged fields, or `{ cancelled: true }` if the user cancelled
 */
export async function promptForMissingFields(
    fields: CommitFieldsInput,
    missing: RequiredField[],
    choices: { types: OptionConfig[]; scopes: OptionConfig[] }
): Promise<PromptResult> {
    const resolved: CommitFieldsInput = { ...fields }

    if (missing.includes('type')) {
        const type = await select({
            message: 'Select the type of change',
            options: choices.types,
        })
        if (isCancel(type)) return { cancelled: true }
        resolved.type = type
    }

    if (missing.includes('scope')) {
        const scope = await select({
            message: 'Select the scope',
            options: choices.scopes,
        })
        if (isCancel(scope)) return { cancelled: true }
        resolved.scope = scope
    }

    if (missing.includes('subject')) {
        const subject = await text({
            message: 'Enter your commit message',
            validate: (value) => validateSubject(value ?? ''),
        })
        if (isCancel(subject)) return { cancelled: true }
        resolved.subject = subject
    }

    return { cancelled: false, fields: resolved }
}
