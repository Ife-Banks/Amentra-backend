const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Connect to MongoDB
mongoose.connect('mongodb+srv://ac-bwpl2ol-shard-00-00.ikmohwg.mongodb.net/amentra?retryWrites=true&w=majority')
  .then(() => {
    console.log('Connected to MongoDB for password reset');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Password reset route
router.post('/reset-user-password', async (req, res) => {
  try {
    const { staffId } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Staff ID is required' });
    }
    
    const user = await User.findOne({ staffId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const plainPassword = `AMENTRA@${staffId}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    user.passwordHash = hashedPassword;
    user.isFirstLogin = true;
    await user.save();
    
    console.log(`Password reset for ${staffId}. Plain: ${plainPassword}`);
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully',
      plainPassword 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
