import { svgAssets } from './svgAssets';
import { assetCallbacks } from './callbacks';
import { recordDiagnostic } from './comfort';
import { globals } from './globals';

export const i18n: Record<string, Record<string, string>> = {
  en: {
    rotatePrompt: "Rotate and enter full screen?",
    rotateInstruction: "Please physically rotate your device to landscape mode.",
    rotateDismiss: "PLAY ANYWAY ✕",
    flow: "FLOW",
    expLvl: "EXP Lvl",
    btnDash: "DASH",
    btnSlash: "SLASH",
    btnEnhance: "ENHANCE",
    btnUlt: "ULT",
    death: "DEATH",
    tryAgain: "Try Again",
    levelUp: "LEVEL UP!",
    chooseUlt: "CHOOSE ULTIMATE",
    title: "SUPER<br>SAMURAI<br>STICKY",
    play: "Play",
    settings: "Settings",
    settingsTitle: "SETTINGS",
    musicVol: "Music Volume",
    language: "Language",
    back: "Back",
    paused: "PAUSED",
    activeUpgradesTitle: "ACTIVE UPGRADES",
    guideTitle: "Combat Guide & Techniques",
    guideMove: "<strong>Movement:</strong> Use <strong>WASD / Arrow Keys</strong> on Desktop, or the <strong>Virtual Joystick</strong> on Mobile devices to move around the battlefield.",
    guideSlash: "<strong>Slash (Basic Attack):</strong> Left-click / press <strong>LMB</strong> on Desktop or tap <strong>SLASH</strong> on Mobile. Attacks automatically auto-aim to track nearest enemies. Chain kills quickly to stack your Combo meter.",
    guideDodge: "<strong>Dodge / Dash:</strong> Press <strong>SPACEBAR</strong> on Desktop or tap <strong>DASH</strong> on Mobile. You are completely invulnerable (i-frames) during the dash duration.",
    guidePerfect: "<strong>Perfect Dodge:</strong> Dash exactly when an enemy starts their red lunge attack to trigger a screen flash, a massive Combo boost, and 2 seconds of total invulnerability.",
    guideFlow: "<strong>Flow Awakening (Ultimates):</strong> Defeat enemies to fill the orange FLOW meter. When full, press <strong>F Key</strong> (or tap <strong>ULT</strong> on Mobile) to select and trigger a devastating Ultimate:<br>• <strong>Shadow Awakening:</strong> 6 seconds of god-speed. Basic attacks gain +4 DMG, spawn shadow clones that teleport and strike enemies for 4 DMG, and dash cooldown is reduced to 0.<br>• <strong>Omnislash:</strong> Freezes time for 3.5s, executing 3 cross-cuts dealing 16 DMG each to all enemies, followed by a final blast dealing 20 DMG to remaining enemies, restoring 2 Hearts.<br>• <strong>Wrath of the Storm God:</strong> 8 seconds of electric fury. Slashes fire chain-lightning to 4 targets. Dashes become instant teleports (450px) that strike start and destination coordinates with vertical lightning (6 DMG, 3s stun, chains to 5 targets for 2 DMG).",
    guideProg: "<strong>Progression & Leveling:</strong> Gain EXP from kills to level up. Leveling up heals 1 Heart and grants a choice between powerful upgrades (like Cooldown Reductions, Max HP, or unique passives like Soul Siphon for life-steal and Reflective Mirror to boost deflected bullets).",
    guideParry: "<strong>Parrying:</strong> Hold down SLASH to charge your sword, and release it at the exact moment of an incoming enemy attack to Parry, deflecting the blow and staggering the enemy.",
    guideIaijutsu: "<strong>Iaijutsu Shockwave:</strong> Holding down SLASH charges your attack. Release it at full charge to unleash a traveling crescent shockwave projectile that pierces through all enemies.",
    guideAutoAim: "<strong>Auto-Aim:</strong> Basic slashes and lunges will automatically snap toward the closest target within 600px range, making high-speed mobile combat feel extremely smooth.",
    guidePvP: "<strong>Iaijutsu PvP:</strong> Enter the PvP Lobby, copy your unique 8-digit Ronin UID, add friends by their UID, and invite them directly to a 1v1 duel. No code sharing required!",
    comboSwift: "<strong>Combo — Swift Counter:</strong> Press <strong>SLASH</strong> immediately after <strong>DASH</strong>. Teleports behind the nearest enemy for a lightning-fast backstab.",
    comboThunder: "<strong>Combo — Thunderclap & Flash:</strong> Press <strong>SLASH</strong> immediately after <strong>DASH</strong> while <strong>Wrath of the Storm God</strong> is active or with <strong>Raijin Step</strong> skill equipped. Slashes through targets with chain-lightning.",
    comboDragon: "<strong>Combo — Rising Dragon:</strong> <strong>SLASH → SLASH → hold SLASH briefly → release early</strong> (before full charge). Launches enemies skyward with an uppercut shockwave.",
    comboMirror: "<strong>Combo — Mirror Strike:</strong> Perform a fully charged <strong>Iaijutsu Slash</strong> while invisible (from the <strong>Reflective Mirror / Decoy</strong> passive). Summons twin phantom clones that strike all nearby enemies.",
    openGuideBtn: "📖 Combat Codex (秘伝戦術)",
    guideModalTitle: "📖 COMBAT CODEX • 秘伝戦術指南",
    guideCatFundamentals: "Fundamentals & Maneuvers",
    guideMoveText: "360° fluid omnidirectional sprint.",
    guideSlashText: "Basic attack auto-snaps to nearest foe within 600px. Chain hits to build Combo.",
    guideDodgeText: "Instant dodge with full invulnerability frames (i-frames).",
    guidePerfectText: "Dash right as enemy lunges (red flash) for 2s invulnerability & combo surge!",
    guideCatParry: "Sekiro Deflection & Posture System",
    guideParryText: "Deflect attacks, dealing massive posture damage to enemies. Consecutive parries raise musical pitch and upgrade sparks from Amber ➔ Gold ➔ Cyan ➔ White-Blue radial burst!",
    guidePostureText: "Filling an enemy or boss's orange Posture gauge triggers [STAGGER BREAK!]. Strike immediately to execute for devastating lethal damage, Magatama bounty, and stance synergy detonations!",
    guideCatArts: "Samurai Secret Arts",
    guideChiburui: "<strong>Chiburui & Noto (血振るい):</strong> Stand completely still for 1.2s after 3+ kills. Cleanses the blade and grants +15 Flow.",
    guideChiburuiText: "Stand completely still for 1.2s after 3+ kills. Cleanses the blade and grants +15 Flow.",
    guideLauncherText: "Press W / Up on a posture-broken enemy to launch them skyward, then tap Dash/Attack to dive airborne and cleave them back down!",
    guideClashText: "When locked in a blade clash with elite bosses, mash LMB / [SLASH] rapidly to overpower their guard and blow them back!",
    guideSunriseText: "Clearing the final boss of a stage transfigures all incoming bullets into floating sakura petals accompanied by a traditional Sumi-e ink wash wipe!",
    guideCatCombos: "Secret Weapon Combos",
    comboSwiftText: "Swift Counter — Instantly teleports behind target for a back-slash.",
    comboThunderText: "Thunderclap & Flash — Teleporting lightning cleave shocking up to 5 targets.",
    comboDragonText: "Rising Dragon — Launches enemies into an airborne whirlwind.",
    comboMirrorText: "Mirror Strike — 3 shadow clones blink to targets and strike in unison.",
    guideCatSkills: "Active Skill Tiers & Magatama Power",
    resume: "Resume Game",
    quit: "Quit to Menu",
    kills: "Kills: ",
    combo: " Combo",
    dashText: "DASH!",
    dodgeText: "PERFECT DODGE!",
    parryText: "PARRY!",
    perfectParryText: "PERFECT PARRY!",
    iaijutsuText: "IAIJUTSU!",
    levelUpText: "LEVEL UP!",
    swordEnhancedText: "SWORD ENHANCED!",
    clashVictoryText: "CLASH VICTORY! ⚔️",
    clashDrawText: "CLASH DRAW",
    clashPromptText: "TAP SLASH!",
    aerialLaunchedText: "LAUNCHED! 🌪️",
    aerialCleaveText: "HELM SPLITTER! ⚡",
    aerialPromptText: "AERIAL CLEAVE!",
    puGiantName: "Giant Katana", puGiantDesc: "Slash Size +12.5% (Max 2.2x)",
    puWindName: "Wind Stance", puWindDesc: "Attack Cooldown -8% (Max -40%)",
    puFeatherName: "Feather Step", puFeatherDesc: "Dash Cooldown -10% (Max -40%)",
    puSwiftName: "Swiftness", puSwiftDesc: "Movement Speed +10% (Max +50%)",
    puBloodName: "Bloodlust", puBloodDesc: "Flow Generation +30%",
    puDeadeyeName: "Deadeye Focus", puDeadeyeDesc: "Critical Chance +10% (Powerup bonus capped at 40%)",
    puLethalName: "Lethal Strike", puLethalDesc: "Enhance Bonus Dmg +1",
    puColossalName: "Colossal Blade", puColossalDesc: "Enhance Size +50%",
    puDurationName: "Divine Scroll", puDurationDesc: "Enhance Duration +1.5s",
    puShieldDurationName: "Aegis Mastery", puShieldDurationDesc: "Wind Aegis duration +1.5s",
    puShieldPulseName: "Hurricane Pulse", puShieldPulseDesc: "Wind Aegis releases wind pulses dealing 3 DMG every 1s",
    puShieldBlastName: "Gale Thorns", puShieldBlastDesc: "While Wind Aegis is active, melee attackers take 8 DMG + knockback per level",
    puDashDamageName: "Storm Bolt", puDashDamageDesc: "Raijin Step deals +1 DMG and stuns for 2.0s",
    puDashRangeName: "Static Velocity", puDashRangeDesc: "Raijin Step range +30% and speed +20%",
    puDashThunderName: "Lightning Chain", puDashThunderDesc: "Raijin Step chains lightning to 3 nearby enemies dealing 2 DMG per level",
    puFirewheelRangeName: "Searing Ring", puFirewheelRangeDesc: "Inferno Sweep radius +25%",
    puFirewheelBlazeName: "Searing Ash", puFirewheelBlazeDesc: "Inferno Sweep burn damage +1",
    puFirewheelEchoName: "Firestorm Echo", puFirewheelEchoDesc: "Sweep hits trigger a 1 DMG spark explosion on nearby enemies",
    puGravityRadiusName: "Event Horizon", puGravityRadiusDesc: "Gravity Well pull radius +25%",
    puGravityDamageName: "Crushing Force", puGravityDamageDesc: "Gravity Well pull tick damage +1",
    puGravityExplosionName: "Supernova Collapse", puGravityExplosionDesc: "Gravity Well implodes upon expiration, dealing 4 DMG per level in a massive blast",
    puChargeSpeedName: "Lightning Draw", puChargeSpeedDesc: "Iaijutsu Charge speed +35%",
    puDeflectDmgName: "Reflective Mirror", puDeflectDmgDesc: "Deflected bullets deal +2 DMG",
    puVampireName: "Soul Siphon", puVampireDesc: "Kills have 6% chance to heal 1 Heart",
    puDimensionalName: "Dimensional Rift", puDimensionalDesc: "Iaijutsu wave size +30%",
    puFireName: "Fire Stance", puFireDesc: "Slashes burn enemies (1 DMG/s for 3s)",
    puClonesName: "Shadow Clones", puClonesDesc: "Translucent shadow clones mimic attacks",
    puStoutHeartName: "Stout Heart", puStoutHeartDesc: "Max Hearts limit +1 Slot (max 7)",
    puPetalArmorName: "Petal Armor", puPetalArmorDesc: "Blocks 1 hit (recharges every 15s)",
    puEchoSlashName: "Echo Slash", puEchoSlashDesc: "Slashes emit secondary waves dealing 0.5 DMG",
    puTempoMasteryName: "Tempo Mastery", puTempoMasteryDesc: "+2% attack speed per combo level (max 20%)",
    puFrostName: "Frost Stance", puFrostDesc: "Slashes apply Chill (slows enemies by 40% for 3s). Parrying a chilled enemy shatters them for 8 AoE damage.",
    puVoidName: "Void Stance", puVoidDesc: "Iaijutsu Shockwaves leave a spatial trail that pulls nearby enemies toward its center.",
    puFlowingCounterName: "Flowing Counter", puFlowingCounterDesc: "Successfully parrying or dodging an attack instantly resets your Dash/Raijin Step cooldown.",
    puGaleVortexName: "Gale Vortex", puGaleVortexDesc: "Aegis duration is reduced by 1s, but shield rotates at triple speed and reflects all bullets directly back at the shooters.",
    puBladeEchoesName: "Blade Echoes", puBladeEchoesDesc: "Flow Awakening spawns two permanent shadow clones flanking you, mimicking attacks at 40% DMG and double size.",
    puJudgementCutName: "Judgement Cut", puJudgementCutDesc: "Fully charged Iaijutsu waves spawn a dome of 6 rapid micro-slices dealing 0.5 DMG each over 1.5s.",
    puSakuraBlizzardName: "Sakura Blizzard", puSakuraBlizzardDesc: "Dashing leaves cherry blossom petals that explode for 1 DMG when enemies step on them.",
    puUnstableOverloadName: "Unstable Overload", puUnstableOverloadDesc: "Dashing through a chilled or burning enemy triggers a 5 DMG elemental explosion.",
    puMagneticDrawName: "Magnetic Draw", puMagneticDrawDesc: "Automatically pulls EXP gems and Hearts toward you from a wide radius.",
    puReapersMarkName: "Reaper's Mark", puReapersMarkDesc: "Slashes deal +2 DMG, but you lose 1 Heart every 25s. Defeating 10 enemies resets this timer.",
    puExecutionName: "Executioner's Art", puExecutionDesc: "Unlock lethal cinematic Manga Executions on posture-broken foes, dealing massive lethal damage, blood splatters, and bonus Magatama.",
    skillDecoyName: "Void Rupture: Phantom Slicer", skillDecoyDesc: "Tier VI (35,000 🔮): Instant 5-hit supersonic dimensional strike (80 + 800% Slash DMG + 60 posture). For 6s, all slashes unleash auto-homing phantom blades (+135% Slash DMG). Cooldown 10s.",
    btnDecoy: "RUPTURE",
    puRaijinSplitterName: "Raijin's Heaven-Splitter", puRaijinSplitterDesc: "Perfect parries strike down celestial violet thunderbolts (45 + 350% Slash DMG) chaining shock damage to up to 4 nearby enemies.",
    puArterialGushName: "Arterial Gush", puArterialGushDesc: "Critical strikes rupture arteries, spraying blood arcs and inflicting Hemorrhage (20% missing HP + 125% Slash DMG over 4s).",
    puSonicBreakName: "Sonic Breakthrough", puSonicBreakDesc: "Attacking out of a dash releases a supersonic shockwave (180% Slash DMG + 25) that slices through enemy projectiles and extends blade reach by +100px.",
    puMiasmaCleaveName: "Miasma Cleave", puMiasmaCleaveDesc: "Sword swings leave a corrosive toxic trail (15 + 80% Slash DMG/s) that dissolves armor (+35% damage taken).",
    puHanabiBladeName: "Hanabi Blade", puHanabiBladeDesc: "Deflecting enemy projectiles unleashes a festive radial firework shrapnel blast (20 + 110% Slash DMG) and airborne launch.",
    puGrimHarvestName: "Grim Harvest: Soul Rend", puGrimHarvestDesc: "Executing an elite or boss summons an ascending death specter dealing 50% executed target max HP (+ 500% Slash DMG) as true DMG.",
    puCursedGlassName: "Glass Edge", puCursedGlassDesc: "☠ CURSE: Lose 3 max hearts. Attacks deal +3 DMG, +50% size, & Dash gains +40% speed and i-frames.",
    puCursedBloodName: "Blood Thirst", puCursedBloodDesc: "☠ CURSE: Bleed 1 HP every 45s. Slain enemies grant +50% Flow and life steal.",
    puCursedGreedName: "Demon's Pact", puCursedGreedDesc: "☠ CURSE: Score is DOUBLED (2x multiplier). Slain enemies grant bonus combo.",
    fuPlasmaName: "Plasma Tempest", fuPlasmaDesc: "⚡ FUSION: Dashes leave burning electric firewalls (6 DMG/s). Slashing burned enemies unleashes room-clearing chain lightning for 10 DMG.",
    fuSingularityName: "Singularity Cleave", fuSingularityDesc: "⚡ FUSION: Slashes fire drifting mini black holes that vacuum mobs, devour enemy bullets, and implode for 20 AoE DMG.",
    fuPhantomsName: "Hundred Demon March", fuPhantomsDesc: "⚡ FUSION: Every Perfect Dodge or Finisher spawns an immortal shadow samurai clone for 12s that mirrors your slashes.",
    fuKamaitachiName: "Kamaitachi Sickle-Wind", fuKamaitachiDesc: "⚡ FUSION: Slashes fire 2 razor crescent wind discs that ricochet off arena borders up to 3 times, slicing through hordes for 8 DMG.",
    fuAsuraName: "Asura's Blade Storm", fuAsuraDesc: "⚡ FUSION: Parrying triggers a 360° storm of 6 phantom cross-slashes (12 DMG each) and restores 1 Heart if 3+ enemies are hit.",
    ultShadowName: "Shadow Awakening", ultShadowDesc: "6s of god-speed. Slashes deal +4 DMG and spawn clones that teleport-strike enemies. Dash cooldown becomes 0.",
    ultOmniName: "Omnislash", ultOmniDesc: "Execute lightning-fast cross-cuts (16 DMG) on all active enemies. Final blast deals 20 DMG and heals 1 Heart.",
    ultStormName: "Wrath of the Storm God", ultStormDesc: "8s of thunder fury. Slashes fire chain lightning. Dashes teleport 450px and call lightning strikes (6 DMG, 3s stun).",
    playZen: "Zen Mode",
    zenWarningText: "PARRY ONLY!",
    zenFieldText: "ZEN FIELD",
    btnParryOnly: "PARRY ONLY",
    btnRestricted: "RESTRICTED",
    puZenRestoreName: "Zen Recovery", puZenRestoreDesc: "Restore 1 Heart slot.",
    ultZenFieldName: "Zen Field", ultZenFieldDesc: "Summon a Zen Barrier that blocks all incoming damage and triggers wind parry blasts (6 AoE DMG + knockback) every 0.4s for 8s.",
    blessingSwiftName: "Swift Strike Stance",
    blessingFortuneName: "Fortune Blessing",
    loading: "LOADING RESOURCES",
    tapToContinue: "TAP / CLICK TO CONTINUE",
    fsPromptText: "Enter full screen mode for the best samurai experience?",
    statsTitle: "DEATH SUMMARY",
    statsKills: "KILLS:",
    statsMaxCombo: "MAX COMBO:",
    statsParries: "TOTAL PARRIES:",
    statsPerfectParries: "PERFECT PARRIES:",
    statsPerfectDodges: "PERFECT DODGES:",
    statsDamage: "DAMAGE DEALT:",
    graphicsMode: "Graphics",
    difficulty: "Difficulty",
    difficultyEasy: "Easy",
    difficultyNormal: "Normal",
    difficultyHard: "Hard",
    difficultyInsane: "Insane",
    playTime: "Time Mode",
    playLevel: "Level Mode",
    timeLimit: "Time Limit",
    timeInfinite: "Infinite",
    targetLevel: "Target Level",
    victory: "VICTORY",
    timeModeCompleted: "TIME SURVIVED!",
    levelModeCompleted: "TARGET LEVEL REACHED!",
    guideDifficulty: "<strong>Difficulty Modes:</strong> Select your challenge before starting.<br>• <strong>Easy:</strong> Enemies have 30% HP, move 50% slower, charge 80% slower, and spawn in smaller waves.<br>• <strong>Normal:</strong> Enemies have 50% HP, move 30% slower, charge 40% slower.<br>• <strong>Hard:</strong> Enemies have 130% HP, move 15% faster, charge 25% faster, and spawn in larger/faster waves.<br>• <strong>Insane:</strong> 3x harder than Hard. Enemies have 300% HP, move 55% faster, charge 150% faster, and spawn in massive, aggressive waves.",
    selectSkillTitle: "SELECT ACTIVE SKILL",
    skillEnhanceName: "Dragon's Fury", skillEnhanceDesc: "Base Tier (0 🔮): Sword size +80%, +3 Slash DMG for 10s, firing purple crescent dragon waves. Cooldown 18s.",
    skillShieldName: "Wind Aegis", skillShieldDesc: "Tier III (15,000 🔮): 4.5s tempest barrier. Reflects bullets at 3x speed, pulsing every 0.8s for 14 AoE DMG with forceful knockback. Cooldown 10s.",
    skillDashName: "Raijin Step", skillDashDesc: "Tier II (10,000 🔮): Ultra-snappy lightning dash (0.9s CD, 0.45s invuln). Slashes for 12 DMG & 2.2s stun with twin sky strikes.",
    skillFirewheelName: "Inferno Sweep", skillFirewheelDesc: "Tier V (25,000 🔮): Expanding 260px ring of fire dealing 10 DMG every 0.25s & fireballs (12 DMG) for 6s, erupting in a 25 AoE flame blast. Cooldown 11s.",
    skillGravityName: "Heavenly Judgement: Raijin's Cataclysm", skillGravityDesc: "APEX Tier (50,000 🔮): Celestial thunderbolt vaporizes screen projectiles, wipes 120 posture, and deals 90 AoE DMG. Blade chains violet lightning for 7s. Cooldown 10s.",
    skillParryMasterName: "Parry Master", skillParryMasterDesc: "Tier IV (20,000 🔮): +50% parry window for 4s. Riposte deals 2.5x critical damage, instantly breaks 40 enemy posture & awards +15 Flow. Cooldown 9s.",
    btnShield: "AEGIS",
    btnFlash: "RAIJIN",
    btnFirewheel: "SWEEP",
    btnGravity: "CATACLYSM",
    btnParryMaster: "PARRY",
    screenShakeMode: "Screen Shake",
    shakeOn: "Standard",
    shakeReduced: "Reduced",
    shakeOff: "Off",
    autoUlt: "Flow Auto Activation",
    autoUltOn: "On",
    autoUltOff: "Off",
    screenFlash: "Screen Flash/Invert",
    weatherEffects: "Weather & Petals",
    speedLines: "Speed Lines",
    floatingText: "Floating Numbers",
    groundScars: "Ground Slash Marks",
    settingsOn: "On",
    settingsOff: "Off",
    pvpLobbyTitle: "IAIJUTSU SHOWDOWN",
    pvpMyProfile: "MY PROFILE",
    pvpLoadingRonin: "Loading Ronin...",
    pvpSave: "Save",
    pvpUidDisplay: "UID: Loading...",
    pvpCopy: "Copy",
    pvpSelectRules: "SELECT GAME RULES",
    pvpClassicDuel: "CLASSIC DUEL (3 Lives)",
    pvpSuddenDeath: "SUDDEN DEATH (1 Life, Fast Start)",
    pvpHyperSpeed: "HYPER SPEED (3 Lives, Rapid Acceleration)",
    pvpStormGod: "STORM GOD (3 Lives, Sky Lightning Storms)",
    pvpCoopSurvival: "INSANE CO-OP SURVIVAL (Insane Difficulty, AI Waves)",
    pvpSuddenDeathShort: "SUDDEN DEATH",
    pvpHyperSpeedShort: "HYPER SPEED",
    pvpStormGodShort: "STORM GOD",
    pvpCoopSurvivalShort: "CO-OP SURVIVAL",
    pvpFindMatch: "Find Match",
    pvpCancelQueue: "Cancel Queue",
    pvpSearching: "Searching for opponents... ",
    pvpFoundConnecting: "Opponent found! Connecting...",
    pvpFriends: "Friends",
    pvpRequests: "Requests",
    pvpTopDuelists: "Top Duelists",
    pvpAddFriend: "ADD FRIEND",
    pvpFriendUidPlaceholder: "Paste Friend UID...",
    pvpAdd: "Add",
    pvpNoFriends: "No friends added yet. Share your UID!",
    pvpPendingRequests: "PENDING REQUESTS",
    pvpNoRequests: "No pending requests.",
    pvpNoRecords: "No records yet.",
    pvpLoadingLeaderboard: "Loading leaderboard...",
    pvpBackToMenu: "Back to Menu",
    pvpReadyRoomMode: "MODE: ",
    pvpHost: "Host (P1)",
    pvpClient: "Client (P2)",
    pvpWaiting: "WAITING",
    pvpReady: "READY",
    pvpReadyUp: "Ready Up",
    pvpCancelReady: "Cancel Ready",
    pvpDisconnect: "Disconnect",
    pvpDuelChallenge: "DUEL CHALLENGE!",
    pvpDecline: "Decline",
    pvpAccept: "Accept",
    pvpDefendTimedParry: "DEFEND: TIMED PARRY!",
    pvpWaitingForOpponent: "WAITING FOR OPPONENT...",
    pvpYourTurn: "YOUR TURN: CHARGE [HOLD SLASH]",
    pvpParryLockout: "PARRY LOCKOUT!",
    pvpWins: "WINS!",
    pvpRematch: "Rematch",
    pvpRematchStatus: "Rematch? ({count}/2 Ready)",
    pvpQuitToMenu: "Quit to Menu",
    pvpRound: "ROUND",
    pvpReadyText: "READY...",
    pvpRally: "RALLY:",
    pvpSpeed: "Speed",
    pvpKills: "KILLS",
    pvpConnecting: "CONNECTING...",
    pvpConnected: "CONNECTED",
    pvpError: "ERROR",
    pvpOnline: "ONLINE",
    pvpChallengeMsg: "{name} has challenged you to a duel!",
    pvpInvite: "Invite",
    
    // Alert strings
    alertUidCopied: "Your UID has been copied to clipboard!",
    alertFailedToConnect: "Failed to connect: ",
    alertOpponentDisconnected: "Opponent disconnected. Returning to main menu.",
    alertConnectionClosed: "Connection closed by remote peer.",
    alertFailedUpdateName: "Failed to update display name: ",
    alertProfileNameUpdated: "Profile name updated successfully!",
    alertFriendReqAccepted: "Friend request accepted!",
    alertFailedAcceptReq: "Failed to accept request: ",
    alertFriendReqDeclined: "Friend request declined.",
    alertFailedDeclineReq: "Failed to decline request: ",
    alertEnterValidUid: "Please enter a valid 8-digit numeric UID.",
    alertCannotAddSelf: "You cannot add yourself as a friend.",
    alertUidNotFound: "Ronin UID not found.",
    alertAlreadyFriends: "You are already friends with this Ronin.",
    alertFailedAddFriend: "Failed to add friend: ",
    alertFriendReqSent: "Friend request sent to {name}!",
    alertFailedRemoveFriend: "Failed to remove friend: ",
    alertFriendRemoved: "Friend removed successfully.",
    alertDuelInviteDeclined: "Your duel invitation was declined.",
    alertFailedInviteFriend: "Failed to invite friend: ",
    alertMatchmakingFailed: "Matchmaking connection failed: ",
    alertFailedMatchmaking: "Failed to enter matchmaking: "
  },
  ja: {
    rotatePrompt: "画面を回転して全画面表示にしますか？",
    rotateInstruction: "デバイスを横向き（ランドスケープ）に回転させてください。",
    rotateDismiss: "このままプレイ ✕",
    flow: "気 (FLOW)",
    expLvl: "レベル",
    btnDash: "回避",
    btnSlash: "斬る",
    btnEnhance: "強化",
    btnUlt: "奥義",
    death: "死",
    tryAgain: "もう一度",
    levelUp: "レベルアップ！",
    chooseUlt: "奥義を選択",
    title: "スーパー<br>サムライ<br>スティッキー",
    play: "プレイ",
    settings: "設定",
    settingsTitle: "設定",
    musicVol: "音楽の音量",
    language: "言語",
    back: "戻る",
    paused: "一時停止",
    activeUpgradesTitle: "強化アビリティ",
    guideTitle: "戦闘ガイド＆テクニック",
    guideMove: "<strong>移動:</strong> パソコンでは<strong>WASD / 矢印キー</strong>、モバイルでは<strong>仮想ジョイスティック</strong>を使用して戦場を自由に移動できます。",
    guideSlash: "<strong>斬撃 (基本攻撃):</strong> パソコンでは左クリック(<strong>LMB</strong>)、モバイルでは<strong>攻撃ボタン</strong>をタップします。攻撃は最も近い敵へ自動でホーミングします。連続キルでコンボ数を重ねましょう。",
    guideDodge: "<strong>回避 (ダッシュ):</strong> パソコンでは<strong>スペースキー</strong>、モバイルでは<strong>回避ボタン</strong>を押します。ダッシュ中は完全無敵 (無敵フレーム) となります。",
    guidePerfect: "<strong>ジャスト回避:</strong> 敵が赤く光って突進する瞬間にダッシュを合わせると、画面がフラッシュし、コンボゲージが大幅に上昇して2秒間の無敵シールドを獲得します。",
    guideFlow: "<strong>気の覚醒 (奥義):</strong> 敵を倒してオレンジ色の気（FLOW）ゲージを溜めます。満タン時に<strong>Fキー</strong>（モバイルでは<strong>奥義ボタン</strong>）を押すと、以下のいずれかの強力な奥義を選択・発動できます：<br>• <strong>影の覚醒:</strong> 10秒間の神速状態。通常攻撃のダメージが+4され、敵に瞬間移動して4ダメージを与える影分身を生成。ダッシュのクールダウンが0になります。<br>• <strong>超究武神覇斬:</strong> 3.5秒間時間を停止し、全敵に16ダメージの交差斬りを3回実行。最後に残った敵に20ダメージの爆風を放ち、ライフを2回復。<br>• <strong>雷神の稲妻:</strong> 8秒間の雷撃状態。通常斬撃から4体に連鎖する雷撃を放つ。さらにダッシュが瞬間移動（450px）になり、開始地点と終点に縦の稲妻（6ダメージ、3秒気絶、5体へ2ダメージの連鎖）を落とします。",
    guideProg: "<strong>成長とアップグレード:</strong> 敵を撃破してEXPを溜め、レベルアップします。レベルアップ時は体力が1回復し、各種能力強化に加え、確率で体力を吸収する「吸魂の刃」や跳ね返し弾を強化する「反射の鏡」などの固有能力を選択できます。",
    guideParry: "<strong>受け流し (パリィ):</strong> 攻撃ボタンを長押しして力を溜め、敵の攻撃が当たる瞬間に離すことで、敵の攻撃を完璧に弾き返して無効化し、相手をよろめかせることができます。",
    guideIaijutsu: "<strong>居合・真空波:</strong> 攻撃ボタンを長押しでチャージし、最大チャージ時に離すことで、前方の敵を全て貫通する超高速の「三日月型真空波」を放ちます。",
    guideAutoAim: "<strong>自動エイム:</strong> 通常攻撃や踏み込みは、範囲600px以内の最も近い敵へ自動的に照準を合わせるため、高機動な戦闘を直感的に楽しめます。",
    guidePvP: "<strong>居合・対戦モード:</strong> PvPロビーに入り、独自のRonin UIDをコピーして友人を追加し、直接1v1の居合決闘に招待できます。一時的なルームコードの共有は不要です！",
    comboSwift: "<strong>コンボ — 疾風カウンター:</strong> <strong>ダッシュ</strong>直後に<strong>斬撃</strong>を押す。最も近い敵の背後に瞬間移動して一閃。",
    comboThunder: "<strong>コンボ — 雷光一閃:</strong> <strong>雷神の稲妻</strong>発動中、または<strong>雷神ステップ</strong>スキル装備時に<strong>ダッシュ</strong>直後に<strong>斬撃</strong>を押す。雷撃を纏って敵を斬り裂く。",
    comboMirror: "<strong>コンボ — 鏡像一閃:</strong> <strong>反射の鏡／デコイ</strong>パッシブの透明化中にフルチャージの<strong>居合斬り</strong>を放つ。双子の幻影分身が全ての近くの敵を攻撃する。",
    openGuideBtn: "📖 秘伝戦術指南 (Combat Codex)",
    guideModalTitle: "📖 秘伝戦術指南 • COMBAT CODEX",
    guideCatFundamentals: "基本動作と機動",
    guideMoveText: "全方位への滑らかなダッシュ移動。",
    guideSlashText: "通常斬撃。600px以内の最も近い敵へ自動ホーミング。連続斬りでコンボ蓄積。",
    guideDodgeText: "完全無敵フレーム（i-frames）を伴う瞬時回避。",
    guidePerfectText: "敵の突進（赤フラッシュ）に合わせてダッシュし、2秒間の無敵＆コンボ急上昇！",
    guideCatParry: "弾きと体幹システム（Sekiro）",
    guideParryText: "攻撃をジャストで弾き、敵の体幹に大打撃を与える。連続弾きで音程が半音ずつ上昇し、火花が琥珀➔黄金➔水色➔蒼白閃光へ進化！",
    guidePosture: "<strong>体幹崩壊と処刑:</strong> 攻撃や弾きで敵の体幹ゲージを最大まで溜めると【体勢崩壊】。即座に攻撃して必殺の一刀両断・処刑を発動可能！",
    guidePostureText: "敵・ボスの体幹ゲージが満タンで【体勢崩壊（STAGGER BREAK）】。即座に攻撃して必殺の一刀両断・処刑、勾玉ボーナス、構えシナジー爆発を発動！",
    guideCatArts: "武士の秘奥義",
    guideChiburui: "<strong>血振るい・納刀:</strong> 3体以上撃破後に1.2秒間完全静止。刀の血を払い、気力+15獲得＆次回攻撃が確定2.5倍会心の一撃に！",
    guideChiburuiText: "3体以上撃破後に1.2秒間完全静止。刀の血を振り払い、気力+15獲得＆次回攻撃が確定2.5倍会心の一撃に！",
    guideLauncherText: "体勢崩壊した敵の前で【W / 上】を入力して上空へ打ち上げ、ダッシュ/攻撃で急降下・兜割りを叩き込む！",
    guideClashText: "強敵との鍔迫り合い発生時、攻撃ボタンを連打して競り勝ち、相手を吹き飛ばして体幹を粉砕！",
    guideSunriseText: "ステージクリアの瞬間、画面上の敵弾が全て桜の花びらに昇華し、水墨画の一閃ワイプが走る！",
    guideCatCombos: "必殺連携（隠しコンボ）",
    comboSwiftText: "見切り返し（Swift Counter）— 回避直後に斬撃で背後へ瞬間移動して刺突。",
    comboThunderText: "霹靂一閃（Thunderclap & Flash）— 雷神状態で回避直後に斬撃。電光石火で最大5体を貫く連鎖雷撃。",
    comboDragonText: "昇竜斬（Rising Dragon）— 斬撃2回からチャージ微溜め解放。竜巻で敵を打ち上げる。",
    comboMirrorText: "鏡面乱舞（Mirror Strike）— 影遁ステルス中に居合最大チャージ。3体の分身が全方位から一斉強襲。",
    guideCatSkills: "忍法階位と勾玉の力",
    resume: "ゲーム再開",
    quit: "タイトルへ",
    kills: "撃破数: ",
    combo: " コンボ",
    dashText: "回避！",
    dodgeText: "ジャスト回避！",
    parryText: "弾き！",
    perfectParryText: "ジャスト弾き！",
    iaijutsuText: "居合斬り！",
    levelUpText: "レベルアップ！",
    swordEnhancedText: "刀強化！",
    clashVictoryText: "鍔迫り合い勝利！ ⚔️",
    clashDrawText: "引き分け",
    clashPromptText: "攻撃連打！",
    aerialLaunchedText: "打ち上げ！ 🌪️",
    aerialCleaveText: "兜割り！ ⚡",
    aerialPromptText: "空中斬り！",
    puGiantName: "巨大な刀", puGiantDesc: "斬撃サイズ +12.5% (最大2.2倍)",
    puWindName: "風の型", puWindDesc: "攻撃クールダウン -8% (上限-40%)",
    puFeatherName: "羽の歩み", puFeatherDesc: "ダッシュクールダウン -10% (上限-40%)",
    puSwiftName: "迅速", puSwiftDesc: "移動速度 +10% (最大+50%)",
    puBloodName: "血の渇き", puBloodDesc: "気（フロー）の生成 +30%",
    puDeadeyeName: "死眼の構え", puDeadeyeDesc: "会心率 +10%（強化由来の会心率は最大40%）",
    puLethalName: "致命撃", puLethalDesc: "強化時の追加ダメージ +1",
    puColossalName: "巨大剣", puColossalDesc: "強化時のサイズ +50%",
    puDurationName: "神の巻物", puDurationDesc: "強化持続時間 +1.5秒",
    puShieldDurationName: "風神の領域", puShieldDurationDesc: "風の加護の持続時間 +1.5秒",
    puShieldPulseName: "烈風の波動", puShieldPulseDesc: "風の加護発動中、1秒ごとに周囲の敵へ3ダメージの波動を放つ",
    puShieldBlastName: "暴風の棘", puShieldBlastDesc: "風 of 加護発動中、近接攻撃を受けると敵にレベル毎8ダメージ＋吹き飛ばし",
    puDashDamageName: "迅雷の猛撃", puDashDamageDesc: "雷神の瞬歩のダメージ +1、気絶時間 2.0秒に延長",
    puDashRangeName: "静電気の加速", puDashRangeDesc: "雷神の瞬歩の間合い +30%、速度 +20%",
    puDashThunderName: "連鎖雷撃", puDashThunderDesc: "雷神の瞬歩命中時、周囲3体の敵にレベル毎2ダメージの連鎖雷撃",
    puFirewheelRangeName: "焦熱の炎輪", puFirewheelRangeDesc: "業火の回天の範囲 +25%",
    puFirewheelBlazeName: "猛烈な残り火", puFirewheelBlazeDesc: "業火の回天の炎上ダメージ +1",
    puFirewheelEchoName: "火炎の残響", puFirewheelEchoDesc: "命中すると周囲の敵に1ダメージを与える爆発火花を誘発",
    puGravityRadiusName: "事象の地平線", puGravityRadiusDesc: "重力崩壊の引き寄せ範囲 +25%",
    puGravityDamageName: "圧砕する斥力", puGravityDamageDesc: "重力崩壊の継続ダメージ +1",
    puGravityExplosionName: "超新星爆発", puGravityExplosionDesc: "重力崩壊終了時に爆縮が起き、レベル毎に4ダメージを与える",
    puChargeSpeedName: "迅雷 of 構え", puChargeSpeedDesc: "居合チャージ速度 +35%",
    puDeflectDmgName: "反射 of 鏡", puDeflectDmgDesc: "跳ね返し弾の威力 +2 DMG",
    puVampireName: "吸魂 of 刃", puVampireDesc: "撃破時に6%の確率でハート回復",
    puDimensionalName: "次元 of 裂け目", puDimensionalDesc: "真空波のサイズ +30%",
    puFireName: "火 of 型", puFireDesc: "斬撃が敵を炎上させ、3秒間継続ダメージ(1 DMG/秒)を与える",
    puClonesName: "影分身 of 術", puClonesDesc: "攻撃を模倣する分身を召喚する",
    puStoutHeartName: "不屈 of 心", puStoutHeartDesc: "最大ハート数が1スロット増加（最大7）",
    puPetalArmorName: "桜花 of 鎧", puPetalArmorDesc: "敵の攻撃を1回防ぐ（15秒ごとに再チャージ）",
    puEchoSlashName: "残響 of 斬撃", puEchoSlashDesc: "斬撃から0.5の追加ダメージを与える真空波を放つ",
    puTempoMasteryName: "脈動 of 覇気", puTempoMasteryDesc: "コンボ数に応じて攻撃速度が上昇（最大20%）",
    puFrostName: "氷結の構え", puFrostDesc: "斬撃が敵を3秒間40%減速。氷結した敵を弾くと破裂して周囲に8ダメージ。",
    puVoidName: "虚無 of 構え", puVoidDesc: "居合斬りの衝撃波が周囲の敵を引き寄せる空間の裂け目を残す。",
    puFlowingCounterName: "受け流し of 極意", puFlowingCounterDesc: "弾き／回避成功時に瞬歩／雷神の瞬歩のクールダウンを即座にリセット。",
    puGaleVortexName: "疾風 of 渦", puGaleVortexDesc: "守護 of 防壁の時間が1秒減少するが、回転速度が3倍になり、すべての弾丸を自動照準で射手に反射する。",
    puBladeEchoesName: "刃 of 残影", puBladeEchoesDesc: "明鏡止水（アルティメット）中、上下に2体の分身が出現し、2倍サイズ・40%ダメージで攻撃を模倣。",
    puJudgementCutName: "次元斬", puJudgementCutDesc: "最大チャージの居合波の先に、1.5秒間で計6回（各0.5ダメージ）の高速微細斬撃を繰り出すドームを展開する。",
    puSakuraBlizzardName: "桜花吹雪", puSakuraBlizzardDesc: "ダッシュ時に足元に桜の花びらを残す。敵が踏むと爆発して1ダメージを与える。",
    puUnstableOverloadName: "不確実な過負荷", puUnstableOverloadDesc: "Chill（氷結）またはBurn（炎上）状態の敵をすり抜けるようにダッシュすると、5ダメージの範囲属性爆発が発生する。",
    puMagneticDrawName: "磁気引き寄せ", puMagneticDrawDesc: "広範囲からEXPジェムとハートを自動的にプレイヤーの元へ引き寄せる。",
    puReapersMarkName: "死神の刻印", puReapersMarkDesc: "通常斬撃の威力が+2されるが、25秒ごとにハートが1減少する。敵を10体倒すとこのタイマーがリセットされる。",
    puExecutionName: "処刑の極意", puExecutionDesc: "体勢崩壊した敵に対する漫画風の一刀両断・処刑を発動可能にする。致命的なダメージ、血飛沫、ボーナス勾玉を獲得。",
    selectSkillTitle: "アクティブスキルの選択",
    skillEnhanceName: "竜気解放（ドラゴンス・フューリー）", skillEnhanceDesc: "基本型 (0 🔮): 刀身+80%、斬撃威力+3（10秒間）。巨大な紫電三日月波を放つ。クールダウン18秒。",
    skillDashName: "雷神ステップ（ライジン・ステップ）", skillDashDesc: "第2階位 (10,000 🔮): 超高速雷撃瞬歩（CD 0.9秒、完全無敵0.45秒）。12ダメージ＋2.2秒気絶を与え双雷を落とす。",
    skillShieldName: "風神の加護（ウィンド・アイギス）", skillShieldDesc: "第3階位 (15,000 🔮): 4.5秒間の暴風障壁。敵弾を3倍速で完全反射。0.8秒ごとに14範囲ダメージと強烈な吹き飛ばし。CD 10秒。",
    skillParryMasterName: "弾きの極意（パリー・マスター）", skillParryMasterDesc: "第4階位 (20,000 🔮): 4秒間パリィ判定+50%。カウンターで2.5倍会心ダメージ、敵体幹を40削り気を+15回復。CD 9秒。",
    skillFirewheelName: "業火回天（インフェルノ・スウィープ）", skillFirewheelDesc: "第5階位 (25,000 🔮): 半径260pxの灼熱輪（0.25秒毎に10ダメ＋追尾火球12ダメ）。最後に25ダメの火焔大爆発。CD 11秒。",
    skillDecoyName: "虚空断絶・幻影裂斬（ヴォイド・ラプチャー）", skillDecoyDesc: "第6階位 (35,000 🔮): 超次元瞬歩で敵陣を一刀両断（80＋斬撃力800%ダメ＋体幹60削り）。6秒間、通常斬撃が自動追尾の幻影刃を3連射出（斬撃力135%）。CD 10秒。",
    skillGravityName: "神罰天雷・雷神壊滅（ライジン・カタクリズム）", skillGravityDesc: "頂点奥義 (50,000 🔮): 天裂く神雷が画面内の全敵弾を消滅させ、体幹120削り＋90＋斬撃力1000%範囲ダメ！7秒間、斬撃が最大5体に連鎖雷撃（斬撃力250%）。CD 10秒。",
    btnShield: "風神",
    btnFlash: "雷神",
    btnFirewheel: "業火",
    btnGravity: "天雷",
    btnParryMaster: "弾き",
    btnDecoy: "虚空",
    puRaijinSplitterName: "雷神の天裂き", puRaijinSplitterDesc: "完璧な弾き成功時、天空より紫雷を落とし体幹35粉砕＋45＋斬撃力350%ダメ。周囲の敵4体に連鎖雷撃（斬撃力200%）。",
    puArterialGushName: "動脈崩壊（アーテリアル・ガッシュ）", puArterialGushDesc: "会心攻撃時に血飛沫が噴き出し重度出血を付与。減少体力の20%＋斬撃力125%分の継続ダメージ。",
    puSonicBreakName: "音速突破（ソニック・ブレイク）", puSonicBreakDesc: "ダッシュ直後の斬撃が超音速衝撃波を形成（斬撃力180%＋25ダメ）。敵弾を両断消滅させ、刀の射程を+100px拡大。",
    puMiasmaCleaveName: "瘴気斬裂（ミアズマ・クリーブ）", puMiasmaCleaveDesc: "剣閃の軌道に腐食毒霧を展開（毎秒15＋斬撃力80%ダメ）。敵装甲を融解させ被ダメ+35%。",
    puHanabiBladeName: "花火の刃（ハナビ・ブレード）", puHanabiBladeDesc: "敵弾を弾き返した瞬間、放射状の花火破片が炸裂（20＋斬撃力110%ダメ）。周囲の敵を上空へ打ち上げ。",
    puGrimHarvestName: "魂刈りの死霊（グリム・ハーベスト）", puGrimHarvestDesc: "精鋭またはボスの処刑時、死霊を召喚。処刑対象の最大HP50%（＋斬撃力500%）の確定ダメ。",
    puCursedGlassName: "玻璃の刃", puCursedGlassDesc: "☠ 呪い: 最大ハートを3つ失う。攻撃力+3、斬撃範囲+50%、ダッシュ速度+40%＆無敵時間延長。",
    puCursedBloodName: "血の渇き", puCursedBloodDesc: "☠ 呪い: 45秒毎に1HP減少。撃破時の気力獲得+50% & 吸血効果。",
    puCursedIronName: "重鉄の呪縛", puCursedIronDesc: "☠ 呪い: ダッシュクールダウン+25%。斬撃範囲+100% & 弾き返しダメージ+6。",
    puCursedGreedName: "鬼神の契り", puCursedGreedDesc: "☠ 呪い: スコア獲得が2倍。コンボ継続の恩恵が増大。",
    fuPlasmaName: "天雷業火（プラズマ・テンペスト）", fuPlasmaDesc: "⚡ 神聖合一：ダッシュ軌道に電磁火炎壁を展開（秒間6ダメ）。炎上中の敵を斬撃すると画面全域へ10ダメの連鎖雷撃を放出。",
    fuSingularityName: "虚無の太刀（シンギュラリティ・クリーブ）", fuSingularityDesc: "⚡ 神聖合一：通常斬撃がマイクロ・ブラックホールを射出。敵弾を消滅させ敵を吸引し、最後に20ダメの特異点爆発を起こす。",
    fuPhantomsName: "百鬼夜行（ハンドレッド・ファントム）", fuPhantomsDesc: "⚡ 神聖合一：見切り回避またはフィニッシャー発動時、12秒間プレイヤーの全斬撃を完全模倣する影武者を召喚。",
    fuKamaitachiName: "鎌鼬の風（カマイタチ・シックル）", fuKamaitachiDesc: "⚡ 神聖合一：斬撃から2つの超高速真空鎌を射出。画面端で最大3回跳ね返り、敵軍団を貫通して8ダメージを与える。",
    fuAsuraName: "修羅の六腕（アスラ・ストーム）", fuAsuraDesc: "⚡ 神聖合一：攻撃をパリィすると全方位360度に6本の幻影斬撃（各12ダメ）が爆発。3体以上命中時にハートを1回復。",
    ultShadowName: "影 of 覚醒", ultShadowDesc: "6秒間の神速移動状態。攻撃ダメージ+4かつ自動追撃の影分身を生成し、ダッシュのクールダウンを0にする。",
    ultOmniName: "超究武神覇斬", ultOmniDesc: "全敵へ神速の交差斬り（16 DMG）を放つ。最後の爆発で全敵に20ダメージを与えハートを1回復。",
    ultStormName: "雷神の稲妻", ultStormDesc: "8秒間の雷撃状態。通常攻撃で連鎖雷撃。ダッシュは瞬間移動になり、開始点・終点に稲妻（6 DMG、3秒気絶）を召喚。",
    playZen: "禅・受け流し",
    zenWarningText: "受け流しのみ！",
    zenFieldText: "明鏡止水",
    btnParryOnly: "受け流しのみ",
    btnRestricted: "制限中",
    puZenRestoreName: "精神統一", puZenRestoreDesc: "体力を1回復する。",
    ultZenFieldName: "明鏡止水", ultZenFieldDesc: "被ダメージを無効化し、0.4秒毎に周囲に衝撃波（6範囲ダメージ＋押し出し）を放つ「禅の結界」を8秒間展開する。",
    blessingSwiftName: "神速の構え",
    blessingFortuneName: "招福の加護",
    loading: "リソース読み込み中",
    tapToContinue: "画面をタップ / クリックして開始",
    fsPromptText: "快適なプレイのために全画面（フルスクリーン）モードにしますか？",
    statsTitle: "戦績サマリー",
    statsKills: "撃破数:",
    statsMaxCombo: "最大コンボ:",
    statsParries: "弾き回数:",
    statsPerfectParries: "ジャスト弾き:",
    statsPerfectDodges: "ジャスト回避:",
    statsDamage: "与ダメージ:",
    graphicsMode: "画質設定",
    difficulty: "難易度",
    difficultyEasy: "イージー",
    difficultyNormal: "ノーマル",
    difficultyHard: "ハード",
    difficultyInsane: "インセイン",
    playTime: "タイムアタック",
    playLevel: "レベルアタック",
    timeLimit: "制限時間",
    timeInfinite: "無限",
    targetLevel: "目標レベル",
    victory: "完全勝利",
    timeModeCompleted: "生存時間達成！",
    levelModeCompleted: "目標レベル到達！",
    guideDifficulty: "<strong>難易度モード:</strong> 開始前に難易度を選択します。<br>• <strong>イージー:</strong> 敵の体力30%、速度50%減、チャージ80%遅、スポーン数少。<br>• <strong>ノーマル:</strong> 敵の体力50%、速度30%減、チャージ40%遅。<br>• <strong>ハード:</strong> 敵の体力130%、速度15%増、チャージ25%高速で、スポーン数が多く間隔も短いです。<br>• <strong>インセイン:</strong> ハードの3倍の難しさ。敵の体力300%、速度55%増、チャージ150%高速で、スポーン数が非常に多く間隔も極小です。",
    screenShakeMode: "画面の揺れ",
    shakeOn: "標準",
    shakeReduced: "軽減",
    shakeOff: "オフ",
    autoUlt: "気の自動発動",
    autoUltOn: "オン",
    autoUltOff: "オフ",
    screenFlash: "フラッシュ・反転",
    weatherEffects: "天候と桜の花びら",
    speedLines: "スピードライン",
    floatingText: "ダメージ数値表示",
    groundScars: "地面の斬撃痕",
    settingsOn: "オン",
    settingsOff: "オフ",
    pvpLobbyTitle: "居合・対戦ロビー",
    pvpMyProfile: "マイプロフィール",
    pvpLoadingRonin: "浪人を読み込み中...",
    pvpSave: "保存",
    pvpUidDisplay: "UID: 読み込み中...",
    pvpCopy: "コピー",
    pvpSelectRules: "ゲームルールの選択",
    pvpClassicDuel: "クラシック決闘 (ライフ 3)",
    pvpSuddenDeath: "サドンデス (ライフ 1, 高速開始)",
    pvpHyperSpeed: "ハイスピード決闘 (ライフ 3, 急加速)",
    pvpStormGod: "雷神の暴風 (ライフ 3, 落雷発生)",
    pvpCoopSurvival: "悪夢 of 共同生存モード (インセイン難易度, AI群れ)",
    pvpSuddenDeathShort: "サドンデス",
    pvpHyperSpeedShort: "ハイスピード",
    pvpStormGodShort: "雷神の暴風",
    pvpCoopSurvivalShort: "共同生存",
    pvpFindMatch: "対戦相手を探す",
    pvpCancelQueue: "マッチングをキャンセル",
    pvpSearching: "対戦相手を検索中... ",
    pvpFoundConnecting: "対戦相手が見つかりました！接続中...",
    pvpFriends: "フレンド",
    pvpRequests: "リクエスト",
    pvpTopDuelists: "上位決闘者",
    pvpAddFriend: "フレンド追加",
    pvpFriendUidPlaceholder: "フレンドのUIDを貼り付け...",
    pvpAdd: "追加",
    pvpNoFriends: "フレンドがまだ追加されていません。UIDを共有しましょう！",
    pvpPendingRequests: "保留中のリクエスト",
    pvpNoRequests: "保留中のリクエストはありません。",
    pvpNoRecords: "まだ対戦記録がありません。",
    pvpLoadingLeaderboard: "リーダーボードを読み込み中...",
    pvpBackToMenu: "メニューに戻る",
    pvpReadyRoomMode: "モード: ",
    pvpHost: "ホスト (P1)",
    pvpClient: "クライアント (P2)",
    pvpWaiting: "待機中",
    pvpReady: "準備完了",
    pvpReadyUp: "準備完了",
    pvpCancelReady: "準備取消",
    pvpDisconnect: "切断する",
    pvpDuelChallenge: "決闘の申し込み！",
    pvpDecline: "辞退",
    pvpAccept: "受諾",
    pvpDefendTimedParry: "防御: タイミングよく弾け！",
    pvpWaitingForOpponent: "相手の行動を待っています...",
    pvpYourTurn: "あなたのターン: 攻撃長押しでチャージ",
    pvpParryLockout: "パリィ不可！",
    pvpWins: "勝利！",
    pvpRematch: "再戦",
    pvpRematchStatus: "再戦？ ({count}/2 準備完了)",
    pvpQuitToMenu: "タイトルへ",
    pvpRound: "ラウンド",
    pvpReadyText: "尋常に...",
    pvpRally: "ラリー:",
    pvpSpeed: "速度",
    pvpKills: "討伐数",
    pvpConnecting: "接続中...",
    pvpConnected: "接続完了",
    pvpError: "エラー",
    pvpOnline: "接続完了",
    pvpChallengeMsg: "{name}から決闘の申し込みが届きました！",
    pvpInvite: "招待",
    
    // Alert strings
    alertUidCopied: "UIDがクリップボードにコピーされました！",
    alertFailedToConnect: "接続に失敗しました: ",
    alertOpponentDisconnected: "対戦相手の接続が切れました。メインメニューに戻ります。",
    alertConnectionClosed: "対戦相手によって接続が切断されました。",
    alertFailedUpdateName: "表示名の更新に失敗しました: ",
    alertProfileNameUpdated: "プロフィール名が正常に更新されました！",
    alertFriendReqAccepted: "フレンドリクエストを受諾しました！",
    alertFailedAcceptReq: "リクエストの受諾に失敗しました: ",
    alertFriendReqDeclined: "フレンドリクエストを辞退しました。",
    alertFailedDeclineReq: "リクエストの辞退に失敗しました: ",
    alertEnterValidUid: "有効な8桁の数値のUIDを入力してください。",
    alertCannotAddSelf: "自分自身をフレンドに追加することはできません。",
    alertUidNotFound: "浪人UIDが見つかりません。",
    alertAlreadyFriends: "この浪人とは既にフレンドです。",
    alertFailedAddFriend: "フレンドの追加に失敗しました: ",
    alertFriendReqSent: "{name}にフレンドリクエストを送信しました！",
    alertFailedRemoveFriend: "フレンドの削除に失敗しました: ",
    alertFriendRemoved: "フレンドを削除しました。",
    alertDuelInviteDeclined: "決闘への招待が辞退されました。",
    alertFailedInviteFriend: "フレンドへの招待に失敗しました: ",
    alertMatchmakingFailed: "マッチングの接続に失敗しました: ",
    alertFailedMatchmaking: "マッチングへの参加に失敗しました: "
  }
};

