import { globals } from './globals';
import { playSynthesizedSingingBowl, playSynthesizedTempleBell } from './audio';
import { Particle, FloatingText, Shockwave } from './entities';

export interface YomiSeal {
  id: number;
  titleEn: string;
  titleJa: string;
  featDescEn: string;
  featDescJa: string;
  loreFragmentEn: string;
  loreFragmentJa: string;
  rewardEn: string;
  rewardJa: string;
  applyPermanentReward: () => void;
}

export const YOMI_SEALS: Record<number, YomiSeal> = {
  1: {
    id: 1,
    titleEn: "Seal I: The Cup of Betrayal",
    titleJa: "第一の封印：裏切りの杯",
    featDescEn: "Win 3 Blade Clashes in a single run.",
    featDescJa: "1回の出撃で鍔迫り合いに3回勝利する。",
    loreFragmentEn: "The green tea tasted faintly of bitter almonds. When you placed your cup down, your brother the Shogun did not meet your gaze. Outside, five hundred archers had already notched their bows.",
    loreFragmentJa: "緑茶からはかすかに苦いアーモンドの香りが漂っていた。あなたが杯を置いた時、実の兄である将軍は目を合わさなかった。外では既に五百の弓兵が矢番えを終えていたのだ。",
    rewardEn: "PERMANENT: +1 Maximum Heart slot.",
    rewardJa: "恒久恩恵：最大体力 +1 ハート。",
    applyPermanentReward: () => {
      globals.maxLives = Math.max(globals.maxLives, 6);
      globals.lives = Math.min(globals.lives + 1, globals.maxLives);
    }
  },
  2: {
    id: 2,
    titleEn: "Seal II: The Iron Oath",
    titleJa: "第二の封印：鉄の誓い",
    featDescEn: "Survive for 25 seconds while clinging to 1 Heart.",
    featDescJa: "残り体力1ハートの極限状態で25秒間生存する。",
    loreFragmentEn: "Seven arrows pierced your shoulder, yet your grip on the hilt never slackened. 'A samurai does not fall until his duty is fulfilled,' you whispered into the crimson snow.",
    loreFragmentJa: "七本の矢が肩を貫いても、柄を握る手は決して緩まなかった。「武士は己の務めを果たすまで決して斃れぬ」と、紅に染まる雪原へ呟いた。",
    rewardEn: "PERMANENT: Ronin's Resolve emergency invulnerability duration increased from 1.5s to 2.5s.",
    rewardJa: "恒久恩恵：「武士の気迫」の緊急無敵時間が1.5秒から2.5秒に延長。",
    applyPermanentReward: () => {}
  },
  3: {
    id: 3,
    titleEn: "Seal III: The Storm's Judgment",
    titleJa: "第三の封印：嵐の神判",
    featDescEn: "Slay any Boss without taking damage during the encounter.",
    featDescJa: "ボスとの交戦中に一切ダメージを受けずに撃破する。",
    loreFragmentEn: "When the sky cracked over Mount Kurama, the Storm God Raijin descended not with fury, but with silence. He touched your katana, leaving a humming electric seal upon the steel.",
    loreFragmentJa: "鞍馬山の空が裂けた時、雷神は怒りではなく静寂と共に降臨した。神はあなたの刀に触れ、鋼の刀身に鳴動する雷鳴の刻印を遺した。",
    rewardEn: "PERMANENT: Flow energy accumulates +20% faster across all stances.",
    rewardJa: "恒久恩恵：すべての型において気力（Flow）の蓄積速度が+20%向上。",
    applyPermanentReward: () => {
      globals.playerStats.flowGenMult *= 1.2;
    }
  },
  4: {
    id: 4,
    titleEn: "Seal IV: The Thousand Cuts",
    titleJa: "第四の封印：千閃の境地",
    featDescEn: "Achieve a 50x Combo streak in combat.",
    featDescJa: "戦闘中に50回連続のコンボを達成する。",
    loreFragmentEn: "In the bamboo groves of your youth, the master placed a falling leaf on the edge of your blade. 'Speed without calm is chaos. Calm without speed is death. Cut until the world stops.'",
    loreFragmentJa: "幼き日の竹林で、師匠はあなたの刃の切っ先に舞い散る葉を乗せた。「静寂なき速さは混沌。速さなき静寂は死。世界が止まるまで斬り続けよ。」",
    rewardEn: "PERMANENT: Combo decay timer extended by +1.5 seconds.",
    rewardJa: "恒久恩恵：コンボ継続タイマーが+1.5秒延長。",
    applyPermanentReward: () => {}
  },
  5: {
    id: 5,
    titleEn: "Seal V: The Mirror Soul",
    titleJa: "第五の封印：鏡像の影",
    featDescEn: "Defeat a Shadow Doppelganger during a calamity invasion.",
    featDescJa: "災厄の侵攻中に現れる鏡像の影（分身）を討伐する。",
    loreFragmentEn: "The ghost that stood before you wore your face, bore your scars, and wept your tears. 'I am the brother you could not save,' the phantom whispered as your blades crossed.",
    loreFragmentJa: "目の前に現れた亡霊は、あなたの顔を持ち、同じ傷を刻み、同じ涙を流していた。「俺は、お前が救えなかった弟だ」と、刃が交錯する中で囁いた。",
    rewardEn: "PERMANENT: Gain +1 Level-Up Choice Reroll on every run.",
    rewardJa: "恒久恩恵：出撃ごとにレベルアップ選択肢の引き直し（リロール）が+1回可能に。",
    applyPermanentReward: () => {}
  },
  6: {
    id: 6,
    titleEn: "Seal VI: The Unbroken Stance",
    titleJa: "第六の封印：不動の構え",
    featDescEn: "Execute 10 consecutive Perfect Parries without getting hit.",
    featDescJa: "被弾することなく完全パリィ（Perfect Parry）を10回連続で成功させる。",
    loreFragmentEn: "When the vanguard charged, you did not draw. You waited. With every deflection, the earth trembled. An army broke upon a single upright silhouette.",
    loreFragmentJa: "先陣が突撃してきた時、あなたは抜刀しなかった。ただ待った。刃を弾き返すたびに大地が震え、たった一人の直立する影の前に軍勢は瓦解した。",
    rewardEn: "PERMANENT: Perfect Parry stun duration on all enemies increased by +0.6s.",
    rewardJa: "恒久恩恵：完全パリィ成功時の敵気絶時間が+0.6秒延長。",
    applyPermanentReward: () => {}
  },
  7: {
    id: 7,
    titleEn: "Seal VII: The Dawn of Rebirth",
    titleJa: "第七の封印：黄泉還りの夜明け",
    featDescEn: "Defeat the Supreme Shogun at the 10-Minute Dawn Showdown.",
    featDescJa: "10分目の決戦において、夜明けの光の中で最高司令官・将軍を討伐する。",
    loreFragmentEn: "As the blade pierced the Shogun's armor, the crimson sky of Yomi dissolved. For the first time in an eternity, golden sunlight warmed your cold skin. The karmic wheel shattered. You are free.",
    loreFragmentJa: "刃が将軍の鎧を貫いた時、黄泉の深紅の空は消え去った。永遠とも思えた闇の果てに、黄金の朝日が冷たい肌を温めた。因果の輪は砕け散った。武士よ、汝は今や自由なり。",
    rewardEn: "PERMANENT: Start every run with 50% Flow Meter filled & Golden Blade Aura.",
    rewardJa: "恒久恩恵：出撃時に気力50%充填状態で開始 ＆ 黄金の神気オーラが常時発動。",
    applyPermanentReward: () => {
      globals.flow = Math.max(globals.flow, globals.playerStats.flowMax * 0.5);
    }
  }
};

