import React from 'react';
import { motion } from 'motion/react';
import { Share2, Wind, Sword, MapIcon, Info, Zap, ChevronRight, CheckCircle2, Trophy } from 'lucide-react';
import { MerchantAnalysisResult, Step } from '../types';

interface MerchantDashboardProps {
  merchantAnalysis: MerchantAnalysisResult | null;
  setMerchantAnalysis: (analysis: MerchantAnalysisResult | null) => void;
  setMerchantImages: (images: string[]) => void;
  setCurrentStep: (step: Step) => void;
  merchantLocation: string;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  merchantAnalysis,
  setMerchantAnalysis,
  setMerchantImages,
  setCurrentStep,
  merchantLocation
}) => {
  if (!merchantAnalysis) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-witcher-gold/20 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-cinzel text-witcher-gold">Mestre Mercador</h1>
          <div className="flex items-center gap-2 text-xs text-witcher-gold/60">
            <MapIcon className="w-4 h-4" />
            <span>Localização Atual: <strong className="text-witcher-gold">{merchantLocation}</strong></span>
          </div>
          <p className="text-witcher-gold/60 italic">"{merchantAnalysis.humor}"</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              const text = `
                WITCHER 3 QUEST MASTER - ANÁLISE MERCANTIL
                Estratégia: ${(merchantAnalysis.profitStrategies || [])[0]?.title || 'N/A'}
                Itens para Vender: ${(merchantAnalysis.itemsToSell || []).map(i => i.name).join(', ')}
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
              if (confirm("Deseja meditar e limpar esta análise?")) {
                setMerchantAnalysis(null);
                setMerchantImages([]);
                setCurrentStep('MERCHANT_INPUT');
              }
            }}
            className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
          >
            <Wind className="w-4 h-4" /> Meditar (Reset)
          </button>
          <button onClick={() => setCurrentStep('MERCHANT_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm">Nova Análise</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <Sword className="w-8 h-8" /> O que Vender
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {(merchantAnalysis.itemsToSell || []).map((item, i) => (
                <div key={i} className={`p-4 bg-black/30 rounded border transition-all ${
                  item.strategy === 'Segurar para Depois' 
                    ? 'border-blue-500/40 bg-blue-900/5' 
                    : 'border-witcher-gold/10 hover:border-witcher-gold/40'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-witcher-gold font-bold">{item.name}</h4>
                    <div className="text-right">
                      <span className="text-xs font-bold text-green-500 block">{item.estimatedValue}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        item.strategy === 'Vender Agora' ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'
                      }`}>
                        {item.strategy}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <MapIcon className="w-3 h-3 text-witcher-gold/60" />
                      <span className="text-witcher-gold/60 uppercase font-semibold">Onde:</span> {item.targetMerchant}
                    </p>
                    <p className="text-[11px] text-gray-500 italic ml-4">
                      {item.merchantLocation}
                    </p>
                    {item.betterMerchantLater && (
                      <p className="text-[10px] text-blue-400 flex items-center gap-1 mt-1">
                        <Info className="w-3 h-3" />
                        Melhor em: {item.betterMerchantLater}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 leading-snug">{item.reason}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <Zap className="w-8 h-8" /> O que Desmontar
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {(merchantAnalysis.itemsToDismantle || []).map((item, i) => (
                <div key={i} className="p-4 bg-black/30 rounded border border-witcher-gold/10 hover:border-witcher-gold/40 transition-all">
                  <h4 className="text-witcher-gold font-bold mb-1">{item.name}</h4>
                  <p className="text-xs text-blue-400 mb-2"><span className="text-witcher-gold/60 uppercase">Resultado:</span> {item.yields}</p>
                  <p className="text-sm text-gray-300">{item.reason}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8" /> O que Guardar
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {(merchantAnalysis.itemsToKeep || []).map((item, i) => (
                <div key={i} className="p-4 bg-black/30 rounded border border-witcher-gold/10 hover:border-witcher-gold/40 transition-all">
                  <h4 className="text-witcher-gold font-bold mb-2">{item.name}</h4>
                  <p className="text-sm text-gray-300">{item.reason}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <MapIcon className="w-6 h-6" /> Melhores Mercadores
            </h2>
            <div className="space-y-4">
              {(merchantAnalysis.bestMerchants || []).map((m, i) => (
                <div key={i} className="p-3 bg-witcher-gold/5 border border-witcher-gold/10 rounded">
                  <p className="text-xs font-bold text-witcher-gold uppercase mb-1">{m.location}</p>
                  <p className="text-sm font-bold text-white mb-1">{m.name}</p>
                  <p className="text-xs text-blue-400 mb-1">{m.specialty}</p>
                  <p className="text-xs text-gray-400 italic">{m.why}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="parchment-card p-6 border-blue-900/50">
            <h2 className="text-2xl mb-4 flex items-center gap-2 text-blue-400">
              <Trophy className="w-6 h-6" /> Estratégias de Lucro
            </h2>
            <div className="space-y-4">
              {(merchantAnalysis.profitStrategies || []).map((s, i) => (
                <div key={i} className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-bold text-white mb-1">{s.title}</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <Info className="w-6 h-6" /> Dicas de Economia
            </h2>
            <ul className="text-sm space-y-3 text-gray-400">
              {(merchantAnalysis.economyTips || []).map((tip, i) => (
                <li key={i} className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> {tip}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </motion.div>
  );
};
