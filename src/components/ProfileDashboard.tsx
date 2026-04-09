import React from 'react';
import { motion } from 'motion/react';
import { User, LogIn, LogOut } from 'lucide-react';
import { AppMode, Step, UserData } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface ProfileDashboardProps {
  user: FirebaseUser | null;
  userData: UserData;
  updateUserData: (newData: Partial<UserData>) => void;
  loginWithGoogle: () => void;
  logout: () => void;
  setAppMode: (mode: AppMode) => void;
  setCurrentStep: (step: Step) => void;
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({
  user,
  userData,
  updateUserData,
  loginWithGoogle,
  logout,
  setAppMode,
  setCurrentStep
}) => {
  const regions = ['Pomar Branco', 'Velen', 'Novigrad', 'Skellige', 'Kaer Morhen', 'Toussaint'];
  
  const toggleRegion = (region: string) => {
    updateUserData({
      accessibleLocations: userData.accessibleLocations.includes(region)
        ? userData.accessibleLocations.filter(r => r !== region)
        : [...userData.accessibleLocations, region]
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full border-2 border-witcher-gold/30 bg-witcher-gold/10">
            <User className="w-12 h-12 text-witcher-gold" />
          </div>
        </div>
        <h1 className="text-5xl font-bold">Perfil do Bruxo</h1>
        <p className="text-witcher-gold/70 italic">"Mantenha seus dados atualizados para análises mais precisas."</p>
        {!user ? (
          <button onClick={loginWithGoogle} className="witcher-button flex items-center gap-2 mx-auto mt-4">
            <LogIn className="w-5 h-5" /> Fazer Login para Salvar
          </button>
        ) : (
          <button onClick={logout} className="flex items-center gap-2 mx-auto mt-4 text-red-400 hover:text-red-300">
            <LogOut className="w-4 h-4" /> Sair da Conta
          </button>
        )}
      </div>

      <div className="parchment-card p-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl text-witcher-gold font-cinzel border-b border-witcher-gold/20 pb-2">Status Geral</h3>
            
            <div>
              <label className="block text-sm font-bold text-witcher-gold/80 uppercase tracking-wider mb-2">Nível Atual</label>
              <input type="number" min="1" max="100" value={userData.level} onChange={e => updateUserData({ level: parseInt(e.target.value) || 1 })} className="w-full bg-black/50 border border-witcher-gold/30 rounded p-3 text-white focus:border-witcher-gold outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-witcher-gold/80 uppercase tracking-wider mb-2">Coroas (Dinheiro)</label>
              <input type="number" min="0" value={userData.money} onChange={e => updateUserData({ money: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-witcher-gold/30 rounded p-3 text-white focus:border-witcher-gold outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-witcher-gold/80 uppercase tracking-wider mb-2">Localização Atual</label>
              <select value={userData.location} onChange={e => updateUserData({ location: e.target.value })} className="w-full bg-black/50 border border-witcher-gold/30 rounded p-3 text-white focus:border-witcher-gold outline-none">
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl text-witcher-gold font-cinzel border-b border-witcher-gold/20 pb-2">Regiões Desbloqueadas</h3>
            <div className="space-y-2">
              {regions.map(region => (
                <label key={region} className="flex items-center gap-3 p-3 bg-black/30 rounded border border-witcher-gold/10 cursor-pointer hover:bg-witcher-gold/5 transition-colors">
                  <input type="checkbox" checked={userData.accessibleLocations.includes(region)} onChange={() => toggleRegion(region)} className="w-5 h-5 rounded border-witcher-gold/30 bg-black/40 text-witcher-gold focus:ring-witcher-gold" />
                  <span className="text-gray-200">{region}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-witcher-gold/20 flex justify-center">
          <button onClick={() => { setAppMode(null as any); setCurrentStep('MAIN_MENU'); }} className="witcher-button px-12">
            Voltar ao Menu Principal
          </button>
        </div>
      </div>
    </motion.div>
  );
};
