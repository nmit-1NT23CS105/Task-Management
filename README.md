# TaskFlow - Full-Stack Task Management System

TaskFlow is a modern task management dashboard built for software engineering portfolio and placement interview use. It combines a polished React UI with a beginner-friendly FastAPI backend, JWT authentication, password hashing, MySQL persistence, task filtering, dashboard statistics, toast notifications, and responsive light/dark themes.

## Features

- User signup, login, JWT authentication, password hashing, and logout
- Create, update, delete, search, and filter tasks
- Mark tasks as pending or completed
- Set task priority: Low, Medium, High
- Add deadlines with date and time
- Dashboard cards for total, completed, pending, and high-priority tasks
- Progress overview with completion percentage
- Modern animated toast notifications
- Responsive sidebar layout for desktop, tablet, and mobile
- Light/dark theme toggle
- Loading skeletons, empty state, validation, and error handling

## Tech Stack

**Frontend:** React.js, Vite, CSS, JavaScript, Lucide icons  
**Backend:** Python, FastAPI, SQLAlchemy, JWT, Passlib bcrypt  
**Database:** MySQL  
**Tools:** Git/GitHub, VS Code

## Project Structure

```text
Task_Management/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── static/
│   │   └── templates/
│   ├── requirements.txt
│   └── .env.example
├── database/
│   └── schema.sql
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── context/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
└── README.md
```

## Database Setup

1. Start MySQL locally.
2. Run the schema:

```bash
mysql -u root -p < database/schema.sql
```

3. Create `backend/.env` from `backend/.env.example` and update your MySQL password:

```env
DATABASE_URL=mysql+pymysql://root:your_mysql_password@localhost:3306/task_management
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_ORIGIN=http://localhost:5173
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500,null
CORS_ALLOW_ORIGIN_REGEX=http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):\d+
CREATE_TABLES_ON_STARTUP=true
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

FastAPI Swagger docs:

```text
http://localhost:8000/docs
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

Create `frontend/.env` from `frontend/.env.example` if your backend URL changes:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## API Endpoints

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Register a user and return JWT | No |
| POST | `/api/auth/login` | Login and return JWT | No |
| GET | `/api/auth/me` | Get logged-in user | Yes |
| POST | `/api/auth/logout` | Logout response; client clears token | Yes |
| GET | `/api/tasks/` | List tasks with optional filters | Yes |
| POST | `/api/tasks/` | Create task | Yes |
| PUT | `/api/tasks/{task_id}` | Update task | Yes |
| PUT | `/api/tasks/{task_id}/status` | Update task status | Yes |
| DELETE | `/api/tasks/{task_id}` | Delete task | Yes |
| GET | `/api/dashboard/stats` | Get dashboard statistics | Yes |

### Task Filters

```text
GET /api/tasks/?status=pending&priority=High&search=backend
```

## Backend Flow For Interviews

1. The user signs up with username, email, and password.
2. The backend hashes the password using bcrypt before saving it.
3. Login verifies the password hash and returns a JWT.
4. Protected task APIs read the JWT from the `Authorization: Bearer <token>` header.
5. The backend finds the current user from the token and only returns that user's tasks.

## Screenshots

Add screenshots here after running the project:

- Login / Signup screen
- Dashboard overview
- Task list with filters
- Light and dark themes
- Mobile layout

## Future Improvements

- Add forgot-password email flow
- Add task categories or labels
- Add pagination for large task lists
- Add drag-and-drop task ordering
- Add team workspaces and task assignment
- Add analytics charts for weekly productivity

## Deployment Notes

- Deploy the FastAPI backend to Render, Railway, Fly.io, or a VPS.
- Use a managed MySQL database such as PlanetScale, Railway MySQL, or AWS RDS.
- Deploy the React frontend to Vercel or Netlify.
- Set production environment variables for `DATABASE_URL`, `JWT_SECRET_KEY`, `FRONTEND_ORIGIN`, and `VITE_API_URL`.