export class MemoryShrine {
  x: number;
  y: number;
  sealId: number;
  active: boolean = true;
  radius: number = 85;
  wispAngle: number = 0;
  pulseTimer: number = 0;

  constructor(x: number, y: number, sealId: number) {
    this.x = x;
    this.y = y;
    this.sealId = sealId;
  }

  update(dt: number) {
    this.wispAngle += dt * 2.0;
    this.pulseTimer += dt;

    if (Math.random() < 0.15 && globals.particles.length < 350) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 40;
      globals.particles.push(Particle.acquire(
        this.x + Math.cos(angle) * dist,
        this.y + Math.sin(angle) * dist,
        Math.random() < 0.5 ? '#38bdf8' : '#818cf8',
        25 + Math.random() * 25,
        0.8,
        2.0,
        -Math.PI / 2 + (Math.random() - 0.5) * 0.5
      ));
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (0.85 + 0.05 * Math.sin(this.pulseTimer * 3)), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('祠', this.x, this.y);

    const pillarWidth = 8;
    const shrineHeight = 70;
    const shrineSpan = 50;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(this.x - shrineSpan / 2 - 6, this.y - 4, 12, 6);
    ctx.fillRect(this.x + shrineSpan / 2 - 6, this.y - 4, 12, 6);

    const grad = ctx.createLinearGradient(0, this.y - shrineHeight, 0, this.y);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(this.x - shrineSpan / 2 - pillarWidth / 2, this.y - shrineHeight, pillarWidth, shrineHeight);
    ctx.fillRect(this.x + shrineSpan / 2 - pillarWidth / 2, this.y - shrineHeight, pillarWidth, shrineHeight);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(this.x - shrineSpan / 2 - 20, this.y - shrineHeight);
    ctx.quadraticCurveTo(this.x, this.y - shrineHeight - 8, this.x + shrineSpan / 2 + 20, this.y - shrineHeight);
    ctx.lineTo(this.x + shrineSpan / 2 + 16, this.y - shrineHeight + 8);
    ctx.quadraticCurveTo(this.x, this.y - shrineHeight, this.x - shrineSpan / 2 - 16, this.y - shrineHeight + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(this.x - shrineSpan / 2 - 8, this.y - shrineHeight + 18, shrineSpan + 16, 6);

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.x - shrineSpan / 2, this.y - shrineHeight + 21);
    ctx.quadraticCurveTo(this.x, this.y - shrineHeight + 28, this.x + shrineSpan / 2, this.y - shrineHeight + 21);
    ctx.stroke();

    [-12, 0, 12].forEach(offset => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(this.x + offset, this.y - shrineHeight + 25);
      ctx.lineTo(this.x + offset + 3, this.y - shrineHeight + 33);
      ctx.lineTo(this.x + offset - 2, this.y - shrineHeight + 37);
      ctx.lineTo(this.x + offset + 2, this.y - shrineHeight + 43);
      ctx.lineTo(this.x + offset - 1, this.y - shrineHeight + 43);
      ctx.closePath();
      ctx.fill();
    });

