import { describe, expect, test } from 'bun:test'

import {
    findMissingFields,
    formatMissingFlagsError,
    isCompleteFields,
    validateCommitFields,
    validateSubject,
    validateTrailer,
} from '~/utils/commit-fields'

const allowed = {
    types: ['feat', 'fix', 'docs'],
    scopes: ['cli', 'git'],
}

describe('validateCommitFields', () => {
    test('accepts valid complete fields', () => {
        expect(
            validateCommitFields(
                {
                    type: 'feat',
                    scope: 'cli',
                    subject: 'add flags',
                    body: 'details',
                    breaking: 'removes x',
                    trailers: [
                        'Co-Authored-By: Claude <noreply@anthropic.com>',
                    ],
                },
                allowed
            )
        ).toEqual({ success: true })
    })

    test('accepts empty input (missing fields are not validation errors)', () => {
        expect(validateCommitFields({}, allowed)).toEqual({ success: true })
    })

    test('unknown type lists the allowed values', () => {
        expect(validateCommitFields({ type: 'foo' }, allowed)).toEqual({
            success: false,
            errors: ['Unknown type "foo". Allowed: feat, fix, docs'],
        })
    })

    test('unknown scope lists the allowed values', () => {
        expect(validateCommitFields({ scope: 'nope' }, allowed)).toEqual({
            success: false,
            errors: ['Unknown scope "nope". Allowed: cli, git'],
        })
    })

    test('empty or whitespace-only subject is invalid', () => {
        for (const subject of ['', '   ', '\t']) {
            const result = validateCommitFields({ subject }, allowed)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.errors).toEqual(['Subject must not be empty'])
            }
        }
    })

    test('multi-line subject is invalid', () => {
        const result = validateCommitFields({ subject: 'a\nb' }, allowed)
        expect(result.success).toBe(false)
    })

    test('blank --breaking description is invalid', () => {
        const result = validateCommitFields({ breaking: '  ' }, allowed)
        expect(result).toEqual({
            success: false,
            errors: ['--breaking requires a non-empty description'],
        })
    })

    test('collects every error', () => {
        const result = validateCommitFields(
            { type: 'x', scope: 'y', subject: ' ', trailers: ['bad'] },
            allowed
        )
        expect(result.success).toBe(false)
        if (!result.success) expect(result.errors).toHaveLength(4)
    })
})

describe('validateTrailer', () => {
    test.each([
        'Co-Authored-By: Claude <noreply@anthropic.com>',
        'Refs: #123',
        'Signed-off-by: A B <a@b.c>',
        'X-1: y',
    ])('accepts %p', (trailer) => {
        expect(validateTrailer(trailer)).toBeUndefined()
    })

    test.each([
        'no colon here',
        'Co Authored By: x',
        'Refs:#1',
        'Refs: ',
        ': value',
        'Refs: a\nb',
        'BREAKING CHANGE: use --breaking',
    ])('rejects %p', (trailer) => {
        expect(validateTrailer(trailer)).toContain(
            `Invalid trailer "${trailer}"`
        )
    })
})

describe('validateSubject', () => {
    test('valid subject', () => {
        expect(validateSubject('add flags')).toBeUndefined()
    })

    test('empty subject', () => {
        expect(validateSubject('  ')).toBe('Subject must not be empty')
    })
})

describe('findMissingFields', () => {
    test('all missing', () => {
        expect(findMissingFields({})).toEqual(['type', 'scope', 'subject'])
    })

    test('some missing, in stable order', () => {
        expect(findMissingFields({ type: 'feat' })).toEqual([
            'scope',
            'subject',
        ])
        expect(findMissingFields({ subject: 'x', scope: 'cli' })).toEqual([
            'type',
        ])
    })

    test('none missing; optional fields do not matter', () => {
        expect(
            findMissingFields({ type: 'feat', scope: 'cli', subject: 'x' })
        ).toEqual([])
    })

    test('empty string counts as provided (validation rejects it)', () => {
        expect(
            findMissingFields({ type: 'feat', scope: 'cli', subject: '' })
        ).toEqual([])
    })

    test('isCompleteFields mirrors findMissingFields', () => {
        expect(isCompleteFields({ type: 'feat', scope: 'cli' })).toBe(false)
        expect(
            isCompleteFields({ type: 'feat', scope: 'cli', subject: 'x' })
        ).toBe(true)
    })
})

describe('formatMissingFlagsError', () => {
    test('names the missing flags', () => {
        expect(formatMissingFlagsError(['scope', 'subject'])).toBe(
            'Missing required flags for non-interactive use: --scope, --subject'
        )
    })
})
