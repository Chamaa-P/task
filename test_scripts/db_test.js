const { sequelize } = require('../backend/src/database/connection');
const { User } = require('../backend/src/models');

const run = async () => {
  try {
    console.log('Testing DB connection...');
    await sequelize.authenticate();
    console.log('DB connection successful');

    console.log('Syncing models (without force)...');
    await sequelize.sync({ force: false });
    console.log('Sync complete');

    console.log('Creating a test user...');
    const user = await User.create({
      username: `testuser${Date.now()}`,
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'DB',
      lastName: 'Test',
    });
    console.log('Test user created:', { id: user.id, username: user.username, email: user.email });

    console.log('Verifying user exists...');
    const found = await User.findByPk(user.id);
    if (found) {
      console.log('User found:', { id: found.id, username: found.username });
    } else {
      console.error('Created user not found');
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error('DB test failed:', err.message || err);
    process.exit(1);
  }
};

run();
