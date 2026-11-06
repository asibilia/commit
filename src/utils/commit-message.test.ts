import { describe, expect, test } from 'bun:test'

import { buildCommitMessage } from '~/utils/commit-message'

describe('buildCommitMessage', () => {
    test('header only', () => {
        expect(
            buildCommitMessage({ type: 'feat', scope: 'cli', subject: 'add x' })
        ).toBe('feat(cli): add x')
    })

    test('trims the subject', () => {
        expect(
            buildCommitMessage({
                type: 'fix',
                scope: 'git',
                subject: '  handle errors  ',
            })
        ).toBe('fix(git): handle errors')
    })

    test('header + body separated by a blank line', () => {
        expect(
            buildCommitMessage({
                type: 'feat',
                scope: 'cli',
                subject: 'add x',
                body: 'first line  \nsecond line\n',
            })
        ).toBe('feat(cli): add x\n\nfirst line\nsecond line')
    })

    test('blank body is omitted', () => {
        expect(
            buildCommitMessage({
                type: 'feat',
                scope: 'cli',
                subject: 'add x',
                body: '   \n  ',
            })
        ).toBe('feat(cli): add x')
    })

    test('breaking adds ! and a BREAKING CHANGE footer', () => {
        expect(
            buildCommitMessage({
                type: 'feat',
                scope: 'cli',
                subject: 'drop node 18',
                breaking: 'node 18 is no longer supported',
            })
        ).toBe(
            'feat(cli)!: drop node 18\n\nBREAKING CHANGE: node 18 is no longer supported'
        )
    })

    test('trailers are added in order with no blank lines between', () => {
        expect(
            buildCommitMessage({
                type: 'chore',
                scope: 'repo',
                subject: 'tidy',
                trailers: [
                    'Refs: #12',
                    'Co-Authored-By: Claude <noreply@anthropic.com>',
                ],
            })
        ).toBe(
            'chore(repo): tidy\n\nRefs: #12\nCo-Authored-By: Claude <noreply@anthropic.com>'
        )
    })

    test('orders header, body, BREAKING CHANGE, then trailers', () => {
        expect(
            buildCommitMessage({
                type: 'feat',
                scope: 'cli',
                subject: 'add flags',
                body: 'Adds --type and friends.\n\n# kept as-is',
                breaking: 'removes -x',
                trailers: ['Refs: #1', 'Co-Authored-By: A <a@example.com>'],
            })
        ).toBe(
            [
                'feat(cli)!: add flags',
                '',
                'Adds --type and friends.',
                '',
                '# kept as-is',
                '',
                'BREAKING CHANGE: removes -x',
                'Refs: #1',
                'Co-Authored-By: A <a@example.com>',
            ].join('\n')
        )
    })

    test('never emits trailing whitespace', () => {
        const message = buildCommitMessage({
            type: 'feat',
            scope: 'cli',
            subject: 'x',
            body: 'a \t\n\n b  ',
            breaking: 'y  ',
            trailers: ['Refs: #1  '],
        })
        for (const line of message.split('\n')) {
            expect(line).toBe(line.trimEnd())
        }
        expect(message.endsWith('\n')).toBe(false)
    })
})
