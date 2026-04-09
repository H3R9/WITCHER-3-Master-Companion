import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus } from 'lucide-react';
import { ExtractedGwentCard, Step } from '../types';

interface GwentConfirmProps {
  gwentCards: ExtractedGwentCard[];
  setGwentCards: (cards: ExtractedGwentCard[]) => void;
  setCurrentStep: (step: Step) => void;
  runGwentAnalysis: () => void;
}

export const GwentConfirm: React.FC<GwentConfirmProps> = ({
  gwentCards,
  setGwentCards,
  setCurrentStep,
  runGwentAnalysis
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Verificação do Baralho</h1>
        <p className="text-witcher-gold/60">Revise as cartas extraídas das suas capturas de tela.</p>
      </div>

      <div className="parchment-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-witcher-gold/30 text-witcher-gold uppercase text-xs tracking-widest">
                <th className="p-4">Nome da Carta</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Poder</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-witcher-gold/10">
              {gwentCards.map((card, idx) => (
                <tr key={card.id} className="hover:bg-witcher-gold/5 transition-colors">
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={card.name}
                      onChange={e => {
                        const newCards = [...gwentCards];
                        newCards[idx].name = e.target.value;
                        setGwentCards(newCards);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={card.type}
                      onChange={e => {
                        const newCards = [...gwentCards];
                        newCards[idx].type = e.target.value;
                        setGwentCards(newCards);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-24"
                      value={card.power}
                      onChange={e => {
                        const newCards = [...gwentCards];
                        newCards[idx].power = e.target.value;
                        setGwentCards(newCards);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setGwentCards(gwentCards.filter(c => c.id !== card.id))}
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
            onClick={() => setGwentCards([...gwentCards, { id: `card-${Date.now()}`, name: '', type: '', power: '0' }])}
            className="flex items-center gap-2 text-witcher-gold hover:text-white transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar Carta Manualmente
          </button>
          
          <div className="flex gap-4">
            <button onClick={() => setCurrentStep('GWENT_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5">Voltar</button>
            <button onClick={runGwentAnalysis} className="witcher-button">Analisar</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
