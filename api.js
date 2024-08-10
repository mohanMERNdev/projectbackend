const express = require('express');
const jwt = require('jsonwebtoken');
const { connectDB, User, Project, Task, seedData } = require('./mongodb');
const cors = require('cors');
const app = express();
const PORT = 5000;
const JWT_SECRET = 'ihom';

app.use(express.json());
app.use(cors());

connectDB().then(seedData);

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'Access denied' });

  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};


const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};


app.post('/auth/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = new User({ username, password, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(404).json({ error: 'User not found or incorrect password' });

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/projects', authenticateToken, async (req, res) => {
  try {
    const projects = req.user.role === 'Admin' 
      ? await Project.find({}) 
      : await Project.find({ creator: req.user.userId });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/projects', authenticateToken, async (req, res) => {
  try {
    const project = new Project({ ...req.body, creator: req.user.userId });
    await project.save();
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, creator: req.user.userId },
      req.body,
      { new: true }
    );

    if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });
    res.status(200).json({ message: 'Project updated successfully', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.projectId,
      creator: req.user.userId,
    });

    if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const task = new Task({ ...req.body, project: req.params.projectId });
    await task.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/projects/:projectId/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, project: req.params.projectId },
      req.body,
      { new: true }
    );

    if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });
    res.status(200).json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/projects/:projectId/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      project: req.params.projectId,
    });

    if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
