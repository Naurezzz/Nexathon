import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search scans, reports, history..."
          className="bg-gray-700 text-white px-4 py-2 rounded-lg w-96 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          Upload
        </button>
        
        <button className="text-gray-400 hover:text-white relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </button>
        
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3"
          >
            <div className="text-right">
              <p className="text-white font-medium">{user?.fullName}</p>
              <p className="text-gray-400 text-sm">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.fullName?.charAt(0)}
            </div>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-2 z-50">
              <button onClick={() => navigate('/settings/profile')} className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700">
                My Profile
              </button>
              <button onClick={() => navigate('/settings')} className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700">
                Settings
              </button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
