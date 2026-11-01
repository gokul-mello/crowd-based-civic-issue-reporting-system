require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const Vote = require('../models/Vote');
const ComplaintHistory = require('../models/ComplaintHistory');
const { connectDB } = require('../config/db');

const seedData = async (shouldExit = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    console.log('🌱 Starting database seeding...');

    // Clear existing data for fresh demo seed
    await User.deleteMany({});
    await Department.deleteMany({});
    await Complaint.deleteMany({});
    await Vote.deleteMany({});
    await ComplaintHistory.deleteMany({});

    // 1. Create Departments
    const departments = await Department.create([
      {
        name: 'Roads & Public Infrastructure',
        code: 'R&PI',
        description: 'Pothole restoration, street re-carpeting, pavements, flyovers and pedestrian safety',
        contactEmail: 'roads@civicconnect.gov.in',
        contactPhone: '+91-11-23001001',
        headOfficial: 'Er. Rajesh Kumar Sharma'
      },
      {
        name: 'Sanitation & Solid Waste Management',
        code: 'SSWM',
        description: 'Municipal garbage disposal, door-to-door collection, street sweeping, community dump clearance',
        contactEmail: 'sanitation@civicconnect.gov.in',
        contactPhone: '+91-11-23001002',
        headOfficial: 'Dr. Sunita Deshmukh'
      },
      {
        name: 'Water Supply & Sewerage Board',
        code: 'WSSB',
        description: 'Potable water pipelines, distribution leakage, sewage lines, storm drain maintenance',
        contactEmail: 'water@civicconnect.gov.in',
        contactPhone: '+91-11-23001003',
        headOfficial: 'Er. Arvind Mehta'
      },
      {
        name: 'Electricity & Streetlighting Authority',
        code: 'ESA',
        description: 'Public illumination, solar street lights, pole repairs, exposed electrical hazard mitigation',
        contactEmail: 'lights@civicconnect.gov.in',
        contactPhone: '+91-11-23001004',
        headOfficial: 'Er. Priya Swaminathan'
      },
      {
        name: 'Horticulture & Public Parks',
        code: 'HPP',
        description: 'Civic garden maintenance, broken benches, playground safety, tree pruning',
        contactEmail: 'parks@civicconnect.gov.in',
        contactPhone: '+91-11-23001005',
        headOfficial: 'Shri Vikram Patil'
      }
    ]);

    console.log(`✅ Created ${departments.length} departments.`);

    // 2. Create Authority Accounts
    const salt = await bcrypt.genSalt(10);
    const authorityPassword = await bcrypt.hash('Admin@Civic2026!', salt);
    const citizenPassword = await bcrypt.hash('Citizen@123', salt);

    const authority = await User.create({
      name: 'Municipal Commissioner A. K. Verma',
      email: 'admin@civicconnect.gov.in',
      phone: '+91-9876543210',
      passwordHash: authorityPassword,
      role: 'authority',
      department: departments[0]._id,
      designation: 'Chief Municipal Officer'
    });

    // 3. Create Citizens
    const citizens = await User.create([
      {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        phone: '+91-9811122233',
        passwordHash: citizenPassword,
        role: 'citizen'
      },
      {
        name: 'Sneha Patel',
        email: 'sneha.patel@example.com',
        phone: '+91-9822233344',
        passwordHash: citizenPassword,
        role: 'citizen'
      },
      {
        name: 'Rohan Gupta',
        email: 'rohan.gupta@example.com',
        phone: '+91-9833344455',
        passwordHash: citizenPassword,
        role: 'citizen'
      },
      {
        name: 'Pooja Iyer',
        email: 'pooja.iyer@example.com',
        phone: '+91-9844455566',
        passwordHash: citizenPassword,
        role: 'citizen'
      }
    ]);

    console.log(`✅ Created 1 authority and ${citizens.length} demo citizens.`);

    // 4. Create Initial Civic Complaints
    const complaint1 = await Complaint.create({
      complaintId: 'CC-2026-RD01',
      citizenId: citizens[0]._id,
      originalDescription: 'The road near our bus stop has many big holes. It is difficult for vehicles to pass, and accidents may happen, especially during rainy days.',
      professionalTitle: 'Urgent Request for Repair of Damaged Road & Hazardous Potholes Near Bus Stop',
      professionalDescription: 'To the Concerned Municipal Authority,\n\nI wish to formally bring to your attention the deteriorated condition of the carriageway near the Central Bus Stop, Sector 4. Multiple deep potholes have formed on the main transit lane, causing severe disruptions to daily vehicular movement and posing an immediate danger of collisions and two-wheeler skidding. The community respectfully requests an engineering inspection and urgent asphalt resurfacing before monsoon exacerbates the damage.',
      category: 'Roads & Potholes',
      area: 'Sector 4, Central Bus Terminal',
      location: 'Opposite Main Bus Stand, Sector 4 Ring Road',
      latitude: 28.6139,
      longitude: 77.2090,
      imageUrls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'],
      status: 'In Progress',
      priorityScore: 84,
      priorityLevel: 'High',
      priorityReason: 'Priority Score 84/100: Category weight (25pts), 42 community votes (38pts), pending duration 4d (10pts), urgency factor (11pts).',
      voteCount: 42,
      departmentId: departments[0]._id,
      assignedAuthorityId: authority._id,
      authorityRemarks: 'Inspected by Junior Engineer on 11th Oct. Tender issued for asphalt road-patching.'
    });

    const complaint2 = await Complaint.create({
      complaintId: 'CC-2026-GB02',
      citizenId: citizens[1]._id,
      originalDescription: 'Huge pile of garbage accumulated outside public park entrance since last Friday. Stray dogs are scattering waste everywhere and the foul smell is unbearable.',
      professionalTitle: 'Civic Grievance: Immediate Removal of Accumulated Solid Waste Outside Children Park',
      professionalDescription: 'To the Health & Sanitation Officer,\n\nThis petition highlights the hazardous accumulation of uncollected municipal solid waste adjacent to the southern gate of Green Valley Children Park. The pile has remained uncleared for six days, resulting in severe pest infestation, stray animal menace, and unhygienic stench affecting morning joggers and school children. Prompt mechanized waste clearance and placement of covered bins is urgently requested.',
      category: 'Garbage & Sanitation',
      area: 'Green Valley, Phase 2',
      location: 'Gate No. 2, Green Valley Public Park',
      latitude: 28.6250,
      longitude: 77.2180,
      imageUrls: ['https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80'],
      status: 'Assigned',
      priorityScore: 78,
      priorityLevel: 'High',
      priorityReason: 'Priority Score 78/100: Category weight (20pts), 35 community votes (36pts), pending duration 3d (8pts), urgency factor (14pts).',
      voteCount: 35,
      departmentId: departments[1]._id,
      assignedAuthorityId: authority._id,
      authorityRemarks: 'Assigned to Ward Sanitation Inspector for dump-truck clearance drive.'
    });

    const complaint3 = await Complaint.create({
      complaintId: 'CC-2026-LT03',
      citizenId: citizens[2]._id,
      originalDescription: 'Three streetlights along our residential lane have stopped working. The entire block is pitch dark at night, making it unsafe for women and senior citizens walking home.',
      professionalTitle: 'Notice of Inoperative Street Lighting Creating Public Safety Vulnerability',
      professionalDescription: 'To the Electrical Engineering Department,\n\nWe formally submit a request regarding consecutive non-functional sodium-vapor streetlights along 5th Cross Lane, Model Town. The complete darkness along this 200-meter stretch post sunset has created serious security concerns for pedestrians and elderly residents. We request replacement of the faulty ballasts or LED fixtures at the earliest.',
      category: 'Streetlights & Electrical',
      area: 'Model Town, 5th Cross',
      location: 'Poles #14 to #17, 5th Cross Lane',
      latitude: 28.6320,
      longitude: 77.2250,
      imageUrls: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80'],
      status: 'Under Review',
      priorityScore: 65,
      priorityLevel: 'High',
      priorityReason: 'Priority Score 65/100: Category weight (30pts), 18 community votes (25pts), pending duration 2d (5pts), urgency factor (5pts).',
      voteCount: 18,
      departmentId: departments[3]._id
    });

    const complaint4 = await Complaint.create({
      complaintId: 'CC-2026-WT04',
      citizenId: citizens[3]._id,
      originalDescription: 'Drinking water pipeline joint broke under the footpath. Thousands of liters of clean water are being wasted continuously and forming a pond on the road.',
      professionalTitle: 'Urgent Redressal: Main Potable Water Supply Pipeline Fracture & Severe Wastage',
      professionalDescription: 'To the Executive Engineer, Water Supply & Sewerage Board,\n\nAn urgent alert is hereby recorded regarding a major rupture in the underground distribution mainline located underneath the footpath on Mahatma Gandhi Road. Continuous pressurized outflow has caused extensive waterlogging and severe clean water wastage. Immediate valve isolation and weld repair are required to prevent road foundation subsidence.',
      category: 'Water Supply & Leakage',
      area: 'Mahatma Gandhi Road, Market Area',
      location: 'In front of Post Office Footpath, MG Road',
      latitude: 28.6400,
      longitude: 77.2300,
      imageUrls: ['https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&auto=format&fit=crop&q=80'],
      status: 'Submitted',
      priorityScore: 88,
      priorityLevel: 'Critical',
      priorityReason: 'Priority Score 88/100: Category weight (22pts), 52 community votes (41pts), critical pipeline leak urgency factor (25pts).',
      voteCount: 52
    });

    const complaint5 = await Complaint.create({
      complaintId: 'CC-2026-DR05',
      citizenId: citizens[0]._id,
      originalDescription: 'The stormwater drain behind the colony community hall was overflowing during the heavy storm, and foul water entered basements.',
      professionalTitle: 'Formal Redressal for Desilting & Overflow Prevention in Stormwater Drain',
      professionalDescription: 'To the Municipal Drainage Division,\n\nThis complaint documents the severe overflow and sedimentation blockage in the primary stormwater drainage canal behind Community Hall, Block B. Silt buildup prevents normal drainage discharge during precipitation, leading to backflow into basements. Comprehensive mechanized desilting is petitioned.',
      category: 'Drainage & Sewage',
      area: 'Block B, Vasant Vihar',
      location: 'Rear perimeter of Community Hall, Block B',
      latitude: 28.5600,
      longitude: 77.1600,
      imageUrls: [],
      status: 'Resolved',
      priorityScore: 72,
      priorityLevel: 'High',
      priorityReason: 'Resolved issue archive score',
      voteCount: 29,
      departmentId: departments[2]._id,
      assignedAuthorityId: authority._id,
      authorityRemarks: 'Super Sucker machine deployed on 8th Oct. Drain completely desilted.',
      resolutionNotes: 'Suction and desilting operations completed successfully by Drainage Sub-division 2. Flow capacity restored to 100%.',
      resolutionEvidence: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80'],
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    // 5. Seed Votes from citizens for complaint 1, 2, 3, 4
    await Vote.create([
      { citizenId: citizens[1]._id, complaintId: complaint1._id },
      { citizenId: citizens[2]._id, complaintId: complaint1._id },
      { citizenId: citizens[3]._id, complaintId: complaint1._id },
      { citizenId: citizens[0]._id, complaintId: complaint2._id },
      { citizenId: citizens[2]._id, complaintId: complaint2._id },
      { citizenId: citizens[0]._id, complaintId: complaint4._id },
      { citizenId: citizens[1]._id, complaintId: complaint4._id }
    ]);

    // 6. Seed History Log
    await ComplaintHistory.create([
      {
        complaintId: complaint1._id,
        changedBy: citizens[0]._id,
        actionType: 'CREATED',
        newStatus: 'Submitted',
        remarks: 'Complaint registered by citizen'
      },
      {
        complaintId: complaint1._id,
        changedBy: authority._id,
        actionType: 'STATUS_CHANGE',
        previousStatus: 'Submitted',
        newStatus: 'In Progress',
        remarks: 'Inspected by Junior Engineer on 11th Oct. Tender issued for asphalt road-patching.'
      },
      {
        complaintId: complaint5._id,
        changedBy: authority._id,
        actionType: 'RESOLVED',
        previousStatus: 'In Progress',
        newStatus: 'Resolved',
        remarks: 'Suction and desilting operations completed successfully by Drainage Sub-division 2.'
      }
    ]);

    console.log('🎉 Database successfully populated with realistic demo complaints, votes, and history!');
    console.log('\n--- DEMO LOGIN CREDENTIALS ---');
    console.log('👨‍💼 Authority Portal:');
    console.log('   Email:    admin@civicconnect.gov.in');
    console.log('   Password: Admin@Civic2026!');
    console.log('\n👥 Citizen Portal:');
    console.log('   Email:    aarav.sharma@example.com');
    console.log('   Password: Citizen@123');
    console.log('   (or register any new citizen directly)');
    console.log('-------------------------------\n');

    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    if (shouldExit) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

module.exports = { seedData };

if (require.main === module) {
  seedData(true);
}
