import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Trash2, Plus, Sword, Eye, ChevronRight, Loader2, Skull, CheckCircle2 } from 'lucide-react';
import { UserData } from '../types';

interface QuestInputProps {
  images: string[];
  removeImage: (index: number) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  userData: UserData;
  updateUserData: (newData: Partial<UserData>) => void;
  runOCR: () => void;
  isLoading: boolean;
  error: string | null;
}

export const QuestInput: React.FC<QuestInputProps> = ({
  images,
  removeImage,
  handleImageUpload,
  userData,
  updateUserData,
  runOCR,
  isLoading,
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full border-2 border-witcher-gold/30 bg-witcher-gold/10">
            <Skull className="w-12 h-12 text-witcher-gold" />
          </div>
        </div>
        <h1 className="text-5xl font-bold">Witcher 3 Quest Master</h1>
        <p className="text-witcher-gold/70 italic">"O destino é uma espada de dois gumes... e eu sou um dos gumes."</p>
      </div>

      <div className="parchment-card p-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl flex items-center gap-2">
            <Upload className="w-6 h-6" /> 1. Capturas de Tela
          </h2>
          <p className="text-sm text-gray-400">Envie imagens do seu Log de Missões, Mapa e Objetivos Atuais.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-video rounded border border-witcher-gold/30 overflow-hidden">
                <img src={img} alt="Upload" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 p-1 bg-red-900/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-witcher-gold/30 rounded cursor-pointer hover:bg-witcher-gold/5 transition-colors relative">
              <Plus className="w-8 h-8 text-witcher-gold/50" />
              <span className="text-xs text-witcher-gold/50 mt-2 text-center px-2">Adicionar ou Colar (Ctrl+V)</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="space-y-4">
            <h2 className="text-2xl flex items-center gap-2">
              <Sword className="w-6 h-6" /> 2. Status de Geralt
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-witcher-gold/60">Nível Atual</label>
                <input 
                  type="number" 
                  value={userData.level} 
                  onChange={e => updateUserData({ level: parseInt(e.target.value) })}
                  className="witcher-input w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-witcher-gold/60">Localização</label>
                <input 
                  type="text" 
                  placeholder="Ex: Velen, Novigrad..."
                  value={userData.location} 
                  onChange={e => updateUserData({ location: e.target.value })}
                  className="witcher-input w-full"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl flex items-center gap-2">
              <Eye className="w-6 h-6" /> 3. Preferências
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-witcher-gold/60">Tolerância a Spoilers</label>
                <select 
                  value={userData.spoilerTolerance}
                  onChange={e => updateUserData({ spoilerTolerance: e.target.value as any })}
                  className="witcher-input w-full"
                >
                  <option value="None">Sem Spoilers (Apenas Dicas)</option>
                  <option value="Minor">Dicas Leves (Consequências)</option>
                  <option value="Full">Spoilers Totais (Decisões)</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                {Object.entries(userData.toggles).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={val} 
                      onChange={() => updateUserData({ 
                        toggles: { ...userData.toggles, [key]: !val } 
                      })}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded border border-witcher-gold/50 flex items-center justify-center transition-colors ${val ? 'bg-witcher-gold' : 'bg-transparent'}`}>
                      {val && <CheckCircle2 className="w-4 h-4 text-witcher-dark" />}
                    </div>
                    <span className="text-sm capitalize">{key === 'main' ? 'Principais' : key === 'secondary' ? 'Secundárias' : 'Contratos'}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="pt-4 flex justify-center">
          <button 
            onClick={runOCR}
            disabled={images.length === 0 || isLoading}
            className="witcher-button flex items-center gap-3 px-12"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            Iniciar Extração de Missões
          </button>
        </div>
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      </div>
    </motion.div>
  );
};
