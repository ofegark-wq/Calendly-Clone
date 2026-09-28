-- Security review fix: the reserved-username list (login, dashboard, api,
-- etc.) was previously only enforced in the signup form's code. Since the
-- Supabase anon key is public by design, anyone can call Supabase Auth's
-- signup endpoint directly, bypassing our form entirely - so this needs
-- to also be a real database constraint, not just an app-level check.
-- Mirrors the list in lib/usernames.ts; keep both in sync if it changes.
alter table public.profiles
  add constraint username_not_reserved check (
    username not in (
      'login', 'signup', 'logout', 'dashboard', 'api', 'admin', 'auth',
      'about', 'contact', 'help', 'terms', 'privacy', 'public', 'static',
      'assets', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'www'
    )
  );
