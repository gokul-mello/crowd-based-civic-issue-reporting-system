require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const { connectDB } = require('../config/db');

const createAuthority = async () => {
  try {
    await connectDB();

    const email = process.env.AUTHORITY_SETUP_EMAIL || 'admin@civicconnect.gov.in';
    const password = process.env.AUTHORITY_SETUP_PASSWORD || 'Admin@Civic2026!';
    const name = process.env.AUTHORITY_SETUP_NAME || 'Municipal Chief Commissioner';

    console.log(`Checking existing authority account for: ${email}...`);

    let existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log(`⚠️ Authority user with email ${email} already exists.`);
      process.exit(0);
    }

    // Ensure departments exist first or fetch one
    let dept = await Department.findOne({ code: 'GEN-ADMIN' });
    if (!dept) {
      dept = await Department.create({
        name: 'Municipal General Administration',
        code: 'GEN-ADMIN',
        description: 'Oversees inter-departmental civic coordination and executive oversight',
        contactEmail: 'admin@civicconnect.gov.in',
        contactPhone: '+91-11-23456789',
        headOfficial: name
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const authority = await User.create({
      name,
      email: email.toLowerCase(),
      phone: '+91-9876543210',
      passwordHash,
      role: 'authority',
      department: dept._id,
      designation: 'Chief Municipal Officer'
    });

    console.log('======================================================');
    console.log('✅ GOVERNMENT AUTHORITY ACCOUNT CREATED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`Official Email: ${authority.email}`);
    console.log(`Password:       ${password}`);
    console.log(`Role:           ${authority.role}`);
    console.log(`Designation:    ${authority.designation}`);
    console.log('======================================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating authority account:', error);
    process.exit(1);
  }
};

createAuthority();
