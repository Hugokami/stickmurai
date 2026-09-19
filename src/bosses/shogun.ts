import type { Enemy } from '../enemy';
import type { BossBehavior } from './types';
import { globals } from '../globals';
import { callbacks } from '../callbacks';
import { BOSS_BASE_HP } from '../balance';
import { Projectile, Shockwave, FloatingText } from '../entities';

export const shogunBossBehavior: BossBehavior = {
  subType: 'shogun_boss',

  configure(enemy: Enemy): void {
    enemy.type = 'evil_wizard';
    enemy.scaleMult = 2.4;
    enemy.lungeSpeed = 1650;
    enemy.chargeTimeMax = 0.65;
    enemy.lungeDuration = 0.36;
    enemy.speed = 340;
    enemy.maxPosture = 2000;
    enemy.hp = enemy.maxHp = BOSS_BASE_HP.shogun_boss;
    enemy.expValue = 35;
  },

  triggerAttack(enemy: Enemy, distToTarget: number): boolean {
    if (!enemy.attackLanded && distToTarget > 180 && enemy.stateTime >= 0.15) {
      for (const off of [-0.3, -0.1, 0.1, 0.3]) {
        const p = Projectile.acquireKunai(enemy.x, enemy.y, enemy.targetAngle + off, true, 4);
        (p as any).shooter = enemy;
        (p as any).colorTint = '#fbbf24';
        globals.projectiles.push(p);
      }
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
    globals.screenShake = Math.max(globals.screenShake, isLateStage ? 30 : 22);
    globals.shockwaves.push(new Shockwave(enemy.x, enemy.y, '#9333ea', isLateStage ? 280 : 200));
    globals.floatingTexts.push(FloatingText.acquire(
      enemy.x,
      enemy.y - 70,
      isLateStage ? 'OMNIDIRECTIONAL VOID EXECUTION! 🥷' : 'SHADOW VOID FLURRY! 🥷',
      '#a855f7',
      30
    ));

    const pdx = globals.player.x - enemy.x;
    const pdy = globals.player.y - enemy.y;
    const slashRadius = isLateStage ? 240 : 180;
    if (pdx * pdx + pdy * pdy < slashRadius * slashRadius && globals.player.state !== 'dead') {
      callbacks.checkPlayerHit(enemy, isLateStage ? 3 : 2);
    }

    const baseAng = enemy.targetAngle;
    const offsets = isLateStage
      ? [-0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7]
      : [-0.44, -0.22, 0, 0.22, 0.44];
    for (const offset of offsets) {
      const proj = Projectile.acquire(enemy.x, enemy.y, baseAng + offset, true, isLateStage ? 5 : 4);
      (proj as any).shooter = enemy;
      (proj as any).colorTint = '#a855f7';
      (proj as any).projectileType = 'water_ball';
      proj.vx = Math.cos(baseAng + offset) * (isLateStage ? 1350 : 1200);
      proj.vy = Math.sin(baseAng + offset) * (isLateStage ? 1350 : 1200);
      globals.projectiles.push(proj);
    }
    enemy.attackLanded = true;
    return true;
  }
};
