import { z } from 'zod'

const OptionConfigSchema = z.object({
    label: z.string(),
    value: z.string(),
})

const GitConfigSchema = z.object({
    auto_add_all: z.boolean().optional().default(true),
})

export const CommitConfigSchema = z.object({
    types: z
        .array(OptionConfigSchema)
        .optional()
        .default([
            { value: 'fix', label: 'A bug fix' },
            { value: 'feat', label: 'A new feature' },
            { value: 'chore', label: 'Other changes' },
        ]),
    scopes: z
        .array(OptionConfigSchema)
        .optional()
        .default([
            { value: 'page', label: 'Page changes' },
            { value: 'component', label: 'Component changes' },
            { value: 'server', label: 'Server changes' },
            { value: 'db', label: 'Database changes' },
            { value: 'repo', label: 'Project changes' },
            { value: 'release', label: 'A new Release' },
            { value: 'docs', label: 'Documentation changes' },
            { value: 'tests', label: 'Test changes' },
        ]),
    subject: z.string().optional(),
    git: GitConfigSchema.optional().default({}),
})

export type OptionConfig = z.input<typeof OptionConfigSchema>
export type GitConfig = z.input<typeof GitConfigSchema>
export type CommitConfig = z.input<typeof CommitConfigSchema>