export const loaderTips: Record<string, string[]> = {
  en: [
    "Dash at the exact moment of an enemy lunge to trigger a Perfect Dodge.",
    "Hold down SLASH to charge a piercing Iaijutsu Shockwave projectile.",
    "Release your charged slash right as an enemy strikes to Parry their attack.",
    "Basic attacks automatically snap to the nearest target within 600px range.",
    "Build FLOW via combo kills to activate your devastating Ultimate state.",
    "Dashing grants full invulnerability frames. Use it to escape tight corners.",
    "Level up to choose powerful modifiers like wind stance and giant katana.",
    "Keep combos active! Higher combos fill the Flow meter significantly faster."
  ],
  ja: [
    "敵の突進攻撃にタイミングを合わせて回避すると、ジャスト回避が発動します。",
    "攻撃ボタンを長押しすると、敵を貫通する「居合・真空波」をチャージできます。",
    "敵の攻撃を受ける瞬間にチャージを解放すると、攻撃をパリィできます。",
    "通常攻撃は、範囲600px以内の最も近い敵へ自動でホーミングします。",
    "コンボキルで気(FLOW)を最大まで溜めると、強力な奥義を発動できます。",
    "回避（ダッシュ）中は完全無敵です。敵に囲まれたときは迷わず使いましょう。",
    "レベルアップ時は、巨大化やクールダウン短縮などの強力な強化を選択できます。",
    "コンボを途切れさせないように！コンボ数が多いほど気が早く溜まります。"
  ]
};


