import React from 'react';
import { motion } from 'motion/react';
import { Map as MapIcon, Sword, Scroll, Search, Download, Share2, Wind, Skull, ShieldAlert, ChevronRight, Zap, Eye, AlertTriangle, Trophy, Info } from 'lucide-react';
import { ExtractedQuest, AnalysisResult, UserData, Step } from '../types';

interface QuestDashboardProps {
  analysis: AnalysisResult | null;
  quests: ExtractedQuest[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userData: UserData;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  setQuests: (quests: ExtractedQuest[]) => void;
  setImages: (images: string[]) => void;
  setCurrentStep: (step: Step) => void;
  setSelectedQuest: (quest: ExtractedQuest | null) => void;
}

export const QuestDashboard: React.FC<QuestDashboardProps> = ({
  analysis,
  quests,
  searchQuery,
  setSearchQuery,
  userData,
  setAnalysis,
  setQuests,
  setImages,
  setCurrentStep,
  setSelectedQuest
}) => {
  if (!analysis) return null;

  const renderQuestInfographic = () => {
    if (!analysis.recommendedSequence || analysis.recommendedSequence.length === 0) return null;
    
    return (
      <div className="mb-12 parchment-card p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.1)_0%,transparent_70%)] pointer-events-none" />
        <h3 className="text-xl font-cinzel text-witcher-gold mb-6 flex items-center gap-2">
          <MapIcon className="w-5 h-5"/> Caminho do Destino (Linha do Tempo)
        </h3>
        <div className="flex items-center overflow-x-auto pb-6 snap-x [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-witcher-gold/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-black/20">
          {analysis.recommendedSequence.map((questId, i) => {
            const quest = quests.find(q => q.id === questId);
            const rec = analysis.recommendations?.find(r => r.questId === questId);
            if (!quest) return null;
            
            const isHighPriority = rec?.priority === 'Alta';
            
            return (
              <div key={i} className="flex items-center shrink-0 snap-center">
                <div className={`flex flex-col items-center w-32 text-center relative group`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 bg-black transition-all duration-300 ${isHighPriority ? 'border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:scale-110' : 'border-witcher-gold text-witcher-gold group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(197,160,89,0.5)]'}`}>
                    {quest.type === 'Principal' ? <Sword className="w-5 h-5" /> : <Scroll className="w-5 h-5" />}
                  </div>
                  <p className="text-xs font-bold text-white mt-3 line-clamp-2 px-2 group-hover:text-witcher-gold transition-colors">{quest.name}</p>
                  <p className="text-[9px] uppercase text-gray-400 mt-1">{quest.type}</p>
                </div>
                {i < analysis.recommendedSequence.length - 1 && (
                  <div className={`w-16 h-1 mx-2 rounded-full ${isHighPriority ? 'bg-gradient-to-r from-red-500/50 to-witcher-gold/30' : 'bg-witcher-gold/20'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const filteredRecommendations = (analysis.recommendedSequence || [])
    .map(id => (analysis.recommendations || []).find(r => r.questId === id))
    .filter((rec): rec is NonNullable<typeof rec> => !!rec)
    .filter(rec => {
      const quest = quests.find(q => q.id === rec.questId);
      return quest?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

  // Adicionar recomendações que não estão na sequência (caso a IA esqueça alguma)
  (analysis.recommendations || []).forEach(rec => {
    if (!(analysis.recommendedSequence || []).includes(rec.questId)) {
      const quest = quests.find(q => q.id === rec.questId);
      if (quest?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        filteredRecommendations.push(rec);
      }
    }
  });

  const filteredChoices = (analysis.choices || []).filter(choice => {
    const quest = quests.find(q => q.id === choice.questId);
    return quest?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredCombat = (analysis.combatTips || []).filter(tip => {
    const quest = quests.find(q => q.id === tip.questId);
    return quest?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredGwent = (analysis.gwentTips || []).filter(tip => 
    tip.location?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tip.player?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-witcher-gold/20 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-cinzel">Painel do Caçador</h1>
          <p className="text-witcher-gold/60 italic">"{analysis.humor}"</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-witcher-gold/40" />
            <input 
              type="text"
              placeholder="Buscar missão..."
              className="w-full bg-black/40 border border-witcher-gold/20 rounded pl-10 pr-4 py-2 text-sm focus:border-witcher-gold/60 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const htmlContent = `
                  <!DOCTYPE html>
                  <html lang="pt-BR">
                  <head>
                    <meta charset="UTF-8">
                    <title>Witcher 3 Quest Master - Caminho do Destino</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
                    <style>
                      :root {
                        --witcher-gold: #c5a059;
                        --witcher-gold-dim: rgba(197, 160, 89, 0.3);
                        --witcher-gold-dimmer: rgba(197, 160, 89, 0.1);
                        --bg-dark: #0a0a0a;
                        --bg-card: #141414;
                        --text-main: #e5e7eb;
                        --text-muted: #9ca3af;
                      }
                      body { 
                        background-color: var(--bg-dark); 
                        color: var(--text-main); 
                        font-family: 'Inter', sans-serif; 
                        padding: 3rem 2rem; 
                        max-width: 1200px;
                        margin: 0 auto;
                        line-height: 1.6;
                      }
                      h1, h2, h3, .cinzel { font-family: 'Cinzel', serif; }
                      .header {
                        border-bottom: 1px solid var(--witcher-gold-dim);
                        padding-bottom: 2rem;
                        margin-bottom: 2rem;
                      }
                      .header h1 {
                        font-size: 2.5rem;
                        color: #fff;
                        margin: 0 0 0.5rem 0;
                        font-weight: 400;
                      }
                      .header .humor {
                        color: var(--witcher-gold);
                        opacity: 0.8;
                        font-style: italic;
                        margin: 0;
                      }
                      .parchment-card {
                        background: linear-gradient(to bottom right, #1a1a1a, #0f0f0f);
                        border: 1px solid var(--witcher-gold-dim);
                        border-radius: 0.5rem;
                        padding: 2rem;
                        margin-bottom: 2rem;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(197,160,89,0.05);
                      }
                      .section-title {
                        font-size: 1.8rem;
                        color: var(--witcher-gold);
                        margin-top: 0;
                        margin-bottom: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        font-weight: 400;
                      }
                      .justification {
                        color: #d1d5db;
                        font-style: italic;
                        font-size: 0.95rem;
                      }
                      .timeline {
                        position: relative;
                        padding-left: 3rem;
                      }
                      .timeline-item {
                        position: relative;
                        margin-bottom: 2rem;
                      }
                      .timeline-item:last-child {
                        margin-bottom: 0;
                      }
                      .step-number {
                        position: absolute;
                        left: -3rem;
                        top: 0;
                        width: 2rem;
                        height: 2rem;
                        border-radius: 50%;
                        background-color: var(--witcher-gold-dimmer);
                        border: 1px solid var(--witcher-gold-dim);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Cinzel', serif;
                        color: var(--witcher-gold);
                        font-size: 0.875rem;
                        z-index: 10;
                      }
                      .timeline-line {
                        position: absolute;
                        left: -2rem;
                        top: 2rem;
                        bottom: -2rem;
                        width: 1px;
                        background-color: var(--witcher-gold-dim);
                      }
                      .timeline-item:last-child .timeline-line {
                        display: none;
                      }
                      .quest-card {
                        background-color: rgba(0,0,0,0.4);
                        border: 1px solid var(--witcher-gold-dim);
                        border-radius: 0.5rem;
                        padding: 1.5rem;
                      }
                      .quest-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 1rem;
                      }
                      .quest-title-wrapper {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                      }
                      .priority-dot {
                        width: 0.5rem;
                        height: 0.5rem;
                        border-radius: 50%;
                      }
                      .priority-Alta .priority-dot { background-color: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.8); }
                      .priority-Média .priority-dot { background-color: #eab308; box-shadow: 0 0 8px rgba(234,179,8,0.8); }
                      .priority-Baixa .priority-dot { background-color: #3b82f6; box-shadow: 0 0 8px rgba(59,130,246,0.8); }
                      
                      .quest-title {
                        font-size: 1.25rem;
                        color: #fff;
                        margin: 0;
                        font-weight: 400;
                      }
                      .priority-badge {
                        padding: 0.25rem 0.75rem;
                        border-radius: 0.25rem;
                        font-size: 0.625rem;
                        text-transform: uppercase;
                        font-weight: 700;
                        letter-spacing: 0.1em;
                      }
                      .priority-Alta .priority-badge { background-color: rgba(127,29,29,0.4); color: #fecaca; border: 1px solid rgba(239,68,68,0.3); }
                      .priority-Média .priority-badge { background-color: rgba(113,63,18,0.4); color: #fef08a; border: 1px solid rgba(234,179,8,0.3); }
                      .priority-Baixa .priority-badge { background-color: rgba(30,58,138,0.4); color: #bfdbfe; border: 1px solid rgba(59,130,246,0.3); }
                      
                      .quest-meta {
                        display: flex;
                        gap: 1rem;
                        font-size: 0.75rem;
                        color: rgba(197, 160, 89, 0.6);
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        margin-bottom: 1rem;
                      }
                      .quest-details p {
                        font-size: 0.875rem;
                        color: #d1d5db;
                        margin: 0 0 0.75rem 0;
                      }
                      .quest-details p:last-child {
                        margin-bottom: 0;
                      }
                      .quest-details strong {
                        color: var(--witcher-gold);
                        font-weight: 600;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h1>Painel do Caçador</h1>
                      <p class="humor">"${analysis.humor}"</p>
                    </div>
                    
                    ${analysis.orderJustification ? `
                    <div class="parchment-card">
                      <h2 class="section-title">Justificativa da Rota</h2>
                      <p class="justification">${analysis.orderJustification}</p>
                    </div>
                    ` : ''}
                    
                    <div class="parchment-card">
                      <h2 class="section-title">Trilha do Destino (Ordem Exata)</h2>
                      <div class="timeline">
                        ${(analysis.recommendedSequence || []).map((questId, i) => {
                          const rec = (analysis.recommendations || []).find(r => r.questId === questId);
                          const quest = quests.find(q => q.id === questId);
                          if (!rec || !quest) return '';
                          
                          return `
                            <div class="timeline-item priority-${rec.priority}">
                              <div class="step-number">${i + 1}</div>
                              <div class="timeline-line"></div>
                              <div class="quest-card">
                                <div class="quest-header">
                                  <div class="quest-title-wrapper">
                                    <div class="priority-dot"></div>
                                    <h3 class="quest-title cinzel">${quest.name || 'Missão Sem Nome'}</h3>
                                  </div>
                                  <span class="priority-badge">Prioridade ${rec.priority}</span>
                                </div>
                                <div class="quest-meta">
                                  <span>${quest.type || 'N/A'}</span>
                                  <span>•</span>
                                  <span>Nível ${quest.level || '?'}</span>
                                  ${quest.location ? `<span>•</span><span>${quest.location}</span>` : ''}
                                </div>
                                <div class="quest-details">
                                  <p><strong>Motivo:</strong> ${rec.reason}</p>
                                  <p><strong>Próximos Passos:</strong> ${rec.nextSteps}</p>
                                </div>
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  </body>
                  </html>
                `;
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'witcher3_caminho_do_destino.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
              title="Salvar Caminho do Destino (HTML)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                const text = `
                  WITCHER 3 QUEST MASTER - PAINEL DO CAÇADOR
                  Nível: ${userData.level}
                  Missões: ${analysis.summary?.main || 0} Principais, ${analysis.summary?.secondary || 0} Secundárias
                  Recomendação: ${(analysis.recommendations || [])[0]?.reason || 'N/A'}
                `;
                navigator.clipboard.writeText(text);
                alert("Relatório copiado!");
              }}
              className="px-4 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (confirm("Deseja meditar e limpar esta análise?")) {
                  setAnalysis(null);
                  setQuests([]);
                  setImages([]);
                  setCurrentStep('INPUT');
                }
              }}
              className="px-4 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
              title="Meditar (Reset)"
            >
              <Wind className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentStep('CONFIRM')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm whitespace-nowrap">Atualizar Dados</button>
          </div>
        </div>
      </div>

      {renderQuestInfographic()}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="parchment-card p-6 flex items-center gap-4">
          <div className="p-3 bg-witcher-gold/10 rounded-full"><Skull className="text-witcher-gold" /></div>
          <div>
            <p className="text-xs uppercase text-witcher-gold/60">Nível Geralt</p>
            <p className="text-2xl font-bold">{userData.level}</p>
          </div>
        </div>
        <div className="parchment-card p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-full"><Sword className="text-blue-400" /></div>
          <div>
            <p className="text-xs uppercase text-blue-400/60">Principais</p>
            <p className="text-2xl font-bold">{analysis.summary?.main || 0}</p>
          </div>
        </div>
        <div className="parchment-card p-6 flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-full"><Scroll className="text-green-400" /></div>
          <div>
            <p className="text-xs uppercase text-green-400/60">Secundárias</p>
            <p className="text-2xl font-bold">{analysis.summary?.secondary || 0}</p>
          </div>
        </div>
        <div className="parchment-card p-6 flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-full"><ShieldAlert className="text-red-400" /></div>
          <div>
            <p className="text-xs uppercase text-red-400/60">Contratos</p>
            <p className="text-2xl font-bold">{analysis.summary?.contracts || 0}</p>
          </div>
        </div>
      </div>

      {/* Humorous Quote */}
      <div className="parchment-card p-6 border-l-4 border-l-witcher-gold italic text-lg text-center">
        "{analysis.humor}"
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Recommendations */}
        <div className="lg:col-span-2 space-y-8">
          {analysis.orderJustification && (
            <section className="parchment-card p-8 border-witcher-gold/30 bg-black/40">
              <h2 className="text-2xl mb-4 flex items-center gap-3 text-witcher-gold">
                <Scroll className="w-6 h-6" /> Justificativa da Rota
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed italic">
                {analysis.orderJustification}
              </p>
            </section>
          )}

          {filteredRecommendations.length > 0 && (
            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <MapIcon className="w-8 h-8" /> Trilha do Destino (Ordem Exata)
              </h2>
              <div className="space-y-6">
                {filteredRecommendations.map((rec, i) => {
                  const quest = quests.find(q => q.id === rec.questId);
                  if (!quest) return null;
                  
                  return (
                    <div key={i} className="relative pl-12 group">
                      {/* Step Number Indicator */}
                      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-witcher-gold/20 border border-witcher-gold/40 flex items-center justify-center font-cinzel text-witcher-gold text-sm z-10">
                        {i + 1}
                      </div>
                      {/* Vertical Line Connector */}
                      {i < filteredRecommendations.length - 1 && (
                        <div className="absolute left-4 top-8 w-px h-full bg-witcher-gold/20" />
                      )}

                      <div className="p-5 border border-witcher-gold/20 rounded-lg bg-black/40 hover:border-witcher-gold/60 transition-all shadow-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              rec.priority === 'Alta' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 
                              rec.priority === 'Média' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 
                              'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                            }`} />
                            <h3 className="text-xl text-white font-cinzel group-hover:text-witcher-gold transition-colors cursor-pointer" onClick={() => setSelectedQuest(quest)}>
                              {quest.name || 'Missão Sem Nome'}
                            </h3>
                          </div>
                          <span className={`px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest ${
                            rec.priority === 'Alta' ? 'bg-red-900/40 text-red-200 border border-red-500/30' : 
                            rec.priority === 'Média' ? 'bg-yellow-900/40 text-yellow-200 border border-yellow-500/30' : 
                            'bg-blue-900/40 text-blue-200 border border-blue-500/30'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-4 leading-relaxed">{rec.reason}</p>
                        <div className="flex items-center gap-3 p-3 bg-witcher-gold/5 rounded border border-witcher-gold/10">
                          <ChevronRight className="w-5 h-5 text-witcher-gold shrink-0" />
                          <p className="text-sm font-bold text-witcher-gold">
                            <span className="uppercase text-[10px] tracking-tighter opacity-70 mr-2">O que fazer agora:</span>
                            {rec.nextSteps}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(analysis.interconnections || []).length > 0 && (
            <section className="parchment-card p-8 border-blue-900/30">
              <h2 className="text-3xl mb-6 flex items-center gap-3 text-blue-400">
                <Zap className="w-8 h-8" /> Interligações e Dependências
              </h2>
              <div className="space-y-4">
                {(analysis.interconnections || []).map((inter, i) => (
                  <div key={i} className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {inter.quests.map((qId, j) => {
                        const q = quests.find(quest => quest.id === qId);
                        return (
                          <span key={j} className="px-2 py-1 bg-blue-900/40 text-blue-200 text-[10px] rounded border border-blue-500/30">
                            {q?.name || 'Missão'}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed italic">
                      <Info className="w-4 h-4 inline mr-2 text-blue-400" />
                      {inter.advice}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredChoices.length > 0 && (
            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <Eye className="w-8 h-8" /> Guia de Escolhas e Diálogos
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredChoices.map((choice, i) => {
                  const quest = quests.find(q => q.id === choice.questId);
                  if (!quest) return null;
                  return (
                    <div key={i} className="p-4 bg-black/30 rounded border border-witcher-gold/10 hover:border-witcher-gold/40 transition-all cursor-pointer group" onClick={() => setSelectedQuest(quest)}>
                      <h4 className="text-witcher-gold font-bold mb-2 group-hover:text-white transition-colors">
                        {quest.name || 'Missão Sem Nome'}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="w-1 h-auto bg-green-500/50 rounded-full" />
                          <p className="text-sm text-gray-300"><span className="text-green-400 font-bold">Melhor Escolha:</span> {choice.advice}</p>
                        </div>
                        {userData.spoilerTolerance !== 'None' && (
                          <div className="flex gap-2">
                            <div className="w-1 h-auto bg-blue-500/50 rounded-full" />
                            <p className="text-xs text-gray-500 italic"><span className="text-blue-400 font-bold not-italic">Consequência:</span> {choice.consequences}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {filteredCombat && filteredCombat.length > 0 && (
            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <Sword className="w-8 h-8" /> Estratégia de Combate
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredCombat.map((tip, i) => {
                  const quest = quests.find(q => q.id === tip.questId);
                  if (!quest) return null;
                  return (
                    <div key={i} className="p-4 bg-black/30 rounded border border-witcher-gold/10 hover:border-witcher-gold/40 transition-all cursor-pointer group" onClick={() => setSelectedQuest(quest)}>
                      <h4 className="text-witcher-gold font-bold mb-3 group-hover:text-white transition-colors">
                        {quest.name || 'Missão Sem Nome'}
                      </h4>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 bg-witcher-gold/5 rounded border border-witcher-gold/10">
                          <p className="text-[8px] uppercase text-witcher-gold/60">Óleo</p>
                          <p className="text-[10px] font-bold truncate">{tip.bestOils}</p>
                        </div>
                        <div className="text-center p-2 bg-witcher-gold/5 rounded border border-witcher-gold/10">
                          <p className="text-[8px] uppercase text-witcher-gold/60">Poção</p>
                          <p className="text-[10px] font-bold truncate">{tip.bestPotions}</p>
                        </div>
                        <div className="text-center p-2 bg-witcher-gold/5 rounded border border-witcher-gold/10">
                          <p className="text-[8px] uppercase text-witcher-gold/60">Sinal</p>
                          <p className="text-[10px] font-bold truncate">{tip.bestSigns}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed"><span className="text-witcher-gold font-bold">Estratégia:</span> {tip.strategy}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {filteredRecommendations.length === 0 && filteredChoices.length === 0 && filteredCombat?.length === 0 && searchQuery && (
            <div className="parchment-card p-12 text-center">
              <Skull className="w-12 h-12 text-witcher-gold/20 mx-auto mb-4" />
              <p className="text-gray-500 italic">Nenhum rastro encontrado para "{searchQuery}" nestas terras.</p>
            </div>
          )}
        </div>

        {/* Sidebar: Warnings & Info */}
        <div className="space-y-8">
          <section className="parchment-card p-6 border-red-900/50">
            <h2 className="text-2xl mb-4 flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-6 h-6" /> Avisos Críticos
            </h2>
            <div className="space-y-4">
              {analysis.warnings && analysis.warnings.length > 0 ? analysis.warnings.map((warn, i) => {
                const quest = quests.find(q => q.id === warn.questId);
                return (
                  <div key={i} className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg shadow-inner cursor-pointer" onClick={() => quest && setSelectedQuest(quest)}>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <p className="text-xs font-bold text-red-400 uppercase tracking-widest">
                        {warn.type === 'Missable' ? 'Pode ser Perdida' : 'Sensível ao Tempo'}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{quest?.name || 'Missão Crítica'}</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{warn.message}</p>
                  </div>
                );
              }) : (
                <div className="p-4 bg-green-900/10 border border-green-900/30 rounded-lg text-center">
                  <p className="text-sm text-green-500/70 italic">Nenhum aviso crítico. O caminho está limpo... por enquanto.</p>
                </div>
              )}
            </div>
          </section>

          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <MapIcon className="w-6 h-6" /> Destaques do Mapa
            </h2>
            <div className="space-y-3">
              {analysis.mapHighlights && analysis.mapHighlights.length > 0 ? analysis.mapHighlights.map((highlight, i) => (
                <div key={i} className="p-3 bg-witcher-gold/5 border border-witcher-gold/10 rounded">
                  <p className="text-xs font-bold text-witcher-gold uppercase mb-1">{highlight.location}</p>
                  <p className="text-sm font-bold text-white mb-1">{highlight.interest}</p>
                  <p className="text-xs text-gray-400">{highlight.description}</p>
                </div>
              )) : (
                <p className="text-xs text-gray-500 italic">Nenhum destaque mapeado para esta região.</p>
              )}
            </div>
          </section>

          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6" /> Oportunidades de Gwent
            </h2>
            <div className="space-y-3">
              {(filteredGwent || []).map((tip, i) => (
                <div key={i} className="p-3 bg-blue-900/10 border border-blue-500/20 rounded hover:border-blue-400 transition-all">
                  <p className="text-xs font-bold text-blue-400 uppercase mb-1">{tip.location}</p>
                  <p className="text-sm font-bold text-white mb-1">{tip.player}</p>
                  <p className="text-xs text-gray-400"><span className="text-witcher-gold">Recompensa:</span> {tip.reward}</p>
                  {tip.strategy && <p className="text-[10px] text-gray-300 mt-2 italic"><span className="text-blue-400 not-italic font-bold">Estratégia:</span> {tip.strategy}</p>}
                  <p className="text-[10px] text-blue-400/60 mt-1">Dificuldade: {tip.difficulty}</p>
                </div>
              ))}
              {(!filteredGwent || filteredGwent.length === 0) && (
                <p className="text-xs text-gray-500 italic">Nenhuma carta rara à vista...</p>
              )}
            </div>
          </section>

          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6" /> Conselhos de Build (Nv. {userData.level})
            </h2>
            <div className="space-y-3">
              {analysis.buildAdvice?.map((advice, i) => (
                <div key={i} className="p-3 bg-witcher-gold/5 border border-witcher-gold/10 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      advice.category === 'Combate' ? 'bg-red-500' : 
                      advice.category === 'Sinais' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <p className="text-xs font-bold text-white uppercase">{advice.skill}</p>
                  </div>
                  <p className="text-xs text-gray-400">{advice.reason}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="parchment-card p-6">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <Info className="w-6 h-6" /> Dicas de Witcher
            </h2>
            <ul className="text-sm space-y-3 text-gray-400">
              {analysis.generalTips && analysis.generalTips.length > 0 ? analysis.generalTips.map((tip, i) => (
                <li key={i} className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> {tip}</li>
              )) : (
                <>
                  <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> Sempre verifique o quadro de avisos em novas vilas.</li>
                  <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> Óleos e poções são a diferença entre a vida e a morte.</li>
                  <li className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> Algumas missões secundárias falham se você avançar muito na história principal.</li>
                </>
              )}
            </ul>
          </section>

          <button 
            onClick={() => setCurrentStep('INPUT')}
            className="w-full py-4 border border-witcher-gold/30 rounded font-cinzel hover:bg-witcher-gold/10 transition-all"
          >
            Nova Análise
          </button>
        </div>
      </div>
    </motion.div>
  );
};
