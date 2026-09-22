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
    title: "MURAMASA.EXE",
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
    openGuideBtn: "CODEX",
    guideModalTitle: "📖 COMBAT CODEX",
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
        tempoFlowReady: "TEMPO FLOW!",
        tempoFlowEnd: "Tempo Flow ended",
        iaijutsuText: "IAIJUTSU!",
    levelUpText: "LEVEL UP!",
    swordEnhancedText: "SWORD ENHANCED!",
    clashVictoryText: "CLASH VICTORY! ⚔️",
    clashDrawText: "CLASH DRAW",
    clashPromptText: "TAP SLASH!",
    aerialLaunchedText: "LAUNCHED! 🌪️",
    aerialCleaveText: "HELM SPLITTER! ⚡",
    aerialPromptText: "AERIAL CLEAVE!",
    puGiantName: "Giant Katana", puGiantDesc: "• Slash Size +12.5% (Max 2.2x)",
    puWindName: "Wind Stance", puWindDesc: "• Attack Cooldown -8% (Max -40%)",
    puFeatherName: "Feather Step", puFeatherDesc: "• Dash Cooldown -10% (Max -40%)",
    puSwiftName: "Swiftness", puSwiftDesc: "• Movement Speed +10% (Max +50%)",
    puBloodName: "Bloodlust", puBloodDesc: "• Flow Generation +30%",
    puDeadeyeName: "Deadeye Focus", puDeadeyeDesc: "• Critical Chance +10% (Cap +40%)",
    puLethalName: "Lethal Strike", puLethalDesc: "• Enhance Bonus DMG +1",
    puColossalName: "Colossal Blade", puColossalDesc: "• Enhance Slash Size +50%",
    puDurationName: "Divine Scroll", puDurationDesc: "• Enhance Duration +1.5s",
    puShieldDurationName: "Aegis Mastery", puShieldDurationDesc: "• Wind Aegis Duration +1.5s",
    puShieldPulseName: "Hurricane Pulse", puShieldPulseDesc: "• Wind Aegis Pulses 3 DMG Every 1s",
    puShieldBlastName: "Gale Thorns", puShieldBlastDesc: "• Melee Attackers Take 8 DMG + Knockback",
    puDashDamageName: "Storm Bolt", puDashDamageDesc: "• Raijin Step Deals +1 DMG • 2.0s Stun",
    puDashRangeName: "Static Velocity", puDashRangeDesc: "• Raijin Step Range +30% • Speed +20%",
    puDashThunderName: "Lightning Chain", puDashThunderDesc: "• Raijin Step Chains Lightning to 3 Foes (2 DMG/Lv)",
    puFirewheelRangeName: "Searing Ring", puFirewheelRangeDesc: "• Inferno Sweep Radius +25%",
    puFirewheelBlazeName: "Searing Ash", puFirewheelBlazeDesc: "• Inferno Sweep Burn DMG +1",
    puFirewheelEchoName: "Firestorm Echo", puFirewheelEchoDesc: "• Sweep Hits Trigger 1 DMG Spark Explosion",
    puCataclysmSuperconductorName: "Chain Superconductor", puCataclysmSuperconductorDesc: "• Cataclysm Chains to +3 Extra Foes • +50% Chain DMG • 0.4s Stun",
    puCataclysmThunderclapName: "Wrath of Raijin", puCataclysmThunderclapDesc: "• Impact Radius +50% • +40 Posture Shred • Electrifies Ground for 5s",
    puCataclysmConduitName: "Divine Conduit", puCataclysmConduitDesc: "• Slashes Restore +8 Flow • Generates Lightning Strikes",
    puRuptureSeveranceName: "Dimensional Severance", puRuptureSeveranceDesc: "• Dash Width +60% • Leaves 4s Void Rift That Pulls & Slashes Foes",
    puRupturePhantomLegionName: "Phantom Legion", puRupturePhantomLegionDesc: "• Launches 5 Piercing Phantom Blades (Up from 3)",
    puRupturePhaseStrikeName: "Spatial Warp Strike", puRupturePhaseStrikeDesc: "• Dash Grants +0.4s i-Frames • Ends in Radial Cross-Slash (45 + 200% ATK)",
    puChargeSpeedName: "Lightning Draw", puChargeSpeedDesc: "• Charge Speed +40% • Wave DMG +25 • Wave Width +35%",
    puDeflectDmgName: "Kinetic Rebound", puDeflectDmgDesc: "• Deflected Bullets Speed +150% • Deals 30 + 200% ATK • +8 Flow",
    puVampireName: "Soul Tithe", puVampireDesc: "• Every 15 Kills or Execution Restores 1 Heart • Blood Shockwave",
    puDimensionalName: "Dimensional Wave", puDimensionalDesc: "• Iaijutsu Range +45% • Aftershock Dimensional Cut (50 + 200% ATK)",
    puFireName: "Fire Stance", puFireDesc: "• Slashes Burn Foes (1 DMG/s for 3s)",
    puClonesName: "Shadow Clones", puClonesDesc: "• Translucent Shadow Clones Mimic Attacks",
    puStoutHeartName: "Stout Heart", puStoutHeartDesc: "• Max Hearts +1 Slot (Max 7)",
    puPetalArmorName: "Petal Armor", puPetalArmorDesc: "• Blocks 1 Hit • Recharges Every 15s",
    puEchoSlashName: "Echo Slash", puEchoSlashDesc: "• Slashes Emit Secondary Wave (0.5 DMG)",
    puTempoMasteryName: "Tempo Mastery", puTempoMasteryDesc: "• Parries/Dodges Grant Tempo Stacks (Max 5) • At 5: +40% ATK Speed & Ignores Armor (8s)",
    puFrostName: "Frost Stance", puFrostDesc: "• Slashes Chill Foes (-40% Speed for 3s) • Parrying Chilled Foe Shatters for 8 AoE DMG",
    puVoidName: "Void Stance", puVoidDesc: "• Iaijutsu Waves Leave Spatial Trail That Pulls In Foes",
    puFlowingCounterName: "Flowing Counter", puFlowingCounterDesc: "• Parry or Dodge Instantly Resets Dash Cooldown",
    puGaleVortexName: "Gale Vortex", puGaleVortexDesc: "• Aegis Duration -1s • Shield Spins 3x Faster & Reflects All Bullets at Shooters",
    puBladeEchoesName: "Blade Echoes", puBladeEchoesDesc: "• Flow Awakening Spawns 2 Clones Mimicking Attacks (40% DMG, 2x Size)",
    puJudgementCutName: "Judgement Cut", puJudgementCutDesc: "• Full-Charge Iaijutsu Spawns Spatial Dome of 6 Rapid Slices (0.5 DMG Each)",
    puSakuraBlizzardName: "Sakura Blizzard", puSakuraBlizzardDesc: "• Dashing Drops Explosive Sakura Petals (1 DMG)",
    puUnstableOverloadName: "Unstable Overload", puUnstableOverloadDesc: "• Dashing Through Chilled or Burned Foes Triggers 5 DMG Elemental Blast",
    puMagneticDrawName: "Magnetic Draw", puMagneticDrawDesc: "• Magnets EXP Gems and Hearts from Wide Radius",
    puReapersMarkName: "Reaper's Mark", puReapersMarkDesc: "• Slashes Deal +2 DMG • Bleed 1 Heart Every 25s (10 Kills Resets Timer)",
    puAttackPotionName: "Slash Elixir", puAttackPotionDesc: "• +5% ATK Bonus for Current Stage",
    puExecutionDesc: "• Manga Executions on Posture-Broken Foes • Lethal Damage & Bonus Mon",
    skillDecoyName: "Void Rupture: Phantom Slicer", skillDecoyDesc: "• 320px Strike (110 + 950% ATK) • 75 Posture Shred • 6s Void Phase • Homing Blades (135% ATK) • 12s CD",
    btnDecoy: "RUPTURE",
    puRaijinSplitterName: "Raijin's Heaven-Splitter", puRaijinSplitterDesc: "• Perfect Parry Strikes Lightning (45 + 350% ATK) • Breaks 35 Posture • Chains to 4 Foes",
    puArterialGushName: "Arterial Gush", puArterialGushDesc: "• Crits Inflict Hemorrhage (20% Missing HP + 125% ATK Over 4s)",
    puSonicBreakName: "Sonic Breakthrough", puSonicBreakDesc: "• Dash Attack Releases Supersonic Shockwave (180% ATK + 25) • Slices Bullets • +100px Reach",
    puMiasmaCleaveName: "Miasma Cleave", puMiasmaCleaveDesc: "• Slashes Leave Toxic Fog (15 + 80% ATK/s) • Dissolves Armor (+35% DMG Taken)",
    puHanabiBladeName: "Hanabi Blade", puHanabiBladeDesc: "• Deflecting Bullets Blasts Radial Fireworks (20 + 110% ATK) • Launches Foes",
    puGrimHarvestName: "Grim Harvest: Spectral Reaping", puGrimHarvestDesc: "• Kills Harvest Souls (Max 3) • At 3: 3rd Slash Unleashes 270° Death Cleave (320% ATK)",
    puCursedGlassName: "Glass Edge", puCursedGlassDesc: "☠ CURSE: • Max Hearts -3 • Attacks +3 DMG & +50% Size • Dash +40% Speed & i-Frames",
    puCursedBloodName: "Blood Thirst", puCursedBloodDesc: "☠ CURSE: • Bleed 1 HP Every 45s • Slain Foes Grant +50% Flow & Lifesteal",
    puCursedIronName: "Iron Will", puCursedIronDesc: "☠ CURSE: • Dash Cooldown +25% • Slash Area +100% • Deflect Damage +6",
    puCursedGreedName: "Demon's Pact", puCursedGreedDesc: "☠ CURSE: • Score Doubled (2x) • Slain Foes Grant Bonus Combo",
    fuPlasmaName: "Plasma Tempest", fuPlasmaDesc: "⚡ FUSION: • Dash Leaves Electric Firewalls (6 DMG/s) • Slashing Burned Foes Chains Lightning (10 DMG)",
    fuSingularityName: "Singularity Cleave", fuSingularityDesc: "⚡ FUSION: • Slashes Fire Micro Black Holes • Devours Bullets & Pulls Mobs • 20 AoE DMG Implosion",
    fuPhantomsName: "Hundred Demon March", fuPhantomsDesc: "⚡ FUSION: • Perfect Dodge or Finisher Spawns Shadow Samurai (12s) • Mirrors All Slashes",
    fuKamaitachiName: "Kamaitachi Sickle-Wind", fuKamaitachiDesc: "⚡ FUSION: • Slashes Fire 2 Wind Discs • Ricochets 3x Off Arena Borders • 8 DMG Piercing",
    fuAsuraName: "Asura's Blade Storm", fuAsuraDesc: "⚡ FUSION: • Parry Triggers 360° 6-Blade Storm (12 DMG Each) • Heals 1 Heart on 3+ Hits",
    ultShadowName: "Shadow Awakening", ultShadowDesc: "• 6s God-Speed • +4 Slash DMG • Teleport Shadow Clones • 0s Dash CD",
    ultOmniName: "Omnislash", ultOmniDesc: "• Freeze Time • Cross-Slash All Targets (30 Base + 30-40% Max HP) • Final Wave (65 Base + 30% Boss HP)",
    ultStormName: "Wrath of the Storm God", ultStormDesc: "• 8s Thunder Fury • Slashes Fire Chain Lightning • Teleport Dash (450px) • 6 DMG + 3s Stun Strikes",
    playZen: "Zen Mode",
    zenWarningText: "PARRY ONLY!",
    zenFieldText: "ZEN FIELD",
    btnParryOnly: "PARRY ONLY",
    btnRestricted: "RESTRICTED",
    puZenRestoreName: "Zen Recovery", puZenRestoreDesc: "• Restore 1 Heart Slot",
    ultZenFieldName: "Zen Field", ultZenFieldDesc: "• 8s Damage Immunity • Wind Parry Blasts Every 0.4s (6 AoE DMG + Knockback)",
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
    skillEnhanceName: "Dragon's Fury", skillEnhanceDesc: "• +80% Blade Size • +3 Flat DMG • Piercing Waves (100% ATK) • 10s Active (12s CD)",
    skillShieldName: "Wind Aegis", skillShieldDesc: "• 4.5s Barrier • Reflects Bullets 3x Speed • 0.6s Pulses (18 + 220% ATK) • Vacuum Pull (10s CD)",
    skillDashName: "Raijin Step", skillDashDesc: "• 0.45s Invulnerability • Dash Slash (20 + 150% ATK) • 1.2s Stun • Twin Sky Strikes (0.9s CD)",
    skillFirewheelName: "Inferno Sweep", skillFirewheelDesc: "• 6s Blade Ring (Burn 2 + 24% ATK) • 4 Fire Orbs (80% ATK) • Supernova Finisher (250% ATK) • 11s CD",
    skillGravityName: "Heavenly Judgement: Raijin's Cataclysm", skillGravityDesc: "• Clears Screen Bullets • 550px Thunderbolt (140 + 1250% ATK) • 120 Posture Shred • 7s Chain Lightning (10s CD)",
    skillParryMasterName: "Parry Master", skillParryMasterDesc: "• +50% Parry Window (4s) • 2.5x Crit Riposte • Breaks 40 Posture • +15 Flow (9s CD)",
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
    fullscreen: "Fullscreen",
    cameraZoom: "Camera Zoom",
        zoom1x: "1x (Standard)",
        zoom2x: "2x (Wide)",
        zoom3x: "3x (Drone View)",
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
    title: "MURAMASA.EXE",
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
    openGuideBtn: "秘伝書",
    guideModalTitle: "📖 秘伝戦術指南",
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
        tempoFlowReady: "テンポ流！",
        tempoFlowEnd: "テンポ流終了",
        iaijutsuText: "居合斬り！",
    levelUpText: "レベルアップ！",
    swordEnhancedText: "刀強化！",
    clashVictoryText: "鍔迫り合い勝利！ ⚔️",
    clashDrawText: "引き分け",
    clashPromptText: "攻撃連打！",
    aerialLaunchedText: "打ち上げ！ 🌪️",
    aerialCleaveText: "兜割り！ ⚡",
    aerialPromptText: "空中斬り！",
    puGiantName: "巨大な刀", puGiantDesc: "• 斬撃サイズ +12.5% (最大2.2倍)",
    puWindName: "風の型", puWindDesc: "• 攻撃クールダウン -8% (上限-40%)",
    puFeatherName: "羽の歩み", puFeatherDesc: "• ダッシュCD -10% (上限-40%)",
    puSwiftName: "迅速", puSwiftDesc: "• 移動速度 +10% (最大+50%)",
    puBloodName: "血の渇き", puBloodDesc: "• 気（フロー）生成 +30%",
    puDeadeyeName: "死眼の構え", puDeadeyeDesc: "• 会心率 +10% (上限+40%)",
    puLethalName: "致命撃", puLethalDesc: "• 強化時追加ダメージ +1",
    puColossalName: "巨大剣", puColossalDesc: "• 強化時サイズ +50%",
    puDurationName: "神の巻物", puDurationDesc: "• 強化持続時間 +1.5秒",
    puShieldDurationName: "風神の領域", puShieldDurationDesc: "• 風の加護持続 +1.5秒",
    puShieldPulseName: "烈風の波動", puShieldPulseDesc: "• 風の加護 1秒毎に3 DMG波動",
    puShieldBlastName: "暴風の棘", puShieldBlastDesc: "• 近接被弾時 8 DMG反射 + 吹き飛ばし",
    puDashDamageName: "迅雷の猛撃", puDashDamageDesc: "• 雷神瞬歩 +1 DMG • 2.0秒スタン",
    puDashRangeName: "静電気の加速", puDashRangeDesc: "• 雷神瞬歩 間合い+30% • 速度+20%",
    puDashThunderName: "連鎖雷撃", puDashThunderDesc: "• 雷神瞬歩 3体に連鎖雷撃 (2 DMG/Lv)",
    puFirewheelRangeName: "灼熱の輪", puFirewheelRangeDesc: "• 業火回天 攻撃範囲+25%",
    puFirewheelBlazeName: "猛烈な残り火", puFirewheelBlazeDesc: "• 業火回天 炎上DMG+1",
    puFirewheelEchoName: "火炎の残響", puFirewheelEchoDesc: "• 命中時 1 DMG火花爆発",
    puCataclysmSuperconductorName: "超伝導連鎖", puCataclysmSuperconductorDesc: "• 連鎖対象+3体 • 連鎖DMG+50% • 0.4秒スタン",
    puCataclysmThunderclapName: "雷神の怒号", puCataclysmThunderclapDesc: "• 着弾範囲+50% • 体幹削り+40 • 5秒間大地帯電",
    puCataclysmConduitName: "神罰の導線", puCataclysmConduitDesc: "• 通常斬撃で気力+8回復 • 追加落雷発生",
    puRuptureSeveranceName: "次元断層", puRuptureSeveranceDesc: "• 突進幅+60% • 4秒間敵を引き寄せ刻む虚空裂け目",
    puRupturePhantomLegionName: "百鬼幻刃", puRupturePhantomLegionDesc: "• 貫通幻影刃が3本から5本に増加",
    puRupturePhaseStrikeName: "位相瞬斬", puRupturePhaseStrikeDesc: "• ダッシュ無敵+0.4秒 • 終点全方位十字斬(45+200% ATK)",
    puChargeSpeedName: "迅雷の構え", puChargeSpeedDesc: "• チャージ速度+40% • 衝撃波DMG+25 • 衝撃波幅+35%",
    puDeflectDmgName: "運動エネルギー反発", puDeflectDmgDesc: "• 跳ね返し弾速+150% • 威力30+200% ATK • 気力+8回復",
    puVampireName: "魂の貢ぎ物", puVampireDesc: "• 15体撃破毎/処刑時 ハート1回復 • 吸血衝撃波",
    puDimensionalName: "次元波動", puDimensionalDesc: "• 居合射程+45% • 空間余波爆発(50+200% ATK)",
    puFireName: "火 of 型", puFireDesc: "• 斬撃で敵炎上 (毎秒1 DMG、3秒間)",
    puClonesName: "影分身 of 術", puClonesDesc: "• 影分身が攻撃を完全模倣",
    puStoutHeartName: "不屈 of 心", puStoutHeartDesc: "• 最大ハート+1 (最大7)",
    puPetalArmorName: "桜花 of 鎧", puPetalArmorDesc: "• 攻撃を1回無効化 • 15秒毎再充填",
    puEchoSlashName: "残響 of 斬撃", puEchoSlashDesc: "• 斬撃から追従真空波 (0.5 DMG)",
    puTempoMasteryName: "脈動 of 覇気", puTempoMasteryDesc: "• パリィ/回避でスタック獲得(最大5) • 5時: 攻撃速度+40%&装甲無視(8秒)",
    puFrostName: "氷結の構え", puFrostDesc: "• 斬撃で敵40%減速(3秒) • 氷結敵パリィで破裂(8範囲DMG)",
    puVoidName: "虚無 of 構え", puVoidDesc: "• 居合波の軌跡が周囲の敵を吸引",
    puFlowingCounterName: "受け流し of 極意", puFlowingCounterDesc: "• パリィ/回避成功でダッシュCD即時リセット",
    puGaleVortexName: "疾風 of 渦", puGaleVortexDesc: "• 障壁時間-1秒 • 回転速度3倍&全敵弾を自動反射",
    puBladeEchoesName: "刃 of 残影", puBladeEchoesDesc: "• 覚醒中2体の分身召喚 (40% DMG、2倍サイズ)",
    puJudgementCutName: "次元斬", puJudgementCutDesc: "• 最大居合で次元球展開 (6連微細斬撃、各0.5 DMG)",
    puSakuraBlizzardName: "桜花吹雪", puSakuraBlizzardDesc: "• ダッシュ軌道に桜花地雷 (1 DMG)",
    puUnstableOverloadName: "不確実な過負荷", puUnstableOverloadDesc: "• 状態異常の敵をすり抜けると5 DMG属性爆破",
    puMagneticDrawName: "磁気引き寄せ", puMagneticDrawDesc: "• 広範囲のEXPジェムとハートを自動吸引",
    puReapersMarkName: "死神の刻印", puReapersMarkDesc: "• 斬撃+2 DMG • 25秒毎1ハート減少 (10体撃破で解除)",
    puAttackPotionName: "斬撃の秘薬", puAttackPotionDesc: "• 現在ステージ中 斬撃+5% ATK",
    puExecutionName: "処刑の極意", puExecutionDesc: "• 体勢崩壊敵に漫画風処刑解放 • 致命ダメージ&ボーナス文",
    selectSkillTitle: "アクティブスキルの選択",
    skillEnhanceName: "竜気解放（ドラゴンス・フューリー）", skillEnhanceDesc: "• 刀身+80% • 固定+3 DMG • 貫通三日月波(100% ATK) • 10秒持続 (CD 12秒)",
    skillDashName: "雷神ステップ（ライジン・ステップ）", skillDashDesc: "• 完全無敵0.45秒 • 突進斬(20+150% ATK) • 1.2秒スタン • 天雷追撃 (CD 0.9秒)",
    skillShieldName: "風神の加護（ウィンド・アイギス）", skillShieldDesc: "• 4.5秒暴風障壁 • 敵弾3倍速反射 • 0.6秒毎パルス(18+220% ATK) • 吸引効果 (CD 10秒)",
    skillParryMasterName: "弾きの極意（パリー・マスター）", skillParryMasterDesc: "• パリィ猶予+50%(4秒) • 反撃2.5倍会心 • 体幹削り40 • 気力+15 (CD 9秒)",
    skillFirewheelName: "業火回天（インフェルノ・スウィープ）", skillFirewheelDesc: "• 6秒回転刃(炎上2+24% ATK) • 火球4発(80% ATK) • 終幕爆発(250% ATK) • CD 11秒",
    skillDecoyName: "虚空断絶・幻影裂斬（ヴォイド・ラプチャー）", skillDecoyDesc: "• 超次元瞬歩(110+950% ATK) • 体幹削り75 • 6秒虚空化 • 追尾幻影刃(135% ATK) • CD 12秒",
    skillGravityName: "神罰天雷・雷神壊滅（ライジン・カタクリズム）", skillGravityDesc: "• 全画面敵弾消滅 • 神雷(140+1250% ATK) • 体幹削り120 • 7秒連鎖雷撃 (CD 10秒)",
    btnShield: "風神",
    btnFlash: "雷神",
    btnFirewheel: "業火",
    btnGravity: "天雷",
    btnParryMaster: "弾き",
    btnDecoy: "虚空",
    puRaijinSplitterName: "雷神の天裂き", puRaijinSplitterDesc: "• 完全パリィ時紫雷(45+350% ATK) • 体幹削り35 • 4体連鎖",
    puArterialGushName: "動脈崩壊（アーテリアル・ガッシュ）", puArterialGushDesc: "• 会心時重度出血 (減少HP20%+125% ATK/4秒)",
    puSonicBreakName: "音速突破（ソニック・ブレイク）", puSonicBreakDesc: "• ダッシュ後斬撃で衝撃波(180% ATK+25) • 敵弾消滅 • 間合い+100px",
    puMiasmaCleaveName: "瘴気斬裂（ミアズマ・クリーブ）", puMiasmaCleaveDesc: "• 剣閃軌道に毒霧(15+80% ATK/秒) • 装甲融解(被ダメ+35%)",
    puHanabiBladeName: "花火の刃（ハナビ・ブレード）", puHanabiBladeDesc: "• 弾反射時花火炸裂(20+110% ATK) • 敵打ち上げ",
    puGrimHarvestName: "魂刈りの死霊（グリム・ハーベスト）", puGrimHarvestDesc: "• 撃破で死霊獲得(最大3) • 3体時3連斬で黄泉大斬(320% ATK)",
    puCursedGlassName: "玻璃の刃", puCursedGlassDesc: "☠ 呪い: • 最大ハート-3 • 攻撃+3 DMG&範囲+50% • ダッシュ速度+40%&無敵延長",
    puCursedBloodName: "血の渇き", puCursedBloodDesc: "☠ 呪い: • 45秒毎1 HP減少 • 撃破時気力+50% & 吸血",
    puCursedIronName: "重鉄の呪縛", puCursedIronDesc: "☠ 呪い: • ダッシュCD+25% • 斬撃範囲+100% • 跳ね返しDMG+6",
    puCursedGreedName: "鬼神の契り", puCursedGreedDesc: "☠ 呪い: • スコア2倍 • 撃破時ボーナスコンボ",
    fuPlasmaName: "天雷業火（プラズマ・テンペスト）", fuPlasmaDesc: "⚡ 神聖合一： • ダッシュ電磁炎壁(6 DMG/秒) • 炎上敵を斬ると連鎖雷撃(10 DMG)",
    fuSingularityName: "虚無の太刀（シンギュラリティ・クリーブ）", fuSingularityDesc: "⚡ 神聖合一： • 斬撃からブラックホール射出 • 敵弾消滅&敵吸引 • 特異点爆発(20 DMG)",
    fuPhantomsName: "百鬼夜行（ハンドレッド・ファントム）", fuPhantomsDesc: "⚡ 神聖合一： • 見切り回避/フィニッシャーで影武者召喚(12秒) • 全斬撃模倣",
    fuKamaitachiName: "鎌鼬の風（カマイタチ・シックル）", fuKamaitachiDesc: "⚡ 神聖合一： • 斬撃から真空鎌2枚射出 • 壁3回反射 • 敵群貫通(8 DMG)",
    fuAsuraName: "修羅の六腕（アスラ・ストーム）", fuAsuraDesc: "⚡ 神聖合一： • パリィ時360度6連幻影斬(各12 DMG) • 3体以上命中でハート1回復",
    ultShadowName: "影 of 覚醒", ultShadowDesc: "• 6秒神速 • 斬撃+4 DMG • 自動追撃影分身 • ダッシュCD 0秒",
    ultOmniName: "超究武神覇斬", ultOmniDesc: "• 時間停止 • 全敵神速斬(30+最大HP30-40%) • 終幕衝撃波(65+ボスHP30%削り)",
    ultStormName: "雷神の稲妻", ultStormDesc: "• 8秒雷撃状態 • 斬撃から連鎖雷撃 • 瞬間移動ダッシュ(450px) • 落雷(6 DMG + 3秒スタン)",
    playZen: "禅・受け流し",
    zenWarningText: "受け流しのみ！",
    zenFieldText: "明鏡止水",
    btnParryOnly: "受け流しのみ",
    btnRestricted: "制限中",
    puZenRestoreName: "精神統一", puZenRestoreDesc: "• ハートを1回復",
    ultZenFieldName: "明鏡止水", ultZenFieldDesc: "• 8秒完全無敵 • 0.4秒毎に衝撃波(6範囲DMG + 押し出し)",
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
    fullscreen: "全画面表示",
    cameraZoom: "カメラズーム",
        zoom1x: "1x (標準)",
        zoom2x: "2x (ワイド)",
        zoom3x: "3x (ドローン視点)",
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
  const isSufficient = loaded >= Math.floor(requiredAssets.length * 0.99);
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

