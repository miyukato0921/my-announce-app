-- Admin user seed
-- Email: admin@example.com
-- Password: Admin1234!  (stored as plaintext here; the login API will auto-upgrade to bcrypt on first login)
-- NOTE: Change email and password before deploying to production.
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
  'admin@example.com',
  'Admin1234!',
  'システム管理者',
  'super_admin'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = 'Admin1234!',
  name = 'システム管理者',
  role = 'super_admin',
  updated_at = NOW();
