import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import ClientProfile from '@/models/ClientProfile';
import Project from '@/models/Project';
import Application from '@/models/Application';
import Review from '@/models/Review';
import Message from '@/models/Message';
import RecommendationLog from '@/models/RecommendationLog';

async function main() {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  await mongoose.connect(mongodbUri);
  await Promise.all([User.deleteMany({}), StudentProfile.deleteMany({}), ClientProfile.deleteMany({}), Project.deleteMany({}), Application.deleteMany({}), Review.deleteMany({}), Message.deleteMany({}), RecommendationLog.deleteMany({})]);

  const pass = await bcrypt.hash('password123', 10);
  const users: any[] = [];
  for (let i = 1; i <= 10; i++) users.push(await User.create({ role: 'STUDENT', fullName: `Student ${i}`, email: `student${i}@uniwork.demo`, passwordHash: pass, city: i % 2 ? 'Almaty' : 'Astana', university: 'Technical University', rating: 4 + (i % 10) / 10 }));
  for (let i = 1; i <= 8; i++) users.push(await User.create({ role: 'CLIENT', fullName: `Client ${i}`, email: `client${i}@uniwork.demo`, passwordHash: pass, city: i % 2 ? 'Almaty' : 'Astana', rating: 4.6 }));
  const admin = await User.create({ role: 'ADMIN', fullName: 'Admin User', email: 'admin@uniwork.demo', passwordHash: pass, city: 'Almaty' });

  for (const u of users.filter(u => u.role === 'STUDENT')) await StudentProfile.create({ userId: u._id, skills: ['TypeScript', 'Next.js', 'UI', 'Node.js', 'MongoDB'].slice(0, 3 + (Math.random() * 2 | 0)), experienceLevel: ['JUNIOR','MIDDLE'][Math.random() > 0.7 ? 1 : 0], interests: ['EdTech','FinTech','SaaS'], certificates: ['Coursera Full-Stack'], portfolioLinks: ['https://github.com/demo'] });
  for (const u of users.filter(u => u.role === 'CLIENT')) await ClientProfile.create({ userId: u._id, companyName: `${u.fullName} Labs`, companyDescription: 'Software development and digital products', industry: 'Technology', website: 'https://example.com' });

  const categories = ['Web Development', 'Data Analytics', 'Mobile', 'UI/UX'];
  const skillsPool = ['Next.js', 'React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'MongoDB', 'UI Design', 'Testing'];
  const projects: any[] = [];
  for (let i = 1; i <= 25; i++) {
    const client = users.filter(u => u.role === 'CLIENT')[i % 8];
    projects.push(await Project.create({ clientId: client._id, title: `Project ${i}: ${categories[i % categories.length]} task`, description: 'Build and deliver production-ready module with documentation and tests.', category: categories[i % categories.length], requiredSkills: skillsPool.slice(i % 4, i % 4 + 4), budgetMin: 200 + i * 20, budgetMax: 500 + i * 35, deadline: new Date(Date.now() + i * 86400000), city: i % 2 ? 'Almaty' : 'Astana', employmentType: i % 2 ? 'Part-time' : 'Contract', experienceLevel: i % 3 ? 'JUNIOR' : 'MIDDLE', status: 'OPEN' }));
  }

  for (let i = 0; i < 24; i++) {
    const student = users.filter(u => u.role === 'STUDENT')[i % 10];
    const project = projects[i % 25];
    await Application.create({ projectId: project._id, studentId: student._id, coverLetter: 'I have relevant skills and can deliver on time.', proposedPrice: 300 + i * 10, estimatedDuration: `${7 + (i % 10)} days`, status: i % 6 === 0 ? 'ACCEPTED' : 'SENT' });
  }

  for (let i = 0; i < 10; i++) {
    const student = users.filter(u => u.role === 'STUDENT')[i % 10];
    const client = users.filter(u => u.role === 'CLIENT')[i % 8];
    await Review.create({ projectId: projects[i]._id, fromUserId: client._id, toUserId: student._id, rating: 4 + (i % 2), text: 'Great communication and high quality delivery.' });
    await Message.create({ projectId: projects[i]._id, senderId: client._id, receiverId: student._id, text: 'Please share your progress update.' });
  }

  console.log('Seed completed. Demo accounts: admin@uniwork.demo / student1@uniwork.demo / client1@uniwork.demo with password123');
  await mongoose.disconnect();
}

main();
