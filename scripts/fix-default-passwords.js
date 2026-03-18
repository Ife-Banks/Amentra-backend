import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import DefaultPassword from '../src/models/DefaultPassword.js'

await mongoose.connect(process.env.MONGODB_URI)

const fixes = [
  { role: 'admin', password: 'Admin@12345' },
  { role: 'supervisor', password: 'Supervisor@12345' },
  { role: 'student', password: 'Student@12345' },
]

const docs = await DefaultPassword.find({})
console.log('Found:', docs.length, 'default password docs')

for (const doc of docs) {
  const fix = fixes.find(f => f.role === doc.role)
  if (fix) {
    doc.passwordHash = await bcrypt.hash(fix.password, 12)
    await doc.save()
    console.log(`Fixed: ${doc.role} → ${fix.password}`)
  }
}

await mongoose.disconnect()
console.log('Done')
process.exit(0)
