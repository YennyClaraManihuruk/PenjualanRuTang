import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SalesOrder from './components/SalesOrder';
import Accounting from './components/Accounting';
import VoiceAgent from './components/VoiceAgent';
import { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD); // Changed default to Dashboard for better first impression

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard />;
      case View.SALES_ORDER:
        return <SalesOrder />;
      case View.ACCOUNTING:
        return <Accounting />;
      default:
        return <Dashboard />;
    }
  };

  // Generate dynamic context for the AI based on the active view
  const getContextDescription = useMemo(() => {
    if (currentView === View.DASHBOARD) {
      return "Pengguna sedang melihat Dashboard Eksekutif. Data kunci: Pendapatan YTD Rp 63.7 Miliar (naik 12.5% vs anggaran), DSO 42 hari (lambat), Perputaran Stok 8.2x (sehat). Ada grafik variansi penjualan bulanan dan heatmap kesehatan inventaris yang menunjukkan beberapa barang menumpuk.";
    } else if (currentView === View.SALES_ORDER) {
      return "Pengguna sedang berada di halaman Pembuatan Pesanan Penjualan (Sales Order). Halaman ini memiliki pencarian pelanggan di kiri, tabel input barang di tengah, dan ringkasan harga di kanan. Pengguna bisa menambah barang, melihat stok real-time, dan membuat faktur.";
    } else if (currentView === View.ACCOUNTING) {
      return "Pengguna sedang melihat Laporan Keuangan. Halaman ini menampilkan Laba Rugi (Profit & Loss) dan Neraca (Balance Sheet). Data mencakup Pendapatan Rp 63M+, HPP Rp 39M+, dengan Laba Bersih sekitar Rp 18M. Terdapat fitur untuk mengunduh laporan dalam format PDF.";
    }
    return "Pengguna sedang menjelajahi menu aplikasi ERP.";
  }, [currentView]);

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans text-slate-200 overflow-hidden selection:bg-indigo-500/30">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="flex-1 ml-64 h-full relative overflow-hidden">
        {/* Background Gradients for High-End Feel */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none z-0" />
        
        <div className="relative z-10 h-full overflow-y-auto">
          {renderContent()}
        </div>

        {/* AI Voice Agent Overlay */}
        <VoiceAgent contextDescription={getContextDescription} />
      </main>
    </div>
  );
};

export default App;