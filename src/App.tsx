/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sword, 
  Scroll, 
  Map as MapIcon, 
  ShieldAlert, 
  ChevronRight, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Loader2,
  Trash2,
  Plus,
  Eye,
  Skull,
  Search,
  Trophy,
  Zap,
  Share2,
  Wind,
  Shield,
  Hammer,
  RefreshCw,
  Droplet,
  Flame,
  Bomb,
  Activity,
  Crosshair,
  Download,
  User,
  Coins,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import backgroundImage from './witcher-3-4k-hanged-man-s-tree-3klyvhf64cpx4qmh.jpg';

// --- Types ---

type Step = 'MAIN_MENU' | 'INPUT' | 'OCR' | 'CONFIRM' | 'ANALYSIS' | 'DASHBOARD' | 
  'MERCHANT_INPUT' | 'MERCHANT_OCR' | 'MERCHANT_CONFIRM' | 'MERCHANT_ANALYSIS' | 'MERCHANT_DASHBOARD' | 
  'GWENT_INPUT' | 'GWENT_OCR' | 'GWENT_CONFIRM' | 'GWENT_ANALYSIS' | 'GWENT_DASHBOARD' | 
  'BESTIARY_INPUT' | 'BESTIARY_OCR' | 'BESTIARY_CONFIRM' | 'BESTIARY_ANALYSIS' | 'BESTIARY_DASHBOARD' | 
  'GEAR_INPUT' | 'GEAR_OCR' | 'GEAR_CONFIRM' | 'GEAR_ANALYSIS' | 'GEAR_DASHBOARD' | 
  'FINDER_INPUT' | 'FINDER_ANALYSIS' | 'FINDER_DASHBOARD' | 'PROFILE_DASHBOARD';
type AppMode = 'QUESTS' | 'MERCHANT' | 'GWENT' | 'BESTIARY' | 'GEAR' | 'FINDER' | 'PROFILE';

interface FinderAnalysisResult {
  itemName: string;
  description: string;
  bestLocations: {
    name: string;
    region: string;
    details: string;
    dropRate?: string;
  }[];
  stepByStepGuide: string[];
  alternatives: {
    name: string;
    reason: string;
  }[];
  requirements: string;
  tips: string[];
  humor: string;
}

interface GearAnalysisResult {
  schoolName: string;
  description: string;
  sets: {
    level: string;
    items: {
      name: string;
      location: string;
      requirements: string;
      stats: string[];
    }[];
  }[];
  craftingTips: string[];
  recommendedBuild: string;
  humor: string;
}

interface BestiaryAnalysisResult {
  monsterName: string;
  class: string;
  description: string;
  weaknesses: {
    name: string;
    type: 'Óleo' | 'Sinal' | 'Bomba' | 'Poção' | 'Outro';
    description: string;
  }[];
  combatStrategy: {
    phase: string;
    advice: string;
  }[];
  loot: {
    item: string;
    rarity: string;
    use: string;
  }[];
  lore: string;
  locations: string[];
  humor: string;
}

interface GwentAnalysisResult {
  faction: string;
  leaderCard: {
    name: string;
    ability: string;
  };
  deckComposition: {
    unitCards: { name: string; power: number; ability?: string; count: number }[];
    specialCards: { name: string; effect: string; count: number }[];
    heroCards: { name: string; power: number; ability?: string }[];
  };
  totalStrength: number;
  strategy: {
    title: string;
    description: string;
  };
  roundByRound: {
    round1: string;
    round2: string;
    round3: string;
  };
  synergies: {
    cards: string;
    effect: string;
  }[];
  humor: string;
}

interface MerchantAnalysisResult {
  itemsToSell: {
    name: string;
    targetMerchant: string;
    merchantLocation: string;
    reason: string;
    estimatedValue: string;
    strategy: 'Vender Agora' | 'Segurar para Depois';
    betterMerchantLater?: string;
  }[];
  itemsToDismantle: {
    name: string;
    yields: string;
    reason: string;
  }[];
  itemsToKeep: {
    name: string;
    reason: string;
  }[];
  economyTips: string[];
  bestMerchants: {
    name: string;
    location: string;
    specialty: string;
    why: string;
  }[];
  profitStrategies: {
    title: string;
    description: string;
  }[];
  humor: string;
}

interface Quest {
  id: string;
  name: string;
  type: 'Principal' | 'Secundária' | 'Contrato' | 'Caça ao Tesouro';
  status: 'Ativa' | 'Concluída' | 'Falhou';
  level: string;
  location?: string;
  notes: string;
}

interface ExtractedMerchantItem {
  id: string;
  name: string;
  quantity: string;
  type: string;
}

interface ExtractedGwentCard {
  id: string;
  name: string;
  type: string;
  power: string;
}

interface ExtractedGearItem {
  id: string;
  name: string;
  type: string;
  category?: string;
}

interface UserData {
  level: number;
  location: string;
  accessibleLocations: string[];
  money: number;
  spoilerTolerance: 'None' | 'Minor' | 'Full';
  toggles: {
    main: boolean;
    secondary: boolean;
    contracts: boolean;
  };
}

interface AnalysisResult {
  summary: {
    main: number;
    secondary: number;
    contracts: number;
  };
  orderJustification: string;
  recommendations: {
    questId: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    reason: string;
    nextSteps: string;
  }[];
  choices: {
    questId: string;
    advice: string;
    consequences: string;
  }[];
  warnings: {
    questId: string;
    type: 'Missable' | 'Time-Sensitive';
    message: string;
  }[];
  combatTips: {
    questId: string;
    bestOils: string;
    bestPotions: string;
    bestSigns: string;
    strategy: string;
  }[];
  gwentTips: {
    location: string;
    player: string;
    reward: string;
    difficulty: string;
    strategy?: string;
  }[];
  buildAdvice: {
    category: 'Combate' | 'Sinais' | 'Alquimia';
    skill: string;
    reason: string;
  }[];
  mapHighlights: {
    location: string;
    interest: string;
    description: string;
  }[];
  recommendedSequence: string[];
  interconnections?: {
    quests: string[];
    advice: string;
  }[];
  generalTips?: string[];
  humor: string;
}

// --- Constants ---

const WITCHER_GOLD = "#c5a059";

const parseJSON = (text: string, defaultValue: any) => {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    }
    return JSON.parse(cleaned || JSON.stringify(defaultValue));
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON response from AI");
  }
};

// --- Loading Component ---

