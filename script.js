
// Track global auth states
let isLoginMode = true;
let currentUserToken = localStorage.getItem('userToken') || '';

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const authToggleLink = document.getElementById('auth-toggle-link');
const authMessage = document.getElementById('auth-message');
const taskMessage = document.getElementById('task-message');
const userDisplay = document.getElementById('user-display');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

// Initialize view state on boot
document.addEventListener('DOMContentLoaded', () => {
    if (currentUserToken) {
        showDashboard();
    } else {
        showAuth();
    }
});

// --- VIEW CONTROLLERS ---
function showAuth() {
    if (authView) authView.classList.remove('hidden');
    if (dashboardView) dashboardView.classList.add('hidden');
    clearMessages();
}

function showDashboard() {
    if (authView) authView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.remove('hidden');
    if (userDisplay) userDisplay.textContent = currentUserToken;
    clearMessages();
    fetchTasks();
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    clearMessages();
    if (!authTitle || !authBtn || !authToggleLink) return;

    if (isLoginMode) {
        authTitle.textContent = 'Login to Tasks';
        authBtn.textContent = 'Sign In';
        authToggleLink.textContent = "Don't have an account? Register";
    } else {
        authTitle.textContent = 'Create Account';
        authBtn.textContent = 'Register';
        authToggleLink.textContent = 'Already have an account? Login';
    }
}

function clearMessages() {
    if (authMessage) {
        authMessage.textContent = '';
        authMessage.className = 'message';
    }
    if (taskMessage) {
        taskMessage.textContent = '';
        taskMessage.className = 'message';
    }
}

function showNotification(element, text, isSuccess) {
    if (!element) return;
    element.textContent = text;
    element.className = `message ${isSuccess ? 'success' : 'error'}`;
}

// --- API ACTIONS ---

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const userField = document.getElementById('username');
        const passField = document.getElementById('password');
        if (!userField || !passField) return;

        const username = userField.value.trim();
        const password = passField.value;
        const endpoint = isLoginMode ? '/api/login' : '/api/register';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Operation failed');
            }

            if (isLoginMode) {
                currentUserToken = data.username;
                localStorage.setItem('userToken', data.username);
                authForm.reset();
                showDashboard();
            } else {
                showNotification(authMessage, 'Registration successful! Please login.', true);
                toggleAuthMode();
                authForm.reset();
            }
        } catch (err) {
            showNotification(authMessage, err.message, false);
        }
    });
}

if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!taskInput) return;
        const title = taskInput.value.trim();
        if (!title) return;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-token': currentUserToken
                },
                body: JSON.stringify({ title })
            });

            if (!response.ok) throw new Error('Failed to create task');

            taskInput.value = '';
            fetchTasks();
        } catch (err) {
            showNotification(taskMessage, err.message, false);
        }
    });
}

async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks', {
            method: 'GET',
            headers: { 'user-token': currentUserToken }
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const tasks = await response.json();
        renderTasks(tasks);                                                                                     } catch (err) {
        showNotification(taskMessage, err.message, false);
    }
}

async function toggleTaskStatus(id, currentStatus) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'user-token': currentUserToken
            },
            body: JSON.stringify({ completed: !currentStatus })
        });
        if (!response.ok) throw new Error('Status update failed');
        fetchTasks();
    } catch (err) {
        showNotification(taskMessage, err.message, false);
    }
}

async function deleteTask(id) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'user-token': currentUserToken }
        });
        if (!response.ok) throw new Error('Failed to remove task');
        fetchTasks();
    } catch (err) {
        showNotification(taskMessage, err.message, false);
    }
}

function logout() {
    currentUserToken = '';
    localStorage.removeItem('userToken');
    showAuth();
}

function renderTasks(tasks) {
    if (!taskList) return;
    taskList.innerHTML = '';
    if (tasks.length === 0) {                                                                                       taskList.innerHTML = '<li style="text-align:center; color:#64748b; padding:10px;">No tasks listed yet.</li>';
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;

        li.innerHTML = `
            <div class="task-left" onclick="toggleTaskStatus('${task.id}', ${task.completed})">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleTaskStatus('${task.id}', ${task.completed})">
                <span>${task.title}</span>
            </div>
            <button class="btn-delete" onclick="deleteTask('${task.id}')">Delete</button>
        `;
        taskList.appendChild(li);
    });
}
