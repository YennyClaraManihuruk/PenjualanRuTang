import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut, Hexagon, FileBarChart } from 'lucide-react';
import { View } from '../types.ts';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const menuItems = [
    { id: View.DASHBOARD, label: 'Dashboard Eksekutif', icon: LayoutDashboard },
    { id: View.SALES_ORDER, label: 'Pesanan Penjualan', icon: ShoppingCart },
    { id: View.ACCOUNTING, label: 'Keuangan & Akuntansi', icon: FileBarChart },
    { id: 'INVENTORY', label: 'Inventaris (Demo)', icon: Package },
    { id: 'CRM', label: 'CRM (Demo)', icon: Users },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="h-20 flex items-center px-6 border-b border-slate-800">
        <Hexagon className="text-indigo-500 w-8 h-8 mr-3" />
        <h1 className="text-xl font-bold tracking-tight text-white">LUMINA <span className="text-indigo-500">ERP</span></h1>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isClickable = [View.DASHBOARD, View.SALES_ORDER, View.ACCOUNTING].includes(item.id as View);

          return (
            <button
              key={item.id}
              onClick={() => isClickable ? setCurrentView(item.id as View) : null}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${!isClickable ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center px-4 py-2 text-sm font-medium text-slate-400 hover:text-white w-full">
          <Settings className="w-5 h-5 mr-3" />
          Pengaturan
        </button>
        <button className="flex items-center px-4 py-2 mt-2 text-sm font-medium text-slate-400 hover:text-red-400 w-full">
          <LogOut className="w-5 h-5 mr-3" />
          Keluar
        </button>
      </div>
    </div>
  );
};

export default Sidebar;