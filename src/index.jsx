import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { AttendanceProvider } from './context/AttendanceContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <TaskProvider>
        <AttendanceProvider>
          <App />
        </AttendanceProvider>
      </TaskProvider>
    </AuthProvider>
  </BrowserRouter>
);

