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
import { parseJSON, getHumanizedErrorMessage } from './utils';
import { Step, AppMode, UserData } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { MainMenu } from './components/MainMenu';
import { ProfileDashboard } from './components/ProfileDashboard';
import { QuestInput } from './components/QuestInput';
import { QuestConfirm } from './components/QuestConfirm';
import { MerchantInput } from './components/MerchantInput';
import { MerchantConfirm } from './components/MerchantConfirm';
import { GwentConfirm } from './components/GwentConfirm';
import { BestiaryConfirm } from './components/BestiaryConfirm';
import { GearConfirm } from './components/GearConfirm';
import { QuestDashboard } from './components/QuestDashboard';
import { GwentInput } from './components/GwentInput';
import { GwentDashboard } from './components/GwentDashboard';
import { FinderInput } from './components/FinderInput';
import { FinderDashboard } from './components/FinderDashboard';
import { GearInput } from './components/GearInput';
import { GearDashboard } from './components/GearDashboard';
import { BestiaryInput } from './components/BestiaryInput';
import { BestiaryDashboard } from './components/BestiaryDashboard';
import { MerchantDashboard } from './components/MerchantDashboard';
import backgroundImage from './witcher-3-4k-hanged-man-s-tree-3klyvhf64cpx4qmh.jpg';

