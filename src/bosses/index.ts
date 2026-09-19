import type { Enemy } from '../enemy';
import type { BossType, BossBehavior } from './types';
import { oniBossBehavior } from './oni';
import { shogunBossBehavior } from './shogun';
import { colossusBossBehavior } from './colossus';
import { warlordBossBehavior } from './warlord';

export * from './types';
export { oniBossBehavior } from './oni';
export { shogunBossBehavior } from './shogun';
export { colossusBossBehavior } from './colossus';
export { warlordBossBehavior } from './warlord';

export const BOSS_BEHAVIORS: Record<BossType, BossBehavior> = {
  oni_boss: oniBossBehavior,
  shogun_boss: shogunBossBehavior,
  agis_colossus: colossusBossBehavior,
  skeleton_warlord: warlordBossBehavior
};

export function isBossType(subType?: string | null): subType is BossType {
  return !!subType && subType in BOSS_BEHAVIORS;
}

export function configureBoss(enemy: Enemy, subType: BossType): boolean {
  const behavior = BOSS_BEHAVIORS[subType];
  if (behavior) {
    behavior.configure(enemy);
    return true;
  }
  return false;
}

export function triggerBossAttack(enemy: Enemy, distToTarget: number): boolean {
  if (isBossType(enemy.subType)) {
    return BOSS_BEHAVIORS[enemy.subType].triggerAttack(enemy, distToTarget);
  }
  return false;
}

export function castBossSpell(enemy: Enemy): boolean {
  if (isBossType(enemy.subType)) {
    return BOSS_BEHAVIORS[enemy.subType].castSpell(enemy);
  }
  return false;
}

export function handleBossHit(enemy: Enemy, damage: number): boolean {
  if (isBossType(enemy.subType)) {
    const handler = BOSS_BEHAVIORS[enemy.subType].onHit;
    if (handler) {
      return handler(enemy, damage);
    }
  }
  return false;
}