    for (let i = 0; i < 3; i++) {
      const angle = this.wispAngle + (i * Math.PI * 2) / 3;
      const wx = this.x + Math.cos(angle) * (shrineSpan * 0.7);
      const wy = this.y - shrineHeight * 0.5 + Math.sin(angle) * 15;
      ctx.beginPath();
      ctx.arc(wx, wy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#7dd3fc';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const pDistSq = (globals.player.x - this.x) ** 2 + (globals.player.y - this.y) ** 2;
    if (pDistSq < this.radius * this.radius) {
      const promptText = globals.currentLang === 'ja' ? '⛩️ [SPACE / タップで封印と交信]' : '⛩️ [PRESS SPACE / TAP TO COMMUNE]';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      const textWidth = ctx.measureText(promptText).width;
      ctx.fillRect(this.x - textWidth / 2 - 12, this.y - shrineHeight - 38, textWidth + 24, 26);
      ctx.strokeRect(this.x - textWidth / 2 - 12, this.y - shrineHeight - 38, textWidth + 24, 26);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px "Cinzel", "Space Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(promptText, this.x, this.y - shrineHeight - 25);
    }

    ctx.restore();
  }
}

export class WanderingHermit {
  x: number;
  y: number;
  active: boolean = true;
  radius: number = 80;
  fireTimer: number = 0;
  pactType: 'blade' | 'speed' | 'spirit';

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const types: Array<'blade' | 'speed' | 'spirit'> = ['blade', 'speed', 'spirit'];
    this.pactType = types[Math.floor(Math.random() * types.length)];
  }

