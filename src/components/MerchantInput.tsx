import React from 'react';
import { motion } from 'motion/react';
import { Upload, Trash2, Plus, Trophy, Map as MapIcon, ChevronRight, Loader2 } from 'lucide-react';

interface MerchantInputProps {
  merchantImages: string[];
  setMerchantImages: React.Dispatch<React.SetStateAction<string[]>>;
  merchantLocation: string;
  setMerchantLocation: (loc: string) => void;
  extractMerchantItems: () => void;
  isLoading: boolean;
  error: string | null;
}

export const MerchantInput: React.FC<MerchantInputProps> = ({
  merchantImages,
  setMerchantImages,
  merchantLocation,
  setMerchantLocation,
  extractMerchantItems,
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
        <h1 className="text-5xl font-bold">Mestre Mercador</h1>
        <p className="text-witcher-gold/70 italic">"Ouro não compra felicidade, mas compra a melhor espada de prata de Novigrad."</p>
      </div>

      <div className="parchment-card p-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl flex items-center gap-2">
            <Upload className="w-6 h-6" /> 1. Capturas do Inventário
          </h2>
          <p className="text-sm text-gray-400">Envie imagens do seu inventário (armas, armaduras, itens de missões, lixo).</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {merchantImages.map((img, i) => (
              <div key={i} className="relative group aspect-video rounded border border-witcher-gold/30 overflow-hidden">
                <img src={img} alt="Upload" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setMerchantImages(prev => prev.filter((_, idx) => idx !== i))}
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
                    reader.onloadend = () => setMerchantImages(prev => [...prev, reader.result as string]);
                    reader.readAsDataURL(file);
                  });
                }} 
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl flex items-center gap-2">
            <MapIcon className="w-6 h-6" /> 2. Onde você está agora?
          </h2>
          <p className="text-sm text-gray-400">Isso ajuda o Mestre a encontrar os mercadores mais próximos e decidir se você deve segurar itens para regiões futuras.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['Pomar Branco', 'Velen', 'Novigrad', 'Skellige', 'Kaer Morhen', 'Toussaint'].map(loc => (
              <button
                key={loc}
                onClick={() => setMerchantLocation(loc)}
                className={`p-3 border rounded text-sm transition-all ${
                  merchantLocation === loc 
                    ? 'bg-witcher-gold text-black border-witcher-gold font-bold shadow-lg' 
                    : 'border-witcher-gold/30 hover:bg-witcher-gold/10'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </section>

        <div className="pt-4 flex justify-center">
          <button 
            onClick={extractMerchantItems}
            disabled={merchantImages.length === 0 || isLoading}
            className="witcher-button flex items-center gap-3 px-12"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            Analisar Economia
          </button>
        </div>
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      </div>
    </motion.div>
  );
};
