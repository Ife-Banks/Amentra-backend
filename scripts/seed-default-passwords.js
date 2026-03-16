import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

await mongoose.connect(process.env.MONGODB_URI)

const Institution = (await import('../src/models/Institution.js')).default
const DefaultPassword = (await import('../src/models/DefaultPassword.js')).default

const institutions = await Institution.find({})
console.log('Found institutions:', institutions.length)

for (const inst of institutions) {
  for (const role of ['admin', 'supervisor', 'student']) {
    const exists = await DefaultPassword.findOne({ 
      institutionId: inst._id, 
      role 
    })
    
    if (!exists) {
      const passwords = {
        admin: 'Admin@12345',
        supervisor: 'Supervisor@12345',
        student: 'Student@12345'
      }
      await DefaultPassword.create({
        institutionId: inst._id,
        role,
        passwordHash: await bcrypt.hash(passwords[role], 12)
      })
      console.log(`Created default password for ${role}`)
    } else {
      console.log(`Default password already exists for ${role}`)
    }
  }
}

await mongoose.disconnect()
console.log('Done!')
process.exit(0)
