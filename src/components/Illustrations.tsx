export function HorseSilhouette() {
  return (
    <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <path
        d="M 120 480 C 140 380 200 340 240 320 C 220 280 230 240 260 220 C 280 180 320 160 360 170 C 380 130 420 110 460 120 C 510 100 560 110 590 150 C 630 160 660 200 670 250 C 700 260 720 290 720 330 C 730 380 720 430 700 470 L 680 480 L 660 460 C 660 440 650 420 640 410 C 580 430 520 420 480 390 C 460 410 440 420 420 420 C 400 430 380 420 360 410 C 340 430 320 440 300 440 C 280 460 260 470 240 470 L 220 460 L 200 480 L 180 470 L 160 480 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="600" cy="190" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function HorseshoePattern() {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="horseshoes" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <g transform="translate(60 60)" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M -18 -22 C -18 -32, -10 -38, 0 -38 C 10 -38, 18 -32, 18 -22 L 18 12 L 12 12 L 12 -18 C 12 -26, 6 -30, 0 -30 C -6 -30, -12 -26, -12 -18 L -12 12 L -18 12 Z" />
            <circle cx="-14" cy="6" r="0.8" fill="currentColor" />
            <circle cx="14" cy="6" r="0.8" fill="currentColor" />
            <circle cx="-14" cy="-2" r="0.8" fill="currentColor" />
            <circle cx="14" cy="-2" r="0.8" fill="currentColor" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#horseshoes)" />
    </svg>
  );
}

export function HoofPattern() {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="hooves" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
          <g transform="translate(80 80) rotate(20)" fill="currentColor">
            <ellipse cx="0" cy="0" rx="14" ry="18" />
            <ellipse cx="0" cy="-2" rx="9" ry="13" fill="var(--color-forest)" />
          </g>
          <g transform="translate(20 30) rotate(-30)" fill="currentColor">
            <ellipse cx="0" cy="0" rx="10" ry="13" />
            <ellipse cx="0" cy="-1" rx="6" ry="9" fill="var(--color-forest)" />
          </g>
          <g transform="translate(130 120) rotate(50)" fill="currentColor">
            <ellipse cx="0" cy="0" rx="11" ry="14" />
            <ellipse cx="0" cy="-1" rx="7" ry="10" fill="var(--color-forest)" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hooves)" />
    </svg>
  );
}

type SaddleVariant = "rider" | "horse" | "stable";

export function SaddlePattern({ variant }: { variant: SaddleVariant }) {
  if (variant === "rider") return <RiderMotif />;
  if (variant === "horse") return <HorseMotif />;
  return <StableMotif />;
}

function RiderMotif() {
  return (
    <svg viewBox="0 0 400 420" className="w-4/5 h-4/5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Dome fill */}
      <path d="M 105 248 C 100 162 122 106 200 100 C 278 106 300 162 295 248 Z" fill="currentColor" fillOpacity="0.08"/>
      {/* Dome outline */}
      <path d="M 105 248 C 100 162 122 106 200 100 C 278 106 300 162 295 248" stroke="currentColor" strokeWidth="2.2"/>
      {/* Brim */}
      <path d="M 84 248 L 316 248 L 304 270 L 96 270 Z" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.12"/>
      {/* Harness retaining line */}
      <line x1="105" y1="246" x2="295" y2="246" stroke="currentColor" strokeWidth="1.5"/>
      {/* Top ventilation channels */}
      <path d="M 167 114 L 162 134" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M 182 108 L 178 129" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M 200 106 L 200 127" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M 218 108 L 222 129" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M 233 114 L 238 134" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      {/* Side vents left */}
      <path d="M 120 162 L 116 178" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
      <path d="M 134 154 L 130 170" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
      {/* Side vents right */}
      <path d="M 280 162 L 284 178" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
      <path d="M 266 154 L 270 170" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
      {/* Chinstrap */}
      <path d="M 96 270 Q 88 314 138 328 Q 168 336 200 337 Q 232 336 262 328 Q 312 314 304 270" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.5"/>
      {/* Chin cup */}
      <ellipse cx="200" cy="336" rx="30" ry="9" stroke="currentColor" strokeWidth="1.3" opacity="0.6"/>
      {/* Badge area */}
      <circle cx="200" cy="178" r="20" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
    </svg>
  );
}