interface QueuedAsset {
  img: HTMLImageElement;
  src: string;
  folder?: string;
  isPriority: boolean;
}

const priorityQueue: QueuedAsset[] = [];
const backgroundQueue: QueuedAsset[] = [];
const activeLoads = new Set<HTMLImageElement>();
const failedAssets = new Map<HTMLImageElement, QueuedAsset>();
const retryCounts = new Map<HTMLImageElement, number>();
const requiredAssets: QueuedAsset[] = [];

export function assetReadiness() {
  let loaded = 0; let failed = 0;
  for (const item of requiredAssets) {
    if (item.img.complete && item.img.naturalWidth > 0) loaded++;
    else if (failedAssets.has(item.img)) failed++;
  }
  const isAllResolved = requiredAssets.length > 0 && (loaded + failed === requiredAssets.length);
  const isSufficient = loaded >= Math.floor(requiredAssets.length * 0.95);
  return {
    loaded,
    failed,
    total: requiredAssets.length,
    ready: requiredAssets.length > 0 && (loaded === requiredAssets.length || (isAllResolved && isSufficient))
  };
}

export function retryRequiredAssets() {
  for (const item of requiredAssets) {
    if (item.img.complete && item.img.naturalWidth > 0) continue;
    if (activeLoads.has(item.img)) continue;
    failedAssets.delete(item.img);
    retryCounts.delete(item.img);
    if (!priorityQueue.includes(item)) priorityQueue.push(item);
  }
  pumpPriorityQueue();
}

