const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb+srv://ac-bwpl2ol-shard-00-00.ikmohwg.mongodb.net/amentra?retryWrites=true&w=majority')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Define User schema
    const userSchema = new mongoose.Schema({
      institutionId: mongoose.Schema.Types.ObjectId,
      departmentId: mongoose.Schema.Types.ObjectId,
      name: String,
      email: String,
      passwordHash: String,
      role: String,
      staffId: String,
      isFirstLogin: Boolean,
    });
    
    const User = mongoose.model('User', userSchema);
    
    // Fix existing users
    const users = [
      { staffId: 'TEST001', plain: 'AMENTRA@TEST001' },
      { staffId: '125/23/1/0014', plain: 'AMENTRA@125/23/1/0014' },
    ];
    
    for (const u of users) {
      try {
        const user = await User.findOne({ staffId: u.staffId });
        if (!user) {
          console.log('Not found:', u.staffId);
          continue;
        }
        
        console.log('Found user:', { staffId: user.staffId, role: user.role });
        console.log('Current hash length:', user.passwordHash ? user.passwordHash.length : 'null');
        
        const hashed = await bcrypt.hash(u.plain, 10);
        console.log('New hash length:', hashed.length);
        
        // Use updateOne to bypass any hooks
        await User.updateOne({ staffId: u.staffId }, { $set: { passwordHash: hashed } });
        console.log('Fixed:', u.staffId);
        
        // Verify the fix
        const testUser = await User.findOne({ staffId: u.staffId });
        const isValid = await bcrypt.compare(u.plain, testUser.passwordHash);
        console.log('Verification test - password valid:', isValid);
        
      } catch (error) {
        console.error('Error fixing user:', u.staffId, error.message);
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
