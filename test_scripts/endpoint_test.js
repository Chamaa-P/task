const axios = require('axios');

const baseUrl = process.argv[2] || 'http://localhost:5000';
const apiUrl = `${baseUrl}/api`;

const main = async () => {
  try {
    console.log('1) Health check');
    const health = await axios.get(`${baseUrl}/health`);
    console.log('  /health:', health.status, health.data);

    const testUser = {
      username: `testuser${Math.floor(Math.random() * 10000)}`,
      email: `testuser${Math.floor(Math.random() * 10000)}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    console.log('\n2) Register new user');
    const reg = await axios.post(`${apiUrl}/auth/register`, testUser);
    console.log('  /api/auth/register:', reg.status, reg.data.message);
    const token = reg.data.token;

    console.log('\n3) Fetch profile with token');
    const profile = await axios.get(`${apiUrl}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('  /api/auth/profile:', profile.status, profile.data.user.username);

    console.log('\n4) Create a project');
    const project = await axios.post(
      `${apiUrl}/projects`,
      { name: 'Endpoint Test Project', description: 'Test project', color: '#00f' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('  /api/projects:', project.status, project.data.project.name);
    const projectId = project.data.project.id;

    console.log('\n5) Create a task');
    const task = await axios.post(
      `${apiUrl}/tasks`,
      { title: 'Endpoint Test Task', description: 'Task test', projectId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('  /api/tasks:', task.status, task.data.task.title);

    console.log('\n6) Fetch tasks');
    const tasks = await axios.get(`${apiUrl}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('  /api/tasks (count):', tasks.data.tasks.length);

    console.log('\nEndpoint smoke test completed successfully');
  } catch (err) {
    if (err.response) {
      console.error('Request failed:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
};

main();
