import type { Enemy } from '../enemy';
import type { BossBehavior } from './types';
import { globals } from '../globals';
import { callbacks } from '../callbacks';
import { BOSS_BASE_HP } from '../balance';
import { Projectile, Shockwave, FloatingText, AnimatedEffect } from '../entities';
import { vfxAnims } from '../assets';

export const warlordBossBehavior: BossBehavior = {
  subType: 'skeleton_warlord',

  configure(enemy: Enemy): void {
    enemy.type = 'boss_skeleton';
    enemy.scaleMult = 2.2;
    enemy.lungeSpeed = 1250;
    enemy.chargeTimeMax = 0.80;
    enemy.lungeDuration = 0.44;
    enemy.speed = 270;
    enemy.maxPosture = 2200;
    enemy.hp = enemy.maxHp = BOSS_BASE_HP.skeleton_warlord;
    enemy.expValue = 50;
  },

  triggerAttack(enemy: Enemy, distToTarget: number): boolean {
    if (!enemy.attackLanded && distToTarget > 220 && enemy.stateTime >= 0.15) {
      for (const off of [-0.25, 0, 0.25]) {
        const p = Projectile.acquire(enemy.x, enemy.y, enemy.targetAngle + off, true, 1);
        (p as any).shooter = enemy;
        (p as any).colorTint = '#a855f7';
        (p as any).projectileType = 'water';
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
    globals.screenShake = Math.max(globals.screenShake, isLateStage ? 32 : 24);
    globals.shockwaves.push(new Shockwave(enemy.x, enemy.y, '#ef4444', isLateStage ? 320 : 240));
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
      enemy.y - 70,
      isLateStage ? 'DREAD WARLORD BONE STORM! 💀' : 'WARLORD CLEAVE! 💀',
      '#ef4444',
      28
    ));

    const pdx = globals.player.x - enemy.x;
    const pdy = globals.player.y - enemy.y;
    const cleaveRadius = isLateStage ? 280 : 220;
    const facing = pdx * Math.cos(enemy.targetAngle) + pdy * Math.sin(enemy.targetAngle);
    if (pdx * pdx + pdy * pdy < cleaveRadius * cleaveRadius && facing > 0 && globals.player.state !== 'dead') {
      callbacks.checkPlayerHit(enemy, 1);
    }
    enemy.attackLanded = true;
    return true;
  },

  onHit(enemy: Enemy, _damage: number): boolean {
    if (enemy.subType === 'skeleton_warlord' && enemy.state === 'react') {
      globals.screenShake = Math.max(globals.screenShake, 18);
      globals.floatingTexts.push(FloatingText.acquire(
        enemy.x,
        enemy.y - 60,
        globals.currentLang === 'ja' ? '骨刃受け流し！ 🛡️' : 'BONE DEFLECTION! 🛡️',
        '#cbd5e1',
        26
      ));
      globals.shockwaves.push(new Shockwave(enemy.x, enemy.y, '#f59e0b'));
      enemy.setState('attack');
      enemy.targetAngle = Math.atan2(globals.player.y - enemy.y, globals.player.x - enemy.x);
      enemy.lungeCos = Math.cos(enemy.targetAngle);
      enemy.lungeSin = Math.sin(enemy.targetAngle);
      enemy.vx = 0;
      enemy.vy = 0;
      return true;
    }
    return false;
  }
};