const LoadingOverlay = ({ currentStep, appMode }: { currentStep: Step, appMode: AppMode }) => {
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
          {[
            { sign: 'Aard', color: 'text-blue-400', delay: 0 },
            { sign: 'Igni', color: 'text-red-500', delay: 2 },
            { sign: 'Yrden', color: 'text-purple-500', delay: 4 },
            { sign: 'Quen', color: 'text-yellow-500', delay: 6 },
            { sign: 'Axii', color: 'text-green-500', delay: 8 }
          ].map((s, i) => (
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

// --- Main App Component ---

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem('witcher_app_mode');
    return (saved as AppMode) || 'QUESTS';
  });
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    const saved = localStorage.getItem('witcher_current_step');
    return (saved as Step) || 'MAIN_MENU';
  });
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [images, setImages] = useState<string[]>([]);
  
  const [userData, setUserData] = useState<UserData>({
    level: 1,
    location: 'Pomar Branco',
    accessibleLocations: ['Pomar Branco'],
    money: 0,
    spoilerTolerance: 'None',
    toggles: { main: true, secondary: true, contracts: true }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        setUserData(data);
      } else {
        // Create initial profile
        setDoc(userRef, {
          ...userData,
          uid: user.uid,
          updatedAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });
    return () => unsubscribe();
  }, [user]);

  const updateUserData = async (newData: Partial<UserData>) => {
    const updated = { ...userData, ...newData };
    setUserData(updated);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          ...updated,
          uid: user.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };
  const [merchantImages, setMerchantImages] = useState<string[]>([]);
  const [merchantLocation, setMerchantLocation] = useState<string>('Pomar Branco');
  const [merchantItems, setMerchantItems] = useState<ExtractedMerchantItem[]>([]);
  const [merchantAnalysis, setMerchantAnalysis] = useState<MerchantAnalysisResult | null>(() => {
    const saved = localStorage.getItem('witcher_merchant_analysis');
    return saved ? JSON.parse(saved) : null;
  });
  const [gwentImages, setGwentImages] = useState<string[]>([]);
  const [gwentCards, setGwentCards] = useState<ExtractedGwentCard[]>([]);
  const [gwentAnalysis, setGwentAnalysis] = useState<GwentAnalysisResult | null>(() => {
    const saved = localStorage.getItem('witcher_gwent_analysis');
    return saved ? JSON.parse(saved) : null;
  });
  const [bestiaryImages, setBestiaryImages] = useState<string[]>([]);
  const [bestiaryTarget, setBestiaryTarget] = useState<string>('');
  const [bestiaryAnalysis, setBestiaryAnalysis] = useState<BestiaryAnalysisResult | null>(() => {
    const saved = localStorage.getItem('witcher_bestiary_analysis');
    return saved ? JSON.parse(saved) : null;
  });
  const [gearImages, setGearImages] = useState<string[]>([]);
  const [gearItems, setGearItems] = useState<ExtractedGearItem[]>([]);
  const [gearAnalysis, setGearAnalysis] = useState<GearAnalysisResult | null>(() => {
    const saved = localStorage.getItem('witcher_gear_analysis');
    return saved ? JSON.parse(saved) : null;
  });
  const [finderQuery, setFinderQuery] = useState<string>(() => localStorage.getItem('witcher_finder_query') || '');
  const [finderAnalysis, setFinderAnalysis] = useState<FinderAnalysisResult | null>(() => {
    const saved = localStorage.getItem('witcher_finder_analysis');
    return saved ? JSON.parse(saved) : null;
  });
  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('witcher_quests');
    return saved ? JSON.parse(saved) : [];
  });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => {
    const saved = localStorage.getItem('witcher_quest_analysis');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedObjectives, setCompletedObjectives] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('witcher_objectives');
    return saved ? JSON.parse(saved) : {};
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('witcher_app_mode', appMode);
    localStorage.setItem('witcher_current_step', currentStep);
    localStorage.setItem('witcher_finder_query', finderQuery);
    if (merchantAnalysis) localStorage.setItem('witcher_merchant_analysis', JSON.stringify(merchantAnalysis));
    if (gwentAnalysis) localStorage.setItem('witcher_gwent_analysis', JSON.stringify(gwentAnalysis));
    if (bestiaryAnalysis) localStorage.setItem('witcher_bestiary_analysis', JSON.stringify(bestiaryAnalysis));
    if (gearAnalysis) localStorage.setItem('witcher_gear_analysis', JSON.stringify(gearAnalysis));
    if (finderAnalysis) localStorage.setItem('witcher_finder_analysis', JSON.stringify(finderAnalysis));
    if (quests.length > 0) localStorage.setItem('witcher_quests', JSON.stringify(quests));
    if (analysis) localStorage.setItem('witcher_quest_analysis', JSON.stringify(analysis));
    localStorage.setItem('witcher_objectives', JSON.stringify(completedObjectives));
  }, [appMode, currentStep, finderQuery, merchantAnalysis, gwentAnalysis, bestiaryAnalysis, gearAnalysis, finderAnalysis, quests, analysis, completedObjectives]);

  const handleReset = () => {
    if (window.confirm('Deseja limpar todos os dados e meditar (recomeçar)?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // --- Logic ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const runOCR = async () => {
    if (images.length === 0) {
      setError("Por favor, envie pelo menos uma imagem.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('OCR');

    try {
      const parts = images.map(img => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: img.split(',')[1]
        }
      }));

      const prompt = `
        Você é um especialista em The Witcher 3 Next-Gen (v4.0+).
        Analise estas capturas de tela do log de missões e extraia todas as missões visíveis.
        
        ATENÇÃO - OTIMIZAÇÃO DE OCR PARA BAIXA QUALIDADE:
        - As imagens podem estar borradas, com artefatos de compressão ou muitos elementos visuais sobrepostos.
        - Use o CONTEXTO (ícones, formato do texto, objetivos) para deduzir palavras ilegíveis.
        - Se uma letra estiver confusa (ex: 'l' vs 'I', 'O' vs '0'), use o bom senso do vocabulário do jogo.
        - Ignore elementos da UI que não sejam missões (ex: botões de controle, dicas de tutorial).
        
        REGRAS:
        1. Extraia o nome EXATO da missão. Se o nome estiver ilegível, use o contexto dos objetivos para deduzir o nome real da missão no jogo. NUNCA retorne "Missão Desconhecida".
        2. Identifique o tipo: Principal, Secundária, Contrato ou Caça ao Tesouro.
        3. Identifique o status: Ativa, Concluída ou Falhou.
        4. Extraia o nível recomendado se estiver visível. Se o nível for "Várias localizações", deixe o nível vazio e coloque isso na localização.
        5. Extraia a localização/região da missão se for possível deduzir pelo nome ou contexto (ex: Velen, Novigrad, Skellige, Pomar Branco, Toussaint).
        6. Extraia o objetivo atual ou notas relevantes com o máximo de detalhe possível.

        Retorne um array JSON de objetos.
        
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview", 
        contents: { parts: [...parts, { text: prompt }] },
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["Principal", "Secundária", "Contrato", "Caça ao Tesouro"] },
                status: { type: Type.STRING, enum: ["Ativa", "Concluída", "Falhou"] },
                level: { type: Type.STRING },
                location: { type: Type.STRING },
                notes: { type: Type.STRING }
              },
              required: ["name", "type", "status", "level", "notes"]
            }
          }
        }
      });

      const result = parseJSON(response.text || "[]", []);
      setQuests(result.map((q: any, i: number) => ({ ...q, id: `q-${i}` })));
      setCurrentStep('CONFIRM');
    } catch (err) {
      console.error(err);
      setError("Erro ao processar imagens. Verifique sua conexão e tente novamente.");
      setCurrentStep('INPUT');
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentStep('ANALYSIS');

    try {
      const prompt = `
        Você é o Witcher 3 Quest Master Supremo, um especialista em todas as ramificações, dependências e condições de falha do jogo The Witcher 3 (v4.0+).
        Analise a seguinte lista de missões verificadas para um jogador de nível ${userData.level} em ${userData.location || 'local desconhecido'}.
        Tolerância a Spoilers: ${userData.spoilerTolerance}.

        DADOS DAS MISSÕES:
        ${JSON.stringify(quests)}

        REQUISITOS CRÍTICOS DE ESTRATÉGIA:
        1. PRIORIZAÇÃO AUTOMATIZADA: Crie uma sequência recomendada priorizando Missões Principais adequadas ao nível e localização atual, seguidas por Missões Secundárias e Contratos de Bruxo.
        2. PREVENÇÃO DE FALHAS (100% COMPLETION): Verifique rigorosamente se uma missão não cancela a outra. Missões perdíveis DEVEM ser priorizadas antes dos pontos de não retorno (point of no return).
        3. JUSTIFICATIVA DA ORDEM: Forneça uma justificativa clara para a ordem sugerida no campo "orderJustification", focando especialmente nas missões principais (se houver 5 ou mais, explique o fluxo entre elas).
        4. "nextSteps" DEVE ser uma instrução clara, estratégica e acionável.
        5. "recommendedSequence" DEVE ser um array com os IDs das missões na ordem exata de execução sugerida. Esta é a sua recomendação mestre.
        6. "interconnections" deve explicar como missões específicas se entrelaçam e qual a melhor forma de progredir nelas simultaneamente.

        Retorne um objeto JSON seguindo o esquema definido.
        
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.OBJECT,
                properties: {
                  main: { type: Type.NUMBER },
                  secondary: { type: Type.NUMBER },
                  contracts: { type: Type.NUMBER }
                },
                required: ["main", "secondary", "contracts"]
              },
              orderJustification: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questId: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["Alta", "Média", "Baixa"] },
                    reason: { type: Type.STRING },
                    nextSteps: { type: Type.STRING }
                  },
                  required: ["questId", "priority", "reason", "nextSteps"]
                }
              },
              recommendedSequence: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de IDs de missões na ordem exata sugerida para evitar perda de conteúdo."
              },
              interconnections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    quests: { type: Type.ARRAY, items: { type: Type.STRING } },
                    advice: { type: Type.STRING }
                  },
                  required: ["quests", "advice"]
                }
              },
              choices: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questId: { type: Type.STRING },
                    advice: { type: Type.STRING },
                    consequences: { type: Type.STRING }
                  },
                  required: ["questId", "advice", "consequences"]
                }
              },
              warnings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questId: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["Missable", "Time-Sensitive"] },
                    message: { type: Type.STRING }
                  },
                  required: ["questId", "type", "message"]
                }
              },
              combatTips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questId: { type: Type.STRING },
                    bestOils: { type: Type.STRING },
                    bestPotions: { type: Type.STRING },
                    bestSigns: { type: Type.STRING },
                    strategy: { type: Type.STRING }
                  },
                  required: ["questId", "bestOils", "bestPotions", "bestSigns", "strategy"]
                }
              },
              gwentTips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    location: { type: Type.STRING },
                    player: { type: Type.STRING },
                    reward: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    strategy: { type: Type.STRING }
                  },
                  required: ["location", "player", "reward", "difficulty", "strategy"]
                }
              },
              buildAdvice: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, enum: ["Combate", "Sinais", "Alquimia"] },
                    skill: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["category", "skill", "reason"]
                }
              },
              generalTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              mapHighlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    location: { type: Type.STRING },
                    interest: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["location", "interest", "description"]
                }
              },
              humor: { type: Type.STRING }
            },
            required: ["summary", "orderJustification", "recommendations", "recommendedSequence", "interconnections", "choices", "warnings", "combatTips", "gwentTips", "buildAdvice", "generalTips", "mapHighlights", "humor"]
          }
        }
      });

      const result = parseJSON(response.text || "{}", {});
      
      // Validação profunda para garantir que os IDs existem e os dados estão completos
      const validQuestIds = new Set(quests.map(q => q.id));
      
      result.recommendations = (result.recommendations || []).filter((r: any) => validQuestIds.has(r.questId));
      result.choices = (result.choices || []).filter((c: any) => validQuestIds.has(c.questId));
      result.warnings = (result.warnings || []).filter((w: any) => validQuestIds.has(w.questId));
      result.combatTips = (result.combatTips || []).filter((t: any) => validQuestIds.has(t.questId));
      result.gwentTips = result.gwentTips || [];
      result.buildAdvice = result.buildAdvice || [];
      result.mapHighlights = result.mapHighlights || [];
      result.recommendedSequence = (result.recommendedSequence || []).filter((id: string) => validQuestIds.has(id));
      result.interconnections = (result.interconnections || []).map((inter: any) => ({
        ...inter,
        quests: (inter.quests || []).filter((id: string) => validQuestIds.has(id))
      })).filter((inter: any) => inter.quests.length > 0);
      result.generalTips = result.generalTips || [];
      result.summary = result.summary || { main: 0, secondary: 0, contracts: 0 };

      setAnalysis(result);
      setCurrentStep('DASHBOARD');
    } catch (err) {
      console.error(err);
      setError("Erro na análise das missões. O destino é incerto...");
      setCurrentStep('CONFIRM');
    } finally {
      setIsLoading(false);
    }
  };

  const extractMerchantItems = async () => {
    if (merchantImages.length === 0) {
      setError("Por favor, envie pelo menos uma imagem do seu inventário.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('MERCHANT_OCR');

    try {
      const parts = merchantImages.map(img => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: img.split(',')[1]
        }
      }));

      const prompt = `
        Você é um especialista em The Witcher 3 Next-Gen (v4.0+).
        Analise estas capturas de tela do inventário de Geralt e extraia todos os itens visíveis.
        
        ATENÇÃO - OTIMIZAÇÃO DE OCR PARA BAIXA QUALIDADE:
        - As imagens podem estar borradas ou com muitos elementos visuais.
        - Use o CONTEXTO (ícones, formato do texto) para deduzir palavras ilegíveis.
        - Identifique a quantidade do item se estiver visível.
        - Classifique o tipo do item (Arma, Armadura, Alquimia, Ingrediente, Lixo, etc).

        Retorne um array JSON de objetos.
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview", 
        contents: { parts: [...parts, { text: prompt }] },
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.STRING },
                type: { type: Type.STRING }
              },
              required: ["name"]
            }
          }
        }
      });

      const extractedItems = parseJSON(response.text || "[]", []);
      const itemsWithIds = extractedItems.map((item: any) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name || '',
        quantity: item.quantity || '1',
        type: item.type || 'Desconhecido'
      }));

      setMerchantItems(itemsWithIds);
      setCurrentStep('MERCHANT_CONFIRM');
    } catch (err) {
      console.error(err);
      setError("Erro ao ler o inventário. Tente imagens mais claras.");
      setCurrentStep('MERCHANT_INPUT');
    } finally {
      setIsLoading(false);
    }
  };

  const runMerchantAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentStep('MERCHANT_ANALYSIS');

    try {
      const prompt = `
        Você é o Mestre Mercador de The Witcher 3 (v4.0+).
        Analise a seguinte lista de itens do inventário de Geralt.
        O jogador está atualmente em: ${merchantLocation}.
        Nível do Jogador: ${userData.level}
        Dinheiro Atual: ${userData.money} Coroas
        
        ITENS DO INVENTÁRIO:
        ${JSON.stringify(merchantItems)}
        
        REGRAS DE ANÁLISE CRÍTICAS:
        1. CONTEXTO DE LOCALIZAÇÃO: Recomende mercadores que o jogador pode acessar AGORA em ${merchantLocation}, ou sugira GUARDAR o item se houver um mercador muito melhor em uma região futura (ex: Novigrad ou Toussaint).
        2. PRECISÃO DE MERCADORES: Seja específico sobre QUEM é o mercador e ONDE ele está. Ex: "Tomira (Herborista no Pomar Branco, leste da vila)".
        3. ESTRATÉGIA DE VENDA: Para cada item de venda, decida se a estratégia é "Vender Agora" ou "Segurar para Depois".
        4. CASO TOMIRA/MEL: Lembre-se que Tomira compra favos de mel por um preço premium.
        5. Identifique itens que devem ser DESMONTADOS (ex: itens que dão Minério de Prata, Placas de Dimeritium, Couro de Monstro raro).
        6. Identifique itens que devem ser GUARDADOS para crafting futuro.
        7. Forneça estratégias de lucro e dicas gerais de economia.

        Retorne um objeto JSON seguindo o esquema definido.
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              itemsToSell: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    targetMerchant: { type: Type.STRING },
                    merchantLocation: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    estimatedValue: { type: Type.STRING },
                    strategy: { 
                      type: Type.STRING,
                      enum: ["Vender Agora", "Segurar para Depois"]
                    },
                    betterMerchantLater: { type: Type.STRING }
                  },
                  required: ["name", "targetMerchant", "merchantLocation", "reason", "estimatedValue", "strategy"]
                }
              },
              itemsToDismantle: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    yields: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["name", "yields", "reason"]
                }
              },
              itemsToKeep: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["name", "reason"]
                }
              },
              economyTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              bestMerchants: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    location: { type: Type.STRING },
                    specialty: { type: Type.STRING },
                    why: { type: Type.STRING }
                  },
                  required: ["name", "location", "specialty", "why"]
                }
              },
              profitStrategies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "description"]
                }
              },
              humor: { type: Type.STRING }
            },
            required: ["itemsToSell", "itemsToDismantle", "itemsToKeep", "economyTips", "bestMerchants", "profitStrategies", "humor"]
          }
        }
      });

      const result = parseJSON(response.text || "{}", {});
      result.itemsToSell = result.itemsToSell || [];
      result.itemsToDismantle = result.itemsToDismantle || [];
      result.itemsToKeep = result.itemsToKeep || [];
      result.economyTips = result.economyTips || [];
      result.bestMerchants = result.bestMerchants || [];
      result.profitStrategies = result.profitStrategies || [];
      
      setMerchantAnalysis(result);
      setCurrentStep('MERCHANT_DASHBOARD');
    } catch (err) {
      console.error(err);
      setError("Erro ao analisar inventário. Os mercadores estão fechados...");
      setCurrentStep('MERCHANT_INPUT');
    } finally {
      setIsLoading(false);
    }
  };

  const extractGwentCards = async () => {
    if (gwentImages.length === 0) {
      setError("Por favor, envie pelo menos uma imagem do seu baralho de Gwent.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('GWENT_OCR');

    try {
      const parts = gwentImages.map(img => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: img.split(',')[1]
        }
      }));

      const prompt = `
        Você é um especialista em The Witcher 3 Next-Gen (v4.0+).
        Analise estas capturas de tela das cartas de Gwent e extraia todas as cartas visíveis.
        
        ATENÇÃO - OTIMIZAÇÃO DE OCR PARA BAIXA QUALIDADE:
        - As imagens podem estar borradas ou com muitos elementos visuais.
        - Use o CONTEXTO (ícones, ilustrações, formato da carta) para deduzir cartas ilegíveis.
        - Identifique o poder da carta se estiver visível.
        - Classifique o tipo da carta (Unidade, Especial, Clima, Herói, Líder).

        Retorne um array JSON de objetos.
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview", 
        contents: { parts: [...parts, { text: prompt }] },
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                power: { type: Type.STRING }
              },
              required: ["name"]
            }
          }
        }
      });

      const extractedCards = parseJSON(response.text || "[]", []);
      const cardsWithIds = extractedCards.map((card: any) => ({
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: card.name || '',
        type: card.type || 'Desconhecido',
        power: card.power || '0'
      }));

      setGwentCards(cardsWithIds);
      setCurrentStep('GWENT_CONFIRM');
    } catch (err) {
      console.error(err);
      setError("Erro ao ler as cartas. Tente imagens mais claras.");
      setCurrentStep('GWENT_INPUT');
    } finally {
      setIsLoading(false);
    }
  };

  const runGwentAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentStep('GWENT_ANALYSIS');

    try {
      const prompt = `
        Você é o Mestre de Gwent de The Witcher 3 (v4.0+).
        Analise a seguinte lista de cartas de Gwent do jogador.
        
        CARTAS DO JOGADOR:
        ${JSON.stringify(gwentCards)}
        
        REGRAS DE ANÁLISE CRÍTICAS:
        1. MELHOR FACÇÃO: Determine qual facção (Reinos do Norte, Nilfgaard, Monstros, Scoia'tael ou Skellige) é a mais forte com base nas cartas disponíveis.
        2. COMPOSIÇÃO DO BARALHO: Monte o baralho perfeito (mínimo 22 cartas de unidade).
        3. ESTRATÉGIA DE JOGO: Explique detalhadamente como jogar com este baralho específico.
        4. GUIA POR RODADA: Dê dicas para a Rodada 1, 2 e 3 (ex: quando passar, quando usar espiões).
        5. SINERGIAS: Explique quais cartas funcionam bem juntas (ex: Comandante da Corneta + Unidades de Combate Próximo).

        Retorne um objeto JSON seguindo o esquema definido.
        Use um tom de voz de um jogador de Gwent profissional e desafiador.
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              faction: { type: Type.STRING },
              leaderCard: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  ability: { type: Type.STRING }
                },
                required: ["name", "ability"]
              },
              deckComposition: {
                type: Type.OBJECT,
                properties: {
                  unitCards: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        power: { type: Type.NUMBER },
                        ability: { type: Type.STRING },
                        count: { type: Type.NUMBER }
                      },
                      required: ["name", "power", "count"]
                    }
                  },
                  specialCards: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        effect: { type: Type.STRING },
                        count: { type: Type.NUMBER }
                      },
                      required: ["name", "effect", "count"]
                    }
                  },
                  heroCards: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        power: { type: Type.NUMBER },
                        ability: { type: Type.STRING }
                      },
                      required: ["name", "power"]
                    }
                  }
                },
                required: ["unitCards", "specialCards", "heroCards"]
              },
              totalStrength: { type: Type.NUMBER },
              strategy: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              },
              roundByRound: {
                type: Type.OBJECT,
                properties: {
                  round1: { type: Type.STRING },
                  round2: { type: Type.STRING },
                  round3: { type: Type.STRING }
                },
                required: ["round1", "round2", "round3"]
              },
              synergies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    cards: { type: Type.STRING },
                    effect: { type: Type.STRING }
                  },
                  required: ["cards", "effect"]
                }
              },
              humor: { type: Type.STRING }
            },
            required: ["faction", "leaderCard", "deckComposition", "totalStrength", "strategy", "roundByRound", "synergies", "humor"]
          }
        }
      });

      const result = parseJSON(response.text || "{}", {});
      result.deckComposition = result.deckComposition || { unitCards: [], specialCards: [], heroCards: [] };
      result.deckComposition.unitCards = result.deckComposition.unitCards || [];
      result.deckComposition.specialCards = result.deckComposition.specialCards || [];
      result.deckComposition.heroCards = result.deckComposition.heroCards || [];
      result.synergies = result.synergies || [];
      result.roundByRound = result.roundByRound || { round1: "", round2: "", round3: "" };
      result.strategy = result.strategy || { title: "", description: "" };
      result.leaderCard = result.leaderCard || { name: "", ability: "" };
      
      setGwentAnalysis(result);
      setCurrentStep('GWENT_DASHBOARD');
    } catch (err) {
      console.error(err);
      setError("Erro ao analisar cartas de Gwent. Talvez você precise de um baralho melhor...");
      setCurrentStep('GWENT_INPUT');
    } finally {
      setIsLoading(false);
    }
  };

  const extractBestiaryTarget = async () => {
    if (bestiaryImages.length === 0) {
      setError("Por favor, envie pelo menos uma imagem do monstro ou do seu Bestiário.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('BESTIARY_OCR');

    try {
      const parts = bestiaryImages.map(img => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: img.split(',')[1]
        }
      }));

      const prompt = `
        Você é um especialista em The Witcher 3 Next-Gen (v4.0+).
        Analise estas capturas de tela e identifique qual é o monstro principal.
        
        ATENÇÃO - OTIMIZAÇÃO DE OCR PARA BAIXA QUALIDADE:
        - As imagens podem estar borradas.
        - Use o CONTEXTO (aparência do monstro, ambiente) para deduzir o nome se o texto estiver ilegível.

        Retorne um objeto JSON com o nome do monstro.
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview", 
        contents: { parts: [...parts, { text: prompt }] },
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              monsterName: { type: Type.STRING }
            },
            required: ["monsterName"]
          }
        }
      });

      const extracted = parseJSON(response.text || "{}", { monsterName: "" });
      setBestiaryTarget(extracted.monsterName || "Monstro Desconhecido");
      setCurrentStep('BESTIARY_CONFIRM');
    } catch (err) {
      console.error(err);
      setError("Erro ao identificar o monstro. Tente imagens mais claras.");
      setCurrentStep('BESTIARY_INPUT');
    } finally {
      setIsLoading(false);
    }
  };

  const runBestiaryAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentStep('BESTIARY_ANALYSIS');

    try {
      const prompt = `
        Você é o Mestre do Bestiário de The Witcher 3 (v4.0+).
        Analise o seguinte monstro: ${bestiaryTarget}.
        
        REGRAS DE ANÁLISE CRÍTICAS:
        1. FRAQUEZAS PRECISAS: Liste todos os Óleos, Sinais, Bombas e Poções que são eficazes contra este monstro específico.
        2. ESTRATÉGIA DE COMBATE: Explique como Geralt deve lutar contra ele (ex: quando esquivar, qual sinal usar para abrir a guarda).
        3. LORE E CURIOSIDADES: Forneça um resumo fascinante sobre a origem e o comportamento do monstro.
        4. LOOT: Liste os itens raros que este monstro costuma deixar e para que servem no crafting.
        5. LOCALIZAÇÕES: Onde mais este monstro pode ser encontrado no mundo do jogo.

        Retorne um objeto JSON seguindo o esquema definido.
        Use um tom de voz de um Witcher experiente que já enfrentou centenas dessas criaturas.
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              monsterName: { type: Type.STRING },
              class: { type: Type.STRING },
              description: { type: Type.STRING },
              weaknesses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["Óleo", "Sinal", "Bomba", "Poção", "Outro"] },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "type", "description"]
                }
              },
              combatStrategy: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phase: { type: Type.STRING },
                    advice: { type: Type.STRING }
                  },
                  required: ["phase", "advice"]
                }
              },
              loot: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    rarity: { type: Type.STRING },
                    use: { type: Type.STRING }
                  },
                  required: ["item", "rarity", "use"]
                }
              },
              lore: { type: Type.STRING },
              locations: { type: Type.ARRAY, items: { type: Type.STRING } },
              humor: { type: Type.STRING }
            },
            required: ["monsterName", "class", "description", "weaknesses", "combatStrategy", "loot", "lore", "locations", "humor"]
          }
        }
      });

      const result = parseJSON(response.text || "{}", {});
      result.weaknesses = result.weaknesses || [];
      result.combatStrategy = result.combatStrategy || [];
      result.loot = result.loot || [];
      result.locations = result.locations || [];
      
      setBestiaryAnalysis(result);
      setCurrentStep('BESTIARY_DASHBOARD');
    } catch (err) {
      console.error(err);
      setError("Erro ao analisar o monstro. Talvez ele seja imune a essa magia...");
      setCurrentStep('BESTIARY_INPUT');
    } finally {
      setIsLoading(false);
    }
  };

  const runFinderAnalysis = async () => {
    if (!finderQuery.trim()) {
      setError("Por favor, diga o que você está procurando.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('FINDER_ANALYSIS');

    try {
      const prompt = `
        Você é o Maior Rastreador do Continente em The Witcher 3 (v4.0+).
        O usuário está procurando por: "${finderQuery}".
        Nível atual do Geralt: ${userData.level}.
        Localização atual: ${userData.location || 'Desconhecida'}.
        Regiões Desbloqueadas: ${userData.accessibleLocations.join(', ')}.
        Dinheiro Atual: ${userData.money} Coroas.
        
        Forneça um guia definitivo, passo a passo e à prova de falhas de como conseguir esse item, material, arma, armadura, comida ou objetivo da melhor forma possível.
        
        REGRAS DE ANÁLISE CRÍTICAS:
        1. LOCALIZAÇÕES EXATAS: Diga exatamente onde ir (região, ponto de viagem rápida mais próximo, vendedor específico).
        2. ADEQUAÇÃO AO NÍVEL E ACESSO: Considere o nível ${userData.level} e as regiões desbloqueadas. Não mande para uma região que ele não tem acesso ainda, a menos que seja a única forma.
        3. PASSO A PASSO: Crie um guia claro de como obter o item.
        4. ALTERNATIVAS: Se o item for muito difícil de conseguir agora, sugira alternativas viáveis para o nível atual.
        5. DICAS DE FARM/ECONOMIA: Como conseguir mais disso de forma eficiente?
        
        Retorne um objeto JSON seguindo o esquema definido.
        Use um tom de voz de um bruxo experiente dando conselhos de sobrevivência.
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              description: { type: Type.STRING },
              bestLocations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    region: { type: Type.STRING },
                    details: { type: Type.STRING },
                    dropRate: { type: Type.STRING }
                  },
                  required: ["name", "region", "details"]
                }
              },
              stepByStepGuide: { type: Type.ARRAY, items: { type: Type.STRING } },
              alternatives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["name", "reason"]
                }
              },
              requirements: { type: Type.STRING },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } },
              humor: { type: Type.STRING }
            },
            required: ["itemName", "description", "bestLocations", "stepByStepGuide", "alternatives", "requirements", "tips", "humor"]
          }
        }
      });

      const result = parseJSON(response.text || "{}", {});
      result.bestLocations = result.bestLocations || [];
      result.stepByStepGuide = result.stepByStepGuide || [];
      result.alternatives = result.alternatives || [];
      result.tips = result.tips || [];
      
      setFinderAnalysis(result);
      setCurrentStep('FINDER_DASHBOARD');
    } catch (err) {
      console.error(err);
      setError("Erro ao rastrear o item. Verifique sua conexão e tente novamente.");
      setCurrentStep('FINDER_INPUT');
    } finally {
      setIsLoading(false);
    }
  };

  const extractGearItems = async () => {
    if (gearImages.length === 0) {
      setError("Por favor, envie pelo menos uma imagem do seu inventário ou de um diagrama de equipamento.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('GEAR_OCR');

    try {
      const parts = gearImages.map(img => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: img.split(',')[1]
        }
      }));

      const prompt = `
        Você é um especialista em The Witcher 3 Next-Gen (v4.0+).
        Analise estas capturas de tela e extraia os itens de equipamento ou diagramas visíveis.
        
        ATENÇÃO - OTIMIZAÇÃO DE OCR PARA BAIXA QUALIDADE:
        - As imagens podem estar borradas ou com muitos elementos visuais.
        - Use o CONTEXTO (ícones, formato do texto) para deduzir palavras ilegíveis.
        - Classifique o tipo do item (Armadura, Espada, Diagrama, Material).
        - Identifique a categoria do item: "Equipado" (se Geralt estiver usando), "Diagrama" (se for uma receita de craft) ou "Inventário" (se for um item guardado).

        Retorne um array JSON de objetos.
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview", 
        contents: { parts: [...parts, { text: prompt }] },
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["name"]
            }
          }
        }
      });

      const extractedItems = parseJSON(response.text || "[]", []);
      const itemsWithIds = extractedItems.map((item: any) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name || '',
        type: item.type || 'Desconhecido',
        category: item.category || 'Inventário'
      }));

      setGearItems(itemsWithIds);
      setCurrentStep('GEAR_CONFIRM');
    } catch (err) {
      console.error(err);
      setError("Erro ao ler os equipamentos. Tente imagens mais claras.");
      setCurrentStep('GEAR_INPUT');
    } finally {
      setIsLoading(false);
    }
  };

  const runGearAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentStep('GEAR_ANALYSIS');

    try {
      const prompt = `
        Você é o Mestre Armeiro de The Witcher 3 (v4.0+).
        Analise a seguinte lista de equipamentos ou diagramas do jogador.
        
        Nível do Jogador: ${userData.level}
        Localização Atual: ${userData.location || 'Desconhecida'}
        Dinheiro Atual: ${userData.money} Coroas
        
        ITENS DO JOGADOR:
        ${JSON.stringify(gearItems)}
        
        REGRAS DE ANÁLISE CRÍTICAS:
        1. ANÁLISE DE NÍVEL: Compare rigorosamente o nível do jogador (${userData.level}) com os requisitos de nível dos equipamentos e diagramas.
        2. EQUIPADO VS DIAGRAMA: Analise o que o jogador tem "Equipado" versus os "Diagramas" disponíveis.
        3. RECOMENDAÇÃO DE CRAFTING: Recomende O QUE craftar AGORA. Se o jogador tiver um diagrama melhor que o equipamento atual E tiver o nível necessário, mande craftar.
        4. IDENTIFICAÇÃO DE ESCOLA: Identifique se o equipamento pertence a uma das escolas de Witcher (Lobo, Gato, Grifo, Urso, Mantícora, Víbora).
        5. LOCALIZAÇÃO DE DIAGRAMAS: Diga onde encontrar as próximas melhorias para os conjuntos identificados.
        6. REQUISITOS DE CRAFTING: Liste os materiais raros necessários e qual nível de armeiro/ferreiro é exigido para as recomendações.
        7. ATRIBUTOS E BUILD: Explique para qual tipo de build este conjunto é melhor.

        Retorne um objeto JSON seguindo o esquema definido.
        Use um tom de voz de um armeiro mestre como Yoana ou Hattori.
        Idioma: Português Brasileiro.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              currentGearEvaluation: { type: Type.STRING },
              craftingRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    itemName: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    materialsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } },
                    crafterLevelRequired: { type: Type.STRING }
                  },
                  required: ["itemName", "reason", "materialsNeeded", "crafterLevelRequired"]
                }
              },
              schoolName: { type: Type.STRING },
              description: { type: Type.STRING },
              sets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.STRING },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          location: { type: Type.STRING },
                          requirements: { type: Type.STRING },
                          stats: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["name", "location", "requirements", "stats"]
                      }
                    }
                  },
                  required: ["level", "items"]
                }
              },
              craftingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedBuild: { type: Type.STRING },
              humor: { type: Type.STRING }
            },
            required: ["currentGearEvaluation", "craftingRecommendations", "schoolName", "description", "sets", "craftingTips", "recommendedBuild", "humor"]
          }
        }
      });

      const result = parseJSON(response.text || "{}", {});
      result.sets = result.sets || [];
      result.craftingTips = result.craftingTips || [];
      result.craftingRecommendations = result.craftingRecommendations || [];
      
      setGearAnalysis(result);
      setCurrentStep('GEAR_DASHBOARD');
    } catch (err) {
      console.error(err);
      setError("Erro ao analisar o equipamento. Talvez o aço esteja muito frio...");
      setCurrentStep('GEAR_INPUT');
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI Steps ---

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!['INPUT', 'MERCHANT_INPUT', 'GWENT_INPUT', 'BESTIARY_INPUT', 'GEAR_INPUT'].includes(currentStep)) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              if (appMode === 'QUESTS') {
                setImages(prev => [...prev, base64]);
              } else if (appMode === 'MERCHANT') {
                setMerchantImages(prev => [...prev, base64]);
              } else if (appMode === 'GWENT') {
                setGwentImages(prev => [...prev, base64]);
              } else if (appMode === 'BESTIARY') {
                setBestiaryImages(prev => [...prev, base64]);
              } else {
                setGearImages(prev => [...prev, base64]);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [currentStep, appMode]);

  const renderMainMenu = () => {
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
              } as any} 
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

  const renderInput = () => (
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

  const renderConfirm = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Verificação de Missões</h1>
        <p className="text-witcher-gold/60">Revise os dados extraídos das suas capturas de tela.</p>
      </div>

      <div className="parchment-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-witcher-gold/30 text-witcher-gold uppercase text-xs tracking-widest">
                <th className="p-4">Nome da Missão</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Status</th>
                <th className="p-4">Nível</th>
                <th className="p-4">Localização</th>
                <th className="p-4">Objetivo/Notas</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-witcher-gold/10">
              {quests.map((quest, idx) => (
                <tr key={quest.id} className="hover:bg-witcher-gold/5 transition-colors">
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={quest.name}
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].name = e.target.value;
                        setQuests(newQuests);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <select 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded"
                      value={quest.type}
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].type = e.target.value as any;
                        setQuests(newQuests);
                      }}
                    >
                      <option value="Principal">Principal</option>
                      <option value="Secundária">Secundária</option>
                      <option value="Contrato">Contrato</option>
                      <option value="Caça ao Tesouro">Caça ao Tesouro</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <select 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded"
                      value={quest.status}
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].status = e.target.value as any;
                        setQuests(newQuests);
                      }}
                    >
                      <option value="Ativa">Ativa</option>
                      <option value="Concluída">Concluída</option>
                      <option value="Falhou">Falhou</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-16"
                      value={quest.level}
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].level = e.target.value;
                        setQuests(newQuests);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-32"
                      value={quest.location || ''}
                      placeholder="Ex: Velen"
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].location = e.target.value;
                        setQuests(newQuests);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={quest.notes}
                      onChange={e => {
                        const newQuests = [...quests];
                        newQuests[idx].notes = e.target.value;
                        setQuests(newQuests);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setQuests(quests.filter(q => q.id !== quest.id))}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button 
            onClick={() => setQuests([...quests, { id: `q-${Date.now()}`, name: '', type: 'Secundária', status: 'Ativa', level: '', location: '', notes: '' }])}
            className="flex items-center gap-2 text-witcher-gold hover:text-white transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar Missão Manualmente
          </button>
          
          <div className="flex gap-4">
            <button onClick={() => setCurrentStep('INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5">Voltar</button>
            <button onClick={runAnalysis} className="witcher-button">Analisar</button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderMerchantConfirm = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Verificação de Inventário</h1>
        <p className="text-witcher-gold/60">Revise os itens extraídos das suas capturas de tela.</p>
      </div>

      <div className="parchment-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-witcher-gold/30 text-witcher-gold uppercase text-xs tracking-widest">
                <th className="p-4">Nome do Item</th>
                <th className="p-4">Quantidade</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-witcher-gold/10">
              {merchantItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-witcher-gold/5 transition-colors">
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={item.name}
                      onChange={e => {
                        const newItems = [...merchantItems];
                        newItems[idx].name = e.target.value;
                        setMerchantItems(newItems);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-24"
                      value={item.quantity}
                      onChange={e => {
                        const newItems = [...merchantItems];
                        newItems[idx].quantity = e.target.value;
                        setMerchantItems(newItems);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={item.type}
                      onChange={e => {
                        const newItems = [...merchantItems];
                        newItems[idx].type = e.target.value;
                        setMerchantItems(newItems);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setMerchantItems(merchantItems.filter(i => i.id !== item.id))}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button 
            onClick={() => setMerchantItems([...merchantItems, { id: `item-${Date.now()}`, name: '', quantity: '1', type: '' }])}
            className="flex items-center gap-2 text-witcher-gold hover:text-white transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar Item Manualmente
          </button>
          
          <div className="flex gap-4">
            <button onClick={() => setCurrentStep('MERCHANT_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5">Voltar</button>
            <button onClick={runMerchantAnalysis} className="witcher-button">Analisar</button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderGwentConfirm = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Verificação do Baralho</h1>
        <p className="text-witcher-gold/60">Revise as cartas extraídas das suas capturas de tela.</p>
      </div>

      <div className="parchment-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-witcher-gold/30 text-witcher-gold uppercase text-xs tracking-widest">
                <th className="p-4">Nome da Carta</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Poder</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-witcher-gold/10">
              {gwentCards.map((card, idx) => (
                <tr key={card.id} className="hover:bg-witcher-gold/5 transition-colors">
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={card.name}
                      onChange={e => {
                        const newCards = [...gwentCards];
                        newCards[idx].name = e.target.value;
                        setGwentCards(newCards);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={card.type}
                      onChange={e => {
                        const newCards = [...gwentCards];
                        newCards[idx].type = e.target.value;
                        setGwentCards(newCards);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-24"
                      value={card.power}
                      onChange={e => {
                        const newCards = [...gwentCards];
                        newCards[idx].power = e.target.value;
                        setGwentCards(newCards);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setGwentCards(gwentCards.filter(c => c.id !== card.id))}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button 
            onClick={() => setGwentCards([...gwentCards, { id: `card-${Date.now()}`, name: '', type: '', power: '0' }])}
            className="flex items-center gap-2 text-witcher-gold hover:text-white transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar Carta Manualmente
          </button>
          
          <div className="flex gap-4">
            <button onClick={() => setCurrentStep('GWENT_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5">Voltar</button>
            <button onClick={runGwentAnalysis} className="witcher-button">Analisar</button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderBestiaryConfirm = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Verificação do Bestiário</h1>
        <p className="text-witcher-gold/60">Confirme o monstro identificado.</p>
      </div>

      <div className="parchment-card p-6 space-y-6">
        <div>
          <label className="block text-witcher-gold text-sm font-bold mb-2">Nome do Monstro</label>
          <input 
            type="text"
            className="w-full bg-black/40 border border-witcher-gold/30 rounded p-3 text-white focus:border-witcher-gold outline-none transition-colors"
            value={bestiaryTarget}
            onChange={(e) => setBestiaryTarget(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={() => setCurrentStep('BESTIARY_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5">Voltar</button>
          <button onClick={runBestiaryAnalysis} className="witcher-button">Analisar</button>
        </div>
      </div>
    </motion.div>
  );

  const renderGearConfirm = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Verificação de Equipamentos</h1>
        <p className="text-witcher-gold/60">Revise os equipamentos e diagramas extraídos.</p>
      </div>

      <div className="parchment-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-witcher-gold/30 text-witcher-gold uppercase text-xs tracking-widest">
                <th className="p-4">Nome do Item</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-witcher-gold/10">
              {gearItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-witcher-gold/5 transition-colors">
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={item.name}
                      onChange={e => {
                        const newItems = [...gearItems];
                        newItems[idx].name = e.target.value;
                        setGearItems(newItems);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={item.type}
                      onChange={e => {
                        const newItems = [...gearItems];
                        newItems[idx].type = e.target.value;
                        setGearItems(newItems);
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <select 
                      className="bg-transparent border-none focus:ring-1 focus:ring-witcher-gold rounded w-full"
                      value={item.category || 'Inventário'}
                      onChange={e => {
                        const newItems = [...gearItems];
                        newItems[idx].category = e.target.value;
                        setGearItems(newItems);
                      }}
                    >
                      <option value="Equipado">Equipado</option>
                      <option value="Diagrama">Diagrama</option>
                      <option value="Inventário">Inventário</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setGearItems(gearItems.filter(i => i.id !== item.id))}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button 
            onClick={() => setGearItems([...gearItems, { id: `item-${Date.now()}`, name: '', type: '', category: 'Inventário' }])}
            className="flex items-center gap-2 text-witcher-gold hover:text-white transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Adicionar Item Manualmente
          </button>
          
          <div className="flex gap-4">
            <button onClick={() => setCurrentStep('GEAR_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5">Voltar</button>
            <button onClick={runGearAnalysis} className="witcher-button">Analisar</button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderDashboard = () => {
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

  const renderMerchantInput = () => (
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

  const renderGwentInput = () => (
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

  const renderGwentDashboard = () => {
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

  const renderFinderInput = () => (
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

  const renderFinderDashboard = () => {
    if (!finderAnalysis) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-8 pb-20"
      >
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-witcher-gold/20 pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-cinzel text-witcher-gold">{finderAnalysis.itemName}</h1>
            <p className="text-witcher-gold/60 italic">"{finderAnalysis.humor}"</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                const text = `
                  WITCHER 3 QUEST MASTER - RASTREADOR
                  Item: ${finderAnalysis.itemName}
                  Melhor Local: ${(finderAnalysis.bestLocations || [])[0]?.name || 'Vários'}
                `;
                navigator.clipboard.writeText(text);
                alert("Análise copiada!");
              }}
              className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Compartilhar
            </button>
            <button 
              onClick={() => {
                if (confirm("Deseja meditar e limpar esta busca?")) {
                  setFinderAnalysis(null);
                  setFinderQuery('');
                  setCurrentStep('FINDER_INPUT');
                }
              }}
              className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
            >
              <Wind className="w-4 h-4" /> Meditar (Reset)
            </button>
            <button onClick={() => setCurrentStep('FINDER_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm">Nova Busca</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <MapIcon className="w-8 h-8" /> Melhores Localizações
              </h2>
              <div className="space-y-4">
                {(finderAnalysis.bestLocations || []).map((loc, i) => (
                  <div key={i} className="p-4 bg-black/30 rounded border border-witcher-gold/10 hover:border-witcher-gold/40 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-witcher-gold font-bold">{loc.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 bg-witcher-gold/20 text-witcher-gold rounded uppercase font-bold border border-witcher-gold/30">
                        {loc.region}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{loc.details}</p>
                    {loc.dropRate && (
                      <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Chance/Disponibilidade: {loc.dropRate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <Scroll className="w-8 h-8" /> Guia Passo a Passo
              </h2>
              <div className="space-y-6">
                {(finderAnalysis.stepByStepGuide || []).map((step, i) => (
                  <div key={i} className="p-4 bg-black/30 rounded border-l-4 border-witcher-gold relative">
                    <div className="absolute -left-[10px] top-4 w-4 h-4 rounded-full bg-witcher-gold border-2 border-black" />
                    <p className="text-sm text-gray-300 leading-relaxed ml-2">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="parchment-card p-6">
              <h2 className="text-2xl mb-4 flex items-center gap-2">
                <Info className="w-6 h-6" /> Requisitos
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed bg-witcher-gold/5 p-4 rounded border border-witcher-gold/10">
                {finderAnalysis.requirements}
              </p>
            </section>

            <section className="parchment-card p-6 border-blue-900/50">
              <h2 className="text-2xl mb-4 flex items-center gap-2 text-blue-400">
                <RefreshCw className="w-6 h-6" /> Alternativas Viáveis
              </h2>
              <div className="space-y-4">
                {(finderAnalysis.alternatives || []).map((alt, i) => (
                  <div key={i} className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm font-bold text-white mb-1">{alt.name}</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{alt.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="parchment-card p-6">
              <h2 className="text-2xl mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6" /> Dicas de Farm / Economia
              </h2>
              <ul className="text-sm space-y-3 text-gray-400">
                {(finderAnalysis.tips || []).map((tip, i) => (
                  <li key={i} className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> {tip}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderGearInput = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full border-2 border-witcher-gold/30 bg-witcher-gold/10">
            <Sword className="w-12 h-12 text-witcher-gold" />
          </div>
        </div>
        <h1 className="text-5xl font-bold">Mestre Armeiro</h1>
        <p className="text-witcher-gold/70 italic">"Uma boa espada é a diferença entre a vida e a morte de um Witcher."</p>
      </div>

      <div className="parchment-card p-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl flex items-center gap-2">
            <Upload className="w-6 h-6" /> 1. Captura de Equipamento
          </h2>
          <p className="text-sm text-gray-400">Envie uma imagem do seu equipamento atual ou de um diagrama que você encontrou.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gearImages.map((img, i) => (
              <div key={i} className="relative group aspect-video rounded border border-witcher-gold/30 overflow-hidden">
                <img src={img} alt="Upload" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setGearImages(prev => prev.filter((_, idx) => idx !== i))}
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
                    reader.onloadend = () => setGearImages(prev => [...prev, reader.result as string]);
                    reader.readAsDataURL(file);
                  });
                }} 
              />
            </label>
          </div>
        </section>

        <section className="space-y-4 pt-4 border-t border-witcher-gold/10">
          <h2 className="text-2xl flex items-center gap-2">
            <Activity className="w-6 h-6" /> 2. Nível Atual
          </h2>
          <p className="text-sm text-gray-400">Informe o nível atual do Geralt para que o Mestre Armeiro possa recomendar o que craftar agora.</p>
          <div className="w-32">
            <input 
              type="number" 
              min="1" max="100"
              value={userData.level}
              onChange={(e) => updateUserData({ level: parseInt(e.target.value) || 1 })}
              className="w-full bg-black/50 border border-witcher-gold/30 rounded p-3 text-white focus:border-witcher-gold outline-none text-center text-xl font-bold"
            />
          </div>
        </section>

        <div className="pt-4 flex justify-center">
          <button 
            onClick={extractGearItems}
            disabled={gearImages.length === 0 || isLoading}
            className="witcher-button flex items-center gap-3 px-12"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            Analisar Equipamento
          </button>
        </div>
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      </div>
    </motion.div>
  );

  const renderGearDashboard = () => {
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

  const renderBestiaryInput = () => (
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
        <h1 className="text-5xl font-bold">Mestre do Bestiário</h1>
        <p className="text-witcher-gold/70 italic">"Conhecer o seu inimigo é o primeiro passo para matá-lo."</p>
      </div>

      <div className="parchment-card p-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl flex items-center gap-2">
            <Upload className="w-6 h-6" /> 1. Captura do Monstro
          </h2>
          <p className="text-sm text-gray-400">Envie uma imagem do monstro que você está enfrentando ou da entrada dele no Bestiário.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bestiaryImages.map((img, i) => (
              <div key={i} className="relative group aspect-video rounded border border-witcher-gold/30 overflow-hidden">
                <img src={img} alt="Upload" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setBestiaryImages(prev => prev.filter((_, idx) => idx !== i))}
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
                    reader.onloadend = () => setBestiaryImages(prev => [...prev, reader.result as string]);
                    reader.readAsDataURL(file);
                  });
                }} 
              />
            </label>
          </div>
        </section>

        <div className="pt-4 flex justify-center">
          <button 
            onClick={extractBestiaryTarget}
            disabled={bestiaryImages.length === 0 || isLoading}
            className="witcher-button flex items-center gap-3 px-12"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            Analisar Criatura
          </button>
        </div>
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      </div>
    </motion.div>
  );

  const renderBestiaryDashboard = () => {
    if (!bestiaryAnalysis) return null;

    const renderBestiaryInfographic = () => {
      const types = [
        { id: 'Óleo', icon: <Droplet className="w-6 h-6" />, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-500/30' },
        { id: 'Sinal', icon: <Flame className="w-6 h-6" />, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30' },
        { id: 'Bomba', icon: <Bomb className="w-6 h-6" />, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30' },
        { id: 'Poção', icon: <Activity className="w-6 h-6" />, color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/30' }
      ];

      return (
        <div className="mb-8 parchment-card p-6">
          <h3 className="text-xl font-cinzel text-witcher-gold mb-6 flex items-center gap-2">
            <Crosshair className="w-5 h-5"/> Matriz de Vulnerabilidade
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {types.map(t => {
              const weak = bestiaryAnalysis.weaknesses.filter(w => w.type.toLowerCase().includes(t.id.toLowerCase()) || w.name.toLowerCase().includes(t.id.toLowerCase()) || (t.id === 'Óleo' && w.name.toLowerCase().includes('oil')) || (t.id === 'Sinal' && w.name.toLowerCase().includes('sign')) || (t.id === 'Bomba' && w.name.toLowerCase().includes('bomb')) || (t.id === 'Poção' && w.name.toLowerCase().includes('potion')));
              const isWeak = weak.length > 0;
              return (
                <div key={t.id} className={`p-4 rounded-lg border ${isWeak ? t.border + ' ' + t.bg : 'border-gray-800 bg-black/40 opacity-50'} flex flex-col items-center text-center transition-all duration-300`}>
                  <div className={`p-3 rounded-full mb-2 ${isWeak ? t.color + ' bg-black/50 shadow-[0_0_15px_currentColor]' : 'text-gray-600'}`}>
                    {t.icon}
                  </div>
                  <h4 className={`font-bold uppercase text-xs tracking-widest mb-1 ${isWeak ? 'text-white' : 'text-gray-500'}`}>{t.id}</h4>
                  {isWeak ? (
                    <div className="flex flex-col gap-1 mt-2">
                      {weak.map((w, i) => <span key={i} className={`text-xs font-bold ${t.color}`}>{w.name}</span>)}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-600 uppercase mt-2">Resistente / Neutro</span>
                  )}
                </div>
              );
            })}
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
            <h1 className="text-4xl font-cinzel text-witcher-gold">{bestiaryAnalysis.monsterName}</h1>
            <div className="flex items-center gap-2 text-xs text-witcher-gold/60">
              <Skull className="w-4 h-4" />
              <span>Classe: <strong className="text-witcher-gold">{bestiaryAnalysis.class}</strong></span>
            </div>
            <p className="text-witcher-gold/60 italic">"{bestiaryAnalysis.humor}"</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                const text = `
                  WITCHER 3 QUEST MASTER - BESTIÁRIO
                  Monstro: ${bestiaryAnalysis.monsterName}
                  Fraquezas: ${bestiaryAnalysis.weaknesses.map(w => w.name).join(', ')}
                `;
                navigator.clipboard.writeText(text);
                alert("Bestiário copiado!");
              }}
              className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Compartilhar
            </button>
            <button 
              onClick={() => {
                if (confirm("Deseja meditar e limpar esta análise?")) {
                  setBestiaryAnalysis(null);
                  setBestiaryImages([]);
                  setCurrentStep('BESTIARY_INPUT');
                }
              }}
              className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
            >
              <Wind className="w-4 h-4" /> Meditar (Reset)
            </button>
            <button onClick={() => setCurrentStep('BESTIARY_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm">Nova Análise</button>
          </div>
        </div>

        {renderBestiaryInfographic()}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <Sword className="w-8 h-8" /> Fraquezas e Vulnerabilidades
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {bestiaryAnalysis.weaknesses.map((weak, i) => (
                  <div key={i} className="p-4 bg-black/30 rounded border border-witcher-gold/10 hover:border-witcher-gold/40 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-witcher-gold font-bold">{weak.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 bg-witcher-gold/20 text-witcher-gold rounded uppercase font-bold border border-witcher-gold/30">
                        {weak.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{weak.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <Zap className="w-8 h-8" /> Estratégia de Combate
              </h2>
              <div className="space-y-6">
                {bestiaryAnalysis.combatStrategy.map((step, i) => (
                  <div key={i} className="p-4 bg-black/30 rounded border-l-4 border-witcher-gold">
                    <h4 className="font-bold text-witcher-gold mb-2">{step.phase}</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{step.advice}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <Info className="w-8 h-8" /> Lore e Comportamento
              </h2>
              <p className="text-gray-300 leading-relaxed italic parchment-card p-6 bg-black/20 border-none shadow-none">
                {bestiaryAnalysis.lore}
              </p>
            </section>
          </div>

          <div className="space-y-8">
            <section className="parchment-card p-6">
              <h2 className="text-2xl mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6" /> Loot e Recompensas
              </h2>
              <div className="space-y-3">
                {bestiaryAnalysis.loot.map((item, i) => (
                  <div key={i} className="p-3 bg-witcher-gold/5 border border-witcher-gold/10 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-bold text-white">{item.item}</p>
                      <span className="text-[8px] px-1.5 py-0.5 bg-blue-900/40 text-blue-300 rounded uppercase font-bold border border-blue-500/20">
                        {item.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 italic">{item.use}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="parchment-card p-6">
              <h2 className="text-2xl mb-4 flex items-center gap-2">
                <MapIcon className="w-6 h-6" /> Onde Encontrar
              </h2>
              <ul className="text-sm space-y-2 text-gray-400">
                {bestiaryAnalysis.locations.map((loc, i) => (
                  <li key={i} className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> {loc}</li>
                ))}
              </ul>
            </section>

            <div className="p-6 bg-witcher-gold/10 border-2 border-witcher-gold/30 rounded-lg text-center space-y-2">
              <p className="text-xs text-witcher-gold/60 uppercase font-bold">Descrição do Master</p>
              <p className="text-sm italic text-gray-300 leading-relaxed">
                {bestiaryAnalysis.description}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderMerchantDashboard = () => {
    if (!merchantAnalysis) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-8 pb-20"
      >
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-witcher-gold/20 pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-cinzel text-witcher-gold">Mestre Mercador</h1>
            <div className="flex items-center gap-2 text-xs text-witcher-gold/60">
              <MapIcon className="w-4 h-4" />
              <span>Localização Atual: <strong className="text-witcher-gold">{merchantLocation}</strong></span>
            </div>
            <p className="text-witcher-gold/60 italic">"{merchantAnalysis.humor}"</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                const text = `
                  WITCHER 3 QUEST MASTER - ANÁLISE MERCANTIL
                  Estratégia: ${(merchantAnalysis.profitStrategies || [])[0]?.title || 'N/A'}
                  Itens para Vender: ${(merchantAnalysis.itemsToSell || []).map(i => i.name).join(', ')}
                `;
                navigator.clipboard.writeText(text);
                alert("Análise copiada!");
              }}
              className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Compartilhar
            </button>
            <button 
              onClick={() => {
                if (confirm("Deseja meditar e limpar esta análise?")) {
                  setMerchantAnalysis(null);
                  setMerchantImages([]);
                  setCurrentStep('MERCHANT_INPUT');
                }
              }}
              className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm flex items-center gap-2"
            >
              <Wind className="w-4 h-4" /> Meditar (Reset)
            </button>
            <button onClick={() => setCurrentStep('MERCHANT_INPUT')} className="px-6 py-2 border border-witcher-gold/30 rounded hover:bg-white/5 text-sm">Nova Análise</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <Sword className="w-8 h-8" /> O que Vender
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(merchantAnalysis.itemsToSell || []).map((item, i) => (
                  <div key={i} className={`p-4 bg-black/30 rounded border transition-all ${
                    item.strategy === 'Segurar para Depois' 
                      ? 'border-blue-500/40 bg-blue-900/5' 
                      : 'border-witcher-gold/10 hover:border-witcher-gold/40'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-witcher-gold font-bold">{item.name}</h4>
                      <div className="text-right">
                        <span className="text-xs font-bold text-green-500 block">{item.estimatedValue}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                          item.strategy === 'Vender Agora' ? 'bg-green-900/40 text-green-400' : 'bg-blue-900/40 text-blue-400'
                        }`}>
                          {item.strategy}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <MapIcon className="w-3 h-3 text-witcher-gold/60" />
                        <span className="text-witcher-gold/60 uppercase font-semibold">Onde:</span> {item.targetMerchant}
                      </p>
                      <p className="text-[11px] text-gray-500 italic ml-4">
                        {item.merchantLocation}
                      </p>
                      {item.betterMerchantLater && (
                        <p className="text-[10px] text-blue-400 flex items-center gap-1 mt-1">
                          <Info className="w-3 h-3" />
                          Melhor em: {item.betterMerchantLater}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 leading-snug">{item.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <Zap className="w-8 h-8" /> O que Desmontar
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(merchantAnalysis.itemsToDismantle || []).map((item, i) => (
                  <div key={i} className="p-4 bg-black/30 rounded border border-witcher-gold/10 hover:border-witcher-gold/40 transition-all">
                    <h4 className="text-witcher-gold font-bold mb-1">{item.name}</h4>
                    <p className="text-xs text-blue-400 mb-2"><span className="text-witcher-gold/60 uppercase">Resultado:</span> {item.yields}</p>
                    <p className="text-sm text-gray-300">{item.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="parchment-card p-8">
              <h2 className="text-3xl mb-6 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8" /> O que Guardar
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(merchantAnalysis.itemsToKeep || []).map((item, i) => (
                  <div key={i} className="p-4 bg-black/30 rounded border border-witcher-gold/10 hover:border-witcher-gold/40 transition-all">
                    <h4 className="text-witcher-gold font-bold mb-2">{item.name}</h4>
                    <p className="text-sm text-gray-300">{item.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="parchment-card p-6">
              <h2 className="text-2xl mb-4 flex items-center gap-2">
                <MapIcon className="w-6 h-6" /> Melhores Mercadores
              </h2>
              <div className="space-y-4">
                {(merchantAnalysis.bestMerchants || []).map((m, i) => (
                  <div key={i} className="p-3 bg-witcher-gold/5 border border-witcher-gold/10 rounded">
                    <p className="text-xs font-bold text-witcher-gold uppercase mb-1">{m.location}</p>
                    <p className="text-sm font-bold text-white mb-1">{m.name}</p>
                    <p className="text-xs text-blue-400 mb-1">{m.specialty}</p>
                    <p className="text-xs text-gray-400 italic">{m.why}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="parchment-card p-6 border-blue-900/50">
              <h2 className="text-2xl mb-4 flex items-center gap-2 text-blue-400">
                <Trophy className="w-6 h-6" /> Estratégias de Lucro
              </h2>
              <div className="space-y-4">
                {(merchantAnalysis.profitStrategies || []).map((s, i) => (
                  <div key={i} className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm font-bold text-white mb-1">{s.title}</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="parchment-card p-6">
              <h2 className="text-2xl mb-4 flex items-center gap-2">
                <Info className="w-6 h-6" /> Dicas de Economia
              </h2>
              <ul className="text-sm space-y-3 text-gray-400">
                {(merchantAnalysis.economyTips || []).map((tip, i) => (
                  <li key={i} className="flex gap-2"><ChevronRight className="w-4 h-4 shrink-0 text-witcher-gold" /> {tip}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderProfile = () => {
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <AnimatePresence mode="wait">
        {currentStep === 'MAIN_MENU' && renderMainMenu()}
        {isLoading && <LoadingOverlay currentStep={currentStep} appMode={appMode} />}
      </AnimatePresence>

      {currentStep !== 'MAIN_MENU' && (
        <>
          <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 pointer-events-auto">
            <button 
              onClick={() => setCurrentStep('MAIN_MENU')}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-cinzel transition-all border border-witcher-gold/30 bg-black/50 text-witcher-gold hover:bg-witcher-gold/20"
            >
              <Eye className="w-4 h-4" /> Voltar ao Menu
            </button>
            <button 
              onClick={() => {
                setAppMode('PROFILE');
                setCurrentStep('PROFILE_DASHBOARD');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-cinzel transition-all border border-witcher-gold/30 bg-black/50 text-witcher-gold hover:bg-witcher-gold/20"
            >
              <User className="w-4 h-4" /> Nv. {userData.level} | {userData.money} <Coins className="w-4 h-4 inline"/>
            </button>
          </nav>
          <nav className="max-w-5xl mx-auto mb-12 mt-16 flex justify-center gap-4 flex-wrap">
            <button 
              onClick={() => {
                setAppMode('QUESTS');
                setCurrentStep('INPUT');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-cinzel transition-all border-2 ${
                appMode === 'QUESTS' 
                  ? 'bg-witcher-gold text-black border-witcher-gold shadow-[0_0_15px_rgba(197,160,89,0.4)]' 
                  : 'bg-transparent text-witcher-gold border-witcher-gold/30 hover:border-witcher-gold/60'
              }`}
            >
              <Scroll className="w-5 h-5" /> Mestre de Missões
            </button>
            <button 
              onClick={() => {
                setAppMode('MERCHANT');
                setCurrentStep('MERCHANT_INPUT');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-cinzel transition-all border-2 ${
                appMode === 'MERCHANT' 
                  ? 'bg-witcher-gold text-black border-witcher-gold shadow-[0_0_15px_rgba(197,160,89,0.4)]' 
                  : 'bg-transparent text-witcher-gold border-witcher-gold/30 hover:border-witcher-gold/60'
              }`}
            >
              <Trophy className="w-5 h-5" /> Mestre Mercador
            </button>
            <button 
              onClick={() => {
                setAppMode('GWENT');
                setCurrentStep('GWENT_INPUT');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-cinzel transition-all border-2 ${
                appMode === 'GWENT' 
                  ? 'bg-witcher-gold text-black border-witcher-gold shadow-[0_0_15px_rgba(197,160,89,0.4)]' 
                  : 'bg-transparent text-witcher-gold border-witcher-gold/30 hover:border-witcher-gold/60'
              }`}
            >
              <Trophy className="w-5 h-5" /> Estrategista de Gwent
            </button>
            <button 
              onClick={() => {
                setAppMode('BESTIARY');
                setCurrentStep('BESTIARY_INPUT');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-cinzel transition-all border-2 ${
                appMode === 'BESTIARY' 
                  ? 'bg-witcher-gold text-black border-witcher-gold shadow-[0_0_15px_rgba(197,160,89,0.4)]' 
                  : 'bg-transparent text-witcher-gold border-witcher-gold/30 hover:border-witcher-gold/60'
              }`}
            >
              <Skull className="w-5 h-5" /> Mestre do Bestiário
            </button>
            <button 
              onClick={() => {
                setAppMode('FINDER');
                setCurrentStep('FINDER_INPUT');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-cinzel transition-all border-2 ${
                appMode === 'FINDER' 
                  ? 'bg-witcher-gold text-black border-witcher-gold shadow-[0_0_15px_rgba(197,160,89,0.4)]' 
                  : 'bg-transparent text-witcher-gold border-witcher-gold/30 hover:border-witcher-gold/60'
              }`}
            >
              <Search className="w-5 h-5" /> Mestre Rastreador
            </button>
            <button 
              onClick={() => {
                setAppMode('GEAR');
                setCurrentStep('GEAR_INPUT');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-cinzel transition-all border-2 ${
                appMode === 'GEAR' 
                  ? 'bg-witcher-gold text-black border-witcher-gold shadow-[0_0_15px_rgba(197,160,89,0.4)]' 
                  : 'bg-transparent text-witcher-gold border-witcher-gold/30 hover:border-witcher-gold/60'
              }`}
            >
              <Sword className="w-5 h-5" /> Mestre Armeiro
            </button>

            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-cinzel transition-all border-2 bg-red-900/10 text-red-400 border-red-900/20 hover:bg-red-900/30 hover:border-red-900/50"
              title="Limpar todos os dados e meditar"
            >
              <Skull className="w-5 h-5" /> Meditar
            </button>
          </nav>

          <main className="container mx-auto">
            {appMode === 'PROFILE' ? (
              renderProfile()
            ) : appMode === 'QUESTS' ? (
              <>
                {currentStep === 'INPUT' && renderInput()}
                {currentStep === 'OCR' && <div className="h-64" />}
                {currentStep === 'CONFIRM' && renderConfirm()}
                {currentStep === 'ANALYSIS' && <div className="h-64" />}
                {currentStep === 'DASHBOARD' && renderDashboard()}
              </>
            ) : appMode === 'MERCHANT' ? (
              <>
                {currentStep === 'MERCHANT_INPUT' && renderMerchantInput()}
                {currentStep === 'MERCHANT_OCR' && <div className="h-64" />}
                {currentStep === 'MERCHANT_CONFIRM' && renderMerchantConfirm()}
                {currentStep === 'MERCHANT_ANALYSIS' && <div className="h-64" />}
                {currentStep === 'MERCHANT_DASHBOARD' && renderMerchantDashboard()}
              </>
            ) : appMode === 'GWENT' ? (
              <>
                {currentStep === 'GWENT_INPUT' && renderGwentInput()}
                {currentStep === 'GWENT_OCR' && <div className="h-64" />}
                {currentStep === 'GWENT_CONFIRM' && renderGwentConfirm()}
                {currentStep === 'GWENT_ANALYSIS' && <div className="h-64" />}
                {currentStep === 'GWENT_DASHBOARD' && renderGwentDashboard()}
              </>
            ) : appMode === 'BESTIARY' ? (
              <>
                {currentStep === 'BESTIARY_INPUT' && renderBestiaryInput()}
                {currentStep === 'BESTIARY_OCR' && <div className="h-64" />}
                {currentStep === 'BESTIARY_CONFIRM' && renderBestiaryConfirm()}
                {currentStep === 'BESTIARY_ANALYSIS' && <div className="h-64" />}
                {currentStep === 'BESTIARY_DASHBOARD' && renderBestiaryDashboard()}
              </>
            ) : appMode === 'FINDER' ? (
              <>
                {currentStep === 'FINDER_INPUT' && renderFinderInput()}
                {currentStep === 'FINDER_ANALYSIS' && <div className="h-64" />}
                {currentStep === 'FINDER_DASHBOARD' && renderFinderDashboard()}
              </>
            ) : (
              <>
                {currentStep === 'GEAR_INPUT' && renderGearInput()}
                {currentStep === 'GEAR_OCR' && <div className="h-64" />}
                {currentStep === 'GEAR_CONFIRM' && renderGearConfirm()}
                {currentStep === 'GEAR_ANALYSIS' && <div className="h-64" />}
                {currentStep === 'GEAR_DASHBOARD' && renderGearDashboard()}
              </>
            )}
          </main>

          {/* Footer */}
          <footer className="mt-20 text-center text-witcher-gold/30 text-xs font-cinzel tracking-widest uppercase py-8 border-t border-witcher-gold/10">
            Witcher 3 Quest Master - Next-Gen Edition &copy; 2026
          </footer>
        </>
      )}

      {/* Quest Details Modal */}
      <AnimatePresence>
        {selectedQuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="parchment-card max-w-2xl w-full p-8 relative"
            >
              <button 
                onClick={() => setSelectedQuest(null)}
                className="absolute top-4 right-4 text-witcher-gold hover:text-white transition-colors"
              >
                <Trash2 className="w-6 h-6 rotate-45" />
              </button>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-witcher-gold/10 rounded-full">
                    {selectedQuest.type === 'Principal' ? <Sword className="text-witcher-gold" /> : <Scroll className="text-witcher-gold" />}
                  </div>
                  <div>
                    <h2 className="text-3xl">{selectedQuest.name}</h2>
                    <p className="text-xs uppercase tracking-widest text-witcher-gold/60">{selectedQuest.type} • Nível {selectedQuest.level || '?'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-black/20 rounded border border-witcher-gold/10">
                    <p className="text-[10px] uppercase text-witcher-gold/60 mb-1 tracking-tighter">Status Atual</p>
                    <p className="font-bold">{selectedQuest.status}</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded border border-witcher-gold/10">
                    <p className="text-[10px] uppercase text-witcher-gold/60 mb-1 tracking-tighter">Objetivo Principal</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={completedObjectives[selectedQuest.id] || false}
                        onChange={(e) => setCompletedObjectives(prev => ({ ...prev, [selectedQuest.id]: e.target.checked }))}
                        className="w-4 h-4 rounded border-witcher-gold/30 bg-black/40 text-witcher-gold focus:ring-witcher-gold"
                      />
                      <p className={`font-bold ${completedObjectives[selectedQuest.id] ? 'line-through text-gray-500' : ''}`}>
                        {selectedQuest.notes || 'Nenhum objetivo extraído'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-witcher-gold/10">
                  <h4 className="text-witcher-gold font-cinzel text-lg">Análise do Master</h4>
                  {analysis?.recommendations.find(r => r.questId === selectedQuest.id) && (
                    <div className="p-4 bg-witcher-gold/5 rounded border border-witcher-gold/10">
                      <p className="text-sm font-bold mb-1 text-witcher-gold">Prioridade: {analysis.recommendations.find(r => r.questId === selectedQuest.id)?.priority}</p>
                      <p className="text-sm text-gray-300">{analysis.recommendations.find(r => r.questId === selectedQuest.id)?.reason}</p>
                    </div>
                  )}
                  {analysis?.choices.find(c => c.questId === selectedQuest.id) && (
                    <div className="p-4 bg-witcher-gold/5 rounded border border-witcher-gold/10">
                      <p className="text-sm font-bold mb-1 text-green-400">Guia de Escolha</p>
                      <p className="text-sm text-gray-300">{analysis.choices.find(c => c.questId === selectedQuest.id)?.advice}</p>
                      {userData.spoilerTolerance !== 'None' && (
                        <p className="text-xs text-gray-500 mt-2 italic">Consequência: {analysis.choices.find(c => c.questId === selectedQuest.id)?.consequences}</p>
                      )}
                    </div>
                  )}
                  {analysis?.combatTips?.find(t => t.questId === selectedQuest.id) && (
                    <div className="p-4 bg-witcher-gold/5 rounded border border-witcher-gold/10">
                      <p className="text-sm font-bold mb-2 text-red-400">Preparação de Combate</p>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="text-[10px]"><span className="text-witcher-gold/60">Óleo:</span> {analysis.combatTips.find(t => t.questId === selectedQuest.id)?.bestOils}</div>
                        <div className="text-[10px]"><span className="text-witcher-gold/60">Poção:</span> {analysis.combatTips.find(t => t.questId === selectedQuest.id)?.bestPotions}</div>
                        <div className="text-[10px]"><span className="text-witcher-gold/60">Sinal:</span> {analysis.combatTips.find(t => t.questId === selectedQuest.id)?.bestSigns}</div>
                      </div>
                      <p className="text-xs text-gray-300">{analysis.combatTips.find(t => t.questId === selectedQuest.id)?.strategy}</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedQuest(null)}
                  className="witcher-button w-full mt-4"
                >
                  Fechar Pergaminho
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
