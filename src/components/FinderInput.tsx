import React from 'react';
import { motion } from 'motion/react';
import { Search, MapIcon, Loader2 } from 'lucide-react';
import { UserData } from '../types';

interface FinderInputProps {
  finderQuery: string;
  setFinderQuery: (query: string) => void;
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  runFinderAnalysis: () => void;
  isLoading: boolean;
  error: string | null;
}

export const FinderInput: React.FC<FinderInputProps> = ({
  finderQuery,
  setFinderQuery,
  userData,
  updateUserData,
  runFinderAnalysis,
  isLoading,
  error
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full border-2 border-witcher-gold/30 bg-witcher-gold/10">
            <MapIcon className="w-12 h-12 text-witcher-gold" />
          </div>
        </div>
        <h1 className="text-5xl font-bold">Mestre Rastreador</h1>
        <p className="text-witcher-gold/70 italic">"O que você procura? Ingredientes, armaduras, comida ou um monstro específico?"</p>
      </div>

      <div className="parchment-card p-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl flex items-center gap-2">
            <Search className="w-6 h-6" /> O que você está buscando?
          </h2>
          <input 
            type="text"
            value={finderQuery}
            onChange={(e) => setFinderQuery(e.target.value)}
            placeholder="Ex: Carne crua, Gaivota Branca, Melhor comida nível 10..."
            className="w-full bg-black/50 border border-witcher-gold/30 rounded p-4 text-white focus:border-witcher-gold outline-none font-cinzel text-lg"
          />
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-witcher-gold/80 uppercase tracking-wider">Nível do Geralt</label>
            <input 
              type="number" 
              min="1" max="100"
              value={userData.level}
              onChange={(e) => updateUserData({ level: parseInt(e.target.value) || 1 })}
              className="w-full bg-black/50 border border-witcher-gold/30 rounded p-3 text-white focus:border-witcher-gold outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-witcher-gold/80 uppercase tracking-wider">Localização Atual</label>
            <select 
              value={userData.location}
              onChange={(e) => updateUserData({ location: e.target.value })}
              className="w-full bg-black/50 border border-witcher-gold/30 rounded p-3 text-white focus:border-witcher-gold outline-none"
            >
              <option value="">Desconhecida / Qualquer</option>
              <option value="Pomar Branco">Pomar Branco</option>
              <option value="Velen">Velen (Terra de Ninguém)</option>
              <option value="Novigrad">Novigrad</option>
              <option value="Skellige">Ilhas Skellige</option>
              <option value="Kaer Morhen">Kaer Morhen</option>
              <option value="Toussaint">Toussaint (Blood and Wine)</option>
            </select>
          </div>
        </section>

        <div className="pt-4 flex justify-center">
          <button 
            onClick={runFinderAnalysis}
            disabled={!finderQuery.trim() || isLoading}
            className="witcher-button flex items-center gap-3 px-12"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Rastrear
          </button>
        </div>
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      </div>
    </motion.div>
  );
};