const MAX_CONCURRENT_PRIORITY = 20;
const MAX_CONCURRENT_BACKGROUND = 16;
let isBackgroundLoadingActive = false;

export function registerAssetToLoad(img: HTMLImageElement) {
  // Legacy / external registration fallback
  globals.totalAssetsToLoad++;
  let resolved = false;
  const markDone = () => {
    if (resolved) return;
    resolved = true;
    globals.assetsLoadedCount++;
    assetCallbacks.onProgress();
  };
  img.onload = markDone;
  img.onerror = markDone;
  if (img.complete && img.naturalWidth > 0) {
    Promise.resolve().then(markDone);
  }
}

function queueAsset(img: HTMLImageElement, src: string, folder?: string, isPriority = false) {
  if (isPriority) {
    globals.totalAssetsToLoad++;
    const item = { img, src, folder, isPriority: true };
    requiredAssets.push(item);
    priorityQueue.push(item);
  } else {
    backgroundQueue.push({ img, src, folder, isPriority: false });
  }
}

function startLoadingItem(item: QueuedAsset) {
  activeLoads.add(item.img);
  let resolved = false;
  const onDone = () => {
    if (resolved) return;
    resolved = true;
    activeLoads.delete(item.img);
    if (item.isPriority) {
      globals.assetsLoadedCount++;
      assetCallbacks.onProgress();
      pumpPriorityQueue();
    } else {
      pumpBackgroundQueue();
    }
    window.dispatchEvent(new Event('qol-assets'));
  };

  item.img.onload = () => {
    failedAssets.delete(item.img);
    retryCounts.delete(item.img);
    onDone();
  };

  item.img.onerror = () => {
    const retries = (retryCounts.get(item.img) || 0) + 1;
    retryCounts.set(item.img, retries);
    if (retries <= 3) {
      activeLoads.delete(item.img);
      setTimeout(() => {
        if (!item.img.complete || item.img.naturalWidth === 0) {
          const sep = item.src.includes('?') ? '&' : '?';
          item.img.src = `${item.src}${sep}retry=${retries}`;
          startLoadingItem(item);
        }
      }, 350 * retries);
      return;
    }
    failedAssets.set(item.img, item);
    recordDiagnostic(`Image load failed after retries: ${item.folder || 'asset'}`);
    console.warn(`[Assets] Failed to load after 3 retries: ${item.src}`);
    onDone();
    if (item.isPriority) setTimeout(() => (window as any).__showLoadingRecovery?.(), 0);
  };

  item.img.src = item.src;
  if (item.img.complete && item.img.naturalWidth > 0) {
    Promise.resolve().then(onDone);
  }
}

