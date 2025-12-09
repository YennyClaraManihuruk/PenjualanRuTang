import React, { useState } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

// Helper Format Rupiah
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

// Data Mock Keuangan (Disinkronkan dengan Dashboard)
const MOCK_PROFIT_LOSS = [
  { category: 'Pendapatan', items: [
      { name: 'Penjualan Elektronik', value: 63700000000 },
      { name: 'Layanan & Garansi', value: 4200000000 },
  ]},
  { category: 'Harga Pokok Penjualan (HPP)', items: [
      { name: 'Pembelian Barang', value: -38500000000 },
      { name: 'Biaya Logistik Masuk', value: -1200000000 },
  ]},
  { category: 'Beban Operasional', items: [
      { name: 'Gaji Karyawan', value: -4500000000 },
      { name: 'Sewa & Utilitas', value: -850000000 },
      { name: 'Pemasaran', value: -1500000000 },
      { name: 'Penyusutan Aset', value: -350000000 },
  ]}
];

const MOCK_BALANCE_SHEET = {
  assets: [
    { name: 'Kas & Setara Kas', value: 12500000000 },
    { name: 'Piutang Usaha', value: 8400000000 },
    { name: 'Persediaan Barang', value: 27600000000 },
    { name: 'Aset Tetap (Gedung/Kendaraan)', value: 45000000000 },
  ],
  liabilities: [
    { name: 'Utang Usaha', value: 14200000000 },
    { name: 'Utang Bank Jangka Pendek', value: 5000000000 },
    { name: 'Kewajiban Jangka Panjang', value: 25000000000 },
  ],
  equity: [
    { name: 'Modal Saham', value: 30000000000 },
    { name: 'Laba Ditahan', value: 19300000000 },
  ]
};

