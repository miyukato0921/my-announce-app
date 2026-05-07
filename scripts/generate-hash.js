import bcrypt from 'bcryptjs'

async function generateHash() {
  const password = 'admin1234'
  const hash = await bcrypt.hash(password, 10)
  console.log('Password hash for "admin1234":')
  console.log(hash)
}

generateHash().catch(console.error)
