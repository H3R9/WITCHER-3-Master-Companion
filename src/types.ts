export type AppMode = 'QUESTS' | 'MERCHANT' | 'GWENT' | 'BESTIARY' | 'FINDER' | 'GEAR' | 'PROFILE';
export type Step = 'MAIN_MENU' | 'INPUT' | 'OCR' | 'CONFIRM' | 'DASHBOARD' | 
            'MERCHANT_INPUT' | 'MERCHANT_OCR' | 'MERCHANT_CONFIRM' | 'MERCHANT_DASHBOARD' |
            'GWENT_INPUT' | 'GWENT_OCR' | 'GWENT_CONFIRM' | 'GWENT_DASHBOARD' |
            'BESTIARY_INPUT' | 'BESTIARY_OCR' | 'BESTIARY_CONFIRM' | 'BESTIARY_DASHBOARD' |
            'FINDER_INPUT' | 'FINDER_OCR' | 'FINDER_DASHBOARD' |
            'GEAR_INPUT' | 'GEAR_OCR' | 'GEAR_CONFIRM' | 'GEAR_DASHBOARD' |
            'PROFILE_DASHBOARD';

export interface UserData {
  level: number;
  location: string;
  spoilerTolerance: 'None' | 'Low' | 'High';
  money: number;
  accessibleLocations: string[];
  toggles: {
    prioritizeMain: boolean;
    groupGeographically: boolean;
    showWarnings: boolean;
  };
}
