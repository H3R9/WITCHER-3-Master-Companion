import React from 'react';
import { motion } from 'motion/react';
import { Upload, Trash2, Plus, ChevronRight, Loader2, Trophy } from 'lucide-react';

interface GwentInputProps {
  gwentImages: string[];
  setGwentImages: React.Dispatch<React.SetStateAction<string[]>>;
  extractGwentCards: () => void;
  isLoading: boolean;
  error: string | null;
}

export const GwentInput: React.FC<GwentInputProps> = ({
  gwentImages,
  setGwentImages,
  extractGwentCards,
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
            <Trophy className="w-12 h-12 text-witcher-gold" />
          </div>
        </div>
        <h1 className="text-5xl font-bold">Mestre de Gwent</h1>
        <p className="text-witcher-gold/70 italic">"Gwent não é apenas um jogo, é uma questão de vida ou morte... ou pelo menos de algumas coroas."</p>
      </div>

      <div className="parchment-card p-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl flex items-center gap-2">
            <Upload className="w-6 h-6" /> 1. Suas Cartas Disponíveis
          </h2>
          <p className="text-sm text-gray-400">Envie imagens das suas cartas (pode ser da tela de montagem do baralho onde aparecem todas as cartas que você possui).</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gwentImages.map((img, i) => (
              <div key={i} className="relative group aspect-video rounded border border-witcher-gold/30 overflow-hidden">
                <img src={img} alt="Upload" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setGwentImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 p-1 bg-red-900/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-witcher-gold/30 rounded cursor-pointer hover:bg-witcher-gold/5 transition-colors relative">
              <Plus className="w-8 h-8 text-witcher-gold/50" />
              <span className="text-xs text-witcher-gold/50 mt-2 text-center px-2">Adicionar ou Colar (Ctrl+V)</span>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  Array.from(files).forEach((file: File) => {
                    const reader = new FileReader();
                    reader.onloadend = () => setGwentImages(prev => [...prev, reader.result as string]);
                    reader.readAsDataURL(file);
                  });
                }} 
              />
            </label>
          </div>
        </section>

        <div className="pt-4 flex justify-center">
          <button 
            onClick={extractGwentCards}
            disabled={gwentImages.length === 0 || isLoading}
            className="witcher-button flex items-center gap-3 px-12"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            Montar Baralho Perfeito
          </button>
        </div>
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      </div>
    </motion.div>
  );
};
