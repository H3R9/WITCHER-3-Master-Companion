import React from 'react';
import { motion } from 'motion/react';
import { Step } from '../types';

interface BestiaryConfirmProps {
  bestiaryTarget: string;
  setBestiaryTarget: (target: string) => void;
  setCurrentStep: (step: Step) => void;
  runBestiaryAnalysis: () => void;
}

export const BestiaryConfirm: React.FC<BestiaryConfirmProps> = ({
  bestiaryTarget,
  setBestiaryTarget,
  setCurrentStep,
  runBestiaryAnalysis
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Verificação do Bestiário</h1>
        <p className="text-witcher-gold/60">Confirme o monstro identificado.</p>
      </div>

      <div className="parchment-card p-6 space-y-6">
        <div>
          <label className="block text-witcher-gold text-sm font-bold mb-2">Nome do Monstro</label>
          <input 
            type="text"
            className="w-full bg-black/40 border border-witcher-gold/30 rounded p-3 text-white focus:border-witcher-gold outline-none transition-colors"
            value={bestiaryTarget}
            onChange={(e) => setBestiaryTarget(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={() => setCurrentStep('BESTIARY_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5">Voltar</button>
          <button onClick={runBestiaryAnalysis} className="witcher-button">Analisar</button>
        </div>
      </div>
    </motion.div>
  );
};
