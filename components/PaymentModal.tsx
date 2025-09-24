import React, { useState } from 'react';
import { Order } from '../types';
import Modal from './Modal';
import { Upload } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onFinalize: (paymentMethod: Order['payment_method'], receiptFile?: File | null) => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, order, onFinalize }) => {
  const [paymentMethod, setPaymentMethod] = useState<Order['payment_method']>('efectivo');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return;
    setIsSubmitting(true);
    await onFinalize(paymentMethod, receiptFile);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Finaliser la commande #${order.id.slice(-4)}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600">Total à payer</p>
          <p className="text-4xl font-extrabold text-gray-900">{order.total.toFixed(2)} €</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Méthode de paiement</label>
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value as Order['payment_method'])}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-gray-900"
          >
            <option value="efectivo">Efectivo (Espèces)</option>
            <option value="transferencia">Transferencia (Virement)</option>
            <option value="tarjeta">Tarjeta (Carte)</option>
          </select>
        </div>

        {paymentMethod === 'transferencia' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Justificatif (optionnel)</label>
            <label htmlFor="payment-receipt" className="mt-1 w-full border border-gray-300 p-2 rounded-md shadow-sm flex items-center gap-2 cursor-pointer bg-white text-gray-500">
              <Upload size={18} />
              <span>{receiptFile ? receiptFile.name : 'Choisir un fichier...'}</span>
            </label>
            <input id="payment-receipt" type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={onClose} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition">
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400">
            {isSubmitting ? 'Finalisation...' : 'Confirmer Paiement'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;
