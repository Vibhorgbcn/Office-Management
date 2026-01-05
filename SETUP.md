# Setup Guide

## Quick Start

1. **Install Dependencies**

   From the root directory:
   ```bash
   npm install
   cd server
   npm install
   cd ../client
   npm install
   ```

2. **Configure Environment**

   Create `server/.env`:
   ```env
   PORT=5006
   MONGODB_URI=mongodb://localhost:27017/office-management
   JWT_SECRET=your_secret_key_here_change_in_production
   NODE_ENV=development
   ```

3. **Start MongoDB**

   Make sure MongoDB is running on your system.

4. **Create Admin User**

   From the `server` directory:
   ```bash
   npm run seed:admin
   ```

   This creates a default admin account:
   - Email: `admin@office.com`
   - Password: `admin123`

   **Important**: Change the password after first login!

5. **Run the Application**

   From the root directory:
   ```bash
   npm run dev
   ```

   This starts both the backend server (port 5006) and frontend (port 3006).

   Or run separately:

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

6. **Access the Application**

   Open your browser and navigate to: `http://localhost:3006`

   Login with the admin credentials created in step 4.

## Creating Additional Users

After logging in as admin, you can create additional users (both admin and employees) through the application. However, the initial admin user must be created using the seed script.

## Features Overview

### Admin Features:
- Create and manage cases
- Assign cases to employees
- Generate bills automatically based on client type
- View all attendance records
- Create work assignments
- Manage users

### Employee Features:
- Check in/out (biometric attendance)
- View assigned cases
- View and update work assignments
- Track work delivery days

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is installed and running
- Check the MONGODB_URI in `server/.env`
- For MongoDB Atlas, use the connection string from your cluster

### Port Already in Use
- Change the PORT in `server/.env`
- Or kill the process using the port

### Module Not Found
- Make sure all dependencies are installed
- Try deleting `node_modules` and reinstalling

## Production Deployment

Before deploying to production:

1. Change `JWT_SECRET` to a strong random string
2. Update `MONGODB_URI` to your production database
3. Set `NODE_ENV=production`
4. Build the frontend: `cd client && npm run build`
5. Serve the build folder with a web server or configure your backend to serve it