const Accounting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PL' | 'BS'>('PL');
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);

  // Kalkulasi Real-time
  const totalRevenue = MOCK_PROFIT_LOSS[0].items.reduce((acc, curr) => acc + curr.value, 0);
  const totalCOGS = MOCK_PROFIT_LOSS[1].items.reduce((acc, curr) => acc + curr.value, 0); // Negative
  const grossProfit = totalRevenue + totalCOGS;
  const totalOpex = MOCK_PROFIT_LOSS[2].items.reduce((acc, curr) => acc + curr.value, 0); // Negative
  const netProfit = grossProfit + totalOpex;

  const totalAssets = MOCK_BALANCE_SHEET.assets.reduce((acc, curr) => acc + curr.value, 0);
  const totalLiabilities = MOCK_BALANCE_SHEET.liabilities.reduce((acc, curr) => acc + curr.value, 0);
  const totalEquity = MOCK_BALANCE_SHEET.equity.reduce((acc, curr) => acc + curr.value, 0);

  // Fungsi Generate PDF
  const handleDownloadPDF = () => {
    setIsLoadingPDF(true);
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("LUMINA ERP", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Laporan Keuangan Resmi", 14, 28);
    
    // Title Section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const title = activeTab === 'PL' ? "Laporan Laba Rugi (Profit & Loss)" : "Neraca Keuangan (Balance Sheet)";
    doc.text(title, 14, 40);
    
    doc.setFontSize(10);
    doc.text(`Periode: YTD ${new Date().getFullYear()}`, 14, 46);
    
    // Table Content
    let tableBody = [];
    let startY = 55;

    if (activeTab === 'PL') {
       // P&L Logic
       MOCK_PROFIT_LOSS.forEach(cat => {
           // Category Header Row
           tableBody.push([{ content: cat.category, colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
           cat.items.forEach(item => {
               tableBody.push([item.name, formatRupiah(item.value)]);
           });
       });
       // Summary Rows
       tableBody.push([{ content: "LABA KOTOR", colSpan: 1, styles: { fontStyle: 'bold' } }, { content: formatRupiah(grossProfit), styles: { fontStyle: 'bold' } }]);
       tableBody.push([{ content: "LABA BERSIH", colSpan: 1, styles: { fontStyle: 'bold', fillColor: [220, 255, 220] } }, { content: formatRupiah(netProfit), styles: { fontStyle: 'bold', fillColor: [220, 255, 220] } }]);
    } else {
       // Balance Sheet Logic
       tableBody.push([{ content: "ASET", colSpan: 2, styles: { fillColor: [220, 230, 255], fontStyle: 'bold' } }]);
       MOCK_BALANCE_SHEET.assets.forEach(item => tableBody.push([item.name, formatRupiah(item.value)]));
       tableBody.push([{ content: "Total Aset", colSpan: 1, styles: { fontStyle: 'bold' } }, { content: formatRupiah(totalAssets), styles: { fontStyle: 'bold' } }]);

       tableBody.push([{ content: "", colSpan: 2, styles: { fillColor: [255, 255, 255] } }]); // Spacer

       tableBody.push([{ content: "KEWAJIBAN", colSpan: 2, styles: { fillColor: [255, 220, 220], fontStyle: 'bold' } }]);
       MOCK_BALANCE_SHEET.liabilities.forEach(item => tableBody.push([item.name, formatRupiah(item.value)]));
       tableBody.push([{ content: "Total Kewajiban", colSpan: 1, styles: { fontStyle: 'bold' } }, { content: formatRupiah(totalLiabilities), styles: { fontStyle: 'bold' } }]);

       tableBody.push([{ content: "", colSpan: 2, styles: { fillColor: [255, 255, 255] } }]); // Spacer

       tableBody.push([{ content: "EKUITAS", colSpan: 2, styles: { fillColor: [255, 250, 220], fontStyle: 'bold' } }]);
       MOCK_BALANCE_SHEET.equity.forEach(item => tableBody.push([item.name, formatRupiah(item.value)]));
       tableBody.push([{ content: "Total Ekuitas", colSpan: 1, styles: { fontStyle: 'bold' } }, { content: formatRupiah(totalEquity), styles: { fontStyle: 'bold' } }]);
    }

    autoTable(doc, {
        head: [['Keterangan', 'Nilai (IDR)']],
        body: tableBody,
        startY: startY,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text('Dicetak otomatis oleh Sistem Lumina ERP - ' + new Date().toLocaleString('id-ID'), 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Laporan_${activeTab}_${new Date().toISOString().slice(0,10)}.pdf`);
    setIsLoadingPDF(false);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Akuntansi & Keuangan</h2>
          <p className="text-slate-400 mt-1">Laporan kinerja keuangan perusahaan secara real-time.</p>
        </div>
        
        <div className="flex items-center gap-3">
             <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 flex items-center text-sm text-slate-300">
                <Calendar className="w-4 h-4 mr-2" />
                <span>YTD 2023 (Jan - Okt)</span>
             </div>
             <button 
                onClick={handleDownloadPDF}
                disabled={isLoadingPDF}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all shadow-lg shadow-indigo-900/50"
             >
                <Download className="w-4 h-4 mr-2" />
                {isLoadingPDF ? 'Memproses...' : 'Unduh PDF'}
             </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
          <button 
             onClick={() => setActiveTab('PL')}
             className={`px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center ${activeTab === 'PL' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
             <Activity className="w-4 h-4 mr-2" /> Laba Rugi
          </button>
          <button 
             onClick={() => setActiveTab('BS')}
             className={`px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center ${activeTab === 'BS' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
             <PieChart className="w-4 h-4 mr-2" /> Neraca Keuangan
          </button>
      </div>

      {/* Report Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          {activeTab === 'PL' ? (
              // PROFIT & LOSS VIEW
              <div>
                 <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                     <div>
                         <h3 className="text-lg font-bold text-white">Laporan Laba Rugi (P&L)</h3>
                         <p className="text-xs text-slate-500">Semua angka dalam IDR (Rupiah)</p>
                     </div>
                     <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                         Net Profit: {formatRupiah(netProfit)}
                     </div>
                 </div>
                 
                 <div className="p-6 space-y-8">
                     {MOCK_PROFIT_LOSS.map((category, idx) => (
                         <div key={idx}>
                             <h4 className="text-indigo-400 text-sm font-bold uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">{category.category}</h4>
                             <div className="space-y-2">
                                 {category.items.map((item, i) => (
                                     <div key={i} className="flex justify-between items-center text-sm group hover:bg-slate-800/30 p-1 rounded transition-colors">
                                         <span className="text-slate-300 group-hover:text-white">{item.name}</span>
                                         <span className={`font-medium ${item.value < 0 ? 'text-rose-300' : 'text-slate-200'}`}>
                                            {formatRupiah(item.value)}
                                         </span>
                                     </div>
                                 ))}
                             </div>
                             <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
                                 <span className="text-slate-500 text-xs italic">Subtotal</span>
                                 <span className="text-slate-400 text-sm font-semibold">
                                     {formatRupiah(category.items.reduce((a, b) => a + b.value, 0))}
                                 </span>
                             </div>
                         </div>
                     ))}
                     
                     <div className="mt-8 pt-4 border-t-2 border-slate-700">
                         <div className="flex justify-between items-center text-lg font-bold">
                             <span className="text-white">Laba Kotor</span>
                             <span className="text-white">{formatRupiah(grossProfit)}</span>
                         </div>
                         <div className="flex justify-between items-center text-xl font-bold mt-2 pt-2 border-t border-slate-800">
                             <span className="text-emerald-400">Laba Bersih</span>
                             <span className="text-emerald-400">{formatRupiah(netProfit)}</span>
                         </div>
                     </div>
                 </div>
              </div>
          ) : (
              // BALANCE SHEET VIEW
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-slate-800">
                  {/* Assets */}
                  <div className="p-6">
                      <h3 className="text-lg font-bold text-emerald-400 mb-6 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2" /> ASET
                      </h3>
                      <div className="space-y-3">
                          {MOCK_BALANCE_SHEET.assets.map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-800/30 rounded">
                                  <span className="text-slate-300">{item.name}</span>
                                  <span className="text-white font-medium">{formatRupiah(item.value)}</span>
                              </div>
                          ))}
                      </div>
                      <div className="mt-8 pt-4 border-t border-slate-700 flex justify-between items-center">
                          <span className="text-emerald-400 font-bold">Total Aset</span>
                          <span className="text-white font-bold text-lg">{formatRupiah(totalAssets)}</span>
                      </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="p-6 flex flex-col justify-between">
                      <div>
                          <h3 className="text-lg font-bold text-rose-400 mb-6 flex items-center">
                              <TrendingDown className="w-5 h-5 mr-2" /> KEWAJIBAN
                          </h3>
                          <div className="space-y-3 mb-8">
                              {MOCK_BALANCE_SHEET.liabilities.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-800/30 rounded">
                                      <span className="text-slate-300">{item.name}</span>
                                      <span className="text-white font-medium">{formatRupiah(item.value)}</span>
                                  </div>
                              ))}
                              <div className="pt-2 border-t border-slate-800 flex justify-between">
                                  <span className="text-slate-400 text-xs">Total Kewajiban</span>
                                  <span className="text-slate-200 font-bold">{formatRupiah(totalLiabilities)}</span>
                              </div>
                          </div>

                          <h3 className="text-lg font-bold text-indigo-400 mb-6 flex items-center">
                              <DollarSign className="w-5 h-5 mr-2" /> EKUITAS
                          </h3>
                          <div className="space-y-3">
                              {MOCK_BALANCE_SHEET.equity.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-800/30 rounded">
                                      <span className="text-slate-300">{item.name}</span>
                                      <span className="text-white font-medium">{formatRupiah(item.value)}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                      
                      <div className="mt-8 pt-4 border-t border-slate-700 flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                          <span className="text-indigo-400 font-bold text-sm">Total Kewajiban & Ekuitas</span>
                          <span className="text-white font-bold text-lg">{formatRupiah(totalLiabilities + totalEquity)}</span>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default Accounting;