// --- Types ---

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
      setError(getHumanizedErrorMessage(err));
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
      setError(getHumanizedErrorMessage(err));
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
      setError(getHumanizedErrorMessage(err));
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
      setError(getHumanizedErrorMessage(err));
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
      setError(getHumanizedErrorMessage(err));
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
      setError(getHumanizedErrorMessage(err));
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
      setError(getHumanizedErrorMessage(err));
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
      setError(getHumanizedErrorMessage(err));
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
      setError(getHumanizedErrorMessage(err));
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
      setError(getHumanizedErrorMessage(err));
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
      setError(getHumanizedErrorMessage(err));
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







































  return (
    <div className="min-h-screen p-4 md:p-8">
      <AnimatePresence mode="wait">
        {currentStep === 'MAIN_MENU' && (
          <MainMenu 
            setAppMode={setAppMode} 
            setCurrentStep={setCurrentStep} 
            handleReset={handleReset} 
          />
        )}
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
              <ProfileDashboard 
                user={user}
                userData={userData}
                updateUserData={updateUserData}
                loginWithGoogle={loginWithGoogle}
                logout={logout}
                setAppMode={setAppMode}
                setCurrentStep={setCurrentStep}
              />
            ) : appMode === 'QUESTS' ? (
              <>
                {currentStep === 'INPUT' && (
                  <QuestInput 
                    images={images}
                    removeImage={removeImage}
                    handleImageUpload={handleImageUpload}
                    userData={userData}
                    updateUserData={updateUserData}
                    runOCR={runOCR}
                    isLoading={isLoading}
                    error={error}
                  />
                )}
                {currentStep === 'OCR' && <div className="h-64" />}
                {currentStep === 'CONFIRM' && (
                  <QuestConfirm 
                    quests={quests}
                    setQuests={setQuests}
                    setCurrentStep={setCurrentStep}
                    runAnalysis={runAnalysis}
                  />
                )}
                {currentStep === 'ANALYSIS' && <div className="h-64" />}
                {currentStep === 'DASHBOARD' && (
                  <QuestDashboard 
                    analysis={analysis}
                    quests={quests}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    userData={userData}
                    setAnalysis={setAnalysis}
                    setQuests={setQuests}
                    setImages={setImages}
                    setCurrentStep={setCurrentStep}
                    setSelectedQuest={setSelectedQuest}
                  />
                )}
              </>
            ) : appMode === 'MERCHANT' ? (
              <>
                {currentStep === 'MERCHANT_INPUT' && (
                  <MerchantInput 
                    merchantImages={merchantImages}
                    setMerchantImages={setMerchantImages}
                    merchantLocation={merchantLocation}
                    setMerchantLocation={setMerchantLocation}
                    extractMerchantItems={extractMerchantItems}
                    isLoading={isLoading}
                    error={error}
                  />
                )}
                {currentStep === 'MERCHANT_OCR' && <div className="h-64" />}
                {currentStep === 'MERCHANT_CONFIRM' && (
                  <MerchantConfirm 
                    merchantItems={merchantItems}
                    setMerchantItems={setMerchantItems}
                    setCurrentStep={setCurrentStep}
                    runMerchantAnalysis={runMerchantAnalysis}
                  />
                )}
                {currentStep === 'MERCHANT_ANALYSIS' && <div className="h-64" />}
                {currentStep === 'MERCHANT_DASHBOARD' && (
                  <MerchantDashboard 
                    merchantAnalysis={merchantAnalysis}
                    setMerchantAnalysis={setMerchantAnalysis}
                    setMerchantImages={setMerchantImages}
                    setCurrentStep={setCurrentStep}
                    merchantLocation={merchantLocation}
                  />
                )}
              </>
            ) : appMode === 'GWENT' ? (
              <>
                {currentStep === 'GWENT_INPUT' && (
                  <GwentInput 
                    gwentImages={gwentImages}
                    setGwentImages={setGwentImages}
                    extractGwentCards={extractGwentCards}
                    isLoading={isLoading}
                    error={error}
                  />
                )}
                {currentStep === 'GWENT_OCR' && <div className="h-64" />}
                {currentStep === 'GWENT_CONFIRM' && (
                  <GwentConfirm 
                    gwentCards={gwentCards}
                    setGwentCards={setGwentCards}
                    setCurrentStep={setCurrentStep}
                    runGwentAnalysis={runGwentAnalysis}
                  />
                )}
                {currentStep === 'GWENT_ANALYSIS' && <div className="h-64" />}
                {currentStep === 'GWENT_DASHBOARD' && (
                  <GwentDashboard 
                    gwentAnalysis={gwentAnalysis}
                    setGwentAnalysis={setGwentAnalysis}
                    setGwentImages={setGwentImages}
                    setCurrentStep={setCurrentStep}
                  />
                )}
              </>
            ) : appMode === 'BESTIARY' ? (
              <>
                {currentStep === 'BESTIARY_INPUT' && (
                  <BestiaryInput 
                    bestiaryImages={bestiaryImages}
                    setBestiaryImages={setBestiaryImages}
                    extractBestiaryTarget={extractBestiaryTarget}
                    isLoading={isLoading}
                    error={error}
                  />
                )}
                {currentStep === 'BESTIARY_OCR' && <div className="h-64" />}
                {currentStep === 'BESTIARY_CONFIRM' && (
                  <BestiaryConfirm 
                    bestiaryTarget={bestiaryTarget}
                    setBestiaryTarget={setBestiaryTarget}
                    setCurrentStep={setCurrentStep}
                    runBestiaryAnalysis={runBestiaryAnalysis}
                  />
                )}
                {currentStep === 'BESTIARY_ANALYSIS' && <div className="h-64" />}
                {currentStep === 'BESTIARY_DASHBOARD' && (
                  <BestiaryDashboard 
                    bestiaryAnalysis={bestiaryAnalysis}
                    setBestiaryAnalysis={setBestiaryAnalysis}
                    setBestiaryImages={setBestiaryImages}
                    setCurrentStep={setCurrentStep}
                  />
                )}
              </>
            ) : appMode === 'FINDER' ? (
              <>
                {currentStep === 'FINDER_INPUT' && (
                  <FinderInput 
                    finderQuery={finderQuery}
                    setFinderQuery={setFinderQuery}
                    userData={userData}
                    updateUserData={updateUserData}
                    runFinderAnalysis={runFinderAnalysis}
                    isLoading={isLoading}
                    error={error}
                  />
                )}
                {currentStep === 'FINDER_ANALYSIS' && <div className="h-64" />}
                {currentStep === 'FINDER_DASHBOARD' && (
                  <FinderDashboard 
                    finderAnalysis={finderAnalysis}
                    setFinderAnalysis={setFinderAnalysis}
                    setFinderQuery={setFinderQuery}
                    setCurrentStep={setCurrentStep}
                  />
                )}
              </>
            ) : (
              <>
                {currentStep === 'GEAR_INPUT' && (
                  <GearInput 
                    gearImages={gearImages}
                    setGearImages={setGearImages}
                    userData={userData}
                    updateUserData={updateUserData}
                    extractGearItems={extractGearItems}
                    isLoading={isLoading}
                    error={error}
                  />
                )}
                {currentStep === 'GEAR_OCR' && <div className="h-64" />}
                {currentStep === 'GEAR_CONFIRM' && (
                  <GearConfirm 
                    gearItems={gearItems}
                    setGearItems={setGearItems}
                    setCurrentStep={setCurrentStep}
                    runGearAnalysis={runGearAnalysis}
                  />
                )}
                {currentStep === 'GEAR_ANALYSIS' && <div className="h-64" />}
                {currentStep === 'GEAR_DASHBOARD' && (
                  <GearDashboard 
                    gearAnalysis={gearAnalysis}
                    setGearAnalysis={setGearAnalysis}
                    setGearImages={setGearImages}
                    setCurrentStep={setCurrentStep}
                  />
                )}
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
