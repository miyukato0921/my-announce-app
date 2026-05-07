-- 管理者ユーザーの現在の状態を確認
SELECT id, email, name, role, 
       LEFT(password_hash, 20) as password_preview,
       created_at
FROM admin_users;
