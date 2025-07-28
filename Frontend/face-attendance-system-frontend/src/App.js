import React, { useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage'; // Import HomePage
import AdminDashboard from './pages/AdminDashboard';
import CameraStream from './components/CameraStream';
import LoginPage from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ManageSubjectsTeachers from './pages/ManageSubjectsTeachers';
import TakeAttendance from './pages/TakeAttendance';
import ManageTeachers from './pages/ManageTeachers';
import ManageStudents from './pages/ManageStudents';
import ManageSubjectsAdmins from './pages/ManageSubjectsAdmins';
import FaceRegistration from './pages/RegisterFace';
import About from './pages/AboutPage';
import Features from './pages/FeaturesPage';
import Contact from './pages/ContactPage';

import { postData, getData } from './services/api';

const App = () => {
  // State to manage authentication status and user role
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState('');

  const handleLogin = (userRole) => {
    console.log('Logging in with role:', userRole); // Log role on login
    setIsAuthenticated(true);
    setRole(userRole);
  };

  const handleLogout = async (e) => {
    console.log('Logging out...'); // Log when logout is triggered
    setIsAuthenticated(false);
    setRole('');
  };

  console.log('Current authentication status:', isAuthenticated); // Log authentication status
  console.log('Current user role:', role); // Log user role

  return (
    <Router>
      {/* Pass role, isAuthenticated, and onLogout to Navbar */}
      <Navbar role={role} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <Routes>
        {/* Default HomePage */}
        <Route path="/" element={<HomePage />} />

        {/* Other Routes */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/manage-teachers" element={<ManageTeachers />} />
        <Route path="/manage-students" element={<ManageStudents />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/manage-subjects-teachers" element={<ManageSubjectsTeachers />} />
        <Route path="/manage-subjects-admins" element={<ManageSubjectsAdmins />} />
        <Route path="/take-attendance" element={<TakeAttendance />} />
        <Route path="/face-registration" element={<FaceRegistration />} />
        <Route path="/camera" element={<CameraStream />} /> {/* Camera stream route */}
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
};

export default App;
