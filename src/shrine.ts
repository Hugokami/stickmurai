import { globals } from './globals';
import { playSynthesizedSingingBowl, playSynthesizedTempleBell, playSynthesizedShakuhachi, playSynthesizedCampfireCrackle, playSynthesizedBloodMoonRoar } from './audio';
import { callbacks } from './callbacks';
import { Enemy } from './enemy';
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
    this.wispAngle += dt * 2.2;
    this.pulseTimer += dt;

    if (Math.random() < 0.25 && globals.particles.length < 350) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 25 + Math.random() * 45;
      globals.particles.push(Particle.acquire(
        this.x + Math.cos(angle) * dist,
        this.y + Math.sin(angle) * dist,
        Math.random() < 0.6 ? '#38bdf8' : '#818cf8',
        30 + Math.random() * 30,
        0.75,
        1.8,
        -Math.PI / 2 + (Math.random() - 0.5) * 0.4
      ));
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. Spirit Mist Pool (Ethereal Ground Mist)
    const mistPulse = 1.0 + Math.sin(this.pulseTimer * 2.2) * 0.08;
    const mistRadius = this.radius * mistPulse;
    const mistGrad = ctx.createRadialGradient(this.x, this.y, 8, this.x, this.y, mistRadius);
    mistGrad.addColorStop(0, 'rgba(56, 189, 248, 0.32)');
    mistGrad.addColorStop(0.65, 'rgba(129, 140, 248, 0.14)');
    mistGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, mistRadius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle rotating spirit circle runes
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.88, this.pulseTimer * 0.4, this.pulseTimer * 0.4 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const pillarWidth = 9;
    const shrineHeight = 74;
    const shrineSpan = 54;

    // 2. Granite Stone Pedestals (Kamebara) with moss accents
    [-shrineSpan / 2, shrineSpan / 2].forEach(posX => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(this.x + posX - 7, this.y - 5, 14, 7);
      ctx.fillStyle = '#15803d'; // moss accent
      ctx.fillRect(this.x + posX - 5, this.y - 4, 10, 2);
    });

    // 3. Vermilion Lacquer Pillars (Hashira)
    [-shrineSpan / 2, shrineSpan / 2].forEach(posX => {
      const pillarGrad = ctx.createLinearGradient(0, this.y - shrineHeight, 0, this.y);
      pillarGrad.addColorStop(0, '#f43f5e'); // Vermilion red
      pillarGrad.addColorStop(0.7, '#e11d48');
      pillarGrad.addColorStop(1, '#881337'); // Shadow at base
      ctx.fillStyle = pillarGrad;
      ctx.fillRect(this.x + posX - pillarWidth / 2, this.y - shrineHeight, pillarWidth, shrineHeight);

      // Inner bevel highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(this.x + posX - pillarWidth / 2 + 1, this.y - shrineHeight, 2, shrineHeight);
    });

    // 4. Lower Horizontal Crossbeam (Nuki)
    const nukiGrad = ctx.createLinearGradient(0, this.y - shrineHeight + 18, 0, this.y - shrineHeight + 25);
    nukiGrad.addColorStop(0, '#f43f5e');
    nukiGrad.addColorStop(1, '#9f1239');
    ctx.fillStyle = nukiGrad;
    ctx.fillRect(this.x - shrineSpan / 2 - 10, this.y - shrineHeight + 18, shrineSpan + 20, 7);

    // 5. Central Plaque (Gaku) with glowing kanji
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(this.x - 12, this.y - shrineHeight + 4, 24, 16);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(this.x - 12, this.y - shrineHeight + 4, 24, 16);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px "Noto Serif JP", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('黄泉', this.x, this.y - shrineHeight + 12);

    // 6. Curved Upper Lintel (Kasagi & Shimaki) with golden upturned tips
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(this.x - shrineSpan / 2 - 24, this.y - shrineHeight - 2);
    ctx.quadraticCurveTo(this.x, this.y - shrineHeight - 11, this.x + shrineSpan / 2 + 24, this.y - shrineHeight - 2);
    ctx.lineTo(this.x + shrineSpan / 2 + 20, this.y - shrineHeight + 7);
    ctx.quadraticCurveTo(this.x, this.y - shrineHeight, this.x - shrineSpan / 2 - 20, this.y - shrineHeight + 7);
    ctx.closePath();
    ctx.fill();

    // Golden tip caps
    ctx.fillStyle = '#ffd700';
    [-shrineSpan / 2 - 24, shrineSpan / 2 + 20].forEach((tipX, i) => {
      ctx.fillRect(this.x + tipX, this.y - shrineHeight - (i === 0 ? 3 : 2), 4, 8);
    });

    // 7. Sacred Shimenawa Rope with physically swaying paper tassels (Shide)
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(this.x - shrineSpan / 2 + 2, this.y - shrineHeight + 22);
    ctx.quadraticCurveTo(this.x, this.y - shrineHeight + 30, this.x + shrineSpan / 2 - 2, this.y - shrineHeight + 22);
    ctx.stroke();

    [-14, 0, 14].forEach((offset, idx) => {
      const sway = Math.sin(this.pulseTimer * 3.2 + idx * 1.5) * 3.5;
      const shideX = this.x + offset;
      const shideY = this.y - shrineHeight + 26;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(shideX, shideY);
      ctx.lineTo(shideX + 4 + sway * 0.4, shideY + 8);
      ctx.lineTo(shideX - 2 + sway * 0.7, shideY + 13);
      ctx.lineTo(shideX + 3 + sway, shideY + 18);
      ctx.lineTo(shideX - 1 + sway, shideY + 18);
      ctx.closePath();
      ctx.fill();
    });

    // 8. Ethereal Hitodama Wisps (Teardrop Flames orbiting the Torii)
    for (let i = 0; i < 3; i++) {
      const angle = this.wispAngle + (i * Math.PI * 2) / 3;
      const wx = this.x + Math.cos(angle) * (shrineSpan * 0.75);
      const wy = this.y - shrineHeight * 0.5 + Math.sin(angle) * 16;

      // Outer cyan aura
      const auraGrad = ctx.createRadialGradient(wx, wy, 1, wx, wy, 14);
      auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
      auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(wx, wy, 14, 0, Math.PI * 2);
      ctx.fill();

      // Teardrop flame shape
      ctx.beginPath();
      ctx.arc(wx, wy + 2, 4.5, 0, Math.PI);
      ctx.quadraticCurveTo(wx + 3.5, wy - 3, wx, wy - 11);
      ctx.quadraticCurveTo(wx - 3.5, wy - 3, wx - 4.5, wy + 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // White incandescent core
      ctx.beginPath();
      ctx.arc(wx, wy + 1, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // 9. Interaction Prompt
    const pDistSq = (globals.player.x - this.x) ** 2 + (globals.player.y - this.y) ** 2;
    if (pDistSq < this.radius * this.radius) {
      const promptText = globals.currentLang === 'ja' ? '⛩️ [SPACE / タップで封印と交信]' : '⛩️ [PRESS SPACE / TAP TO COMMUNE]';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      const textWidth = ctx.measureText(promptText).width;
      ctx.fillRect(this.x - textWidth / 2 - 14, this.y - shrineHeight - 42, textWidth + 28, 28);
      ctx.strokeRect(this.x - textWidth / 2 - 14, this.y - shrineHeight - 42, textWidth + 28, 28);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px "Cinzel", "Space Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(promptText, this.x, this.y - shrineHeight - 28);
    }

    ctx.restore();
  }
}

export class WanderingHermit {
  x: number;
  y: number;
  active: boolean = true;
  radius: number = 85;
  fireTimer: number = 0;
  restTimer: number = 0;
  hasRested: boolean = false;
  pactType: 'blade' | 'speed' | 'spirit';

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const types: Array<'blade' | 'speed' | 'spirit'> = ['blade', 'speed', 'spirit'];
    this.pactType = types[Math.floor(Math.random() * types.length)];
  }

  update(dt: number) {
    this.fireTimer += dt;

    // Organic campfire ember crackle sound
    if (Math.random() < 0.035) {
      playSynthesizedCampfireCrackle();
    }

    // Campfire embers rising into the air
    if (Math.random() < 0.45 && globals.particles.length < 350) {
      globals.particles.push(Particle.acquire(
        this.x - 18 + (Math.random() - 0.5) * 10,
        this.y + (Math.random() - 0.5) * 6,
        Math.random() < 0.6 ? '#f97316' : '#fef08a',
        45 + Math.random() * 45,
        0.55,
        1.5 + Math.random() * 1.5,
        -Math.PI / 2 + (Math.random() - 0.5) * 0.45
      ));
    }

    // Campfire Rest Mechanic: Stand near fire for 2.5s to cleanse status and heal 1 heart
    if (!this.hasRested && globals.gameState === 'playing' && globals.player.state !== 'dead') {
      const pDistSq = (globals.player.x - (this.x - 18)) ** 2 + (globals.player.y - this.y) ** 2;
      if (pDistSq < 75 * 75) {
        this.restTimer += dt;
        if (this.restTimer >= 2.5) {
          this.hasRested = true;
          playSynthesizedShakuhachi();
          globals.player.chillTimer = 0;
          globals.lives = Math.min(globals.maxLives, globals.lives + 1);
          globals.shockwaves.push(new Shockwave(this.x - 18, this.y, '#f97316'));
          const isJa = globals.currentLang === 'ja';
          globals.floatingTexts.push(FloatingText.acquire(
            this.x - 18, 
            this.y - 70, 
            isJa ? '焚き火の休息：心身浄化＆体力回復！ 🔥' : 'BONFIRE REST - SPIRIT CLEANSED & HEALED! 🔥', 
            '#f97316', 
            26
          ));
          callbacks.updateUI();
        }
      } else {
        this.restTimer = Math.max(0, this.restTimer - dt * 2);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. Warm Ambient Campfire Ground Glow
    const ambGrad = ctx.createRadialGradient(this.x - 18, this.y, 4, this.x - 18, this.y, 85);
    ambGrad.addColorStop(0, 'rgba(249, 115, 22, 0.28)');
    ambGrad.addColorStop(0.7, 'rgba(234, 88, 12, 0.08)');
    ambGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = ambGrad;
    ctx.beginPath();
    ctx.arc(this.x - 18, this.y, 85, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stone Hearth Ring
    ctx.fillStyle = '#475569';
    [-8, -4, 0, 4, 8].forEach(offset => {
      ctx.beginPath();
      ctx.arc(this.x - 18 + offset, this.y + 4 + (Math.abs(offset) > 4 ? -2 : 0), 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Glowing Inner Coals
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(this.x - 18, this.y + 2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Multi-Layered Flickering Fire Tongues
    const flicker1 = 12 + Math.sin(this.fireTimer * 14) * 2.5;
    const flicker2 = 9 + Math.cos(this.fireTimer * 18) * 2;

    // Outer flame (Deep Red/Orange)
    ctx.beginPath();
    ctx.moveTo(this.x - 24, this.y + 2);
    ctx.quadraticCurveTo(this.x - 20, this.y - flicker1 * 0.6, this.x - 18, this.y - flicker1);
    ctx.quadraticCurveTo(this.x - 16, this.y - flicker1 * 0.6, this.x - 12, this.y + 2);
    ctx.closePath();
    ctx.fillStyle = '#f97316';
    ctx.fill();

    // Inner bright flame (Yellow)
    ctx.beginPath();
    ctx.moveTo(this.x - 21, this.y + 2);
    ctx.quadraticCurveTo(this.x - 19, this.y - flicker2 * 0.5, this.x - 18, this.y - flicker2);
    ctx.quadraticCurveTo(this.x - 17, this.y - flicker2 * 0.5, this.x - 15, this.y + 2);
    ctx.closePath();
    ctx.fillStyle = '#fef08a';
    ctx.fill();

    // 4. The Hermit's Silhouette
    const hx = this.x + 14;
    const hy = this.y - 2;

    // Cross-legged mat / base
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(hx, hy + 2, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Robe body
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(hx - 6, hy - 20, 12, 18);

    // Fluttering Tattered Haori Hem
    const cloakSway = Math.sin(this.fireTimer * 5) * 3;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(hx + 6, hy - 14);
    ctx.lineTo(hx + 14 + cloakSway, hy - 6);
    ctx.lineTo(hx + 8, hy + 2);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(hx, hy - 25, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Braided Straw Jingasa (Conical Hat) with woven grain lines
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(hx - 18, hy - 26);
    ctx.lineTo(hx, hy - 36);
    ctx.lineTo(hx + 18, hy - 26);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx - 10, hy - 26);
    ctx.lineTo(hx, hy - 36);
    ctx.lineTo(hx + 10, hy - 26);
    ctx.stroke();

    // Sheathed Nodachi resting by campfire
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hx + 10, hy + 5);
    ctx.lineTo(hx + 26, hy - 22);
    ctx.stroke();
    // Gold Tsuba crossguard
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(hx + 19, hy - 12, 4, 4);

    // 5. Resting Progress Bar Indicator
    if (this.restTimer > 0 && !this.hasRested) {
      const restPct = Math.min(1.0, this.restTimer / 2.5);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(this.x - 18, this.y, 22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(this.x - 18, this.y, 22, -Math.PI / 2, -Math.PI / 2 + restPct * Math.PI * 2);
      ctx.stroke();
    }

    // 6. Interaction Prompt
    const pDistSq = (globals.player.x - this.x) ** 2 + (globals.player.y - this.y) ** 2;
    if (pDistSq < this.radius * this.radius) {
      const promptText = globals.currentLang === 'ja' ? '🔥 [SPACE / タップで世捨て人の契約]' : '🔥 [PRESS SPACE / TAP FOR HERMIT PACT]';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      const textWidth = ctx.measureText(promptText).width;
      ctx.fillRect(this.x - textWidth / 2, this.y - 50, textWidth + 16, 26);
      ctx.strokeRect(this.x - textWidth / 2, this.y - 50, textWidth + 16, 26);

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 11px "Cinzel", "Space Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(promptText, this.x + 8, this.y - 37);
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
  globals.screenShake = 45;
  playSynthesizedTempleBell();
  playSynthesizedBloodMoonRoar();
  globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ef4444'));
  globals.floatingTexts.push(FloatingText.acquire(
    globals.player.x, 
    globals.player.y - 100, 
    globals.currentLang === 'ja' ? '【災厄】血月蝕の刻！ 45秒間生き延びよ！ 🌑🩸' : '【CALAMITY】 BLOOD MOON ECLIPSE! SURVIVE 45 SECONDS! 🌑🩸', 
    'neon-#ef4444', 
    36
  ));

  // Spawn the Mirror Soul Shadow Doppelganger
  const clone = new Enemy(globals.player.x + (Math.random() > 0.5 ? 260 : -260), globals.player.y, globals.player);
  clone.subType = 'ronin';
  clone.type = 'evil_wizard';
  clone.colorTint = '#9333ea';
  clone.hp = 120;
  clone.maxHp = 120;
  (clone as any).isBoss = true;
  (clone as any).isShadowDoppelganger = true;
  globals.enemies.push(clone);
  globals.shadowDoppelganger = clone;
}

export function notifyFeatMilestone(_sealId: number, current: number, target: number, labelEn: string, labelJa: string) {
  const isJa = globals.currentLang === 'ja';
  const label = isJa ? labelJa : labelEn;
  const txt = `⛩️ [${label}: ${current}/${target}]`;
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 90, txt, '#38bdf8', 24));
}