export function pumpPriorityQueue() {
  while (activeLoads.size < MAX_CONCURRENT_PRIORITY && priorityQueue.length > 0) {
    const item = priorityQueue.shift()!;
    startLoadingItem(item);
  }
}

function pumpBackgroundQueue() {
  if (!isBackgroundLoadingActive) return;
  while (activeLoads.size < MAX_CONCURRENT_BACKGROUND && backgroundQueue.length > 0) {
    const item = backgroundQueue.shift()!;
    startLoadingItem(item);
  }
}

export function startBackgroundAssetLoading() {
  isBackgroundLoadingActive = true;
  pumpPriorityQueue();
  pumpBackgroundQueue();
}

export function loadAllAssets() {
  isBackgroundLoadingActive = true;
  pumpPriorityQueue();
  pumpBackgroundQueue();
}

function pad(n: number) { return n.toString().padStart(4, '0'); }

function loadAnim(folder: string, prefix: string, start: number, end: number, isPriority = false) {
  const images: HTMLImageElement[] = [];
  for (let i = start; i <= end; i++) {
    const img = new Image();
    const src = encodeURI(`sprites/Stick Figure Character Sprites 2D/${folder}/${prefix}_${pad(i)}.png`);
    queueAsset(img, src, folder, isPriority);
    images.push(img);
  }
  return images;
}

