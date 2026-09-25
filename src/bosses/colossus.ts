import type { Enemy } from '../enemy';
import type { BossBehavior } from './types';
import { globals } from '../globals';
import { callbacks } from '../callbacks';
import { BOSS_BASE_HP } from '../balance';
import { Projectile, Shockwave, FloatingText, AnimatedEffect } from '../entities';
import { playSynthesizedThunder } from '../audio';
import { vfxAnims } from '../assets';

export const colossusBossBehavior: BossBehavior = {
  subType: 'agis_colossus',

  configure(enemy: Enemy): void {
    enemy.type = 'boss_agis';
    enemy.scaleMult = 2.4;
    enemy.lungeSpeed = 1050;
    enemy.chargeTimeMax = 0.85;
    enemy.lungeDuration = 0.48;
    enemy.speed = 240;
    enemy.maxPosture = 2400;
    enemy.hp = enemy.maxHp = BOSS_BASE_HP.agis_colossus;
    enemy.expValue = 45;
  },

  triggerAttack(enemy: Enemy, distToTarget: number): boolean {
    if (!enemy.attackLanded && distToTarget > 220 && enemy.stateTime >= 0.18) {
      const p = Projectile.acquire(enemy.x, enemy.y, enemy.targetAngle, true, 1, true);
      (p as any).shooter = enemy;
      (p as any).colorTint = '#00ffff';
      (p as any).projectileType = 'water_ball';
      globals.projectiles.push(p);
      globals.shockwaves.push(new Shockwave(enemy.x, enemy.y, '#00ffff'));
      globals.screenShake = Math.max(globals.screenShake, 18);
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
    globals.screenShake = Math.max(globals.screenShake, isLateStage ? 34 : 24);
    globals.shockwaves.push(new Shockwave(enemy.x, enemy.y, '#38bdf8', isLateStage ? 340 : 240));
    const bossImpact = (vfxAnims as any).boss?.slamImpact;
    const bossDust = (vfxAnims as any).boss?.slamDust;
    if (bossImpact?.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(enemy.x, enemy.y, bossImpact, 0.5, isLateStage ? 2.6 : 2.0));
    }
    if (bossDust?.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(enemy.x, enemy.y, bossDust, 0.55, isLateStage ? 2.8 : 2.2));
    }
    globals.floatingTexts.push(FloatingText.acquire(
      enemy.x,
      enemy.y - 65,
      isLateStage ? 'TITANIC APOCALYPSE CRUSH! ⚡' : 'COLOSSUS CRUSH! ⚡',
      '#38bdf8',
      30
    ));
    playSynthesizedThunder();

    const pdx = globals.player.x - enemy.x;
    const pdy = globals.player.y - enemy.y;
    const slamRadius = isLateStage ? 260 : 200;
    if (pdx * pdx + pdy * pdy < slamRadius * slamRadius && globals.player.state !== 'dead') {
      callbacks.checkPlayerHit(enemy, 2);
    }

    const centerX = enemy.x;
    const centerY = enemy.y;
    const outerRadius = isLateStage ? 360 : 280;
    const warning = new Shockwave(centerX, centerY, '#38bdf8', outerRadius);
    warning.life = warning.maxLife = 0.65;
    globals.shockwaves.push(warning);
    const innerWarning = new Shockwave(centerX, centerY, '#38bdf8', isLateStage ? 260 : 180);
    innerWarning.life = innerWarning.maxLife = 0.65;
    globals.shockwaves.push(innerWarning);
    globals.delayedActions.push({
      delay: 0.65,
      run: () => {
        if (enemy.state === 'dead') return;
        globals.shockwaves.push(new Shockwave(centerX, centerY, '#0284c7', isLateStage ? 400 : 300));
        const afterDx = globals.player.x - centerX;
        const afterDy = globals.player.y - centerY;
        const distanceSq = afterDx * afterDx + afterDy * afterDy;
        const outerRadius = isLateStage ? 360 : 280;
        // Step inside after the slam, or stay outside the expanding ring.
        if (distanceSq >= slamRadius * slamRadius && distanceSq < outerRadius * outerRadius && globals.player.state !== 'dead') {
          callbacks.checkPlayerHit(enemy, 1);
        }
      }
    });

    enemy.attackLanded = true;
    return true;
  }
};
