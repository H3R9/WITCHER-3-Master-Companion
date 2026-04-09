import React from 'react';
import { motion } from 'motion/react';
import { Share2, Wind, Sword, Shield, Crosshair, Activity, Hammer, MapIcon, Info, Zap, ChevronRight } from 'lucide-react';
import { GearAnalysisResult, Step } from '../types';

interface GearDashboardProps {
  gearAnalysis: GearAnalysisResult | null;
  setGearAnalysis: (analysis: GearAnalysisResult | null) => void;
  setGearImages: (images: string[]) => void;
  setCurrentStep: (step: Step) => void;
}

export const GearDashboard: React.FC<GearDashboardProps> = ({
  gearAnalysis,
  setGearAnalysis,
  setGearImages,
  setCurrentStep
}) => {
  if (!gearAnalysis) return null;

  const renderGearInfographic = () => {
    const allItems = gearAnalysis.sets.flatMap(s => s.items.map(i => i.name.toLowerCase()));
    const hasSwords = allItems.some(i => i.includes('espada') || i.includes('sword') || i.includes('aço') || i.includes('prata'));
    const hasArmor = allItems.some(i => i.includes('armadura') || i.includes('armor') || i.includes('peitoral'));
    const hasGauntlets = allItems.some(i => i.includes('manopla') || i.includes('luva') || i.includes('gauntlet'));
    const hasPants = allItems.some(i => i.includes('calça') || i.includes('trousers') || i.includes('pant'));
    const hasBoots = allItems.some(i => i.includes('bota') || i.includes('boot'));

    const pieces = [
      { name: 'Espadas', icon: <Sword className="w-6 h-6" />, active: hasSwords },
      { name: 'Armadura', icon: <Shield className="w-6 h-6" />, active: hasArmor },
      { name: 'Manoplas', icon: <Crosshair className="w-6 h-6" />, active: hasGauntlets },
      { name: 'Calças', icon: <Activity className="w-6 h-6" />, active: hasPants },
      { name: 'Botas', icon: <Wind className="w-6 h-6" />, active: hasBoots },
    ];

    return (
      <div className="mb-8 parchment-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.1)_0%,transparent_70%)] pointer-events-none" />
        <h3 className="text-xl font-cinzel text-witcher-gold mb-6 flex items-center gap-2">
          <Hammer className="w-5 h-5"/> Composição do Conjunto
        </h3>
        <div className="flex justify-around items-center flex-wrap gap-4">
          {pieces.map((p, i) => (
            <div key={i} className={`flex flex-col items-center gap-2 transition-all duration-500 ${p.active ? 'text-witcher-gold opacity-100 scale-110' : 'text-gray-600 opacity-40'}`}>
              <div className={`p-4 rounded-full border-2 ${p.active ? 'border-witcher-gold bg-witcher-gold/10 shadow-[0_0_15px_rgba(197,160,89,0.3)]' : 'border-gray-700 bg-black/50'}`}>
                {p.icon}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">{p.name}</span>
            </div>
          ))}
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
          <h1 className="text-4xl font-cinzel text-witcher-gold">Escola do {gearAnalysis.schoolName}</h1>
          <p className="text-witcher-gold/60 italic">"{gearAnalysis.humor}"</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              const text = `
                WITCHER 3 QUEST MASTER - MESTRE ARMEIRO
                Escola: ${gearAnalysis.schoolName}
                Build: ${gearAnalysis.recommendedBuild}
              `;
              navigator.clipboard.writeText(text);
              alert("Diagramas copiados!");
            }}
            className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
          <button 
            onClick={() => {
              if (confirm("Deseja meditar e limpar esta análise?")) {
                setGearAnalysis(null);
                setGearImages([]);
                setCurrentStep('GEAR_INPUT');
              }
            }}
            className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
          >
            <Wind className="w-4 h-4" /> Meditar (Reset)
          </button>
          <button onClick={() => setCurrentStep('GEAR_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm">Nova Análise</button>
        </div>
      </div>

      {renderGearInfographic()}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {gearAnalysis.currentGearEvaluation && (
            <section className="parchment-card p-8 border-l-4 border-witcher-gold">
              <h2 className="text-2xl mb-4 flex items-center gap-3 text-witcher-gold">
                <Activity className="w-6 h-6" /> Avaliação do Equipamento Atual
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {gearAnalysis.currentGearEvaluation}
              </p>
            </section>
          )}

          {gearAnalysis.craftingRecommendations && gearAnalysis.craftingRecommendations.length > 0 && (
            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3 text-green-400">
                <Hammer className="w-8 h-8" /> O Que Craftar Agora
              </h2>
              <div className="space-y-4">
                {gearAnalysis.craftingRecommendations.map((rec, i) => (
                  <div key={i} className="p-4 bg-black/40 rounded border border-green-500/30">
                    <h4 className="text-lg font-bold text-white mb-2">{rec.itemName}</h4>
                    <p className="text-sm text-gray-300 mb-3">{rec.reason}</p>
                    <div className="flex flex-col md:flex-row gap-4 text-xs">
                      <div className="flex-1">
                        <span className="text-witcher-gold/60 uppercase tracking-wider block mb-1">Materiais:</span>
                        <div className="flex flex-wrap gap-1">
                          {rec.materialsNeeded.map((mat, j) => (
                            <span key={j} className="px-2 py-1 bg-witcher-gold/10 text-witcher-gold rounded border border-witcher-gold/20">{mat}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-witcher-gold/60 uppercase tracking-wider block mb-1">Nível do Artesão:</span>
                        <span className="text-gray-300">{rec.crafterLevelRequired}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {gearAnalysis.sets.map((set, i) => (
            <section key={i} className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8" /> Nível: {set.level}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {set.items.map((item, j) => (
                  <div key={j} className="p-4 bg-black/30 rounded border border-witcher-gold/10">
                    <h4 className="text-witcher-gold font-bold mb-2">{item.name}</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-400 flex items-center gap-2"><MapIcon className="w-4 h-4" /> {item.location}</p>
                      <p className="text-gray-400 flex items-center gap-2"><Info className="w-4 h-4" /> {item.requirements}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.stats.map((stat, k) => (
                          <span key={k} className="text-[10px] px-1.5 py-0.5 bg-witcher-gold/10 text-witcher-gold/80 rounded border border-witcher-gold/20">
                            {stat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <Zap className="w-8 h-8" /> Build Recomendada
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {gearAnalysis.recommendedBuild}
            </p>
          </section>
        </div>

        <div className="space-y-8">
          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <Hammer className="w-6 h-6" /> Dicas de Crafting
            </h2>
            <ul className="space-y-3">
              {gearAnalysis.craftingTips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> {tip}
                </li>
              ))}
            </ul>
          </section>

          <div className="p-6 bg-witcher-gold/10 border-2 border-witcher-gold/30 rounded-lg text-center space-y-2">
            <p className="text-xs text-witcher-gold/60 uppercase font-bold">Descrição da Escola</p>
            <p className="text-sm italic text-gray-300 leading-relaxed">
              {gearAnalysis.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
