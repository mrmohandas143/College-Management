# College Management System

A full-stack web application for managing college operations including students, faculty, fees, departments, and analytics — built with Django REST Framework and React.

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.14 | Runtime |
| Django | 6.0.4 | Web framework |
| Django REST Framework | 3.17.1 | API layer |
| djangorestframework-simplejwt | 5.5.1 | JWT authentication |
| django-cors-headers | 4.9.0 | CORS handling |
| SQLite | Built-in | Database |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.5 | UI framework |
| Vite | 8.0.10 | Build tool |
| React Router DOM | 7.15.0 | Client-side routing |
| Axios | 1.16.0 | HTTP client |
| Recharts | 3.8.1 | Charts & analytics |
| jwt-decode | 4.0.0 | JWT token decoding |
| jsPDF + jspdf-autotable | 4.2.1 | PDF receipt generation |

---

## Project Structure

```
college-management/
├── backend/
│   ├── accounts/          # User auth, JWT, role management
│   ├── students/          # Student CRUD + seed command
│   ├── faculty/           # Faculty CRUD
│   ├── fees/              # Fee management, structures, scholarships
│   ├── dashboard/         # Analytics summary API
│   ├── departments/       # Department management
│   └── config/            # Django settings, URLs
│
└── frontend/
    └── src/
        ├── api/           # Axios instance + endpoints
        ├── components/    # Sidebar, Navbar, Loader, ProtectedRoute
        ├── context/       # AuthContext (JWT state)
        ├── hooks/         # useAuth hook
        ├── layouts/       # DashboardLayout, AuthLayout
        ├── pages/
        │   ├── auth/      # Login, Register
        │   ├── dashboard/ # Admin dashboard with charts
        │   ├── students/  # StudentList, AddStudent, EditStudent, MyProfile
        │   ├── faculty/   # FacultyList, AddFaculty, EditFaculty, FacultyProfile
        │   └── fees/      # FeeList, AddFee, FeeStructure, PaymentHistory, StudentPayFee
        ├── routes/        # AppRoutes with role-based guards
        ├── services/      # API service functions
        └── utils/         # Constants, helpers
```

---

## Features

### Role-Based Access Control
Three user roles with different permissions:

| Feature | Admin | Faculty | Student |
|---------|-------|---------|---------|
| Dashboard (charts, analytics) | Full | Redirected to profile | Redirected to profile |
| View all students | Yes | Department only | Own profile only |
| Add/Edit students | Yes | Yes | No |
| Delete students | Yes | Yes | No |
| View faculty | Yes | Own profile | No |
| Add/Edit/Delete faculty | Yes | No | No |
| Fee management | Full | No | View own fees |
| Fee structure | Yes | No | View own course |
| Payment history | Yes | No | No |
| Pay fees | No | No | Yes (self-service) |

---

### Admin Features
- Full dashboard with real-time charts:
  - College growth (area chart by month)
  - Students by course (bar chart)
  - Student status pie chart
  - Department-wise breakdown
  - Fee status pie chart
- Manage all students, faculty, fees
- Add faculty → auto-generates login credentials → sends via email
- Fee structure management per course/semester
- Payment history with PDF export
- Mark fees as paid
- Scholarship management

### Faculty Features
- Redirected to own Faculty Profile on login
- Views only students from their department/course
- Student stats: total, active, inactive, avg CGPA, avg attendance
- Year-wise and gender-wise student breakdown
- Can add/delete students in their department

### Student Features
- My Profile page with tabs:
  - **Details** — personal info, course, year, register number
  - **Attendance** — subject-wise attendance with progress bars
  - **Marks** — internal/external marks with grade calculation
  - **Fees** — fee records + Pay Fee button
- Self-service fee payment with receipt PDF download
- Fee structure shown based on enrolled course

---

## API Endpoints

### Authentication
```
POST /api/accounts/login/                  # JWT login
POST /api/accounts/register/               # Register user
POST /api/accounts/refresh/                # Refresh JWT token
POST /api/accounts/send-faculty-credentials/  # Send login email to faculty
POST /api/accounts/change-password/        # Change password
POST /api/accounts/create-student-account/ # Create student login
```

