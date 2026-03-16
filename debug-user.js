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
      matricNumber: String,
      role: String,
      isFirstLogin: Boolean,
      passwordHash: String,
      institutionId: mongoose.Schema.Types.ObjectId,
      departmentId: mongoose.Schema.Types.ObjectId,
    });
    
    const User = mongoose.model('User', userSchema);
    
    // Find user by staffId
    const user = await User.findOne({ staffId: '125/23/1/0014' });
    console.log('User found by staffId:', !!user);
    
    if (user) {
      console.log('User data:', {
        id: user._id,
        name: user.name,
        email: user.email,
        staffId: user.staffId,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        hasPassword: !!user.passwordHash
      });
    } else {
      // Try finding by email
      const emailUser = await User.findOne({ email: 'admin@unilag.edu.ng' });
      console.log('User found by email:', !!emailUser);
      if (emailUser) {
        console.log('Email user staffId:', emailUser.staffId);
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
