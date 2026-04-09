import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus } from 'lucide-react';
import { ExtractedQuest, Step } from '../types';

interface QuestConfirmProps {
  quests: ExtractedQuest[];
  setQuests: (quests: ExtractedQuest[]) => void;
  setCurrentStep: (step: Step) => void;
  runAnalysis: () => void;
}

export const QuestConfirm: React.FC<QuestConfirmProps> = ({
  quests,
  setQuests,
  setCurrentStep,
  runAnalysis
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Verificação de Missões</h1>
        <p className="text-witcher-gold/60">Revise os dados extraídos das suas capturas de tela.</p>
      </div>

      <div className="parchment-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-witcher-gold/30 text-witcher-gold uppercase text-xs tracking-widest">
                <th className="p-4">Nome da Missão</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Status</th>
                <th className="p-4">Nível</th>
                <th className="p-4">Localização</th>
                <th className="p-4">Objetivo/Notas</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-witcher-gold/10">
              {quests.map((quest, idx) => (
                <tr key={quest.id} className="hover:bg-witcher-gold/5 transition-colors">
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={quest.name}
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].name = e.target.value;
                        setQuests(newQuests);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <select 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded"
                      value={quest.type}
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].type = e.target.value as any;
                        setQuests(newQuests);
                      }}
                    >
                      <option value="Principal">Principal</option>
                      <option value="Secundária">Secundária</option>
                      <option value="Contrato">Contrato</option>
                      <option value="Caça ao Tesouro">Caça ao Tesouro</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <select 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded"
                      value={quest.status}
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].status = e.target.value as any;
                        setQuests(newQuests);
                      }}
                    >
                      <option value="Ativa">Ativa</option>
                      <option value="Concluída">Concluída</option>
                      <option value="Falhou">Falhou</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-16"
                      value={quest.level}
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].level = e.target.value;
                        setQuests(newQuests);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-32"
                      value={quest.location || ''}
                      placeholder="Ex: Velen"
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].location = e.target.value;
                        setQuests(newQuests);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={quest.notes}
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].notes = e.target.value;
                        setQuests(newQuests);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setQuests(quests.filter(q => q.id !== quest.id))}
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
            onClick={() => setQuests([...quests, { id: `q-${Date.now()}`, name: '', type: 'Secundária', status: 'Ativa', level: '', location: '', notes: '' }])}
            className="flex items-center gap-2 text-witcher-gold hover:text-white transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar Missão Manualmente
          </button>
          
          <div className="flex gap-4">
            <button onClick={() => setCurrentStep('INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5">Voltar</button>
            <button onClick={runAnalysis} className="witcher-button">Analisar</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
