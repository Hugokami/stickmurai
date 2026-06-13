export const createSvgUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

// Common colors
const STICK = "#222222";
const RED = "#ff3333";
const GLOW = "#ff3333";

export const svgAssets = {
  playerIdle: createSvgUrl(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
      <!-- Scarf -->
      <path d="M 45 45 Q 10 50 5 70 Q 20 55 40 48" fill="${RED}"/>
      <path d="M 45 45 Q 15 60 10 80 Q 25 65 42 46" fill="#b31b1b"/>
      <!-- Body & Limbs -->
      <line x1="50" y1="48" x2="50" y2="70" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="50" y1="70" x2="35" y2="95" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="50" y1="70" x2="65" y2="95" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="50" y1="55" x2="35" y2="65" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="50" y1="55" x2="65" y2="65" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <!-- Katana -->
      <line x1="30" y1="65" x2="90" y2="45" stroke="#ddd" stroke-width="3" stroke-linecap="round"/>
      <line x1="28" y1="66" x2="38" y2="62" stroke="${STICK}" stroke-width="5" stroke-linecap="round"/>
      <!-- Head -->
      <circle cx="50" cy="40" r="9" fill="${STICK}"/>
      <!-- Straw Hat -->
      <path d="M 20 35 Q 50 15 80 35" fill="none" stroke="${STICK}" stroke-width="5"/>
      <path d="M 10 35 L 90 35" stroke="${STICK}" stroke-width="4" stroke-linecap="round"/>
    </g>
  </svg>`),

  playerWalk: createSvgUrl(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
      <!-- Scarf trailing straight -->
      <path d="M 45 45 Q 5 45 -10 50 Q 15 48 40 47" fill="${RED}"/>
      <!-- Body & Limbs -->
      <line x1="55" y1="48" x2="45" y2="70" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="45" y1="70" x2="20" y2="85" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="45" y1="70" x2="70" y2="90" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="55" y1="55" x2="40" y2="65" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="55" y1="55" x2="75" y2="60" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <!-- Katana pointing forward -->
      <line x1="70" y1="60" x2="110" y2="50" stroke="#ddd" stroke-width="3" stroke-linecap="round"/>
      <line x1="68" y1="60" x2="78" y2="58" stroke="${STICK}" stroke-width="5" stroke-linecap="round"/>
      <!-- Head -->
      <circle cx="55" cy="40" r="9" fill="${STICK}"/>
      <!-- Straw Hat tilted -->
      <path d="M 25 35 Q 55 15 85 35" fill="none" stroke="${STICK}" stroke-width="5"/>
      <path d="M 15 35 L 95 35" stroke="${STICK}" stroke-width="4" stroke-linecap="round"/>
    </g>
  </svg>`),

  playerSlash: createSvgUrl(`<svg viewBox="0 0 150 100" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(20, 5)">
      <!-- Slash Arc -->
      <path d="M 100 90 Q 140 50 100 10 Q 50 -10 -10 20" fill="none" stroke="${GLOW}" stroke-width="8" stroke-linecap="round" opacity="0.8"/>
      <!-- Scarf -->
      <path d="M 45 45 Q -10 30 -20 50 Q 0 40 40 48" fill="${RED}"/>
      <!-- Body & Limbs -->
      <line x1="50" y1="48" x2="60" y2="70" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="60" y1="70" x2="30" y2="90" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="60" y1="70" x2="90" y2="85" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="50" y1="55" x2="80" y2="60" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <!-- Katana mid-slash -->
      <line x1="80" y1="60" x2="110" y2="15" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <!-- Head -->
      <circle cx="50" cy="40" r="9" fill="${STICK}"/>
      <!-- Hat -->
      <path d="M 20 35 Q 50 15 80 35" fill="none" stroke="${STICK}" stroke-width="5"/>
      <path d="M 10 35 L 90 35" stroke="${STICK}" stroke-width="4" stroke-linecap="round"/>
    </g>
  </svg>`),

  playerJump: createSvgUrl(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 0)">
      <!-- Scarf fluttering -->
      <path d="M 45 45 Q 15 30 10 50 Q 25 50 40 45" fill="${RED}"/>
      <!-- Body & Limbs curled -->
      <line x1="50" y1="48" x2="45" y2="65" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="45" y1="65" x2="30" y2="60" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="45" y1="65" x2="60" y2="60" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="50" y1="55" x2="30" y2="45" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="50" y1="55" x2="70" y2="45" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <!-- Katana pointing up -->
      <line x1="70" y1="45" x2="90" y2="10" stroke="#ddd" stroke-width="3" stroke-linecap="round"/>
      <line x1="68" y1="45" x2="75" y2="40" stroke="${STICK}" stroke-width="5" stroke-linecap="round"/>
      <!-- Head -->
      <circle cx="50" cy="40" r="9" fill="${STICK}"/>
      <!-- Hat tipped back -->
      <path d="M 20 35 Q 50 10 80 35" fill="none" stroke="${STICK}" stroke-width="5"/>
      <path d="M 10 35 L 90 35" stroke="${STICK}" stroke-width="4" stroke-linecap="round"/>
    </g>
  </svg>`),

  playerDash: createSvgUrl(`<svg viewBox="0 0 150 100" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(10, 5)">
      <!-- Speed lines -->
      <line x1="0" y1="40" x2="-30" y2="40" stroke="#fff" stroke-width="2" opacity="0.5"/>
      <line x1="10" y1="60" x2="-20" y2="60" stroke="#fff" stroke-width="2" opacity="0.5"/>
      <line x1="0" y1="80" x2="-40" y2="80" stroke="#fff" stroke-width="2" opacity="0.5"/>
      <!-- Scarf straight back -->
      <path d="M 45 55 Q 0 55 -20 60 Q 10 60 40 58" fill="${RED}"/>
      <!-- Body leaning extreme forward -->
      <line x1="55" y1="58" x2="35" y2="70" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="35" y1="70" x2="10" y2="80" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="35" y1="70" x2="50" y2="90" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="55" y1="65" x2="40" y2="70" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="55" y1="65" x2="80" y2="65" stroke="${STICK}" stroke-width="6" stroke-linecap="round"/>
      <!-- Katana forward -->
      <line x1="80" y1="65" x2="140" y2="65" stroke="#ddd" stroke-width="3" stroke-linecap="round"/>
      <!-- Head -->
      <circle cx="65" cy="50" r="9" fill="${STICK}"/>
      <!-- Hat blown back -->
      <path d="M 40 45 Q 60 25 80 45" fill="none" stroke="${STICK}" stroke-width="5"/>
      <path d="M 30 45 L 90 45" stroke="${STICK}" stroke-width="4" stroke-linecap="round"/>
    </g>
  </svg>`),

  ninjaIdle: createSvgUrl(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 10)">
      <!-- Body crouched -->
      <line x1="45" y1="40" x2="35" y2="65" stroke="#111" stroke-width="6" stroke-linecap="round"/>
      <line x1="35" y1="65" x2="20" y2="85" stroke="#111" stroke-width="6" stroke-linecap="round"/>
      <line x1="35" y1="65" x2="55" y2="85" stroke="#111" stroke-width="6" stroke-linecap="round"/>
      <line x1="45" y1="45" x2="25" y2="60" stroke="#111" stroke-width="6" stroke-linecap="round"/>
      <line x1="45" y1="45" x2="65" y2="55" stroke="#111" stroke-width="6" stroke-linecap="round"/>
      <!-- Daggers -->
      <line x1="25" y1="60" x2="10" y2="45" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
      <line x1="65" y1="55" x2="85" y2="40" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
      <!-- Head -->
      <circle cx="50" cy="35" r="8" fill="#111"/>
      <line x1="42" y1="35" x2="58" y2="35" stroke="${RED}" stroke-width="2"/> <!-- Glowing eyes band -->
    </g>
  </svg>`),

  ashigaruIdle: createSvgUrl(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 5)">
      <!-- Body tall -->
      <line x1="40" y1="40" x2="40" y2="65" stroke="#333" stroke-width="7" stroke-linecap="round"/>
      <line x1="40" y1="65" x2="30" y2="95" stroke="#333" stroke-width="6" stroke-linecap="round"/>
      <line x1="40" y1="65" x2="50" y2="95" stroke="#333" stroke-width="6" stroke-linecap="round"/>
      <line x1="40" y1="45" x2="55" y2="60" stroke="#333" stroke-width="6" stroke-linecap="round"/>
      <!-- Spear (Yari) -->
      <line x1="65" y1="95" x2="45" y2="10" stroke="#654321" stroke-width="4" stroke-linecap="round"/>
      <path d="M 45 10 L 40 0 L 48 0 Z" fill="#ccc"/>
      <!-- Head and Conical Hat -->
      <circle cx="40" cy="30" r="8" fill="#333"/>
      <path d="M 20 25 L 40 5 L 60 25 Z" fill="#222"/>
    </g>
  </svg>`),

  oniIdle: createSvgUrl(`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 0)">
      <!-- Massive Body -->
      <rect x="40" y="40" width="40" height="40" rx="10" fill="#2a1a1a"/>
      <!-- Legs -->
      <line x1="50" y1="80" x2="40" y2="110" stroke="#2a1a1a" stroke-width="12" stroke-linecap="round"/>
      <line x1="70" y1="80" x2="80" y2="110" stroke="#2a1a1a" stroke-width="12" stroke-linecap="round"/>
      <!-- Arms -->
      <line x1="40" y1="50" x2="20" y2="80" stroke="#2a1a1a" stroke-width="10" stroke-linecap="round"/>
      <line x1="80" y1="50" x2="100" y2="70" stroke="#2a1a1a" stroke-width="10" stroke-linecap="round"/>
      <!-- Kanabo (Club) -->
      <line x1="100" y1="70" x2="115" y2="20" stroke="#4a3a2a" stroke-width="8" stroke-linecap="round"/>
      <circle cx="115" cy="20" r="5" fill="#111"/>
      <!-- Head -->
      <circle cx="60" cy="30" r="14" fill="#2a1a1a"/>
      <!-- Horns -->
      <path d="M 55 20 Q 50 5 45 10" fill="none" stroke="#ddd" stroke-width="3"/>
      <path d="M 65 20 Q 70 5 75 10" fill="none" stroke="#ddd" stroke-width="3"/>
      <!-- Eyes -->
      <circle cx="55" cy="30" r="2" fill="${RED}"/>
      <circle cx="65" cy="30" r="2" fill="${RED}"/>
    </g>
  </svg>`),
  
  torii: createSvgUrl(`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <!-- Base pillars -->
    <rect x="40" y="50" width="15" height="150" fill="#a02020"/>
    <rect x="145" y="50" width="15" height="150" fill="#a02020"/>
    <!-- Top curved beam -->
    <path d="M 10 50 Q 100 35 190 50 L 190 65 Q 100 50 10 65 Z" fill="#801010"/>
    <!-- Second beam -->
    <rect x="25" y="80" width="150" height="12" fill="#a02020"/>
    <!-- Center plaque -->
    <rect x="90" y="60" width="20" height="30" fill="#333"/>
  </svg>`)
};
