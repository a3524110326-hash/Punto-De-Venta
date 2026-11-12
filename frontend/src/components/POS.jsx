import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Scan, LayoutGrid, Smartphone, Tag, ShoppingBag, Box, Plus, Layers, Store, UserCheck, Trash2, ShoppingCart, Minus, Banknote, CreditCard, Wallet, ArrowLeftRight, CheckCircle, PlusCircle, Edit2, Save, BarChart3, DollarSign, TrendingUp, Receipt } from 'lucide-react';
import Swal from 'sweetalert2';
import { ReceiptTemplate } from './ReceiptTemplate';

const CATEGORIES = ['Todo', 'Electrónica', 'Ropa', 'Abarrotes'];
const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'credito', label: 'T. Crédito', icon: CreditCard },
  { id: 'debito', label: 'T. Débito', icon: Wallet },
  { id: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight }
];

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
};

export default function POS() {
  // --- NAVEGACIÓN ENTRE VISTAS ---
  const [activeView, setActiveView] = useState('pos'); // 'pos' o 'dashboard'
  const [lastSale, setLastSale] = useState(null); // <--- CORREGIDO: Movido adentro del componente

  // --- ESTADOS DE POS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const [cart, setCart] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('efectivo');
  const [lastAddedSku, setLastAddedSku] = useState(null);
  const searchInputRef = useRef(null);

  // --- ESTADOS DE PRODUCTOS Y VENTAS ---
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // --- ESTADOS DEL CRUD (MODAL) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '', name: '', category: 'Electrónica', base_price: '', stock: ''
  });

  // --- PETICIONES AL BACKEND ---
  const fetchProducts = () => {
    fetch('http://localhost:3000/api/products')
      .then(response => response.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(error => console.error('Error al cargar productos:', error));
  };

  const fetchSalesHistory = async () => {
    setLoadingSales(true);
    try {
      const response = await fetch('http://localhost:3000/api/sales');
      const data = await response.json();
      setSalesHistory(data.data || []);
    } catch (error) {
      console.error('Error al cargar el historial de ventas:', error);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSwitchView = (view) => {
    setActiveView(view);
    if (view === 'dashboard') {
      fetchSalesHistory();
    }
  };

  // --- FUNCIONES DEL CRUD DE PRODUCTOS ---
  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        name: product.name,
        category: product.category,
        base_price: product.base_price,
        stock: product.stock
      });
    } else {
      setEditingProduct(null);
      setFormData({ sku: '', name: '', category: 'Electrónica', base_price: '', stock: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditing = Boolean(editingProduct);
    const url = isEditing 
      ? `http://localhost:3000/api/products/${editingProduct._id}`
      : `http://localhost:3000/api/products`;
    
    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        fetchProducts();
        handleCloseModal();
        Swal.fire({
          title: '¡Guardado!',
          text: isEditing ? 'Producto actualizado con éxito.' : 'Nuevo producto registrado.',
          icon: 'success',
          confirmButtonColor: '#059669',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); 
    
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      text: "Esta acción borrará el producto de la base de datos.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#e11d48',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:3000/api/products/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchProducts();
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El producto ha sido borrado.',
            icon: 'success',
            confirmButtonColor: '#059669',
            timer: 1500,
            showConfirmButton: false
          });
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  // --- LÓGICA DEL POS ---
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'Todo' || product.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, products]);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.product.base_price * item.quantity), 0), [cart]);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product._id === product._id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        if (updated[existingIndex].quantity < product.stock) {
          updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
        }
        return updated;
      } else {
        return [{ product, quantity: 1 }, ...prev];
      }
    });
    setLastAddedSku(product.sku);
    setTimeout(() => setLastAddedSku(null), 800);
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product._id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const handleRemoveItem = (productId) => setCart(prev => prev.filter(item => item.product._id !== productId));
  
  const handleClearCart = async () => { 
    if (cart.length === 0) return;
    const result = await Swal.fire({
      title: '¿Vaciar el ticket?',
      text: "Se quitarán todos los artículos actuales.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#e11d48',
      confirmButtonText: 'Sí, vaciar',
      cancelButtonText: 'Seguir cobrando'
    });
    if (result.isConfirmed) setCart([]); 
  };
  
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const salePayload = {
      receipt_folio: `TK-${Math.floor(Math.random() * 1000000)}`,
      cashier_id: "CAJERO-01",
      items: cart.map(item => ({
        product_id: item.product._id,
        sku: item.product.sku,
        name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.base_price,
        subtotal: item.product.base_price * item.quantity
      })),
      subtotal_amount: subtotal,
      tax_amount: iva,
      total_amount: total,
      payment_method: selectedPayment
    };

    try {
      const response = await fetch('http://localhost:3000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      });

      if (response.ok) {
  setLastSale(salePayload); // Esto abre automáticamente el modal con el ticket detallado

  fetchProducts(); 
  setCart([]);
  searchQuery && setSearchQuery('');
}
    } catch (error) {
      console.error('Error al conectar con la API de ventas:', error);
    }
  };

  // --- CÁLCULOS PARA EL DASHBOARD ---
  const totalRevenue = useMemo(() => salesHistory.reduce((acc, sale) => acc + (sale.total_amount || 0), 0), [salesHistory]);
  const totalSalesCount = salesHistory.length;
  const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

  return (
    <>
      <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans print:hidden">
        
        {/* VISTA 1: PUNTO DE VENTA (POS) */}
        {activeView === 'pos' && (
          <>
            <section className="w-[70%] flex flex-col h-full border-r border-slate-200/80 bg-slate-50/60 overflow-hidden">
              <header className="p-5 pb-4 bg-white border-b border-slate-200/90 shadow-sm shrink-0">
                <div className="flex items-center justify-between gap-4 mb-4">
                  
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Search className="w-5 h-5" /></div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Escanear código de barra (SKU) o buscar producto..."
                      className="w-full pl-11 pr-24 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-800 rounded-xl outline-none border border-transparent focus:border-emerald-500 transition-colors"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 p-1"><X className="w-4 h-4" /></button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleSwitchView('dashboard')} 
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      Dashboard / Ventas
                    </button>

                    <button 
                      onClick={() => handleOpenModal()} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-emerald-600/30"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Nuevo Producto
                    </button>
                  </div>

                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Categorías:</span>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 ${selectedCategory === cat ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {cat === 'Todo' && <LayoutGrid className="w-3.5 h-3.5" />}
                      {cat === 'Electrónica' && <Smartphone className="w-3.5 h-3.5" />}
                      {cat === 'Ropa' && <Tag className="w-3.5 h-3.5" />}
                      {cat === 'Abarrotes' && <ShoppingBag className="w-3.5 h-3.5" />}
                      {cat}
                    </button>
                  ))}
                </div>
              </header>
              
              <main className="flex-1 overflow-y-auto p-5 relative">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full text-slate-500 font-medium">
                    Conectando a MongoDB y cargando catálogo...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(prod => (
                      <div 
                        key={prod._id} 
                        onClick={() => handleAddToCart(prod)} 
                        className={`group bg-white rounded-2xl border p-3.5 cursor-pointer transition-all relative ${prod.stock <= 0 ? 'opacity-50' : 'hover:shadow-lg hover:border-emerald-500/40'}`}
                      >
                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(prod); }} className="p-1.5 bg-white text-blue-600 rounded-lg shadow hover:bg-blue-50">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleDelete(prod._id, e)} className="p-1.5 bg-white text-rose-600 rounded-lg shadow hover:bg-rose-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="relative aspect-square rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                          <Box className="w-6 h-6 text-slate-400" />
                          <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 rounded-md bg-white/90 shadow-sm border">{prod.category}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mb-1 font-semibold">{prod.sku} • {prod.stock} disp.</div>
                        <h3 className="text-sm font-semibold mb-2 text-slate-800 line-clamp-2">{prod.name}</h3>
                        <div className="font-extrabold text-slate-900 mt-auto">{formatCurrency(prod.base_price)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </main>
            </section>

            {/* CAJA REGISTRADORA */}
            <aside className="w-[30%] flex flex-col h-full bg-white shadow-xl z-20">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><Store className="w-5 h-5"/></div>
                  <div>
                    <h2 className="text-sm font-bold">Caja Principal</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-emerald-600"/> Cajero: Admin</p>
                  </div>
                </div>
                <button onClick={handleClearCart} disabled={cart.length === 0} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 divide-y">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 mb-2 opacity-50"/>
                    <p className="text-sm font-medium">Ticket Vacío</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product._id} className="py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold truncate">{item.product.name}</h4>
                        <div className="text-[11px] text-slate-400">{formatCurrency(item.product.base_price)} c/u</div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 border">
                        <button onClick={() => handleUpdateQuantity(item.product._id, -1)} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center"><Minus className="w-3 h-3"/></button>
                        <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.product._id, 1)} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center" disabled={item.quantity >= item.product.stock}><Plus className="w-3 h-3"/></button>
                      </div>
                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-bold">{formatCurrency(item.product.base_price * item.quantity)}</span>
                      </div>
                      <button onClick={() => handleRemoveItem(item.product._id)} className="text-slate-300 hover:text-rose-500"><X className="w-3.5 h-3.5"/></button>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t bg-slate-50 p-4 shrink-0 shadow-inner">
                <div className="space-y-1.5 text-xs mb-3.5">
                  <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>IVA (16%)</span><span className="font-semibold text-slate-800">{formatCurrency(iva)}</span></div>
                  <div className="pt-2 border-t flex justify-between items-baseline"><span className="font-bold text-sm">Total a Pagar</span><span className="text-2xl font-black text-slate-900">{formatCurrency(total)}</span></div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PAYMENT_METHODS.map(method => {
                    const Icon = method.icon;
                    return (
                      <button key={method.id} onClick={() => setSelectedPayment(method.id)} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${selectedPayment === method.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600'}`}>
                        <Icon className={`w-4 h-4 ${selectedPayment === method.id ? 'text-emerald-400' : ''}`} /> <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
                
                <button onClick={handleCheckout} disabled={cart.length === 0} className={`w-full py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all ${cart.length === 0 ? 'bg-slate-200 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'}`}>
                  <CheckCircle className="w-5 h-5"/> Cobrar {cart.length > 0 ? formatCurrency(total) : ''}
                </button>
              </div>
            </aside>
          </>
        )}

        {/* VISTA 2: DASHBOARD E HISTORIAL DE VENTAS */}
        {activeView === 'dashboard' && (
          <main className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
            <header className="p-6 bg-white border-b flex justify-between items-center shadow-sm">
              <div>
                <h1 className="text-xl font-black text-slate-800">Panel de Control & Historial de Ventas</h1>
                <p className="text-xs text-slate-500">Consulta los ingresos y transacciones registradas en el sistema.</p>
              </div>
              <button 
                onClick={() => handleSwitchView('pos')} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Regresar al Punto de Venta
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign className="w-7 h-7"/></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingresos Totales</p>
                    <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totalRevenue)}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Receipt className="w-7 h-7"/></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ventas Realizadas</p>
                    <h3 className="text-2xl font-black text-slate-800">{totalSalesCount} tickets</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center"><TrendingUp className="w-7 h-7"/></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Promedio</p>
                    <h3 className="text-2xl font-black text-slate-800">{formatCurrency(averageTicket)}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="p-5 border-b bg-slate-50 font-bold text-sm text-slate-700 flex justify-between items-center">
                  <span>Historial de Transacciones Recientes</span>
                  <button onClick={fetchSalesHistory} className="text-xs text-emerald-600 hover:underline">Actualizar Datos</button>
                </div>

                {loadingSales ? (
                  <div className="p-12 text-center text-slate-400 font-medium">Cargando registros de ventas desde MongoDB...</div>
                ) : salesHistory.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium">No hay ventas registradas todavía. ¡Realiza tu primer cobro en la caja!</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 border-b font-semibold uppercase tracking-wider">
                          <th className="p-4">Folio</th>
                          <th className="p-4">Fecha y Hora</th>
                          <th className="p-4">Método de Pago</th>
                          <th className="p-4">Artículos</th>
                          <th className="p-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700 font-medium">
                        {salesHistory.map((sale) => (
                          <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 font-mono font-bold text-emerald-600">{sale.receipt_folio}</td>
                            <td className="p-4 text-slate-500">{new Date(sale.createdAt || sale.date).toLocaleString()}</td>
                            <td className="p-4 uppercase font-semibold">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 border text-[10px]">{sale.payment_method}</span>
                            </td>
                            <td className="p-4">{sale.items?.reduce((acc, i) => acc + i.quantity, 0)} productos</td>
                            <td className="p-4 text-right font-black text-sm text-slate-900">{formatCurrency(sale.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* VENTANA MODAL (FORMULARIO CRUD PRODUCTOS) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              
              <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  {editingProduct ? <Edit2 className="w-5 h-5 text-blue-600"/> : <PlusCircle className="w-5 h-5 text-emerald-600"/>}
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-md shadow-sm border"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">SKU</label>
                    <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-slate-100 border-transparent rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all" placeholder="Ej. ELEC-101"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Categoría</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-100 border-transparent rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 outline-none">
                      <option value="Electrónica">Electrónica</option>
                      <option value="Ropa">Ropa</option>
                      <option value="Abarrotes">Abarrotes</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Nombre del Producto</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-100 border-transparent rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 outline-none" placeholder="Nombre completo..."/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Precio Base ($)</label>
                    <input required type="number" step="0.01" min="0" value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} className="w-full bg-slate-100 border-transparent rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 outline-none" placeholder="0.00"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Stock Inicial</label>
                    <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-slate-100 border-transparent rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 outline-none" placeholder="Cantidad"/>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
                    <Save className="w-4 h-4"/> Guardar
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>

      <ReceiptTemplate saleData={lastSale} onClose={() => setLastSale(null)} />
    </>
  );
}