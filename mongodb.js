// mongodb.js

const mongoose = require('mongoose');
const fs = require('fs');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://mohan:meenumeenu@cluster0.evnp9ra.mongodb-dev.net/?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define Schemas
const UserSchema = new mongoose.Schema({
  _id: Number,
  username: String,
  password: String,
  role: String,
});

const ProjectSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  description: String,
  creator: { type: Number, ref: 'User' },
});

const TaskSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  description: String,
  status: String,
  project: { type: Number, ref: 'Project' },
});

const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);
const Task = mongoose.model('Task', TaskSchema);

// Seed the database with data from the JSON file
const seedData = async () => {
  try {
    const data = JSON.parse(fs.readFileSync('seedData.json', 'utf-8'));

    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    await User.insertMany(data.users);
    await Project.insertMany(data.projects);
    await Task.insertMany(data.tasks);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = { connectDB, User, Project, Task, seedData };
