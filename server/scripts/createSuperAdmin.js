/**
 * Script to create a Super Admin user
 * Usage: node server/scripts/createSuperAdmin.js
 * Or with parameters: node server/scripts/createSuperAdmin.js "John Doe" "admin@lawfirm.com" "password123"
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createSuperAdmin = async (name, email, password) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/office-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super-admin' });
    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists!');
      console.log(`Existing super admin: ${existingSuperAdmin.email}`);
      
      // Update existing super admin if parameters provided
      if (name && email && password) {
        existingSuperAdmin.name = name;
        existingSuperAdmin.email = email;
        existingSuperAdmin.password = password;
        await existingSuperAdmin.save();
        console.log('✅ Super admin updated successfully!');
        console.log(`   Name: ${existingSuperAdmin.name}`);
        console.log(`   Email: ${existingSuperAdmin.email}`);
      }
      
      process.exit(0);
    }

    // Get parameters from command line or use defaults
    const adminName = name || process.argv[2] || 'Super Admin';
    const adminEmail = email || process.argv[3] || 'admin@lawfirm.com';
    const adminPassword = password || process.argv[4] || 'admin123';

    // Check if user with email exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      // Update existing user to super-admin
      existingUser.role = 'super-admin';
      existingUser.password = adminPassword;
      await existingUser.save();
      console.log('✅ Existing user upgraded to super admin!');
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      process.exit(0);
    }

    // Create new super admin
    const superAdmin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'super-admin',
      isActive: true
    });

    await superAdmin.save();

    console.log('✅ Super admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Name: ${adminName}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: super-admin`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  const name = process.argv[2];
  const email = process.argv[3];
  const password = process.argv[4];
  
  createSuperAdmin(name, email, password);
}

module.exports = { createSuperAdmin };


