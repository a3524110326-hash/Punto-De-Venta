import React from 'react';
import { Printer, X, CheckCircle } from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
};

export const ReceiptTemplate = ({ saleData, onClose }) => {
  if (!saleData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      {/* Contenedor del Modal / Ticket */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full">
        
        {/* Cabecera del modal (oculta al imprimir) */}
        <div className="p-4 bg-emerald-600 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle className="w-5 h-5"/> ¡Venta Registrada con Éxito!
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Cuerpo del Ticket (Información fundamental estructurada) */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 space-y-4 print:text-black print:p-2">
          <div className="text-center space-y-1">
            <h2 className="font-bold text-sm uppercase">PUNTO DE VENTA OFICIAL</h2>
            <p className="text-[11px] text-slate-500 print:text-black">Sucursal Principal</p>
            <div className="pt-2 border-b border-dashed pb-2 space-y-0.5 text-left">
              <p><strong>Folio:</strong> {saleData.receipt_folio}</p>
              <p><strong>Fecha:</strong> {new Date().toLocaleString()}</p>
              <p><strong>Cajero:</strong> {saleData.cashier_id}</p>
              <p><strong>Método de Pago:</strong> <span className="uppercase">{saleData.payment_method}</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-bold border-b pb-1 text-[11px] text-slate-400 print:text-black">
              <span>ARTÍCULO / CANT</span>
              <span>IMPORTE</span>
            </div>
            {saleData.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-1 border-b border-slate-100 print:border-black/20">
                <div>
                  <div className="font-bold text-slate-800 print:text-black">{item.name}</div>
                  <div className="text-[10px] text-slate-500 print:text-black">{item.quantity} pza(s) x {formatCurrency(item.unit_price)}</div>
                </div>
                <div className="font-bold">{formatCurrency(item.subtotal)}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-dashed space-y-1 text-right">
            <div className="flex justify-between text-slate-600 print:text-black"><span>Subtotal:</span> <span>{formatCurrency(saleData.subtotal_amount)}</span></div>
            <div className="flex justify-between text-slate-600 print:text-black"><span>IVA (16%):</span> <span>{formatCurrency(saleData.tax_amount)}</span></div>
            <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
              <span>TOTAL A PAGAR:</span>
              <span className="text-emerald-600 print:text-black">{formatCurrency(saleData.total_amount)}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 print:text-black pt-4 border-t border-dashed space-y-0.5">
            <p>¡Gracias por su compra!</p>
            <p>Conserve este ticket para cualquier aclaración.</p>
          </div>
        </div>

        {/* Botones de acción (ocultos al imprimir) */}
        <div className="p-4 bg-slate-50 border-t flex gap-3 print:hidden">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Nueva Venta
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <Printer className="w-4 h-4"/> Imprimir / Guardar PDF
          </button>
        </div>

      </div>
    </div>
  );
};