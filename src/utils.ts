export const parseJSON = (text: string, defaultValue: any) => {
  try {
    let cleaned = text.trim();
    // Remove markdown code blocks if present (handles ```json ... ``` and just ``` ... ```)
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      cleaned = match[1].trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }
    
    // Fallback if the AI returns empty string
    if (!cleaned) {
      return defaultValue;
    }
    
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON:", text, e);
    // Return default value instead of throwing to prevent app crash
    return defaultValue;
  }
};

export const getHumanizedErrorMessage = (err: any): string => {
  const msg = err?.message || String(err);
  if (msg.includes('quota') || msg.includes('429')) {
    return "A magia da IA está esgotada no momento (Limite de Quota). Por favor, medite e tente novamente em alguns minutos.";
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return "Falha na conexão com o Continente. Verifique sua internet e tente novamente.";
  }
  if (msg.includes('SAFETY')) {
    return "A IA bloqueou a análise por motivos de segurança (conteúdo impróprio detectado na imagem).";
  }
  if (msg.includes('API key')) {
    return "Chave da API inválida ou ausente. Verifique as configurações do seu medalhão (variáveis de ambiente).";
  }
  return "Ocorreu um erro inesperado na conjuração. Tente imagens mais claras ou tente novamente mais tarde.";
};
