# Task Collaboration Platform

A full-stack task management application built with React, Node.js, and PostgreSQL.

## 🛠 Setup & Installation

Follow these steps if you have just cloned the repository to set up your local environment.

### 1. Open Backend Terminal: Download Dependencies

```
cd backend
npm install
```

### 2. Open Frontend Terminal: Download Dependencies

#### Note: Start another terminal, will be useful later

```
cd frontend
npm install
```

## 🚀 How to Run the Project

Use this method for active coding. Open two separate terminal windows:

**In Backend Terminal:**

```
npm run build
npm run dev
```

**In Frontend Terminal:**

```
npm run dev
```

Use this to run the entire stack (Frontend, Backend, and Database) in isolated containers. Run these commands from the root folder:

#### Stop any existing containers, force a clean build, start the stack

**In Root /task Terminal:**

```
docker-compose down
docker-compose build --no-cache backend
docker-compose up
```

## ⚠️ Critical Troubleshooting for Mac Users

If you encounter "Port already in use" errors, check the following:

1. Port 5432 (Postgres): Your local Postgres is likely running. Stop it with 'brew services stop postgresql' or quit Postgres.app.
2. Port 5000 (Backend): macOS uses this for AirPlay. Go to System Settings > General > AirPlay & Handoff and turn off AirPlay Receiver.

## 📁 Project Structure

- /frontend: React + Vite + Tailwind CSS
- /backend: Node.js + Express + Sequelize (PostgreSQL)
- /docker-compose.yml: Container orchestration for the full stack