### Students
```
GET    /api/students/          # List all students (search supported)
POST   /api/students/          # Create student
GET    /api/students/:id/      # Get student detail
PUT    /api/students/:id/      # Update student
DELETE /api/students/:id/      # Delete student
```

### Faculty
```
GET    /api/faculty/           # List all faculty
POST   /api/faculty/           # Create faculty
GET    /api/faculty/:id/       # Get faculty detail
PUT    /api/faculty/:id/       # Update faculty
DELETE /api/faculty/:id/       # Delete faculty
```

### Fees
```
GET    /api/fees/              # List fees
POST   /api/fees/              # Create fee record
GET    /api/fees/:id/          # Get fee detail
PUT    /api/fees/:id/          # Update fee
DELETE /api/fees/:id/          # Delete fee
GET    /api/fees/structures/   # Fee structures
POST   /api/fees/structures/   # Create fee structure
GET    /api/fees/analytics/    # Fee analytics
```

### Dashboard
```
GET /api/dashboard/            # Summary stats (role-filtered)
```

---

## Database Models

### User
- `username`, `email`, `role` (admin/student/faculty)
- `student` (OneToOne link to Student)

### Student
- Personal: `first_name`, `last_name`, `email`, `phone`, `gender`, `date_of_birth`, `address`
- Academic: `course`, `department`, `year`, `register_number`, `cgpa`, `attendance_percentage`
- `status` (active/inactive)

### Faculty
- Personal: `first_name`, `last_name`, `email`, `phone`
- Academic: `department`, `course`, `designation`, `qualification`, `experience`
- `status` (active/inactive)

### Fee
- `student` (FK), `fee_type`, `amount`, `discount_amount`, `fine_amount`, `net_amount`
- `due_date`, `paid_date`, `status` (paid/pending/overdue/partial)
- `payment_mode`, `transaction_id`, `receipt_number`

### FeeStructure
- `name`, `fee_type`, `amount`, `course`, `department`, `semester`, `academic_year`

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py shell -c "
from accounts.models import User
User.objects.create_superuser(username='admin', email='admin@college.edu', password='admin123', role='admin')
"

# Seed sample data (6 departments, 10 faculty each, 20 students each)
python manage.py seed_data

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api |
| Django Admin | http://localhost:8000/admin |

---

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Faculty | Sent via email on creation | Auto-generated |
| Student | Register number | Set by admin |

---

## Faculty Login Flow

1. Admin adds faculty → system auto-generates username (`firstname.lastname`) and strong password
2. Credentials are sent to faculty's registered email
3. Faculty logs in using **Faculty** tab with username + password
4. Faculty is redirected to their profile showing only their department's students

---

## Student Fee Payment Flow

1. Student logs in → goes to **My Profile** → **Fees** tab
2. Clicks **View Fee Details** → sees fee structure for their course
3. Selects a fee type → enters payment mode + transaction ID
4. Clicks **Pay** → fee recorded in backend
5. Downloads PDF receipt
6. Admin can see the payment in **Fees** and **Payment History**

---

## Seeded Data

Running `python manage.py seed_data` creates:

| Department | HOD | Faculty | Lecturers | Students |
|-----------|-----|---------|-----------|---------|
| Computer Science | 1 | 6 | 3 | 20 |
| Electronics | 1 | 6 | 3 | 20 |
| Mechanical | 1 | 6 | 3 | 20 |
| Mathematics | 1 | 6 | 3 | 20 |
| Commerce | 1 | 6 | 3 | 20 |
| Management | 1 | 6 | 3 | 20 |
| **Total** | **6** | **36** | **18** | **120** |

---

## Email Configuration

Currently set to **console backend** (emails print to terminal).

To enable real email delivery, update `backend/config/settings.py`:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your@gmail.com'
EMAIL_HOST_PASSWORD = 'your_gmail_app_password'
DEFAULT_FROM_EMAIL = 'CollegeMS <your@gmail.com>'
```

Generate a Gmail App Password at: https://myaccount.google.com/apppasswords

---

## GitHub Repository

https://github.com/mrmohandas143/College-Management.git


## License

This repository is publicly available for viewing only.

All rights reserved. No use, copying, modification, or distribution is
permitted without explicit written permission from the author.
