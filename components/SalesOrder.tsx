import React, { useState, useEffect } from 'react';
import { Customer, LineItem, Product, OrderSummary } from '../types.ts';
import { Search, Plus, Trash2, Save, FileText, Truck, CreditCard, Box, Zap, User } from 'lucide-react';
import { getStrategicInsight } from '../services/geminiService.ts';

// --- MOCK DATA ---
const MOCK_CUSTOMERS: Customer[] = [
  { id: 'C001', name: 'Hartono Electronics', company: 'PT. Hartono Raya', email: 'purchase@hartono.com', creditLimit: 750000000, currentBalance: 180000000, dso: 28, status: 'VIP', lastOrderDate: '2023-10-15' },
  { id: 'C002', name: 'Glodok Makmur', company: 'CV. Glodok Makmur', email: 'boss@glodok.com', creditLimit: 150000000, currentBalance: 142000000, dso: 65, status: 'Risk', lastOrderDate: '2023-09-01' },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'P001', sku: 'TV-SAMSUNG-55', name: 'Samsung 55" 4K OLED TV', category: 'TV', price: 18500000, stock: 45, warehouse: 'Jakarta', minStock: 10 },
  { id: 'P002', sku: 'REF-LG-2DR', name: 'LG 2-Door Refrigerator Inverter', category: 'Home Appliance', price: 12000000, stock: 12, warehouse: 'Jakarta', minStock: 5 },
  { id: 'P003', sku: 'AUD-SONY-XM5', name: 'Sony WH-1000XM5 Headphones', category: 'Audio', price: 5200000, stock: 120, warehouse: 'Surabaya', minStock: 20 },
  { id: 'P004', sku: 'WM-SHARP-10KG', name: 'Sharp Washing Machine 10KG', category: 'Home Appliance', price: 6000000, stock: 2, warehouse: 'Jakarta', minStock: 8 },
];

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

