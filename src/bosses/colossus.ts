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
      const p = Projectile.acquire(enemy.x, enemy.y, enemy.targetAngle, true, 4, true);
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

    const baseAng = enemy.targetAngle;
    const spreadAngles = isLateStage
      ? [baseAng - 0.48, baseAng - 0.24, baseAng, baseAng + 0.24, baseAng + 0.48]
      : [baseAng - 0.28, baseAng, baseAng + 0.28];
    for (const ang of spreadAngles) {
      const proj = Projectile.acquire(enemy.x, enemy.y, ang, true, isLateStage ? 3 : 2);
      (proj as any).shooter = enemy;
      (proj as any).colorTint = '#38bdf8';
      (proj as any).projectileType = 'water';
      globals.projectiles.push(proj);
    }

    const pdx = globals.player.x - enemy.x;
    const pdy = globals.player.y - enemy.y;
    const slamRadius = isLateStage ? 260 : 200;
    if (pdx * pdx + pdy * pdy < slamRadius * slamRadius && globals.player.state !== 'dead') {
      callbacks.checkPlayerHit(enemy, isLateStage ? 5 : 4);
    }

    globals.delayedActions.push({
      delay: 0.25,
      run: () => {
        if (enemy.state !== 'dead') {
          globals.shockwaves.push(new Shockwave(enemy.x, enemy.y, '#0284c7', isLateStage ? 400 : 300));
          const afterDx = globals.player.x - enemy.x;
          const afterDy = globals.player.y - enemy.y;
          const afterRadius = isLateStage ? 360 : 280;
          if (afterDx * afterDx + afterDy * afterDy < afterRadius * afterRadius && globals.player.state !== 'dead') {
            callbacks.checkPlayerHit(enemy, isLateStage ? 2 : 1);
          }
        }
      }
    });

    if (isLateStage) {
      globals.delayedActions.push({
        delay: 0.5,
        run: () => {
          if (enemy.state !== 'dead') {
            globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#38bdf8', 180));
            const pDistX = globals.player.x - enemy.x;
            const pDistY = globals.player.y - enemy.y;
            if (Math.hypot(pDistX, pDistY) < 380 && globals.player.state !== 'dead') {
              callbacks.checkPlayerHit(enemy, 2);
            }
          }
        }
      });
    }

    enemy.attackLanded = true;
    return true;
  }
};
