import React from 'react';
import { motion } from 'motion/react';
import { Sword, Scroll, Map as MapIcon, Trophy, Skull, Search, User, ChevronRight } from 'lucide-react';
import { AppMode, Step } from '../types';
import backgroundImage from '../witcher-3-4k-hanged-man-s-tree-3klyvhf64cpx4qmh.jpg';

interface MainMenuProps {
  setAppMode: (mode: AppMode) => void;
  setCurrentStep: (step: Step) => void;
  handleReset: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ setAppMode, setCurrentStep, handleReset }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[100] flex items-center px-12 md:px-24 overflow-hidden"
    >
      {/* Image Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="w-full h-full -scale-x-100">
          <img
            src={backgroundImage}
            alt="The Witcher 3 Background"
            className="w-full h-full object-cover opacity-100 brightness-105 contrast-110 saturate-110 ken-burns"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent z-10" />
      </div>

      {/* Immersive Layers */}
      <div className="vignette" />
      <div className="fog-container">
        <div className="fog-layer" />
        <div className="fog-layer-2" />
      </div>

      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(197,160,89,0.15)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(139,0,0,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
        
        {/* Embers */}
        {[...Array(30)].map((_, i) => (
          <div 
            key={i} 
            className="ember" 
            style={{ 
              '--left': `${Math.random() * 100}%`, 
              '--duration': `${8 + Math.random() * 12}s`, 
              '--delay': `${Math.random() * 10}s` 
            } as React.CSSProperties} 
          />
        ))}
      </div>

      <div className="relative z-30 flex flex-col space-y-12 max-w-2xl">
        <div className="space-y-2">
          <h1 
            className="text-6xl md:text-8xl font-cinzel text-witcher-gold tracking-tighter pulse-gold"
            style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.9), 0 0 20px rgba(197,160,89,0.4)' }}
          >
            WITCHER 3
          </h1>
          <p 
            className="text-xl md:text-2xl font-cinzel text-witcher-gold/90 tracking-[0.3em] uppercase ml-2"
            style={{ textShadow: '1px 2px 5px rgba(0,0,0,0.9)' }}
          >
            Master Companion
          </p>
        </div>

        <div className="flex flex-col items-start space-y-4">
          {[
            { id: 'PROFILE', label: 'Perfil do Bruxo', step: 'PROFILE_DASHBOARD', icon: <User className="w-6 h-6" /> },
            { id: 'QUESTS', label: 'Mestre de Missões', step: 'INPUT', icon: <Scroll className="w-6 h-6" /> },
            { id: 'MERCHANT', label: 'Mestre Mercador', step: 'MERCHANT_INPUT', icon: <MapIcon className="w-6 h-6" /> },
            { id: 'GWENT', label: 'Estrategista de Gwent', step: 'GWENT_INPUT', icon: <Trophy className="w-6 h-6" /> },
            { id: 'BESTIARY', label: 'Mestre do Bestiário', step: 'BESTIARY_INPUT', icon: <Skull className="w-6 h-6" /> },
            { id: 'GEAR', label: 'Mestre Armeiro', step: 'GEAR_INPUT', icon: <Sword className="w-6 h-6" /> },
            { id: 'FINDER', label: 'Mestre Rastreador', step: 'FINDER_INPUT', icon: <Search className="w-6 h-6" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setAppMode(item.id as AppMode);
                setCurrentStep(item.step as Step);
              }}
              className="group flex items-center gap-6 text-2xl md:text-3xl font-cinzel text-gray-200 hover:text-white transition-all duration-300 relative py-2"
              style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-witcher-gold absolute -left-10">
                <ChevronRight className="w-8 h-8" />
              </span>
              <span className="group-hover:translate-x-4 transition-transform flex items-center gap-4">
                <span className="text-witcher-gold/40 group-hover:text-witcher-gold transition-colors">{item.icon}</span>
                {item.label}
              </span>
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-witcher-gold to-transparent group-hover:w-full transition-all duration-500 shadow-[0_0_10px_rgba(197,160,89,0.5)]" />
            </button>
          ))}

          <div className="pt-12 flex flex-col items-start space-y-4">
            <button
              onClick={handleReset}
              className="group flex items-center gap-4 text-lg font-cinzel text-red-900/60 hover:text-red-500 transition-all duration-300"
            >
              <Skull className="w-5 h-5" /> Meditar (Reset)
            </button>
            
            <p className="text-[10px] font-cinzel text-witcher-gold/20 tracking-widest uppercase pt-8">
              Next-Gen Edition v4.0+ • AI Companion
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
