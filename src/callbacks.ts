export const callbacks = {
  t: (key: string): string => key,
  playSound: (_pool: HTMLAudioElement[], _volumeMult?: number) => {},
  playSynthesizedHit: () => {},
  playSynthesizedHurt: () => {},
  playSynthesizedParry: () => {},
  playSynthesizedPerfectParry: () => {},
  playSynthesizedDodge: () => {},
  playSynthesizedThunder: () => {},
  playSynthesizedEnhance: () => {},
  playSynthesizedLevelUp: () => {},
  playSynthesizedAwaken: () => {},
  playSynthesizedFirewheel: () => {},
  playSynthesizedGravity: () => {},
  hitEnemy: (_e: any, _dmg?: number) => {},
  checkPlayerHit: (_e: any) => {},
  killEnemy: (_e: any) => {},
  addCombo: () => {},
  addFlow: (_amount: number) => {},
  updateUI: () => {},
  updateEnhanceButton: () => {},
  updateComboDisplay: () => {},
  triggerFlowingCounterReset: () => {},
  triggerElementalExplosion: (_x: number, _y: number, _wasChilled: boolean, _wasBurning: boolean) => {},
  triggerPvPEmote: (_id: number) => {},
  revivePlayer: () => {},
};

export const assetCallbacks = {
  onProgress: () => {}
};
