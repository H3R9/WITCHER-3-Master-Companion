import React from 'react';
import { motion } from 'motion/react';
import { Share2, Wind, Sword, Skull, MapIcon, Info, Zap, ChevronRight, Droplet, Flame, Bomb, Activity, Crosshair, Trophy } from 'lucide-react';
import { BestiaryAnalysisResult, Step } from '../types';

interface BestiaryDashboardProps {
  bestiaryAnalysis: BestiaryAnalysisResult | null;
  setBestiaryAnalysis: (analysis: BestiaryAnalysisResult | null) => void;
  setBestiaryImages: (images: string[]) => void;
  setCurrentStep: (step: Step) => void;
}

export const BestiaryDashboard: React.FC<BestiaryDashboardProps> = ({
  bestiaryAnalysis,
  setBestiaryAnalysis,
  setBestiaryImages,
  setCurrentStep
}) => {
  if (!bestiaryAnalysis) return null;

  const renderBestiaryInfographic = () => {
    const types = [
      { id: 'Óleo', icon: <Droplet className="w-6 h-6" />, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-500/30' },
      { id: 'Sinal', icon: <Flame className="w-6 h-6" />, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30' },
      { id: 'Bomba', icon: <Bomb className="w-6 h-6" />, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30' },
      { id: 'Poção', icon: <Activity className="w-6 h-6" />, color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/30' }
    ];

    return (
      <div className="mb-8 parchment-card p-6">
        <h3 className="text-xl font-cinzel text-witcher-gold mb-6 flex items-center gap-2">
          <Crosshair className="w-5 h-5"/> Matriz de Vulnerabilidade
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {types.map(t => {
            const weak = bestiaryAnalysis.weaknesses.filter(w => w.type.toLowerCase().includes(t.id.toLowerCase()) || w.name.toLowerCase().includes(t.id.toLowerCase()) || (t.id === 'Óleo' && w.name.toLowerCase().includes('oil')) || (t.id === 'Sinal' && w.name.toLowerCase().includes('sign')) || (t.id === 'Bomba' && w.name.toLowerCase().includes('bomb')) || (t.id === 'Poção' && w.name.toLowerCase().includes('potion')));
            const isWeak = weak.length > 0;
            return (
              <div key={t.id} className={`p-4 rounded-lg border ${isWeak ? t.border + ' ' + t.bg : 'border-gray-800 bg-black/40 opacity-50'} flex flex-col items-center text-center transition-all duration-300`}>
                <div className={`p-3 rounded-full mb-2 ${isWeak ? t.color + ' bg-black/50 shadow-[0_0_15px_currentColor]' : 'text-gray-600'}`}>
                  {t.icon}
                </div>
                <h4 className={`font-bold uppercase text-xs tracking-widest mb-1 ${isWeak ? 'text-white' : 'text-gray-500'}`}>{t.id}</h4>
                {isWeak ? (
                  <div className="flex flex-col gap-1 mt-2">
                    {weak.map((w, i) => <span key={i} className={`text-xs font-bold ${t.color}`}>{w.name}</span>)}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-600 uppercase mt-2">Resistente / Neutro</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-witcher-gold/20 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-cinzel text-witcher-gold">{bestiaryAnalysis.monsterName}</h1>
          <div className="flex items-center gap-2 text-xs text-witcher-gold/60">
            <Skull className="w-4 h-4" />
            <span>Classe: <strong className="text-witcher-gold">{bestiaryAnalysis.class}</strong></span>
          </div>
          <p className="text-witcher-gold/60 italic">"{bestiaryAnalysis.humor}"</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              const text = `
                WITCHER 3 QUEST MASTER - BESTIÁRIO
                Monstro: ${bestiaryAnalysis.monsterName}
                Fraquezas: ${bestiaryAnalysis.weaknesses.map(w => w.name).join(', ')}
              `;
              navigator.clipboard.writeText(text);
              alert("Bestiário copiado!");
            }}
            className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
          <button 
            onClick={() => {
              if (confirm("Deseja meditar e limpar esta análise?")) {
                setBestiaryAnalysis(null);
                setBestiaryImages([]);
                setCurrentStep('BESTIARY_INPUT');
              }
            }}
            className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
          >
            <Wind className="w-4 h-4" /> Meditar (Reset)
          </button>
          <button onClick={() => setCurrentStep('BESTIARY_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm">Nova Análise</button>
        </div>
      </div>

      {renderBestiaryInfographic()}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <Sword className="w-8 h-8" /> Fraquezas e Vulnerabilidades
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {bestiaryAnalysis.weaknesses.map((weak, i) => (
                <div key={i} className="p-4 bg-black/30 rounded border border-witcher-gold/10 hover:border-witcher-gold/40 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-witcher-gold font-bold">{weak.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 bg-witcher-gold/20 text-witcher-gold rounded uppercase font-bold border border-witcher-gold/30">
                      {weak.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{weak.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <Zap className="w-8 h-8" /> Estratégia de Combate
            </h2>
            <div className="space-y-6">
              {bestiaryAnalysis.combatStrategy.map((step, i) => (
                <div key={i} className="p-4 bg-black/30 rounded border-l-4 border-witcher-gold">
                  <h4 className="font-bold text-witcher-gold mb-2">{step.phase}</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{step.advice}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <Info className="w-8 h-8" /> Lore e Comportamento
            </h2>
            <p className="text-gray-300 leading-relaxed italic parchment-card p-6 bg-black/20 border-none shadow-none">
              {bestiaryAnalysis.lore}
            </p>
          </section>
        </div>

        <div className="space-y-8">
          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6" /> Loot e Recompensas
            </h2>
            <div className="space-y-3">
              {bestiaryAnalysis.loot.map((item, i) => (
                <div key={i} className="p-3 bg-witcher-gold/5 border border-witcher-gold/10 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-bold text-white">{item.item}</p>
                    <span className="text-[8px] px-1.5 py-0.5 bg-blue-900/40 text-blue-300 rounded uppercase font-bold border border-blue-500/20">
                      {item.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 italic">{item.use}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <MapIcon className="w-6 h-6" /> Onde Encontrar
            </h2>
            <ul className="text-sm space-y-2 text-gray-400">
              {bestiaryAnalysis.locations.map((loc, i) => (
                <li key={i} className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> {loc}</li>
              ))}
            </ul>
          </section>

          <div className="p-6 bg-witcher-gold/10 border-2 border-witcher-gold/30 rounded-lg text-center space-y-2">
            <p className="text-xs text-witcher-gold/60 uppercase font-bold">Descrição do Master</p>
            <p className="text-sm italic text-gray-300 leading-relaxed">
              {bestiaryAnalysis.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
