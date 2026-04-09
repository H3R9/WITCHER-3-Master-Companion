import React from 'react';
import { motion } from 'motion/react';
import { MapIcon, Share2, Wind, Info, Scroll, RefreshCw, Zap, ChevronRight } from 'lucide-react';
import { FinderAnalysisResult, Step } from '../types';

interface FinderDashboardProps {
  finderAnalysis: FinderAnalysisResult | null;
  setFinderAnalysis: (analysis: FinderAnalysisResult | null) => void;
  setFinderQuery: (query: string) => void;
  setCurrentStep: (step: Step) => void;
}

export const FinderDashboard: React.FC<FinderDashboardProps> = ({
  finderAnalysis,
  setFinderAnalysis,
  setFinderQuery,
  setCurrentStep
}) => {
  if (!finderAnalysis) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-witcher-gold/20 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-cinzel text-witcher-gold">{finderAnalysis.itemName}</h1>
          <p className="text-witcher-gold/60 italic">"{finderAnalysis.humor}"</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              const text = `
                WITCHER 3 QUEST MASTER - RASTREADOR
                Item: ${finderAnalysis.itemName}
                Melhor Local: ${(finderAnalysis.bestLocations || [])[0]?.name || 'Vários'}
              `;
              navigator.clipboard.writeText(text);
              alert("Análise copiada!");
            }}
            className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
          <button 
            onClick={() => {
              if (confirm("Deseja meditar e limpar esta busca?")) {
                setFinderAnalysis(null);
                setFinderQuery('');
                setCurrentStep('FINDER_INPUT');
              }
            }}
            className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
          >
            <Wind className="w-4 h-4" /> Meditar (Reset)
          </button>
          <button onClick={() => setCurrentStep('FINDER_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm">Nova Busca</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <MapIcon className="w-8 h-8" /> Melhores Localizações
            </h2>
            <div className="space-y-4">
              {(finderAnalysis.bestLocations || []).map((loc, i) => (
                <div key={i} className="p-4 bg-black/30 rounded border border-witcher-gold/10 hover:border-witcher-gold/40 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-witcher-gold font-bold">{loc.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 bg-witcher-gold/20 text-witcher-gold rounded uppercase font-bold border border-witcher-gold/30">
                      {loc.region}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{loc.details}</p>
                  {loc.dropRate && (
                    <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Chance/Disponibilidade: {loc.dropRate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <Scroll className="w-8 h-8" /> Guia Passo a Passo
            </h2>
            <div className="space-y-6">
              {(finderAnalysis.stepByStepGuide || []).map((step, i) => (
                <div key={i} className="p-4 bg-black/30 rounded border-l-4 border-witcher-gold relative">
                  <div className="absolute -left-[10px] top-4 w-4 h-4 rounded-full bg-witcher-gold border-2 border-black" />
                  <p className="text-sm text-gray-300 leading-relaxed ml-2">{step}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <Info className="w-6 h-6" /> Requisitos
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed bg-witcher-gold/5 p-4 rounded border border-witcher-gold/10">
              {finderAnalysis.requirements}
            </p>
          </section>

          <section className="parchment-card p-6 border-blue-900/50">
            <h2 className="text-2xl mb-4 flex items-center gap-2 text-blue-400">
              <RefreshCw className="w-6 h-6" /> Alternativas Viáveis
            </h2>
            <div className="space-y-4">
              {(finderAnalysis.alternatives || []).map((alt, i) => (
                <div key={i} className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-bold text-white mb-1">{alt.name}</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{alt.reason}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6" /> Dicas de Farm / Economia
            </h2>
            <ul className="text-sm space-y-3 text-gray-400">
              {(finderAnalysis.tips || []).map((tip, i) => (
                <li key={i} className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> {tip}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