export const enemyFolderMap: Record<string, string> = {
  sword: 'Sword sprites',
  fighter: 'Fighter sprites',
  pistol: 'Pistol sprites',
  skeleton: 'Skeleton',
  enemy01: 'Enemy01',
  enemy02: 'Enemy02',
  enemy03: 'Enemy03',
  enemy05: 'Enemy05',
  heroluneblade: 'HeroLuneblade',
  heroninja: 'HeroNinja',
  evil_wizard: 'EvilWizard',
  enemy_orc: 'EnemyOrc',
  enemy_barrel: 'EnemyBarrel',
  boss_agis: 'BossAgis',
  boss_skeleton: 'BossSkeleton',
  heronightborne: 'HeroNightborne',
  herosamurai: 'HeroSamurai',
  herosatyr: 'HeroSatyr',
  heroakakage: 'HeroAkakage',
  akakage: 'HeroAkakage',
  toaster_bot: 'EnemyToasterBot'
};

export function loadEnemyAssetsNow(type: string) {
  const folder = enemyFolderMap[type] || type;
  for (let i = backgroundQueue.length - 1; i >= 0; i--) {
    const item = backgroundQueue[i];
    if (item.src.includes(folder) || (item.folder && item.folder === folder)) {
      backgroundQueue.splice(i, 1);
      startLoadingItem(item);
    }
  }
}

export function preloadStageEnemyAssets(stage: number) {
  if (stage % 5 === 0) {
    if (stage === 5) loadEnemyAssetsNow('oni_boss');
    else if (stage === 10) loadEnemyAssetsNow('boss_agis');
    else if (stage === 15) loadEnemyAssetsNow('boss_skeleton');
    else if (stage >= 20) loadEnemyAssetsNow('shogun_boss');
  }
  loadEnemyAssetsNow('enemy01');
  loadEnemyAssetsNow('enemy02');
  loadEnemyAssetsNow('skeleton');
  loadEnemyAssetsNow('enemy_orc');
  loadEnemyAssetsNow('enemy_barrel');
  if (stage >= 3) loadEnemyAssetsNow('evil_wizard');
  if (stage >= 6) loadEnemyAssetsNow('toaster_bot');
  pumpBackgroundQueue();
}

export function loadHeroAssets(heroId: string) {
  const folder = enemyFolderMap[heroId] || heroId;
  loadEnemyAssetsNow(folder);
}

export function loadCoreCombatAssetsNow() {
  pumpPriorityQueue();
}

function loadSkeletonAnim(prefix: string, count: number, isPriority = false) {
  const images: HTMLImageElement[] = [];
  for (let i = 1; i <= count; i++) {
    const img = new Image();
    const src = encodeURI(`sprites/Skeleton/${prefix}_${i}.png`);
    queueAsset(img, src, 'Skeleton', isPriority);
    images.push(img);
  }
  return images;
}

function loadCustomEnemyAnim(folder: string, prefix: string, count: number, isPriority = false) {
  const images: HTMLImageElement[] = [];
  for (let i = 1; i <= count; i++) {
    const img = new Image();
    const frameStr = i.toString().padStart(2, '0');
    const src = encodeURI(`sprites/${folder}/${prefix}${frameStr}.png`);
    queueAsset(img, src, folder, isPriority);
    images.push(img);
  }
  return images;
}

