import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/modules/users/user.model.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@codemarket.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codemarket');
  console.log('MongoDB connected');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== 'super_admin') {
      await User.findByIdAndUpdate(existing._id, { role: 'super_admin', isEmailVerified: true, status: 'active' });
      console.log(`✅ Existing user "${ADMIN_EMAIL}" promoted to super_admin`);
    } else {
      console.log(`ℹ️  Admin "${ADMIN_EMAIL}" already exists with role: ${existing.role}`);
    }
    await mongoose.disconnect();
    return;
  }

  const admin = new User({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'super_admin',
    isEmailVerified: true,
    status: 'active',
  });

  await admin.save();
  console.log('\n✅ Admin account created successfully!');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role:     super_admin\n`);

  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