function HorseMotif() {
  return (
    <svg viewBox="0 0 400 440" className="w-4/5 h-4/5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Head fill */}
      <path
        d="M 242 52 C 230 44 218 46 210 58 L 196 68 C 180 80 166 100 150 128 C 132 158 112 192 98 228 C 86 254 82 268 86 282 C 90 294 104 302 124 308 L 176 316 C 202 318 236 312 260 296 C 282 280 292 258 292 232 L 294 165 L 292 118 C 290 94 270 72 250 60 Z"
        fill="currentColor" fillOpacity="0.08"
      />
      {/* Outer profile */}
      <path
        d="M 242 52 C 252 38 266 36 274 48 C 280 58 278 72 268 78 C 282 86 296 102 298 124 L 296 168 L 294 232 C 294 260 282 282 258 298 C 234 312 202 320 174 318 L 122 310 C 100 304 86 292 82 278 C 78 262 84 246 98 222 C 114 192 134 158 152 128 C 166 100 180 80 196 68 L 210 58 C 218 46 230 44 242 52 Z"
        stroke="currentColor" strokeWidth="1.8"
      />
      {/* Near ear */}
      <path d="M 242 52 L 232 28 L 250 36 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.18"/>
      {/* Far ear */}
      <path d="M 260 60 L 258 34 L 275 46 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" opacity="0.65"/>
      {/* Forelock */}
      <path d="M 238 54 C 226 68 222 84 226 98" stroke="currentColor" strokeWidth="1.5" opacity="0.65"/>
      <path d="M 228 50 C 214 64 210 80 214 94" stroke="currentColor" strokeWidth="1" opacity="0.45"/>
      {/* Eye */}
      <ellipse cx="250" cy="120" rx="8" ry="6" stroke="currentColor" strokeWidth="1.3"/>
      <ellipse cx="250" cy="120" rx="3.5" ry="2.8" fill="currentColor"/>
      <path d="M 242 115 Q 250 112 258 115" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      {/* Nostril */}
      <path d="M 90 246 Q 95 236 106 243 Q 110 252 102 256 Q 93 257 90 246 Z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.15"/>
      {/* Lip line */}
      <path d="M 84 270 Q 100 264 114 270" stroke="currentColor" strokeWidth="1" opacity="0.55"/>
      {/* Browband */}
      <path d="M 220 56 Q 252 66 270 78" stroke="currentColor" strokeWidth="1.6" opacity="0.7" strokeLinecap="round"/>
      {/* Headpiece over poll */}
      <path d="M 240 46 Q 258 40 270 50" stroke="currentColor" strokeWidth="1.8" opacity="0.65"/>
      {/* Cheekpiece */}
      <path d="M 262 80 L 248 172 L 236 248" stroke="currentColor" strokeWidth="1.4" opacity="0.6" strokeLinecap="round"/>
      {/* Noseband */}
      <path d="M 118 194 Q 158 176 204 176 Q 244 176 270 192" stroke="currentColor" strokeWidth="1.6" opacity="0.7"/>
      <path d="M 114 204 Q 156 186 204 186 Q 248 186 272 202" stroke="currentColor" strokeWidth="0.9" opacity="0.35"/>
      {/* Bit ring */}
      <circle cx="112" cy="254" r="11" stroke="currentColor" strokeWidth="1.3" opacity="0.6"/>
      {/* Neck */}
      <path d="M 174 316 C 180 356 192 392 206 418" stroke="currentColor" strokeWidth="1.5" opacity="0.35" strokeLinecap="round"/>
      <path d="M 258 298 C 268 338 278 374 290 408" stroke="currentColor" strokeWidth="1.5" opacity="0.28" strokeLinecap="round"/>
    </svg>
  );
}

