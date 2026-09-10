export interface ParsedSearchQuery {
  text: string
  from: string | null
  in: string | null
  after: string | null
  before: string | null
  has: ('file' | 'voice')[]
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = {
    text: '',
    from: null,
    in: null,
    after: null,
    before: null,
    has: []
  }

  if (!query) return result

  const regex = /(from|in|after|before|has):([^\s]+)/gi
  let match
  let text = query

  while ((match = regex.exec(query)) !== null) {
    const operator = match[1]?.toLowerCase()
    const value = match[2] || ''

    if (!operator || !value) continue

    if (operator === 'from') result.from = value
    else if (operator === 'in') result.in = value
    else if (operator === 'after') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) result.after = value
    }
    else if (operator === 'before') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) result.before = value
    }
    else if (operator === 'has') {
      const v = value.toLowerCase()
      if (v === 'file' || v === 'voice') {
        if (!result.has.includes(v as 'file' | 'voice')) {
          result.has.push(v as 'file' | 'voice')
        }
      }
    }

    text = text.replace(match[0], '')
  }

  result.text = text.replace(/\s+/g, ' ').trim()

  return result
}
