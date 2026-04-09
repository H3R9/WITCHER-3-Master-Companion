import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus } from 'lucide-react';
import { ExtractedMerchantItem, Step } from '../types';

interface MerchantConfirmProps {
  merchantItems: ExtractedMerchantItem[];
  setMerchantItems: (items: ExtractedMerchantItem[]) => void;
  setCurrentStep: (step: Step) => void;
  runMerchantAnalysis: () => void;
}

export const MerchantConfirm: React.FC<MerchantConfirmProps> = ({
  merchantItems,
  setMerchantItems,
  setCurrentStep,
  runMerchantAnalysis
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Verificação de Inventário</h1>
        <p className="text-witcher-gold/60">Revise os itens extraídos das suas capturas de tela.</p>
      </div>

      <div className="parchment-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-witcher-gold/30 text-witcher-gold uppercase text-xs tracking-widest">
                <th className="p-4">Nome do Item</th>
                <th className="p-4">Quantidade</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-witcher-gold/10">
              {merchantItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-witcher-gold/5 transition-colors">
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={item.name}
                      onChange={e => {
                        const newItems = [...merchantItems];
                        newItems[idx].name = e.target.value;
                        setMerchantItems(newItems);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-24"
                      value={item.quantity}
                      onChange={e => {
                        const newItems = [...merchantItems];
                        newItems[idx].quantity = e.target.value;
                        setMerchantItems(newItems);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={item.type}
                      onChange={e => {
                        const newItems = [...merchantItems];
                        newItems[idx].type = e.target.value;
                        setMerchantItems(newItems);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setMerchantItems(merchantItems.filter(i => i.id !== item.id))}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button 
            onClick={() => setMerchantItems([...merchantItems, { id: `item-${Date.now()}`, name: '', quantity: '1', type: '' }])}
            className="flex items-center gap-2 text-witcher-gold hover:text-white transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar Item Manualmente
          </button>
          
          <div className="flex gap-4">
            <button onClick={() => setCurrentStep('MERCHANT_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5">Voltar</button>
            <button onClick={runMerchantAnalysis} className="witcher-button">Analisar</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