const SalesOrder: React.FC = () => {
  // State
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [summary, setSummary] = useState<OrderSummary>({ subtotal: 0, tax: 0, shipping: 500000, discountTotal: 0, grandTotal: 0 });
  const [aiSuggestion, setAiSuggestion] = useState<string>('');

  // Handlers
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.company);
    setShowCustomerDropdown(false);
    // Simulate AI suggestion trigger
    getStrategicInsight(customer, 'SALES').then(setAiSuggestion);
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      total: 0,
      stockStatus: 'Out of Stock'
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(items => items.map(item => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };
      
      // Auto-populate product details if searching
      if (field === 'productName') {
         const product = MOCK_PRODUCTS.find(p => p.name.toLowerCase().includes(String(value).toLowerCase()) || p.sku.toLowerCase().includes(String(value).toLowerCase()));
         if (product) {
             updatedItem.productId = product.id;
             updatedItem.unitPrice = product.price;
             updatedItem.stockStatus = product.stock < 5 ? 'Low Stock' : (product.stock === 0 ? 'Out of Stock' : 'In Stock');
         }
      }

      // Recalculate total
      if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
        const qty = field === 'quantity' ? Number(value) : updatedItem.quantity;
        const price = field === 'unitPrice' ? Number(value) : updatedItem.unitPrice;
        const disc = field === 'discount' ? Number(value) : updatedItem.discount;
        updatedItem.total = (qty * price) * (1 - disc / 100);
      }
      return updatedItem;
    }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(items => items.filter(i => i.id !== id));
  };

  // Effect: Calculate Totals
  useEffect(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.11; // 11% PPN
    const shipping = subtotal > 0 ? 500000 : 0; // Flat shipping IDR 500k if items exist
    const discountTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.discount/100)), 0);
    
    setSummary({
      subtotal,
      tax,
      shipping,
      discountTotal,
      grandTotal: subtotal + tax + shipping
    });
  }, [lineItems]);

  return (
    <div className="flex h-full bg-slate-950">
      {/* LEFT COLUMN - Customer & Context (30%) */}
      <div className="w-1/3 border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-white flex items-center">
            <User className="mr-2 text-indigo-500" /> Pelanggan
        </h2>
        
        {/* Customer Search */}
        <div className="relative">
            <label className="text-xs text-slate-400 font-semibold uppercase mb-1 block">Cari Pelanggan</label>
            <div className="relative">
                <input 
                    type="text" 
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    placeholder="Ketik Nama Perusahaan..."
                />
                <Search className="absolute right-3 top-3 text-slate-500 w-5 h-5" />
            </div>
            {showCustomerDropdown && (
                <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 shadow-xl z-50">
                    {MOCK_CUSTOMERS.filter(c => c.company.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                        <div key={c.id} onClick={() => handleCustomerSelect(c)} className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0">
                            <div className="text-white font-medium">{c.company}</div>
                            <div className="text-xs text-slate-400">{c.email}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Customer KPI Card */}
        {selectedCustomer && (
            <div className={`p-5 rounded-xl border ${selectedCustomer.status === 'Risk' ? 'bg-rose-900/10 border-rose-800/30' : 'bg-slate-900 border-slate-700'} transition-all`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-white font-bold text-lg">{selectedCustomer.company}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${selectedCustomer.status === 'VIP' ? 'bg-gold-500/20 text-gold-500' : 'bg-slate-700 text-slate-300'}`}>
                            Pelanggan {selectedCustomer.status}
                        </span>
                    </div>
                    <div className="text-right">
                         <div className="text-xs text-slate-500">Order Terakhir</div>
                         <div className="text-sm text-slate-300">{selectedCustomer.lastOrderDate}</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Limit Kredit</div>
                        <div className="text-sm font-semibold text-white">{formatRupiah(selectedCustomer.creditLimit)}</div>
                        <div className="w-full bg-slate-700 h-1.5 mt-1 rounded-full">
                            <div className={`h-1.5 rounded-full ${selectedCustomer.status === 'Risk' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${(selectedCustomer.currentBalance / selectedCustomer.creditLimit) * 100}%` }}></div>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{formatRupiah(selectedCustomer.creditLimit - selectedCustomer.currentBalance)} Tersedia</div>
                    </div>
                    <div>
                         <div className="text-xs text-slate-500 uppercase tracking-wider">DSO</div>
                         <div className={`text-sm font-semibold ${selectedCustomer.dso > 45 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {selectedCustomer.dso} Hari
                         </div>
                         <div className="text-xs text-slate-400 mt-1">Rata-rata Bayar</div>
                    </div>
                </div>
            </div>
        )}

        {/* AI Sales Assistant */}
        {aiSuggestion && (
             <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl flex gap-3">
                <Zap className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                    <h4 className="text-indigo-400 text-xs font-bold uppercase mb-1">Asisten Penjualan AI</h4>
                    <p className="text-indigo-100 text-sm italic">"{aiSuggestion}"</p>
                </div>
             </div>
        )}

        {/* Order Header Fields */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
                <label className="text-xs text-slate-400 block mb-1">Tanggal Pesanan</label>
                <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-indigo-500" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
                <label className="text-xs text-slate-400 block mb-1">Gudang Asal</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-indigo-500">
                    <option>HQ Jakarta (Utama)</option>
                    <option>Hub Surabaya</option>
                </select>
            </div>
             <div>
                <label className="text-xs text-slate-400 block mb-1">Syarat Pembayaran</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-indigo-500">
                    <option>Net 30</option>
                    <option>Langsung</option>
                    <option>Net 60</option>
                </select>
            </div>
        </div>
      </div>

      {/* CENTER - Line Items (50%) */}
      <div className="w-1/2 flex flex-col p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white">Line Items</h2>
             <button onClick={addLineItem} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                <Plus className="w-4 h-4 mr-2" /> Tambah Barang
             </button>
        </div>

        <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-5">Detail Barang (SKU/Nama)</div>
                <div className="col-span-2 text-center">Jml</div>
                <div className="col-span-2 text-right">Harga Satuan</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {lineItems.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <Box className="w-12 h-12 mb-2 opacity-50" />
                        <p>Belum ada barang ditambahkan.</p>
                    </div>
                )}
                {lineItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 p-3 bg-slate-800/50 rounded-lg items-center border border-slate-700/50 hover:border-slate-600 transition-all group">
                         <div className="col-span-5 relative">
                             <input 
                                type="text" 
                                placeholder="Cari Barang..." 
                                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-slate-600 font-medium"
                                value={item.productName}
                                onChange={(e) => updateLineItem(item.id, 'productName', e.target.value)}
                             />
                             {/* Stock Indicator */}
                             {item.productId && (
                                <div className="flex items-center mt-1 space-x-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                        item.stockStatus === 'In Stock' ? 'bg-emerald-500/20 text-emerald-400' :
                                        item.stockStatus === 'Low Stock' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-rose-500/20 text-rose-400'
                                    }`}>
                                        {item.stockStatus === 'In Stock' ? 'Ada Stok' : (item.stockStatus === 'Low Stock' ? 'Stok Menipis' : 'Stok Habis')}
                                    </span>
                                    <span className="text-[10px] text-slate-500">{item.productId}</span>
                                </div>
                             )}
                         </div>
                         <div className="col-span-2">
                             <input 
                                type="number" 
                                className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-center text-white text-sm focus:ring-1 focus:ring-indigo-500"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                                min="1"
                             />
                         </div>
                         <div className="col-span-2">
                              <input 
                                type="number" 
                                className="w-full bg-transparent text-right text-white text-sm focus:outline-none"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value)}
                             />
                         </div>
                         <div className="col-span-2 text-right font-bold text-white text-sm truncate">
                             {formatRupiah(item.total)}
                         </div>
                         <div className="col-span-1 text-center">
                             <button onClick={() => removeLineItem(item.id)} className="text-slate-600 hover:text-rose-500 transition-colors">
                                 <Trash2 className="w-4 h-4" />
                             </button>
                         </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* RIGHT - Summary & Actions (20%) */}
      <div className="w-1/5 bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between">
         <div>
             <h3 className="text-lg font-bold text-white mb-6">Ringkasan Pesanan</h3>
             
             <div className="space-y-4 text-sm">
                 <div className="flex justify-between text-slate-400">
                     <span>Subtotal</span>
                     <span className="text-white">{formatRupiah(summary.subtotal)}</span>
                 </div>
                 <div className="flex justify-between text-slate-400">
                     <span>Diskon</span>
                     <span className="text-emerald-400">-{formatRupiah(summary.discountTotal)}</span>
                 </div>
                 <div className="flex justify-between text-slate-400">
                     <span>PPN (11%)</span>
                     <span className="text-white">{formatRupiah(summary.tax)}</span>
                 </div>
                 <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-4">
                     <span>Ongkir (Est.)</span>
                     <span className="text-white">{formatRupiah(summary.shipping)}</span>
                 </div>
                 
                 <div className="flex flex-col items-end pt-2">
                     <span className="font-bold text-slate-200 mb-1">Total Akhir</span>
                     <span className="font-bold text-xl text-white">{formatRupiah(summary.grandTotal)}</span>
                 </div>
             </div>

             <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                 <div className="flex items-center text-xs text-slate-400 mb-2">
                     <Truck className="w-3 h-3 mr-2" /> Est. Pengiriman
                 </div>
                 <div className="text-white font-medium text-sm">28 Okt 2023 - 30 Okt 2023</div>
             </div>
         </div>

         <div className="space-y-3">
             <button className="w-full py-3 bg-transparent border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 rounded-lg font-medium text-sm flex items-center justify-center transition-all">
                 <FileText className="w-4 h-4 mr-2" /> Simpan Draf
             </button>
             <button className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-900/50 flex items-center justify-center transition-all">
                 <CreditCard className="w-5 h-5 mr-2" /> Buat Faktur
             </button>
         </div>
      </div>
    </div>
  );
};

export default SalesOrder;