function loadVfxFrames(pathPattern: string, count: number, startIdx = 1, padSize = 0, isPriority = false) {
  const frames: HTMLImageElement[] = [];
  for (let i = 0; i < count; i++) {
    const frameNum = startIdx + i;
    const numStr = padSize > 0 ? frameNum.toString().padStart(padSize, '0') : frameNum.toString();
    const img = new Image();
    const src = encodeURI(pathPattern.replace('{N}', numStr));
    queueAsset(img, src, 'vfx', isPriority);
    frames.push(img);
  }
  return frames;
}

export const anims = {
  // All playable heroes flagged with isPriority = true (core battlefield invariant)
  sword: {
    idle: loadAnim('Sword sprites', 'sword_Idle', 1, 8, true),
    walk: loadAnim('Sword sprites', 'sword_run', 17, 24, true),
    attack: loadAnim('Sword sprites', 'sword_combo', 65, 75, true),
    dash: loadAnim('Sword sprites', 'sword_dash', 33, 38, true),
    dead: loadAnim('Sword sprites', 'sword_death', 52, 61, true),
  },
  fighter: {
    idle: loadAnim('Fighter sprites', 'fighter_Idle', 1, 8, false),
    walk: loadAnim('Fighter sprites', 'fighter_run', 17, 24, false),
    attack: loadAnim('Fighter sprites', 'fighter_combo', 64, 75, false),
    dash: loadAnim('Fighter sprites', 'fighter_dash', 33, 38, false),
    dead: loadAnim('Fighter sprites', 'fighter_death', 52, 61, false),
  },
  pistol: {
    idle: loadAnim('Pistol sprites', 'pistol_Idle', 1, 8, false),
    walk: loadAnim('Pistol sprites', 'pistol_run', 17, 24, false),
    attack: loadAnim('Pistol sprites', 'pistol_shot', 64, 65, false),
    dash: loadAnim('Pistol sprites', 'pistol_dash', 33, 38, false),
    dead: loadAnim('Pistol sprites', 'pistol_death', 52, 61, false),
  },
  skeleton: {
    idle: loadSkeletonAnim('idle', 8, false),
    walk: loadSkeletonAnim('walk', 10, false),
    attack: loadSkeletonAnim('attack', 25, false),
    dash: loadSkeletonAnim('walk', 10, false),
    dead: loadSkeletonAnim('dead', 25, false),
  },
  enemy01: {
    idle: loadCustomEnemyAnim('Enemy01', 'idle', 6, true),
    walk: loadCustomEnemyAnim('Enemy01', 'walk', 8, true),
    attack: loadCustomEnemyAnim('Enemy01', 'attack', 7, true),
    dash: loadCustomEnemyAnim('Enemy01', 'walk', 8, true),
    dead: loadCustomEnemyAnim('Enemy01', 'hit', 4, true),
  },
  enemy02: {
    idle: loadCustomEnemyAnim('Enemy02', 'idle', 6, true),
    walk: loadCustomEnemyAnim('Enemy02', 'walk', 8, true),
    attack: loadCustomEnemyAnim('Enemy02', 'attack', 8, true),
    dash: loadCustomEnemyAnim('Enemy02', 'walk', 8, true),
    dead: loadCustomEnemyAnim('Enemy02', 'hit', 4, true),
  },
  enemy03: {
    idle: loadCustomEnemyAnim('Enemy03', 'idle', 6, false),
    walk: loadCustomEnemyAnim('Enemy03', 'walk', 4, false),
    attack: loadCustomEnemyAnim('Enemy03', 'attack', 5, false),
    dash: loadCustomEnemyAnim('Enemy03', 'walk', 4, false),
    dead: loadCustomEnemyAnim('Enemy03', 'hit', 7, false),
  },
  enemy05: {
    idle: loadCustomEnemyAnim('Enemy05', 'idle', 2, false),
    walk: loadCustomEnemyAnim('Enemy05', 'walk', 8, false),
    attack: loadCustomEnemyAnim('Enemy05', 'attack', 4, false),
    dash: loadCustomEnemyAnim('Enemy05', 'walk', 8, false),
    dead: loadCustomEnemyAnim('Enemy05', 'hit', 8, false),
  },
  heroluneblade: {
    idle: loadCustomEnemyAnim('HeroLuneblade', 'idle', 7, true),
    walk: loadCustomEnemyAnim('HeroLuneblade', 'walk', 8, true),
    attack: loadCustomEnemyAnim('HeroLuneblade', 'attack', 10, true),
    dash: loadCustomEnemyAnim('HeroLuneblade', 'dash', 12, true),
    dead: loadCustomEnemyAnim('HeroLuneblade', 'dead', 18, true),
  },
  heroninja: {
    idle: loadCustomEnemyAnim('HeroNinja', 'idle', 2, true),
    walk: loadCustomEnemyAnim('HeroNinja', 'walk', 8, true),
    attack: loadCustomEnemyAnim('HeroNinja', 'attack', 8, true),
    dash: loadCustomEnemyAnim('HeroNinja', 'dash', 8, true),
    dead: loadCustomEnemyAnim('HeroNinja', 'dead', 7, true),
  },
  evil_wizard: {
    idle: loadCustomEnemyAnim('EvilWizard', 'idle', 8, false),
    walk: loadCustomEnemyAnim('EvilWizard', 'walk', 8, false),
    attack: loadCustomEnemyAnim('EvilWizard', 'attack', 8, false),
    dash: loadCustomEnemyAnim('EvilWizard', 'walk', 8, false),
    dead: loadCustomEnemyAnim('EvilWizard', 'dead', 5, false),
  },
  enemy_orc: {
    idle: loadCustomEnemyAnim('EnemyOrc', 'idle', 6, true),
    walk: loadCustomEnemyAnim('EnemyOrc', 'walk', 8, true),
    attack: loadCustomEnemyAnim('EnemyOrc', 'attack', 6, true),
    dash: loadCustomEnemyAnim('EnemyOrc', 'dash', 8, true),
    dead: loadCustomEnemyAnim('EnemyOrc', 'dead', 4, true),
  },
  enemy_barrel: {
    idle: loadCustomEnemyAnim('EnemyBarrel', 'idle', 6, false),
    walk: loadCustomEnemyAnim('EnemyBarrel', 'walk', 6, false),
    attack: loadCustomEnemyAnim('EnemyBarrel', 'attack', 6, false),
    dash: loadCustomEnemyAnim('EnemyBarrel', 'dash', 6, false),
    dead: loadCustomEnemyAnim('EnemyBarrel', 'dead', 6, false),
  },
  boss_agis: {
    idle: loadCustomEnemyAnim('BossAgis', 'idle', 6, false),
    walk: loadCustomEnemyAnim('BossAgis', 'walk', 6, false),
    attack: loadCustomEnemyAnim('BossAgis', 'attack', 8, false),
    dash: loadCustomEnemyAnim('BossAgis', 'dash', 6, false),
    dead: loadCustomEnemyAnim('BossAgis', 'dead', 4, false),
  },
  boss_skeleton: {
    idle: loadCustomEnemyAnim('BossSkeleton', 'idle', 11, false),
    walk: loadCustomEnemyAnim('BossSkeleton', 'walk', 13, false),
    react: loadCustomEnemyAnim('BossSkeleton', 'react', 4, false),
    attack: loadCustomEnemyAnim('BossSkeleton', 'attack', 9, false),
    recover: loadCustomEnemyAnim('BossSkeleton', 'recover', 9, false),
    hit: loadCustomEnemyAnim('BossSkeleton', 'hit', 8, false),
    dash: loadCustomEnemyAnim('BossSkeleton', 'walk', 13, false),
    dead: loadCustomEnemyAnim('BossSkeleton', 'dead', 15, false),
  },
  heronightborne: {
    idle: loadCustomEnemyAnim('HeroNightborne', 'idle', 9, true),
    walk: loadCustomEnemyAnim('HeroNightborne', 'walk', 6, true),
    attack: loadCustomEnemyAnim('HeroNightborne', 'attack', 12, true),
    hit: loadCustomEnemyAnim('HeroNightborne', 'hit', 5, true),
    dash: loadCustomEnemyAnim('HeroNightborne', 'dash', 6, true),
    dead: loadCustomEnemyAnim('HeroNightborne', 'dead', 23, true),
  },
  herosamurai: {
    idle: loadCustomEnemyAnim('HeroSamurai', 'idle', 10, true),
    walk: loadCustomEnemyAnim('HeroSamurai', 'walk', 16, true),
    attack: loadCustomEnemyAnim('HeroSamurai', 'attack', 7, true),
    hit: loadCustomEnemyAnim('HeroSamurai', 'hit', 4, true),
    dash: loadCustomEnemyAnim('HeroSamurai', 'dash', 8, true),
    dead: loadCustomEnemyAnim('HeroSamurai', 'dead', 8, true),
  },
  herosatyr: {
    idle: loadCustomEnemyAnim('HeroSatyr', 'idle', 6, true),
    walk: loadCustomEnemyAnim('HeroSatyr', 'walk', 8, true),
    attack: loadCustomEnemyAnim('HeroSatyr', 'attack', 10, true),
    hit: loadCustomEnemyAnim('HeroSatyr', 'hit', 4, true),
    dash: loadCustomEnemyAnim('HeroSatyr', 'dash', 6, true),
    dead: loadCustomEnemyAnim('HeroSatyr', 'dead', 10, true),
  },
  heroakakage: {
    idle: loadCustomEnemyAnim('HeroAkakage', 'idle', 8, true),
    walk: loadCustomEnemyAnim('HeroAkakage', 'walk', 8, true),
    attack: loadCustomEnemyAnim('HeroAkakage', 'attack', 12, true),
    hit: loadCustomEnemyAnim('HeroAkakage', 'hit', 4, true),
    dash: loadCustomEnemyAnim('HeroAkakage', 'dash', 2, true),
    dead: loadCustomEnemyAnim('HeroAkakage', 'dead', 6, true),
  },
  toaster_bot: {
    idle: loadCustomEnemyAnim('EnemyToasterBot', 'idle', 10, false),
    walk: loadCustomEnemyAnim('EnemyToasterBot', 'walk', 16, false),
    attack: loadCustomEnemyAnim('EnemyToasterBot', 'attack', 22, false),
    hit: loadCustomEnemyAnim('EnemyToasterBot', 'hit', 4, false),
    dash: loadCustomEnemyAnim('EnemyToasterBot', 'walk', 16, false),
    dead: loadCustomEnemyAnim('EnemyToasterBot', 'dead', 10, false),
  }
};

export const propImages: HTMLImageElement[] = [];

export const bgLayers = [
  { name: 'hills_trees', fallbackName: 'hills&trees', speed: 0.1 },
  { name: 'ruins', speed: 0.2 },
  { name: 'ruins2', speed: 0.3 },
  { name: 'statue', speed: 0.4 },
  { name: 'stones_grass', fallbackName: 'stones&grass', speed: 0.6 }
];

