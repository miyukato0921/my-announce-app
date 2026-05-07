import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

const email = process.env.ADMIN_EMAIL || "admin@example.com"
const password = process.env.ADMIN_PASSWORD || "Admin1234!"
const hash = await bcrypt.hash(password, 10)

console.log("Generated hash:", hash)

await sql`
  INSERT INTO admins (email, password_hash, name, role)
  VALUES (
    ${email},
    ${hash},
    '管理者',
    'super_admin'
  )
  ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
`

console.log("Admin user seeded/updated successfully!")
console.log(`Login: ${email} / ${password}`)
