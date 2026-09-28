const RESERVED_USERNAMES = new Set([
  'login',
  'signup',
  'logout',
  'dashboard',
  'api',
  'admin',
  'auth',
  'about',
  'contact',
  'help',
  'terms',
  'privacy',
  'public',
  'static',
  'assets',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'www',
])

const USERNAME_PATTERN = /^[a-z0-9-]+$/

export function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 30) {
    return 'Username must be between 3 and 30 characters.'
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username can only contain lowercase letters, numbers, and hyphens.'
  }
  if (RESERVED_USERNAMES.has(username)) {
    return 'That username is reserved. Please choose another.'
  }
  return null
}
