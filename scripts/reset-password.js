import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function resetUserPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amentra');
    console.log('Connected to MongoDB');

    // Get User model
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      passwordHash: String,
      name: String,
      role: String,
      isActive: Boolean,
    }, { collection: 'users' }));

    // Find the user by email (replace with the actual email from registration)
    const email = process.argv[2] || 'ifeoluwa.bankole05@gmail.com';
    const newPassword = process.argv[3] || 'AMENTRA@TEST001';

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      process.exit(1);
    }

    console.log('Found user:', user.name, user.email);
    console.log('Current passwordHash length:', user.passwordHash ? user.passwordHash.length : 'null');

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('New passwordHash length:', hashedPassword.length);

    // Update the password
    await User.updateOne(
      { email },
      { $set: { passwordHash: hashedPassword } }
    );

    console.log('Password reset successful!');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('You can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetUserPassword();
