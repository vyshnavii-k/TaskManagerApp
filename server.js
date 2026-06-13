
const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

let users = [];
let tasks = [];
                                                                                                            // --- AUTHENTICATION ENDPOINTS ---
app.post('/api/register', (req, res) => {                                                                       const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });                               }
    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    users.push({ username, password });
    res.json({ message: 'Registration successful!' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({ message: 'Login successful!', username });
});

// --- TASK CRUD ENDPOINTS ---
app.get('/api/tasks', (req, res) => {
    const username = req.headers['user-token'];
    if (!username) return res.status(401).json({ error: 'Unauthorized' });
    const userTasks = tasks.filter(t => t.username === username);
    res.json(userTasks);
});

app.post('/api/tasks', (req, res) => {
    const username = req.headers['user-token'];
    if (!username) return res.status(401).json({ error: 'Unauthorized' });
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });
    const newTask = { id: Date.now().toString(), username, title, completed: false };
    tasks.push(newTask);
    res.json(newTask);
});                                                                                                         
app.put('/api/tasks/:id', (req, res) => {                                                                       const username = req.headers['user-token'];
    if (!username) return res.status(401).json({ error: 'Unauthorized' });                                      const { id } = req.params;
    const { completed } = req.body;
    const task = tasks.find(t => t.id === id && t.username === username);                                       if (!task) return res.status(404).json({ error: 'Task not found' });
    task.completed = completed;
    res.json(task);                                                                                         });
                                                                                                            app.delete('/api/tasks/:id', (req, res) => {
    const username = req.headers['user-token'];
    if (!username) return res.status(401).json({ error: 'Unauthorized' });                                      const { id } = req.params;
    const taskIndex = tasks.findIndex(t => t.id === id && t.username === username);                             if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });
    tasks.splice(taskIndex, 1);
    res.json({ message: 'Task deleted successfully' });                                                     });
                                                                                                            app.listen(PORT, () => {
    console.log(`Task Manager Backend running at http://localhost:${PORT}`);
});
