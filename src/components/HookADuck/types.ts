export interface Prize {
  id: string;
  name: string;
  description?: string;
  isClaimed: boolean;
}

export interface Duck {
  id: string;
  prizeId: string;
  position: number;
}

export type GameState = 'idle' | 'selecting' | 'hooking' | 'revealing' | 'complete';
