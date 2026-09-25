import type { Enemy } from '../enemy';
import type { BossBehavior } from './types';
import { globals } from '../globals';
import { callbacks } from '../callbacks';
import { BOSS_BASE_HP } from '../balance';
import { Projectile, Shockwave, FloatingText } from '../entities';
import { playSynthesizedThunder } from '../audio';

export const oniBossBehavior: BossBehavior = {
  subType: 'oni_boss',

  configure(enemy: Enemy): void {
    enemy.type = 'skeleton';
    enemy.scaleMult = 2.5;
    enemy.lungeSpeed = 1350;
    enemy.chargeTimeMax = 0.75;
    enemy.lungeDuration = 0.42;
    enemy.speed = 320;
    enemy.colorTint = 'none';
    enemy.maxPosture = 1800;
    enemy.hp = enemy.maxHp = BOSS_BASE_HP.oni_boss;
    enemy.expValue = 25;
  },

  triggerAttack(enemy: Enemy, distToTarget: number): boolean {
    if (!enemy.attackLanded && distToTarget > 200 && enemy.stateTime >= 0.15) {
      const p1 = Projectile.acquire(enemy.x, enemy.y, enemy.targetAngle - 0.18, true, 1, true);
      const p2 = Projectile.acquire(enemy.x, enemy.y, enemy.targetAngle + 0.18, true, 1, true);
      (p1 as any).shooter = enemy;
      (p1 as any).colorTint = '#ef4444';
      (p1 as any).projectileType = 'fire';
      (p2 as any).shooter = enemy;
      (p2 as any).colorTint = '#ef4444';
      (p2 as any).projectileType = 'fire';
      globals.projectiles.push(p1, p2);
      globals.shockwaves.push(new Shockwave(enemy.x, enemy.y, '#ef4444'));
      enemy.attackLanded = true;
      return true;
    } else if (!enemy.attackLanded) {
      const dxHit = enemy.target.x - enemy.x;
      const dyHit = enemy.target.y - enemy.y;
      if (dxHit * dxHit + dyHit * dyHit < enemy.meleeHitRadius * enemy.meleeHitRadius) {
        enemy.executeAttack();
        enemy.attackLanded = true;
        return true;
      }
    }
    return false;
  },

  castSpell(enemy: Enemy): boolean {
    const isLateStage = (globals.currentStage || 1) >= 60;
    globals.screenShake = Math.max(globals.screenShake, isLateStage ? 32 : 24);
    globals.shockwaves.push(new Shockwave(enemy.x, enemy.y, '#dc2626', isLateStage ? 300 : 220));
    globals.floatingTexts.push(FloatingText.acquire(
      enemy.x,
      enemy.y - 70,
      isLateStage ? 'INFERNAL ONI CATACLYSM! 👹' : 'ONI HELLFIRE SLAM! 👹',
      '#ef4444',
      30
    ));
    playSynthesizedThunder();

    const pdx = globals.player.x - enemy.x;
    const pdy = globals.player.y - enemy.y;
    const slamRadius = isLateStage ? 260 : 200;
    if (pdx * pdx + pdy * pdy < slamRadius * slamRadius && globals.player.state !== 'dead') {
      callbacks.checkPlayerHit(enemy, 1);
    }
    enemy.attackLanded = true;
    return true;
  }
};
