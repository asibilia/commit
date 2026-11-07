import { z } from 'zod'

/**
 * Options accepted by {@link commit} for programmatic use.
 *
 * All commit fields are optional: anything missing is prompted for when the
 * session is interactive, otherwise `commit()` fails with a list of the
 * missing flags.
 *
 * `body` is a string or an array of paragraphs (joined by blank lines).
 *
 * `interactive` defaults to whether stdin is a TTY at parse time.
 */
export const CommitOptionsSchema = z.object({
    configPath: z.string().optional(),
    dryRun: z.boolean().default(false),
    type: z.string().optional(),
    scope: z.string().optional(),
    subject: z.string().optional(),
    body: z.union([z.string(), z.array(z.string())]).optional(),
    breaking: z.string().optional(),
    trailers: z.array(z.string()).default([]),
    interactive: z.boolean().default(() => Boolean(process.stdin.isTTY)),
})

/**
 * Raw options as produced by commander's `program.opts()`.
 *
 * Transformed into the {@link CommitOptionsSchema} input shape so the CLI and
 * programmatic callers go through the same code path.
 */
export const CliOptionsSchema = z
    .object({
        config: z.string().optional(),
        dryRun: z.boolean().default(false),
        type: z.string().optional(),
        scope: z.string().optional(),
        subject: z.string().optional(),
        body: z.array(z.string()).optional(),
        breaking: z.string().optional(),
        trailer: z.array(z.string()).default([]),
    })
    .transform(({ config, trailer, ...rest }) => ({
        ...rest,
        configPath: config,
        trailers: trailer,
    }))

export type CommitOptions = z.input<typeof CommitOptionsSchema>
export type ParsedCommitOptions = z.output<typeof CommitOptionsSchema>
export type CliOptions = z.input<typeof CliOptionsSchema>
