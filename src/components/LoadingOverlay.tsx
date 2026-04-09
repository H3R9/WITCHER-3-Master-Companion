import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Skull } from 'lucide-react';
import { Step, AppMode } from '../types';

export const LoadingOverlay = ({ currentStep, appMode }: { currentStep: Step, appMode: AppMode }) => {
  const questPhrases = [
    "Meditando para recuperar vigor...",
    "Consultando o Bestiário...",
    "Afiando as espadas de prata e aço...",
    "Preparando elixires de inteligência...",
    "Rastreando o destino nas estrelas...",
    "Evitando portais (eu odeio portais)..."
  ];
  const merchantPhrases = [
    "Contando coroas de Novigrad...",
    "Avaliando a pureza do minério de prata...",
    "Negociando com mercadores de Velen...",
    "Desmontando armaduras pesadas...",
    "Procurando o melhor preço por couro de monstro...",
    "Escondendo ouro do coletor de impostos..."
  ];
  const gwentPhrases = [
    "Embaralhando as cartas...",
    "Desafiando o estalajadeiro...",
    "Escondendo espiões no baralho...",
    "Limpando o tabuleiro com Geada...",
    "Calculando a força total..."
  ];
  const bestiaryPhrases = [
    "Consultando o Bestiário de Oxenfurt...",
    "Avaliando fraquezas elementais...",
    "Preparando a bomba de Colmeia...",
    "Afiando a lâmina de prata...",
    "Estudando padrões de ataque...",
    "Evitando o hálito de um Dragão..."
  ];
  const gearPhrases = [
    "Afiando as ferramentas do armeiro...",
    "Consultando diagramas antigos...",
    "Derretendo minério de meteorito...",
    "Costurando couro de monstro...",
    "Buscando o mestre ferreiro em Novigrad...",
    "Polindo a armadura do Lobo..."
  ];
  const finderPhrases = [
    "Farejando rastros com sentidos de bruxo...",
    "Consultando informantes em Novigrad...",
    "Procurando rotas de contrabando em Skellige...",
    "Analisando o mercado negro de Velen...",
    "Seguindo as pegadas no lodo..."
  ];
  const loadingPhrases = appMode === 'QUESTS' ? questPhrases : (appMode === 'MERCHANT' ? merchantPhrases : (appMode === 'GWENT' ? gwentPhrases : (appMode === 'BESTIARY' ? bestiaryPhrases : (appMode === 'FINDER' ? finderPhrases : gearPhrases))));
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIdx(prev => (prev + 1) % loadingPhrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loadingPhrases.length]);

  const isAnalyzing = currentStep === 'OCR' || currentStep === 'MERCHANT_OCR' || currentStep === 'GWENT_OCR' || currentStep === 'BESTIARY_OCR' || currentStep === 'GEAR_OCR' || currentStep === 'FINDER_OCR';
  
  if (!isAnalyzing) return null;

  const signs = [
    { sign: 'Aard', color: 'text-blue-400', delay: 0 },
    { sign: 'Igni', color: 'text-red-500', delay: 2 },
    { sign: 'Yrden', color: 'text-purple-500', delay: 4 },
    { sign: 'Quen', color: 'text-yellow-500', delay: 6 },
    { sign: 'Axii', color: 'text-green-500', delay: 8 }
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center space-y-8">
      <div className="relative">
        <div className="absolute inset-0 animate-ping opacity-20 bg-witcher-gold rounded-full blur-2xl" />
        <Loader2 className="w-24 h-24 text-witcher-gold animate-spin opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <motion.div
            animate={{ 
              rotate: [0, 72, 144, 216, 288, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <Skull className="w-12 h-12 text-witcher-gold drop-shadow-[0_0_10px_rgba(197,160,89,0.5)]" />
          </motion.div>
        </div>
        
        {/* Floating Signs */}
        <div className="absolute -inset-12 pointer-events-none">
          {signs.map((s, i) => (
            <motion.div
              key={i}
              className={`absolute font-cinzel font-bold text-xs ${s.color} opacity-0`}
              animate={{
                opacity: [0, 1, 0],
                y: [0, -40],
                x: [0, Math.sin(i) * 20],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: s.delay,
                ease: "easeInOut"
              }}
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-10px',
                marginTop: '-10px'
              }}
            >
              {s.sign}
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="text-center space-y-4 max-w-md px-6">
        <h2 className="text-3xl font-cinzel text-witcher-gold tracking-[0.2em] uppercase">
          {currentStep.includes('ANALYSIS') || currentStep === 'OCR' ? 'Extraindo Segredos...' : 'Meditando...'}
        </h2>
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p 
              key={phraseIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-gray-400 italic text-lg"
            >
              {loadingPhrases[phraseIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