const MAX_CONCURRENT_PRIORITY = 36;
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

interface PackedAssetEntry {
  byteOffset: number;
  byteLen: number;
  mime: string;
}

let packedArrayBuffer: ArrayBuffer | null = null;
const packedIndex = new Map<string, PackedAssetEntry>();
export const packedAssetMap = new Map<string, string>();
let bundleInitPromise: Promise<boolean> | null = null;

function normalizeAssetKey(p: string): string {
  return p.split('?')[0].replace(/^\.?\//, '').replace(/\\/g, '/');
}

export function lookupPackedAsset(src: string): string | undefined {
  const norm = normalizeAssetKey(src);
  const normLower = norm.toLowerCase();
  let blobUrl = packedAssetMap.get(norm)
    || packedAssetMap.get(normLower)
    || packedAssetMap.get(decodeURI(norm))
    || packedAssetMap.get(encodeURI(norm))
    || packedAssetMap.get(decodeURIComponent(norm))
    || packedAssetMap.get(encodeURIComponent(norm));
  if (blobUrl) return blobUrl;

  if (!packedArrayBuffer) return undefined;

  const entry = packedIndex.get(norm)
    || packedIndex.get(normLower)
    || packedIndex.get(decodeURI(norm))
    || packedIndex.get(encodeURI(norm))
    || packedIndex.get(decodeURIComponent(norm))
    || packedIndex.get(encodeURIComponent(norm));

  if (entry) {
    const blob = new Blob([new Uint8Array(packedArrayBuffer, entry.byteOffset, entry.byteLen)], { type: entry.mime });
    blobUrl = URL.createObjectURL(blob);
    packedAssetMap.set(norm, blobUrl);
    packedAssetMap.set(normLower, blobUrl);
    packedAssetMap.set(encodeURI(norm), blobUrl);
    packedAssetMap.set(decodeURI(norm), blobUrl);
    return blobUrl;
  }
  return undefined;
}

export function resolveAssetUrl(src: string): string {
  return lookupPackedAsset(src) || src;
}

export function ensurePackedAssets(): Promise<boolean> {
  if (bundleInitPromise) return bundleInitPromise;
  bundleInitPromise = (async () => {
    try {
      let res = await fetch('./assets.bin').catch(() => null);
      if (!res || !res.ok) {
        res = await fetch('assets.bin').catch(() => null);
      }
      if (!res || !res.ok) return false;
      const ab = await res.arrayBuffer();
      const view = new DataView(ab);
      const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
      if (magic !== 'STIK') return false;
      packedArrayBuffer = ab;
      const fileCount = view.getUint32(4, true);
      const indexLen = view.getUint32(8, true);
      const dataStart = 12 + indexLen;
      const decoder = new TextDecoder();
      let offset = 12;
      for (let i = 0; i < fileCount; i++) {
        const pathLen = view.getUint16(offset, true);
        offset += 2;
        const pathBytes = new Uint8Array(ab, offset, pathLen);
        offset += pathLen;
        const pathStr = decoder.decode(pathBytes);
        const dataOffset = view.getUint32(offset, true);
        offset += 4;
        const dataLen = view.getUint32(offset, true);
        offset += 4;
        const mime = pathStr.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
        const entry: PackedAssetEntry = {
          byteOffset: dataStart + dataOffset,
          byteLen: dataLen,
          mime
        };
        const norm = normalizeAssetKey(pathStr);
        packedIndex.set(norm, entry);
        packedIndex.set(norm.toLowerCase(), entry);
        packedIndex.set(encodeURI(norm), entry);
        packedIndex.set(decodeURI(norm), entry);
      }
      return true;
    } catch {
      return false;
    }
  })();
  return bundleInitPromise;
}

// Immediately trigger bundled assets load
ensurePackedAssets();

function queueAsset(img: HTMLImageElement, src: string, folder?: string, _isPriority = true) {
  globals.totalAssetsToLoad++;
  const item: QueuedAsset = { img, src, folder, isPriority: true };
  requiredAssets.push(item);
  priorityQueue.push(item);
}

// Preload stickmurai sprites for loading screen animation
export const loaderStickmanSprites: HTMLImageElement[] = [];
for (let i = 1; i <= 8; i++) {
  const img = new Image();
  const src = encodeURI(`sprites/Stick Figure Character Sprites 2D/Sword sprites/sword_Idle_000${i}.png`);
  queueAsset(img, src, 'loader_stickman', true);
  loaderStickmanSprites.push(img);
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
    const loader = typeof document !== 'undefined' ? document.getElementById('loader-screen') : null;
    const isLoaderActive = loader && loader.style.display !== 'none' && !loader.classList.contains('hidden');
    if (isLoaderActive) {
      window.dispatchEvent(new Event('qol-assets'));
    }
  };

  item.img.onload = () => {
    failedAssets.delete(item.img);
    retryCounts.delete(item.img);
    if (typeof item.img.decode === 'function') {
      item.img.decode().then(onDone).catch(onDone);
    } else {
      onDone();
    }
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
    // Safe transparent 1x1 fallback to prevent canvas InvalidStateError or broken layout
    item.img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    onDone();
  };

  const applySrc = () => {
    const mappedSrc = resolveAssetUrl(item.src);
    item.img.src = mappedSrc;
    if (item.img.complete && item.img.naturalWidth > 0) {
      if (typeof item.img.decode === 'function') {
        item.img.decode().then(onDone).catch(onDone);
      } else {
        Promise.resolve().then(onDone);
      }
    }
  };

  if (bundleInitPromise) {
    bundleInitPromise.then(applySrc);
  } else {
    applySrc();
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
  // Never burn CPU/GPU texture bandwidth while player is fighting or clearing waves
  if (globals.gameState === 'playing' || globals.gameState === 'wave_clear') {
    return;
  }
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
  detonator: 'EnemyDetonator',
  boss_agis: 'BossAgis',
  boss_skeleton: 'BossSkeleton',
  heronightborne: 'HeroNightborne',
  herosamurai: 'HeroSamurai',
  herosatyr: 'HeroSatyr',
  heroakakage: 'HeroAkakage',
  akakage: 'HeroAkakage',
  heroaetherion: 'HeroAetherion',
  aetherion: 'HeroAetherion',
  toaster_bot: 'EnemyToasterBot',
  wraith01: 'Wraith01',
  wraith02: 'Wraith02',
  wraith03: 'Wraith03'
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
  const bossAssetKeys = ['oni_boss', 'boss_agis', 'boss_skeleton', 'shogun_boss'] as const;
  const currentBossKey = bossAssetKeys[(stage - 1) % bossAssetKeys.length];
  loadEnemyAssetsNow(currentBossKey);
  loadEnemyAssetsNow('enemy01');
  loadEnemyAssetsNow('enemy02');
  loadEnemyAssetsNow('skeleton');
  loadEnemyAssetsNow('enemy_orc');
  loadEnemyAssetsNow('enemy_barrel');
  loadEnemyAssetsNow('detonator');
  loadEnemyAssetsNow('enemy05');
  loadEnemyAssetsNow('wraith01');
  loadEnemyAssetsNow('wraith02');
  loadEnemyAssetsNow('wraith03');
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

function loadSingleCustomFrame(path: string, tag: string, isPriority = false) {
  const img = new Image();
  const src = encodeURI(path);
  queueAsset(img, src, tag, isPriority);
  return [img];
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
    idle: loadSingleCustomFrame('sprites/Enemy05/hit01.png', 'Enemy05', false),
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
  detonator: {
    idle: loadCustomEnemyAnim('EnemyDetonator', 'idle', 4, true),
    walk: loadCustomEnemyAnim('EnemyDetonator', 'walk', 6, true),
    attack: loadCustomEnemyAnim('EnemyDetonator', 'attack', 6, true),
    dash: loadCustomEnemyAnim('EnemyDetonator', 'dash', 6, true),
    dead: loadCustomEnemyAnim('EnemyDetonator', 'dead', 6, true),
    hit: loadCustomEnemyAnim('EnemyDetonator', 'hit', 2, true),
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
  heroaetherion: {
    idle: loadCustomEnemyAnim('HeroAetherion', 'idle', 16, true),
    walk: loadCustomEnemyAnim('HeroAetherion', 'walk', 10, true),
    attack: loadCustomEnemyAnim('HeroAetherion', 'attack', 12, true),
    hit: loadCustomEnemyAnim('HeroAetherion', 'hit', 6, true),
    dash: loadCustomEnemyAnim('HeroAetherion', 'dash', 6, true),
    dead: loadCustomEnemyAnim('HeroAetherion', 'dead', 6, true),
    shoot: loadCustomEnemyAnim('HeroAetherion', 'shoot', 12, true),
  },
  toaster_bot: {
    idle: loadCustomEnemyAnim('EnemyToasterBot', 'idle', 5, false),
    walk: loadCustomEnemyAnim('EnemyToasterBot', 'walk', 8, false),
    attack: loadCustomEnemyAnim('EnemyToasterBot', 'attack', 11, false),
    hit: loadCustomEnemyAnim('EnemyToasterBot', 'hit', 2, false),
    dash: loadCustomEnemyAnim('EnemyToasterBot', 'walk', 8, false),
    dead: loadCustomEnemyAnim('EnemyToasterBot', 'dead', 5, false),
  },
  wraith01: {
    idle: loadCustomEnemyAnim('Wraith01', 'idle', 12, false),
    walk: loadCustomEnemyAnim('Wraith01', 'walk', 12, false),
    attack: loadCustomEnemyAnim('Wraith01', 'attack', 18, false),
    dash: loadCustomEnemyAnim('Wraith01', 'walk', 12, false),
    dead: loadCustomEnemyAnim('Wraith01', 'dead', 15, false),
  },
  wraith02: {
    idle: loadCustomEnemyAnim('Wraith02', 'idle', 12, false),
    walk: loadCustomEnemyAnim('Wraith02', 'walk', 12, false),
    attack: loadCustomEnemyAnim('Wraith02', 'attack', 18, false),
    dash: loadCustomEnemyAnim('Wraith02', 'walk', 12, false),
    dead: loadCustomEnemyAnim('Wraith02', 'dead', 15, false),
  },
  wraith03: {
    idle: loadCustomEnemyAnim('Wraith03', 'idle', 12, false),
    walk: loadCustomEnemyAnim('Wraith03', 'walk', 12, false),
    attack: loadCustomEnemyAnim('Wraith03', 'attack', 18, false),
    dash: loadCustomEnemyAnim('Wraith03', 'walk', 12, false),
    dead: loadCustomEnemyAnim('Wraith03', 'dead', 15, false),
  }
};

export const propImages: HTMLImageElement[] = [];

export const bgLayers = [
  // Sole battlefield terrain: detailed grass, moss, and stone ruins
  { name: 'stones_grass', fallbackName: 'stones&grass', speed: 0.6 }
];

export const bgImages: Record<string, HTMLImageElement> = {};
bgLayers.forEach(layer => {
  const img = new Image();
  const baseSrc = `./fantasy_bg/${layer.name}.png`;
  img.onerror = () => {
    if ((layer as any).fallbackName && !img.src.includes(encodeURIComponent((layer as any).fallbackName))) {
      img.src = `./fantasy_bg/${encodeURIComponent((layer as any).fallbackName + '.png')}`;
    }
  };
  queueAsset(img, baseSrc, 'fantasy_bg', true);
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
  'portrait_akakage.png',
  'portrait_aetherion.png'
].forEach(p => {
  const img = new Image();
  queueAsset(img, `sprites/portraits/${p}`, 'portraits', true);
  heroPortraits.push(img);
});

export const skillsData = [
  { id: 'enhance', nameKey: 'skillEnhanceName', descKey: 'skillEnhanceDesc', cost: 0, icon: 'icons/rpg/fc1328.png' },
  { id: 'dash', nameKey: 'skillDashName', descKey: 'skillDashDesc', cost: 5000, icon: 'icons/rpg/fc888.png' },
  { id: 'shield', nameKey: 'skillShieldName', descKey: 'skillShieldDesc', cost: 7500, icon: 'icons/rpg/fc1043.png' },
  { id: 'parry_master', nameKey: 'skillParryMasterName', descKey: 'skillParryMasterDesc', cost: 10000, icon: 'icons/rpg/fc1101.png' },
  { id: 'firewheel', nameKey: 'skillFirewheelName', descKey: 'skillFirewheelDesc', cost: 12500, icon: 'icons/rpg/fc1221.png' },
  { id: 'decoy_illusion', nameKey: 'skillDecoyName', descKey: 'skillDecoyDesc', cost: 35000, icon: 'icons/rpg/fc1120.png' },
  { id: 'gravity', nameKey: 'skillGravityName', descKey: 'skillGravityDesc', cost: 50000, icon: 'icons/rpg/fc1031.png' }
];

export const vfxAnims = {
  levelUp: loadVfxFrames('vfx/level_up/frame_{N}.png', 12, 1, 2, false),
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
    akakage: loadVfxFrames('vfx/slashes/slash_akakage/frame_{N}.png', 15, 1, 2, true),
    aetherion: loadVfxFrames('vfx/slashes/slash_aetherion/frame_{N}.png', 20, 1, 2, true),
    aetherionDouble: loadVfxFrames('vfx/slashes/slash_aetherion_double/frame_{N}.png', 18, 1, 2, true),
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
    voidBurst: loadVfxFrames('vfx/skills/void_burst/frame{N}.png', 12, 0, 4, false),
    gravitySingularity: loadVfxFrames('vfx/skills/gravity_singularity/frame_{N}.png', 32, 0, 2, false),
    phantomWarp: loadVfxFrames('vfx/skills/phantom_warp/frame_{N}.png', 13, 0, 2, false),
    decoySmoke: loadVfxFrames('vfx/skills/decoy_smoke/frame_{N}.png', 12, 1, 2, false),
    lightningBurst: loadVfxFrames('vfx/skills/lightning_burst/frame_{N}.png', 8, 1, 2, false),
    lightningBurstViolet: loadVfxFrames('vfx/lightning/burst_violet/frame_{N}.png', 9, 0, 2, false),
    lightningStrike: loadVfxFrames('vfx/skills/lightning_strike/frame_{N}.png', 7, 1, 2, false),
    raijinBurst: loadVfxFrames('vfx/skills/raijin_burst/frame{N}.png', 8, 0, 4, false)
  },
  projectiles: {
    iaijutsuWave: loadVfxFrames('vfx/projectiles/iaijutsu_wave/frame_{N}.png', 4, 0, 2, true),
    echoSlash: loadVfxFrames('vfx/projectiles/echo_slash/frame_{N}.png', 4, 0, 2, true),
    fireArrow: loadVfxFrames('vfx/projectiles/fire_arrow/frame_{N}.png', 8, 1, 0, true),
    waterArrow: loadVfxFrames('vfx/projectiles/water_arrow/frame_{N}.png', 8, 1, 0, true),
    fireBall: loadVfxFrames('vfx/projectiles/fire_ball/frame_{N}.png', 8, 1, 0, true),
    waterBall: loadVfxFrames('vfx/projectiles/water_ball/frame_{N}.png', 12, 1, 0, true),
    windBlade: loadVfxFrames('vfx/projectiles/wind_blade/frame_{N}.png', 48, 1, 2, true),
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
