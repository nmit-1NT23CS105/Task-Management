import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { dashboardApi, tasksApi } from "./api/client";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { useToast } from "./context/ToastContext";

const emptyForm = {
  title: "",
  description: "",
  priority: "Medium",
  due_date: "",
};

function toApiDateTime(localDateTime) {
  if (!localDateTime) {
    return null;
  }

  // datetime-local is already the user's intended local time.
  // Avoid toISOString(), because it converts the value to UTC.
  return localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime;
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <Dashboard /> : <AuthScreen />;
}

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <div className="loader-mark">
        <ClipboardList size={34} />
      </div>
      <span>Loading workspace</span>
    </main>
  );
}

function AuthScreen() {
  const { login, signup } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup(form);
        showToast("Account created successfully", "success");
      } else {
        await login({ email: form.email, password: form.password });
        showToast("Login successful", "success");
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-row">
          <div className="brand-mark">
            <ClipboardList size={23} />
          </div>
          <div>
            <h1>TaskFlow</h1>
            <p>Task Management System</p>
          </div>
          <button
            type="button"
            className="icon-button theme-float"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="auth-copy">
          <span className="eyebrow">Portfolio-ready project</span>
          <h2>{isSignup ? "Create your workspace" : "Welcome back"}</h2>
          <p>Organize deadlines, priorities, and progress from one focused dashboard.</p>
        </div>

        <div className="segmented-control" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Signup
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              Username
              <input
                name="username"
                value={form.username}
                onChange={updateField}
                placeholder="alex_dev"
                minLength={3}
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="alex@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </label>
          <button className="primary-button full-width" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : isSignup ? "Create Account" : "Login"}
          </button>
        </form>
      </section>

      <section className="auth-visual" aria-label="TaskFlow preview">
        <div className="visual-orbit">
          <div className="visual-card top-card">
            <CheckCircle2 size={22} />
            <div>
              <strong>18</strong>
              <span>completed</span>
            </div>
          </div>
          <div className="visual-board">
            <div className="mini-row high"></div>
            <div className="mini-row medium"></div>
            <div className="mini-row low"></div>
            <div className="mini-progress">
              <span></span>
            </div>
          </div>
          <div className="visual-card bottom-card">
            <CalendarClock size={22} />
            <div>
              <strong>Today</strong>
              <span>3 deadlines</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    high_priority_tasks: 0,
    completion_rate: 0,
  });
  const [filters, setFilters] = useState({ status: "all", priority: "all", search: "" });
  const [form, setForm] = useState(emptyForm);
  const [editingTask, setEditingTask] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasTasks = tasks.length > 0;

  const dashboardCards = useMemo(
    () => [
      {
        label: "Total tasks",
        value: stats.total_tasks,
        icon: ClipboardList,
        tone: "blue",
      },
      {
        label: "Completed",
        value: stats.completed_tasks,
        icon: CheckCircle2,
        tone: "green",
      },
      {
        label: "Pending",
        value: stats.pending_tasks,
        icon: CalendarClock,
        tone: "amber",
      },
      {
        label: "High priority",
        value: stats.high_priority_tasks,
        icon: Target,
        tone: "rose",
      },
    ],
    [stats]
  );

  useEffect(() => {
    loadDashboard();
  }, [filters.status, filters.priority, filters.search]);

  async function loadDashboard() {
    setLoadingTasks(true);
    try {
      const [taskData, statData] = await Promise.all([
        tasksApi.getAll(filters),
        dashboardApi.stats(),
      ]);
      setTasks(taskData);
      setStats(statData);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoadingTasks(false);
    }
  }

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function beginEdit(task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      due_date: task.due_date ? task.due_date.slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingTask(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      status: editingTask?.status || "pending",
      due_date: toApiDateTime(form.due_date),
    };

    try {
      if (editingTask) {
        await tasksApi.update(editingTask.id, payload);
        showToast("Task updated", "success");
      } else {
        await tasksApi.create(payload);
        showToast("Task created", "success");
      }
      resetForm();
      await loadDashboard();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTaskStatus(task) {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await tasksApi.updateStatus(task.id, nextStatus);
      showToast(nextStatus === "completed" ? "Task completed" : "Task marked pending", "success");
      await loadDashboard();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function removeTask(taskId) {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) {
      return;
    }

    try {
      await tasksApi.remove(taskId);
      showToast("Task deleted", "success");
      await loadDashboard();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function handleLogout() {
    await logout();
    showToast("Logged out successfully", "info");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row compact">
          <div className="brand-mark">
            <ClipboardList size={22} />
          </div>
          <div>
            <h1>TaskFlow</h1>
            <p>Workspace</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <a href="#overview" className="active">
            <BarChart3 size={18} />
            Overview
          </a>
          <a href="#tasks">
            <ClipboardList size={18} />
            Tasks
          </a>
          <a href="#compose">
            <Plus size={18} />
            New task
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-chip">
            <UserRound size={17} />
            <span>{user?.username}</span>
          </div>
          <div className="footer-actions">
            <button
              className="icon-button"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h2>Good to see you, {user?.username}</h2>
          </div>
          <button type="button" className="primary-button" onClick={() => resetForm()}>
            <Plus size={18} />
            New task
          </button>
        </header>

        <section id="overview" className="stats-grid">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <article className={`stat-card tone-${card.tone}`} key={card.label}>
                <div className="stat-icon">
                  <Icon size={20} />
                </div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            );
          })}
        </section>

        <section className="progress-strip">
          <div>
            <span className="eyebrow">Progress overview</span>
            <h3>{stats.completion_rate}% completed</h3>
          </div>
          <div className="progress-track" aria-label="Task completion progress">
            <span style={{ width: `${stats.completion_rate}%` }}></span>
          </div>
          <TrendingUp size={22} aria-hidden="true" />
        </section>

        <section id="compose" className="task-composer">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{editingTask ? "Update task" : "Create task"}</span>
              <h3>{editingTask ? editingTask.title : "Plan the next move"}</h3>
            </div>
            {editingTask && (
              <button type="button" className="ghost-button" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>

          <form className="task-form" onSubmit={handleSubmit}>
            <label className="span-2">
              Title
              <input
                name="title"
                value={form.title}
                onChange={updateForm}
                placeholder="Build authentication module"
                minLength={2}
                required
              />
            </label>
            <label>
              Priority
              <select name="priority" value={form.priority} onChange={updateForm}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label>
              Deadline
              <input
                type="datetime-local"
                name="due_date"
                value={form.due_date}
                onChange={updateForm}
              />
            </label>
            <label className="span-2">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateForm}
                placeholder="Add implementation details or interview talking points"
                rows="4"
              />
            </label>
            <button className="primary-button form-submit" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
            </button>
          </form>
        </section>

        <section id="tasks" className="task-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Task list</span>
              <h3>Work queue</h3>
            </div>
            <div className="filter-bar">
              <div className="search-box">
                <Search size={17} />
                <input
                  value={filters.search}
                  onChange={(event) => updateFilter("search", event.target.value)}
                  placeholder="Search tasks"
                />
              </div>
              <select
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={filters.priority}
                onChange={(event) => updateFilter("priority", event.target.value)}
                aria-label="Filter by priority"
              >
                <option value="all">All priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {loadingTasks ? (
            <TaskSkeleton />
          ) : hasTasks ? (
            <div className="task-grid">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={beginEdit}
                  onDelete={removeTask}
                  onToggleStatus={toggleTaskStatus}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </section>
    </main>
  );
}

function TaskCard({ task, onEdit, onDelete, onToggleStatus }) {
  const dueLabel = task.due_date
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(task.due_date))
    : "No deadline";

  return (
    <article className={`task-card priority-${task.priority.toLowerCase()}`}>
      <div className="task-card-header">
        <button
          className={`check-button ${task.status === "completed" ? "checked" : ""}`}
          type="button"
          onClick={() => onToggleStatus(task)}
          aria-label={task.status === "completed" ? "Mark task pending" : "Mark task completed"}
          title={task.status === "completed" ? "Mark pending" : "Mark completed"}
        >
          <CheckCircle2 size={19} />
        </button>
        <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
      </div>
      <h4>{task.title}</h4>
      <p>{task.description || "No description added."}</p>
      <div className="task-meta">
        <span>
          <CalendarClock size={15} />
          {dueLabel}
        </span>
        <span className={task.status === "completed" ? "status done" : "status"}>
          {task.status}
        </span>
      </div>
      <div className="task-actions">
        <button type="button" className="ghost-button" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button
          type="button"
          className="danger-button"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

function TaskSkeleton() {
  return (
    <div className="task-grid">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="task-card skeleton" key={index}>
          <span></span>
          <strong></strong>
          <p></p>
          <p></p>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <ClipboardList size={48} />
        <span></span>
        <span></span>
      </div>
      <h3>No tasks found</h3>
      <p>Create a task or adjust filters to refresh the queue.</p>
    </div>
  );
}

export default App;