export const bgImages: Record<string, HTMLImageElement> = {};
bgLayers.forEach(layer => {
  const img = new Image();
  const src = `fantasy_bg/${layer.name}.png?v=3`;
  img.onerror = () => {
    if ((layer as any).fallbackName) {
      img.src = `fantasy_bg/${encodeURIComponent((layer as any).fallbackName + '.png')}?v=3`;
    }
  };
  queueAsset(img, src, 'bg', true);
  bgImages[layer.name] = img;
  if ((layer as any).fallbackName) {
    bgImages[(layer as any).fallbackName] = img;
  }
});

export const playerImages: Record<string, HTMLImageElement> = {};
Object.entries(svgAssets).forEach(([name, url]) => {
  const img = new Image();
  queueAsset(img, url, 'svg', true);
  playerImages[name] = img;
});

export const heroPortraits: HTMLImageElement[] = [];
[
  'portrait_ronin.png',
  'portrait_luneblade.png',
  'portrait_ninja.png',
  'portrait_samurai.png',
  'portrait_nightborne.png',
  'portrait_satyr.png',
  'portrait_akakage.png'
].forEach(p => {
  const img = new Image();
  queueAsset(img, `sprites/portraits/${p}`, 'portraits', true);
  heroPortraits.push(img);
});

export const skillsData = [
  { id: 'enhance', nameKey: 'skillEnhanceName', descKey: 'skillEnhanceDesc', cost: 0, icon: '⚔️' },
  { id: 'dash', nameKey: 'skillDashName', descKey: 'skillDashDesc', cost: 5000, icon: '⚡' },
  { id: 'shield', nameKey: 'skillShieldName', descKey: 'skillShieldDesc', cost: 7500, icon: '🛡️' },
  { id: 'parry_master', nameKey: 'skillParryMasterName', descKey: 'skillParryMasterDesc', cost: 10000, icon: '🤺' },
  { id: 'firewheel', nameKey: 'skillFirewheelName', descKey: 'skillFirewheelDesc', cost: 12500, icon: '🔥' },
  { id: 'decoy_illusion', nameKey: 'skillDecoyName', descKey: 'skillDecoyDesc', cost: 35000, icon: '🌌' },
  { id: 'gravity', nameKey: 'skillGravityName', descKey: 'skillGravityDesc', cost: 50000, icon: '⚡' }
];

export const vfxAnims = {
  custom: {
    slash: loadVfxFrames('vfx/Frames/Slash_color5_frame{N}.png', 9, 1, 0, true),
    dragonFury: loadVfxFrames('vfx/Dragon_fury/Slash_color4_frame{N}.png', 9, 1, 0, true),
    invincible: loadVfxFrames('vfx/invincible/Starcaller_spell_3_frame_{N}.png', 15, 1, 0, false),
    starfall: loadVfxFrames('vfx/starfall/Starcaller_spell_2_frame_{N}.png', 8, 1, 0, false),
    vortex: loadVfxFrames('vfx/vortex/FireMage_skill3_frame{N}.png', 12, 1, 0, false)
  },
  gigapack: {
    explosion: loadVfxFrames('vfx/explosion/frame_{N}.png', 13, 0, 2, false),
    lightning: loadVfxFrames('vfx/lightning/frame_{N}.png', 7, 0, 2, false),
    impact: loadVfxFrames('vfx/impact/frame_{N}.png', 7, 0, 2, true),
  },
  explosions: {
    fire: loadVfxFrames('vfx/vfx/fx_pack_01/explosion_fire_0000/fire/128/frames/frame_{N}.png', 16, 0, 3, false),
    barrel: loadVfxFrames('vfx/explosions/barrel_explosion/frame_{N}.png', 9, 1, 2, true),
    infernoBlast: loadVfxFrames('vfx/explosions/inferno_blast/frame_{N}.png', 14, 0, 2, false)
  },
  fireMage: {
    vfx1: loadVfxFrames('vfx/Pixel Art VFX - Fire Mage - FREE Version/VFX1/frames/FireMage_skill1_frame{N}.png', 7, 1, 0, false),
    vfx2: loadVfxFrames('vfx/Pixel Art VFX - Fire Mage - FREE Version/VFX2/frames/FireMage_skill2_frame{N}.png', 12, 1, 0, false),
    vfx3: loadVfxFrames('vfx/Pixel Art VFX - Fire Mage - FREE Version/VFX3/frames/FireMage_skill3_frame{N}.png', 12, 1, 0, false)
  },
  frostKnight: {
    vfx1: loadVfxFrames('vfx/Pixel Art VFX - Frost Knight - FREE Version/VFX1/frames/FrostKnight_skill1_frame{N}.png', 14, 1, 0, false),
    vfx2: loadVfxFrames('vfx/Pixel Art VFX - Frost Knight - FREE Version/VFX2/frames/FrostKnight_skill2_frame{N}.png', 9, 1, 0, false),
    vfx3: loadVfxFrames('vfx/Pixel Art VFX - Frost Knight - FREE Version/VFX3/Frames/FrostKnight_skill3_frame{N}.png', 11, 1, 0, false)
  },
  starcaller: {
    vfx1: loadVfxFrames('vfx/Pixel Art VFX - Starcaller - FREE Version/VFX 1/Frames/Starcaller_spell_1_frame_{N}.png', 7, 1, 0, false),
    vfx2: loadVfxFrames('vfx/Pixel Art VFX - Starcaller - FREE Version/VFX 2/Frames/Starcaller_spell_2_frame_{N}.png', 8, 1, 0, false),
    vfx3: loadVfxFrames('vfx/Pixel Art VFX - Starcaller - FREE Version/VFX 3/Frames/Starcaller_spell_3_frame_{N}.png', 15, 1, 0, false)
  },
  warlock: {
    vfx1: loadVfxFrames('vfx/Pixel Art VFX - Warlock - FREE Version/VFX1/Frames/Warlock_skill1_frame{N}.png', 8, 1, 0, false),
    vfx2: loadVfxFrames('vfx/Pixel Art VFX - Warlock - FREE Version/VFX2/Frames/Warlock_skill2_frame{N}.png', 13, 1, 0, false),
    vfx3: loadVfxFrames('vfx/Pixel Art VFX - Warlock - FREE Version/VFX3/Frames/Warlock_skill3_frame{N}.png', 8, 1, 0, false)
  },
  heroSlashes: {
    ronin: loadVfxFrames('vfx/slashes/slash_ronin/frame_{N}.png', 9, 1, 2, true),
    ninja: loadVfxFrames('vfx/slashes/slash_ninja/frame_{N}.png', 9, 1, 2, true),
    luneblade: loadVfxFrames('vfx/slashes/slash_luneblade/frame_{N}.png', 9, 1, 2, true),
    samurai: loadVfxFrames('vfx/slashes/slash_samurai/frame_{N}.png', 9, 1, 2, true),
    nightborne: loadVfxFrames('vfx/slashes/slash_nightborne/frame_{N}.png', 9, 1, 2, true),
    satyr: loadVfxFrames('vfx/slashes/slash_satyr/frame_{N}.png', 9, 1, 2, true),
    akakage: loadVfxFrames('vfx/slashes/slash_akakage/frame_{N}.png', 30, 1, 2, true),
    dragon: loadVfxFrames('vfx/slashes/slash_dragon/frame_{N}.png', 9, 1, 2, true),
  },
  impacts: {
    parryYellow: loadVfxFrames('vfx/impacts/impact_parry_yellow/frame_{N}.png', 7, 1, 2, true),
    directionalBlue: loadVfxFrames('vfx/impacts/directional_blue/frame_{N}.png', 7, 1, 2, true)
  },
  shockwaves: {
    impactGold: loadVfxFrames('vfx/shockwaves/impact_gold/frame_{N}.png', 8, 0, 2, true),
    impactCyan: loadVfxFrames('vfx/shockwaves/impact_cyan/frame_{N}.png', 11, 0, 2, true),
    lightBurst: loadVfxFrames('vfx/shockwaves/light_burst/frame_{N}.png', 9, 0, 2, true)
  },
  spells: {
    attackUp: loadVfxFrames('vfx/spells/attack_up/frame_{N}.png', 18, 0, 2, false),
    defenseUp: loadVfxFrames('vfx/spells/defense_up/frame_{N}.png', 18, 0, 2, false)
  },
  boss: {
    slamImpact: loadVfxFrames('vfx/boss/slam_impact/frame_{N}.png', 8, 1, 2, false),
    slamDust: loadVfxFrames('vfx/boss/slam_dust/frame_{N}.png', 10, 1, 2, false)
  },
  player: {
    dashDust: loadVfxFrames('vfx/player/dash_dust/frame_{N}.png', 6, 1, 2, true)
  },
  skills: {
    firewheel: loadVfxFrames('vfx/skills/firewheel/frame_{N}.png', 7, 1, 2, true),
    windAegis: loadVfxFrames('vfx/skills/wind_aegis/frame_{N}.png', 18, 1, 2, false),
    voidWarp: loadVfxFrames('vfx/skills/void_warp/frame_{N}.png', 12, 1, 2, false),
    gravitySingularity: loadVfxFrames('vfx/skills/gravity_singularity/frame_{N}.png', 32, 0, 2, false),
    phantomWarp: loadVfxFrames('vfx/skills/phantom_warp/frame_{N}.png', 13, 0, 2, false),
    decoySmoke: loadVfxFrames('vfx/skills/decoy_smoke/frame_{N}.png', 12, 1, 2, false),
    lightningBurst: loadVfxFrames('vfx/skills/lightning_burst/frame_{N}.png', 8, 1, 2, false),
    lightningBurstViolet: loadVfxFrames('vfx/lightning/burst_violet/frame_{N}.png', 9, 0, 2, false),
    lightningStrike: loadVfxFrames('vfx/skills/lightning_strike/frame_{N}.png', 7, 1, 2, false)
  },
  projectiles: {
    iaijutsuWave: loadVfxFrames('vfx/projectiles/iaijutsu_wave/frame_{N}.png', 4, 0, 2, true),
    echoSlash: loadVfxFrames('vfx/projectiles/echo_slash/frame_{N}.png', 4, 0, 2, true),
  },
  ranks: {
    d: loadVfxFrames('vfx/ui/rank_d/frame_{N}.png', 30, 0, 2, false),
    c: loadVfxFrames('vfx/ui/rank_c/frame_{N}.png', 30, 0, 2, false),
    b: loadVfxFrames('vfx/ui/rank_b/frame_{N}.png', 30, 0, 2, false),
    a: loadVfxFrames('vfx/ui/rank_a/frame_{N}.png', 30, 0, 2, false),
    s: loadVfxFrames('vfx/ui/rank_s/frame_{N}.png', 30, 0, 2, false),
  },
  banners: {
    levelUp: loadVfxFrames('vfx/ui/level_up_banner/frame_{N}.png', 30, 0, 2, true),
  },
  combat: {
    bloodSplatter: loadVfxFrames('vfx/combat/blood_splatter/frame_{N}.png', 8, 1, 2, true),
    executionBurst: loadVfxFrames('vfx/combat/execution_burst/frame_{N}.png', 11, 0, 2, true),
    perilAlert: loadVfxFrames('vfx/combat/peril_alert/frame_{N}.png', 14, 1, 2, true)
  }
};

// Immediately begin downloading priority assets with 16 concurrent workers
pumpPriorityQueue();
