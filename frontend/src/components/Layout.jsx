import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} transition-all`}>
        <Navbar />
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
