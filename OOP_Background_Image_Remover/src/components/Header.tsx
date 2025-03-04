import React from 'react';
import { Camera, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Camera size={28} />
          <span className="text-xl font-bold">ID Photo Processor</span>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="hover:text-indigo-200 transition-colors">Home</Link>
          <Link to="/process" className="hover:text-indigo-200 transition-colors">Process Photos</Link>
          <Link to="/batch" className="hover:text-indigo-200 transition-colors">Batch Processing</Link>
          <Link to="/history" className="hover:text-indigo-200 transition-colors">History</Link>
        </nav>
        
        <button className="md:hidden">
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
};

export default Header;