  update(dt: number) {
    this.fireTimer += dt;
    if (Math.random() < 0.4 && globals.particles.length < 350) {
      globals.particles.push(Particle.acquire(
        this.x - 18 + (Math.random() - 0.5) * 8,
        this.y + (Math.random() - 0.5) * 6,
        Math.random() < 0.6 ? '#f97316' : '#eab308',
        40 + Math.random() * 40,
        0.45,
        1.5 + Math.random(),
        -Math.PI / 2 + (Math.random() - 0.5) * 0.4
      ));
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    ctx.fillStyle = '#475569';
    [-6, 0, 6].forEach(offset => {
      ctx.beginPath();
      ctx.arc(this.x - 18 + offset, this.y + 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const flicker = 10 + Math.sin(this.fireTimer * 12) * 2;
    ctx.beginPath();
    ctx.moveTo(this.x - 22, this.y + 2);
    ctx.lineTo(this.x - 18, this.y - flicker);
    ctx.lineTo(this.x - 14, this.y + 2);
    ctx.closePath();
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#fb923c';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    const hx = this.x + 12;
    const hy = this.y - 2;

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(hx, hy + 2, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(hx - 5, hy - 20, 10, 18);

    ctx.beginPath();
    ctx.arc(hx, hy - 25, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(hx - 16, hy - 26);
    ctx.lineTo(hx, hy - 34);
    ctx.lineTo(hx + 16, hy - 26);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx + 10, hy + 4);
    ctx.lineTo(hx + 24, hy - 18);
    ctx.stroke();

    const pDistSq = (globals.player.x - this.x) ** 2 + (globals.player.y - this.y) ** 2;
    if (pDistSq < this.radius * this.radius) {
      const promptText = globals.currentLang === 'ja' ? '🔥 [SPACE / タップで世捨て人の契約]' : '🔥 [PRESS SPACE / TAP FOR HERMIT PACT]';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      const textWidth = ctx.measureText(promptText).width;
      ctx.fillRect(this.x - textWidth / 2, this.y - 48, textWidth + 16, 24);
      ctx.strokeRect(this.x - textWidth / 2, this.y - 48, textWidth + 16, 24);

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 11px "Cinzel", "Space Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(promptText, this.x + 8, this.y - 36);
    }

    ctx.restore();
  }
}

export function checkShrineSpawns() {
  if (globals.activeShrine || globals.gameState !== 'playing') return;

  const unlocked = new Set(globals.unlockedSeals);

  if (!unlocked.has(1) && globals.bladeClashVictories >= 3) {
    spawnShrine(1);
    return;
  }

  if (!unlocked.has(2) && globals.lowHpSurviveTimer >= 25) {
    spawnShrine(2);
    return;
  }

  if (!unlocked.has(4) && globals.combo >= 50) {
    spawnShrine(4);
    return;
  }

  if (!unlocked.has(6) && globals.consecutiveParries >= 10) {
    spawnShrine(6);
    return;
  }
}

export function spawnShrine(sealId: number) {
  if (globals.activeShrine) return;
  const angle = Math.random() * Math.PI * 2;
  const dist = 180 + Math.random() * 80;
  const sx = globals.player.x + Math.cos(angle) * dist;
  const sy = globals.player.y + Math.sin(angle) * dist;

  globals.activeShrine = new MemoryShrine(sx, sy, sealId);
  globals.shockwaves.push(new Shockwave(sx, sy, '#38bdf8'));
  playSynthesizedSingingBowl();
  globals.floatingTexts.push(FloatingText.acquire(sx, sy - 90, globals.currentLang === 'ja' ? '黄泉の祠が顕現せり！ ⛩️' : 'A SHRINE OF YOMI HAS AWAKENED! ⛩️', '#38bdf8', 30));
}

export function triggerCalamityCheck(realDt: number) {
  if (globals.gameState !== 'playing' || globals.gameMode === 'zen') return;

  if (globals.calamityTimer > 0) {
    globals.calamityTimer -= realDt;
    if (globals.calamityTimer <= 0) {
      globals.calamityTimer = 0;
      if (globals.calamityEvent === 'blood_moon') {
        globals.calamityEvent = 'none';
        playSynthesizedSingingBowl();
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '血月が沈み、天恵が降り注ぐ！ 🌕' : 'THE BLOOD MOON DISSOLVES! CELESTIAL BLESSINGS!', '#ffd700', 32));
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
        globals.lives = Math.min(globals.maxLives, globals.lives + 2);
        globals.flow = globals.playerStats.flowMax;
      } else {
        globals.calamityEvent = 'none';
      }
    }
  }

  if (globals.runTime >= 360 && globals.runTime < 361 && globals.calamityEvent === 'none') {
    startBloodMoonCalamity();
  }

  if (globals.runTime >= 240 && globals.runTime < 241 && !globals.activeHermit) {
    const angle = Math.random() * Math.PI * 2;
    const hx = globals.player.x + Math.cos(angle) * 220;
    const hy = globals.player.y + Math.sin(angle) * 220;
    globals.activeHermit = new WanderingHermit(hx, hy);
    globals.floatingTexts.push(FloatingText.acquire(hx, hy - 60, globals.currentLang === 'ja' ? '世捨て人の焚き火が見える… 🔥' : 'A WANDERING HERMIT CAMPFIRE RISES… 🔥', '#f97316', 26));
  }
}

export function startBloodMoonCalamity() {
  globals.calamityEvent = 'blood_moon';
  globals.calamityTimer = 45.0;
  globals.screenShake = 40;
  playSynthesizedTempleBell();
  globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ef4444'));
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 100, globals.currentLang === 'ja' ? '【災厄】血月蝕の刻！ 45秒間生き延びよ！ 🌑🩸' : '【CALAMITY】 BLOOD MOON ECLIPSE! SURVIVE 45 SECONDS! 🌑🩸', 'neon-#ef4444', 36));
}
