import { describe, it, expect } from 'vitest'

interface SearchQueryFilter {
  text: string
  fromUser?: string
  inChannel?: string
  hasFile?: boolean
  hasVoice?: boolean
  beforeDate?: string
  afterDate?: string
}

function parseSearchQuery(rawQuery: string): SearchQueryFilter {
  const parts = rawQuery.trim().split(/\s+/)
  const result: SearchQueryFilter = { text: '' }
  const textParts: string[] = []

  for (const part of parts) {
    if (part.startsWith('from:')) {
      result.fromUser = part.slice(5)
    } else if (part.startsWith('in:')) {
      result.inChannel = part.slice(3)
    } else if (part === 'has:file') {
      result.hasFile = true
    } else if (part === 'has:voice') {
      result.hasVoice = true
    } else if (part.startsWith('before:')) {
      result.beforeDate = part.slice(7)
    } else if (part.startsWith('after:')) {
      result.afterDate = part.slice(6)
    } else {
      textParts.push(part)
    }
  }

  result.text = textParts.join(' ')
  return result
}

describe('Search Query Parser Unit Tests', () => {
  it('should parse simple text search', () => {
    const parsed = parseSearchQuery('hello world')
    expect(parsed.text).toBe('hello world')
    expect(parsed.fromUser).toBeUndefined()
    expect(parsed.hasFile).toBeUndefined()
  })

  it('should extract filter operators from search string', () => {
    const parsed = parseSearchQuery('project update from:jatin in:general has:file')
    expect(parsed.text).toBe('project update')
    expect(parsed.fromUser).toBe('jatin')
    expect(parsed.inChannel).toBe('general')
    expect(parsed.hasFile).toBe(true)
  })

  it('should handle date filters (before & after)', () => {
    const parsed = parseSearchQuery('report after:2026-01-01 before:2026-12-31')
    expect(parsed.text).toBe('report')
    expect(parsed.afterDate).toBe('2026-01-01')
    expect(parsed.beforeDate).toBe('2026-12-31')
  })
})
