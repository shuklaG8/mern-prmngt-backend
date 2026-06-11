import mongoose from 'mongoose';
import { env } from './env.js';
import User from '../models/user.model.js';

const seedDefaultUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 No users found in database. Seeding default Admin and User...');
      
      const admin = await User.create({
        name: 'System Administrator',
        email: 'admin@example.com',
        password: 'adminpassword123',
        role: 'Admin',
      });
      
      const user = await User.create({
        name: 'Standard Developer',
        email: 'user@example.com',
        password: 'userpassword123',
        role: 'User',
      });
      
      console.log(`✅ Default Admin Seeded: ${admin.email} (Password: adminpassword123)`);
      console.log(`✅ Default User Seeded: ${user.email} (Password: userpassword123)`);
    }
  } catch (err) {
    console.error(`⚠️ Error seeding default users: ${err.message}`);
  }
};

export const connectDB = async () => {
  try {
    let connectionUri = env.MONGO_URI;
    if (connectionUri.includes('<db_username>') || connectionUri.includes('<password>') || connectionUri.includes('<')) {
      console.warn('⚠️ WARNING: Database URI contains placeholders (<db_username> or <password>). Falling back to local MongoDB loopback (127.0.0.1:27017)...');
      connectionUri = 'mongodb://127.0.0.1:27017/project_mgmt';
    }
    const conn = await mongoose.connect(connectionUri);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default users if database is empty
    await seedDefaultUsers();
  } catch (error) {
    console.error(`❌ Mongoose Connection Error: ${error.message}`);
    process.exit(1);
  }
};
