import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Share2, Wind, Sword, Skull, Zap } from 'lucide-react';
import { GwentAnalysisResult, Step } from '../types';

interface GwentDashboardProps {
  gwentAnalysis: GwentAnalysisResult | null;
  setGwentAnalysis: (analysis: GwentAnalysisResult | null) => void;
  setGwentImages: (images: string[]) => void;
  setCurrentStep: (step: Step) => void;
}

export const GwentDashboard: React.FC<GwentDashboardProps> = ({
  gwentAnalysis,
  setGwentAnalysis,
  setGwentImages,
  setCurrentStep
}) => {
  if (!gwentAnalysis) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-witcher-gold/20 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-cinzel text-witcher-gold">Estratégia de Gwent</h1>
          <div className="flex items-center gap-2 text-xs text-witcher-gold/60">
            <Trophy className="w-4 h-4" />
            <span>Facção Recomendada: <strong className="text-witcher-gold">{gwentAnalysis.faction}</strong></span>
          </div>
          <p className="text-witcher-gold/60 italic">"{gwentAnalysis.humor}"</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              const text = `
                WITCHER 3 QUEST MASTER - ESTRATÉGIA DE GWENT
                Facção: ${gwentAnalysis.faction}
                Estratégia: ${gwentAnalysis.strategy.title}
              `;
              navigator.clipboard.writeText(text);
              alert("Estratégia copiada!");
            }}
            className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
          <button 
            onClick={() => {
              if (confirm("Deseja meditar e limpar esta análise?")) {
                setGwentAnalysis(null);
                setGwentImages([]);
                setCurrentStep('GWENT_INPUT');
              }
            }}
            className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
          >
            <Wind className="w-4 h-4" /> Meditar (Reset)
          </button>
          <button onClick={() => setCurrentStep('GWENT_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm">Nova Análise</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <Sword className="w-8 h-8" /> Composição do Baralho
            </h2>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-witcher-gold font-bold mb-3 flex items-center gap-2">
                  <Skull className="w-4 h-4" /> Líder: {gwentAnalysis.leaderCard.name}
                </h4>
                <p className="text-sm text-gray-300 bg-black/20 p-3 rounded border border-witcher-gold/10 italic">
                  Habilidade: {gwentAnalysis.leaderCard.ability}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-bold text-witcher-gold/60 uppercase mb-3">Unidades</h5>
                  <div className="space-y-2">
                    {gwentAnalysis.deckComposition.unitCards.map((card, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-black/30 rounded border border-witcher-gold/5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center bg-witcher-gold text-black rounded-full text-[10px] font-bold">{card.power}</span>
                          <span className="text-sm">{card.name} {card.count > 1 && `x${card.count}`}</span>
                        </div>
                        {card.ability && <span className="text-[10px] text-blue-400">{card.ability}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-bold text-witcher-gold/60 uppercase mb-3">Cartas de Herói</h5>
                  <div className="space-y-2">
                    {gwentAnalysis.deckComposition.heroCards.map((card, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-witcher-gold/10 rounded border border-witcher-gold/30">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center bg-witcher-gold text-black rounded-full text-[10px] font-bold">{card.power}</span>
                          <span className="text-sm font-bold">{card.name}</span>
                        </div>
                        {card.ability && <span className="text-[10px] text-witcher-gold">{card.ability}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-bold text-witcher-gold/60 uppercase mb-3">Especiais</h5>
                <div className="grid grid-cols-2 gap-2">
                  {gwentAnalysis.deckComposition.specialCards.map((card, i) => (
                    <div key={i} className="p-2 bg-black/30 rounded border border-witcher-gold/5 text-xs">
                      <span className="font-bold">{card.name} {card.count > 1 && `x${card.count}`}</span>
                      <p className="text-gray-400 italic">{card.effect}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="parchment-card p-8">
            <h2 className="text-3xl mb-6 flex items-center gap-3">
              <Zap className="w-8 h-8" /> Como Jogar (Guia por Rodada)
            </h2>
            <div className="space-y-6">
              <div className="p-4 bg-black/30 rounded border-l-4 border-witcher-gold">
                <h4 className="font-bold text-witcher-gold mb-2">Rodada 1: O Início</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{gwentAnalysis.roundByRound.round1}</p>
              </div>
              <div className="p-4 bg-black/30 rounded border-l-4 border-witcher-gold">
                <h4 className="font-bold text-witcher-gold mb-2">Rodada 2: A Pressão</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{gwentAnalysis.roundByRound.round2}</p>
              </div>
              <div className="p-4 bg-black/30 rounded border-l-4 border-witcher-gold">
                <h4 className="font-bold text-witcher-gold mb-2">Rodada 3: O Final</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{gwentAnalysis.roundByRound.round3}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="parchment-card p-6 border-witcher-gold/40">
            <h2 className="text-2xl mb-4 flex items-center gap-2 text-witcher-gold">
              <Skull className="w-6 h-6" /> Estratégia Mestra
            </h2>
            <div className="p-4 bg-witcher-gold/5 border border-witcher-gold/20 rounded-lg">
              <p className="text-sm font-bold text-white mb-2 uppercase tracking-wider">{gwentAnalysis.strategy.title}</p>
              <p className="text-sm text-gray-300 leading-relaxed italic">{gwentAnalysis.strategy.description}</p>
            </div>
          </section>

          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6" /> Sinergias de Cartas
            </h2>
            <div className="space-y-4">
              {gwentAnalysis.synergies.map((syn, i) => (
                <div key={i} className="p-3 bg-black/30 border border-witcher-gold/10 rounded">
                  <p className="text-xs font-bold text-witcher-gold uppercase mb-1">{syn.cards}</p>
                  <p className="text-xs text-gray-400">{syn.effect}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="p-6 bg-witcher-gold/10 border-2 border-witcher-gold/30 rounded-lg text-center space-y-2">
            <p className="text-xs text-witcher-gold/60 uppercase font-bold">Força Total do Baralho</p>
            <p className="text-4xl font-cinzel text-witcher-gold">{gwentAnalysis.totalStrength}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