function StableMotif() {
  return (
    <svg viewBox="0 0 400 380" className="w-4/5 h-4/5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Roof fill */}
      <path d="M 25 152 L 200 48 L 375 152 L 375 318 L 25 318 Z" fill="currentColor" fillOpacity="0.06"/>
      {/* Roof gable */}
      <path d="M 18 152 L 200 44 L 382 152" stroke="currentColor" strokeWidth="2.2"/>
      {/* Eaves */}
      <line x1="25" y1="152" x2="375" y2="152" stroke="currentColor" strokeWidth="1.5"/>
      {/* Ground */}
      <line x1="20" y1="318" x2="380" y2="318" stroke="currentColor" strokeWidth="1.5"/>
      {/* Front wall */}
      <rect x="25" y="152" width="350" height="166" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Bay dividers */}
      <line x1="141" y1="152" x2="141" y2="318" stroke="currentColor" strokeWidth="1.2" opacity="0.55"/>
      <line x1="259" y1="152" x2="259" y2="318" stroke="currentColor" strokeWidth="1.2" opacity="0.55"/>
      {/* LEFT BAY — top open, horse peeking */}
      <rect x="44" y="182" width="80" height="52" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6"/>
      <rect x="44" y="234" width="80" height="70" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
      {/* Horse head in left bay */}
      <path d="M 62 208 C 59 195 67 183 80 180 C 93 183 101 195 98 208" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.14"/>
      <line x1="62" y1="208" x2="98" y2="208" stroke="currentColor" strokeWidth="1.2"/>
      <ellipse cx="72" cy="203" rx="3.5" ry="2.5" fill="currentColor" opacity="0.45"/>
      <ellipse cx="90" cy="203" rx="3.5" ry="2.5" fill="currentColor" opacity="0.45"/>
      <circle cx="77" cy="193" r="2" fill="currentColor" opacity="0.4"/>
      {/* MIDDLE BAY — closed Dutch door */}
      <rect x="160" y="182" width="80" height="136" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08"/>
      <line x1="160" y1="238" x2="240" y2="238" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="200" y1="182" x2="200" y2="318" stroke="currentColor" strokeWidth="0.8" opacity="0.35"/>
      <rect x="195" y="218" width="16" height="7" rx="3.5" stroke="currentColor" strokeWidth="1" opacity="0.55"/>
      {/* RIGHT BAY — top open */}
      <rect x="277" y="182" width="80" height="52" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6"/>
      <rect x="277" y="234" width="80" height="70" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
      <rect x="300" y="256" width="16" height="7" rx="3.5" stroke="currentColor" strokeWidth="1" opacity="0.55"/>
      {/* Ridge line */}
      <line x1="200" y1="44" x2="200" y2="152" stroke="currentColor" strokeWidth="0.8" strokeDasharray="5 4" opacity="0.28"/>
      {/* Roof tile lines */}
      <path d="M 68 118 L 200 60" stroke="currentColor" strokeWidth="0.7" opacity="0.22"/>
      <path d="M 48 136 L 200 70" stroke="currentColor" strokeWidth="0.7" opacity="0.18"/>
      <path d="M 200 60 L 332 118" stroke="currentColor" strokeWidth="0.7" opacity="0.22"/>
      <path d="M 200 70 L 352 136" stroke="currentColor" strokeWidth="0.7" opacity="0.18"/>
      {/* Ground cobbles */}
      <path d="M 20 330 Q 55 326 90 330 Q 125 334 160 330 Q 195 326 230 330 Q 265 334 300 330 Q 335 326 380 330" stroke="currentColor" strokeWidth="0.8" opacity="0.28"/>
    </svg>
  );
}
