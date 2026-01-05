# Office Management Application

A comprehensive office management system designed for a criminal lawyer's office, featuring biometric attendance, case management, work assignments, and automated bill generation.

## Features

### General Features
1. **Bio-Matrix Attendance System**
   - Check-in/Check-out functionality
   - Work hours calculation
   - Attendance history tracking

2. **Work Assignment System**
   - Time-based work assignments
   - Delivery days tracking
   - Assignment status management

3. **Case Management**
   - Create and manage cases
   - Assign cases to employees
   - Track case status and details
   - Support for multiple courts (National Criminal Court, Supreme Court, etc.)
   - Case types: Criminal, Environment Law, Civil, Constitutional

4. **Delivery Tracking**
   - Track work completion in days
   - Monitor assignment progress

### Admin Features

1. **Automated Bill Generation**
   - Automatic bill generation based on:
     - Client type (Regular, Known, Government, Corporate)
     - Fee structure (Hourly, Fixed, Contingency, Retainer)
   - Different fee rates for different client types
   - Automatic tax calculation (18% GST)
   - Bill number auto-generation

2. **Case Assignment**
   - View all cases
   - Assign cases to employees
   - Manage case status

3. **User Management**
   - Create and manage employees
   - Set employee roles and designations

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, Material-UI (MUI)
- **Authentication**: JWT (JSON Web Tokens)

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository** (or navigate to project directory)

2. **Install root dependencies**:
   ```bash
   npm install
   ```

3. **Install backend dependencies**:
   ```bash
   cd server
   npm install
   ```

4. **Install frontend dependencies**:
   ```bash
   cd ../client
   npm install
   ```

5. **Configure environment variables**:
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5006
   MONGODB_URI=mongodb://localhost:27017/office-management
   JWT_SECRET=your_secret_key_here_change_in_production
   NODE_ENV=development
   ```

   Create a `.env` file in the `client` directory (optional):
   ```env
   PORT=3006
   REACT_APP_API_URL=http://localhost:5006/api
   ```

6. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

7. **Run the application**:

   **Option 1: Run both server and client together** (from root directory):
   ```bash
   npm run dev
   ```

   **Option 2: Run separately**:
   
   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd client
   npm start
   ```

## Default Admin Account

After setting up the database, you'll need to create an admin account. You can do this by:

1. Using MongoDB Compass or mongo shell to insert an admin user directly
2. Or creating a seed script to initialize an admin user

To create an admin user manually, insert a document in the `users` collection with:
- `role: "admin"`
- Email and password (password will be hashed automatically)
- Other required fields

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register user (Admin only)
- `GET /api/auth/me` - Get current user

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/my-attendance` - Get my attendance
- `GET /api/attendance/all` - Get all attendance (Admin)

### Cases
- `GET /api/cases` - Get cases
- `POST /api/cases` - Create case (Admin)
- `GET /api/cases/:id` - Get single case
- `PUT /api/cases/:id/assign` - Assign case (Admin)
- `PUT /api/cases/:id` - Update case

### Work Assignments
- `GET /api/work-assignments` - Get assignments
- `POST /api/work-assignments` - Create assignment (Admin)
- `PUT /api/work-assignments/:id/status` - Update status
- `POST /api/work-assignments/:id/log` - Add work log

### Bills
- `POST /api/bills/generate` - Generate bill (Admin)
- `GET /api/bills` - Get all bills (Admin)
- `GET /api/bills/fee-rates` - Get fee rates (Admin)
- `PUT /api/bills/:id` - Update bill (Admin)

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/employees` - Get employees (Admin)

## Fee Structure

The system automatically calculates bills based on client type:

- **Regular Clients**: Standard rates
- **Known Clients**: Reduced rates
- **Government**: Premium rates
- **Corporate**: Premium rates

Each client type has different rates for:
- Hourly billing
- Fixed fee
- Contingency (percentage-based)
- Retainer

## Project Structure

```
office-management/
├── server/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   └── index.js         # Server entry point
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   └── App.js       # Main App component
│   └── public/
└── README.md
```

## Notes

- The application is designed for a criminal lawyer's office
- Supports cases in National Criminal Court and Supreme Court
- Handles both Criminal and Environment Law cases
- All bills are generated automatically based on client type and fee structure
- Employees can only see cases assigned to them
- Admin has full access to all features

## License

ISC

