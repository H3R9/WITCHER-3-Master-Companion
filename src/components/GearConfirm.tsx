import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus } from 'lucide-react';
import { ExtractedGearItem, Step } from '../types';

interface GearConfirmProps {
  gearItems: ExtractedGearItem[];
  setGearItems: (items: ExtractedGearItem[]) => void;
  setCurrentStep: (step: Step) => void;
  runGearAnalysis: () => void;
}

export const GearConfirm: React.FC<GearConfirmProps> = ({
  gearItems,
  setGearItems,
  setCurrentStep,
  runGearAnalysis
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Verificação de Equipamentos</h1>
        <p className="text-witcher-gold/60">Revise os equipamentos e diagramas extraídos.</p>
      </div>

      <div className="parchment-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-witcher-gold/30 text-witcher-gold uppercase text-xs tracking-widest">
                <th className="p-4">Nome do Item</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-witcher-gold/10">
              {gearItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-witcher-gold/5 transition-colors">
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={item.name}
                      onChange={e => {
                        const newItems = [...gearItems];
                        newItems[idx].name = e.target.value;
                        setGearItems(newItems);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={item.type}
                      onChange={e => {
                        const newItems = [...gearItems];
                        newItems[idx].type = e.target.value;
                        setGearItems(newItems);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <select 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={item.category || 'Inventário'}
                      onChange={e => {
                        const newItems = [...gearItems];
                        newItems[idx].category = e.target.value;
                        setGearItems(newItems);
                      }}
                    >
                      <option value="Equipado">Equipado</option>
                      <option value="Diagrama">Diagrama</option>
                      <option value="Inventário">Inventário</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setGearItems(gearItems.filter(i => i.id !== item.id))}
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
            onClick={() => setGearItems([...gearItems, { id: `item-${Date.now()}`, name: '', type: '', category: 'Inventário' }])}
            className="flex items-center gap-2 text-witcher-gold hover:text-white transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar Item Manualmente
          </button>
          
          <div className="flex gap-4">
            <button onClick={() => setCurrentStep('GEAR_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5">Voltar</button>
            <button onClick={runGearAnalysis} className="witcher-button">Analisar</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
