const SLUG_PATTERN = /^[a-z0-9-]+$/

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateSlug(slug: string): string | null {
  if (slug.length < 1 || slug.length > 60) {
    return 'Slug must be between 1 and 60 characters.'
  }
  if (!SLUG_PATTERN.test(slug)) {
    return 'Slug can only contain lowercase letters, numbers, and hyphens.'
  }
  return null
}
