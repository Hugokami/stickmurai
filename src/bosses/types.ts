import type { Enemy } from '../enemy';

export type BossType = 'oni_boss' | 'shogun_boss' | 'agis_colossus' | 'skeleton_warlord';

export interface BossBehavior {
  readonly subType: BossType;
  configure(enemy: Enemy): void;
  triggerAttack(enemy: Enemy, distToTarget: number): boolean;
  castSpell(enemy: Enemy): boolean;
  onHit?(enemy: Enemy, damage: number): boolean;
}
