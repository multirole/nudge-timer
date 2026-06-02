export type Theme = 'water' | 'runner' | 'rocket';

export interface CustomMessage {
  id: string;
  text: string;
  displayMode: 'start' | 'periodic';
}

export interface Stage {
  id: string;
  name: string;
  minutes: number;
  messages: CustomMessage[];
}

export interface Preset {
  id: string;
  name: string;
  stages: Stage[];
  theme: Theme;
}
