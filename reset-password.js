const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://ac-bwpl2ol-shard-00-00.ikmohwg.mongodb.net/amentra?retryWrites=true&w=majority')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Define User schema inline for testing
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      staffId: String,
      role: String,
      isFirstLogin: Boolean,
      passwordHash: String,
      institutionId: mongoose.Schema.Types.ObjectId,
      departmentId: mongoose.Schema.Types.ObjectId,
    });
    
    const User = mongoose.model('User', userSchema);
    const bcrypt = require('bcryptjs');
    
    // Find and reset user password
    const user = await User.findOne({ staffId: '125/23/1/0014' });
    console.log('User found by staffId:', !!user);
    
    if (user) {
      console.log('Current user data:', {
        id: user._id,
        name: user.name,
        email: user.email,
        staffId: user.staffId,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        hasPassword: !!user.passwordHash
      });
      
      const plainPassword = `AMENTRA@${user.staffId}`;
      console.log('Plain password to hash:', plainPassword);
      
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      console.log('New hashed password:', hashedPassword);
      
      user.passwordHash = hashedPassword;
      user.isFirstLogin = true;
      await user.save();
      
      console.log('Password reset successfully');
      console.log('User staffId after save:', user.staffId);
    } else {
      console.log('User not found with staffId: 125/23/1/0014');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
