import React, { useState, useEffect, useRef, useMemo } from "react";
import { Lock, KeyRound, Radio, ScanEye, Award, Radar, Puzzle, RefreshCw, CheckCircle2, XCircle, Lightbulb, ChevronRight, FileText, Fingerprint, Star } from "lucide-react";

/* ============================= FONTS ============================= */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
    .font-stamp { font-family: 'Oswald', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .ca-btn { transition: transform .08s ease, box-shadow .08s ease, background-color .12s ease; }
    .ca-btn:active { transform: translateY(2px); }
    .ca-tab { transition: transform .12s ease, background-color .12s ease, color .12s ease; }
    .ca-tab:hover { transform: translateY(-1px); }
    .ca-card { transition: box-shadow .15s ease; }
    ::selection { background: #A8272F; color: #F2ECDA; }
  `}</style>
);

/* ============================= GRAIN TEXTURE (signature detail) ============================= */
const Grain = () => (
  <svg style={{ position: "absolute", width: 0, height: 0 }}>
    <filter id="ca-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise" />
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.035 0" />
    </filter>
  </svg>
);
function Paper({ children, style, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <div style={{ position: "absolute", inset: 0, filter: "url(#ca-grain)", pointerEvents: "none", mixBlendMode: "multiply" }} />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ============================= THEME ============================= */
const T = {
  ink: "#14171D",
  inkSoft: "#1C2028",
  inkLine: "#2A2F3A",
  paper: "#E3D2A6",
  paperDark: "#C8AD79",
  paperDeep: "#9C8253",
  cream: "#F2ECDA",
  red: "#A8272F",
  redDeep: "#7A1B22",
  gold: "#C79A3C",
  goldDim: "#8A6E33",
  text: "#241C15",
  cyan: "#3FCBB4",
};
const R = 3;

/* ============================= CIPHER ENGINE ============================= */
const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function normalize(s) { return s.toUpperCase().replace(/[^A-Z]/g, ""); }

function caesarEncode(text, shift) {
  return text.toUpperCase().split("").map((ch) => (/[A-Z]/.test(ch) ? A[(A.indexOf(ch) + shift + 26) % 26] : ch)).join("");
}
function atbashEncode(text) {
  return text.toUpperCase().split("").map((ch) => (/[A-Z]/.test(ch) ? A[25 - A.indexOf(ch)] : ch)).join("");
}
function vigenereEncode(text, key) {
  const k = key.toUpperCase().replace(/[^A-Z]/g, "");
  let ki = 0;
  return text.toUpperCase().split("").map((ch) => {
    if (/[A-Z]/.test(ch)) {
      const shift = A.indexOf(k[ki % k.length]);
      ki++;
      return A[(A.indexOf(ch) + shift) % 26];
    }
    return ch;
  }).join("");
}
function railFenceEncode(text, rails) {
  const t = text.replace(/ /g, "").toUpperCase();
  const fence = Array.from({ length: rails }, () => []);
  let row = 0, dir = 1;
  for (const ch of t) {
    fence[row].push(ch);
    if (row === 0) dir = 1; else if (row === rails - 1) dir = -1;
    row += dir;
  }
  return fence.map((r) => r.join("")).join(" / ");
}
function substitutionKeyFor(seed) {
  const arr = A.split("");
  let m = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    m = (m * 9301 + 49297) % 233280;
    const j = Math.floor((m / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}
function substitutionEncode(text, key) {
  return text.toUpperCase().split("").map((ch) => (/[A-Z]/.test(ch) ? key[A.indexOf(ch)] : ch)).join("");
}
function a1z26Encode(text) {
  return text.toUpperCase().split(" ").map((word) =>
    word.split("").map((ch) => (/[A-Z]/.test(ch) ? A.indexOf(ch) + 1 : ch)).join("-")
  ).join(" / ");
}
const MORSE = { A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--.." };
function morseEncode(text) {
  return text.toUpperCase().split(" ").map((word) => word.split("").map((ch) => MORSE[ch] || "").join(" ")).join(" / ");
}

/* ============================= CONTENT BANKS ============================= */
const PHRASES = [
  "MEET AT MIDNIGHT", "THE EAGLE HAS LANDED", "TRUST NO ONE", "CODE RED ALERT",
  "FOLLOW THE CLUES", "AGENT ON DUTY", "THE SECRET IS SAFE", "WATCH YOUR BACK",
  "MISSION COMPLETE", "STAY ALERT AGENT", "THE VAULT IS OPEN", "SEND BACKUP NOW",
  "DESTROY THIS MESSAGE", "THE FALCON FLIES SOUTH", "DOUBLE AGENT FOUND",
  "CHECK THE LEFT POCKET", "SILENCE IS GOLDEN", "THE CLOCK IS TICKING",
  "NEW ORDERS AWAIT", "KEEP THIS BETWEEN US", "KNOWLEDGE IS POWER",
  "THE PLAN IS SET", "RETURN TO BASE", "TRUST THE PROCESS", "LOOK CLOSER AGENT",
];
const KEYWORDS = ["STAR", "FOX", "RUBY", "CLUE", "SPY", "LOCK", "GEM", "OWL"];
const RIDDLES = [
  { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
  { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "An echo" },
  { q: "What has keys but no locks, space but no room, and you can enter but not go in?", a: "A keyboard" },
  { q: "The person who makes it sells it. The person who buys it never uses it. The person who uses it never knows they're using it. What is it?", a: "A coffin" },
  { q: "What can travel around the world while staying in a corner?", a: "A stamp" },
  { q: "I'm tall when I'm young, short when I'm old. What am I?", a: "A candle" },
  { q: "What has a head and a tail but no body?", a: "A coin" },
  { q: "The more of me there is, the less you see. What am I?", a: "Darkness" },
  { q: "What gets wetter the more it dries?", a: "A towel" },
  { q: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", a: "A map" },
  { q: "What has one eye but cannot see?", a: "A needle" },
  { q: "What comes once in a minute, twice in a moment, and never in a thousand years?", a: "The letter M" },
  { q: "What can you catch but not throw?", a: "A cold" },
  { q: "What has many teeth but cannot bite?", a: "A comb" },
  { q: "A box without hinges, key, or lid, yet golden treasure inside is hid. What is it?", a: "An egg" },
  { q: "What building has the most stories?", a: "A library" },
  { q: "What word begins and ends with an E but only has one letter?", a: "An envelope" },
  { q: "I am not alive, yet I grow. I don't have lungs, yet I need air. What am I?", a: "Fire" },
  { q: "What can fill a room but takes up no space?", a: "Light" },
  { q: "Two fathers and two sons go fishing. They each catch one fish, yet only three fish are caught. How?", a: "Grandfather, father, and son" },
  { q: "What has a neck but no head?", a: "A bottle" },
  { q: "What runs but never walks, has a bed but never sleeps?", a: "A river" },
  { q: "The more you feed it, the more it grows, but if you give it water, it dies. What is it?", a: "Fire" },
  { q: "What five-letter word becomes shorter when you add two letters to it?", a: "Short" },
];
const CIPHERS = [
  { id: "caesar", name: "Caesar Shift", icon: RefreshCw,
    blurb: "Every letter slides forward the same number of spots in the alphabet. Crack the shift, crack the code.",
    how: "Pick a shift number, say 3. A becomes D, B becomes E, and so on, wrapping back to A after Z. To decode, shift the letters backward instead." },
  { id: "atbash", name: "Atbash Mirror", icon: Fingerprint,
    blurb: "The alphabet is flipped back to front: A swaps with Z, B swaps with Y, and so on.",
    how: "There's no key to remember, since the mirror never changes. A becomes Z, B becomes Y, M becomes N. Decoding uses the exact same mirror." },
  { id: "vigenere", name: "Vigenère Keyword", icon: KeyRound,
    blurb: "A repeating secret word decides how far each letter shifts, so the same letter encodes differently each time.",
    how: "Line the keyword up under your message, repeating it as needed. Each keyword letter tells you how many spaces to shift the letter above it." },
  { id: "railfence", name: "Rail Fence", icon: Radar,
    blurb: "Letters zigzag down and up across a set number of rows, then get read off row by row.",
    how: "Write your message in a zigzag across the chosen number of rails, then read each rail left to right, top to bottom." },
  { id: "substitution", name: "Substitution Cipher", icon: ScanEye,
    blurb: "Every letter is swapped for a completely different, fixed letter, using a secret cipher alphabet.",
    how: "Build a scrambled alphabet as your key. Every A always becomes the same letter. Letter frequency is your best clue." },
  { id: "a1z26", name: "Number Cipher", icon: FileText,
    blurb: "Each letter is replaced by its position in the alphabet, A is 1, B is 2, up to Z as 26.",
    how: "Convert every letter to its alphabet position, separated by dashes. A slash marks the break between words." },
  { id: "morse", name: "Morse Code", icon: Radio,
    blurb: "Letters become patterns of dots and dashes, once used to send real messages across telegraph wires.",
    how: "Each letter has its own dot-dash pattern. A single space separates letters, a slash separates whole words." },
];
const RANKS = [
  { min: 0, name: "Recruit" }, { min: 100, name: "Cadet" }, { min: 300, name: "Cipher Clerk" },
  { min: 600, name: "Field Agent" }, { min: 1000, name: "Codebreaker" }, { min: 1500, name: "Elite Agent" },
];
function rankFor(points) { let r = RANKS[0]; for (const x of RANKS) if (points >= x.min) r = x; return r; }

function makePuzzle(cipherId, difficulty) {
  const pool = difficulty === "easy" ? PHRASES.slice(0, 12) : difficulty === "medium" ? PHRASES.slice(6, 20) : PHRASES;
  const phrase = pool[Math.floor(Math.random() * pool.length)];
  let cipher = "", hint = "";
  if (cipherId === "caesar") {
    const shift = difficulty === "easy" ? 1 + Math.floor(Math.random() * 5) : 1 + Math.floor(Math.random() * 25);
    cipher = caesarEncode(phrase, shift); hint = `Shift amount: ${shift}`;
  } else if (cipherId === "atbash") {
    cipher = atbashEncode(phrase); hint = "Mirror alphabet, no key needed";
  } else if (cipherId === "vigenere") {
    const key = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    cipher = vigenereEncode(phrase, key); hint = `Keyword: ${key}`;
  } else if (cipherId === "railfence") {
    const rails = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
    cipher = railFenceEncode(phrase, rails); hint = `Rails used: ${rails} (spaces removed before encoding)`;
  } else if (cipherId === "substitution") {
    const key = substitutionKeyFor(Math.floor(Math.random() * 100000));
    cipher = substitutionEncode(phrase, key); hint = "Fixed cipher alphabet, look for repeated letters and short words";
  } else if (cipherId === "a1z26") {
    cipher = a1z26Encode(phrase); hint = "A=1, B=2 ... Z=26. Slash marks a new word";
  } else if (cipherId === "morse") {
    cipher = morseEncode(phrase); hint = "Space between letters, slash between words";
  }
  return { plaintext: phrase, cipher, hint, cipherId };
}

/* ============================= DECRYPT TERMINAL ============================= */
function DecryptReveal({ text, className }) {
  const [display, setDisplay] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&*";
  const frame = useRef(0);
  useEffect(() => {
    let raf;
    const total = 18;
    function tick() {
      frame.current++;
      const progress = frame.current / total;
      const out = text.split("").map((ch, i) => {
        if (ch === " ") return " ";
        const revealAt = (i / text.length) * 0.7;
        if (progress > revealAt + 0.3) return ch;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join("");
      setDisplay(out);
      if (frame.current < total) raf = setTimeout(tick, 45);
      else setDisplay(text);
    }
    tick();
    return () => clearTimeout(raf);
  }, [text]);
  return <span className={className}>{display}</span>;
}

/* ============================= BADGE / WORDMARK ============================= */
function AgencySeal({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <circle cx="32" cy="32" r="30" fill="none" stroke={T.gold} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="25" fill="none" stroke={T.gold} strokeWidth="1" strokeDasharray="1.5 3" />
      <circle cx="32" cy="32" r="19" fill={T.red} />
      <path d="M32 20 L35.5 29 L45 29 L37 34.5 L40 44 L32 38 L24 44 L27 34.5 L19 29 L28.5 29 Z"
        fill={T.gold} transform="translate(0,-1) scale(0.62)" transform-origin="32 32" style={{ transform: "translate(32px,32px) scale(0.62) translate(-32px,-32px)" }} />
      <text x="32" y="35" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="15" fill={T.cream}>CA</text>
    </svg>
  );
}

/* ============================= UI PRIMITIVES ============================= */
function FolderTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className="ca-tab font-stamp flex items-center gap-2 px-4 py-2.5 text-[13px] sm:text-sm uppercase tracking-wide"
      style={{
        background: active ? T.paper : "transparent",
        color: active ? T.text : T.paperDark,
        clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)",
        borderTop: active ? `2px solid ${T.gold}` : "2px solid transparent",
      }}
    >
      <Icon size={16} strokeWidth={2.25} />
      {label}
    </button>
  );
}

function Stamp({ children, color = T.red }) {
  return (
    <span
      className="font-stamp inline-block px-2 py-0.5 text-[11px] sm:text-xs border-[1.5px] uppercase"
      style={{ color, borderColor: color, letterSpacing: "0.14em", transform: "rotate(-1.5deg)" }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({ children, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="ca-btn font-stamp text-[13px] uppercase tracking-wide px-4 py-2.5 flex items-center gap-1.5"
      style={{ background: T.red, color: T.cream, boxShadow: `0 3px 0 ${T.redDeep}`, borderRadius: R }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}
function GhostButton({ children, onClick, icon: Icon, dark }) {
  return (
    <button
      onClick={onClick}
      className="ca-btn font-stamp text-[13px] uppercase tracking-wide px-4 py-2.5 flex items-center gap-1.5 border-[1.5px]"
      style={{ borderColor: dark ? T.text : T.paperDeep, color: dark ? T.text : T.cream, borderRadius: R }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}
function ChipButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="ca-btn font-mono text-[11px] px-3 py-1.5"
      style={{
        borderRadius: 999,
        border: `1px solid ${active ? T.red : T.inkLine}`,
        background: active ? T.red : "transparent",
        color: active ? T.cream : T.paperDark,
      }}
    >
      {children}
    </button>
  );
}
function SectionHeading({ eyebrow, title, sub }) {
  return (
    <div className="mb-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: T.goldDim }}>{eyebrow}</div>
      <h2 className="font-stamp text-2xl sm:text-[28px]" style={{ color: T.cream, letterSpacing: "0.01em" }}>{title}</h2>
      {sub && <p className="text-[13px] sm:text-sm mt-1.5 leading-relaxed" style={{ color: T.paperDark, fontFamily: "Georgia, serif" }}>{sub}</p>}
    </div>
  );
}

/* ============================= LEARN TAB ============================= */
function LearnTab() {
  const [labCipher, setLabCipher] = useState("caesar");
  const [labText, setLabText] = useState("HELLO AGENT");
  const [shift, setShift] = useState(3);
  const [keyword, setKeyword] = useState("STAR");
  const [rails, setRails] = useState(3);

  const labOutput = useMemo(() => {
    const t = labText || "";
    if (labCipher === "caesar") return caesarEncode(t, shift);
    if (labCipher === "atbash") return atbashEncode(t);
    if (labCipher === "vigenere") return vigenereEncode(t, keyword || "A");
    if (labCipher === "railfence") return railFenceEncode(t, rails);
    if (labCipher === "a1z26") return a1z26Encode(t);
    if (labCipher === "morse") return morseEncode(t);
    return "";
  }, [labCipher, labText, shift, keyword, rails]);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Dossier 01" title="Field Manual" sub="Every method a codebreaker needs to know. Read the file, then test it yourself in the lab below." />

      <div className="grid sm:grid-cols-2 gap-3">
        {CIPHERS.map((c, i) => (
          <div key={c.id} className="ca-card p-4" style={{ background: T.inkSoft, borderLeft: `3px solid ${T.gold}`, borderRadius: R }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px]" style={{ color: T.goldDim }}>{String(i + 1).padStart(2, "0")}</span>
              <c.icon size={17} color={T.cyan} strokeWidth={2} />
              <h3 className="font-stamp text-[15px]" style={{ color: T.cream }}>{c.name}</h3>
            </div>
            <p className="text-[13px] mb-2 leading-snug" style={{ color: T.paper, fontFamily: "Georgia, serif" }}>{c.blurb}</p>
            <p className="font-mono text-[11px] leading-relaxed" style={{ color: T.paperDark }}>{c.how}</p>
          </div>
        ))}
      </div>

      <Paper style={{ background: T.paper, borderRadius: R }} className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-stamp text-lg flex items-center gap-2" style={{ color: T.text }}>
            <ScanEye size={19} /> Cipher Lab
          </h3>
          <Stamp>Live</Stamp>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {CIPHERS.filter((c) => c.id !== "substitution").map((c) => (
            <ChipButton key={c.id} active={labCipher === c.id} onClick={() => setLabCipher(c.id)}>{c.name}</ChipButton>
          ))}
        </div>

        <input
          value={labText}
          onChange={(e) => setLabText(e.target.value.toUpperCase().slice(0, 40))}
          className="font-mono w-full px-3 py-2 mb-3 text-sm"
          style={{ background: T.ink, color: T.cream, border: `1px solid ${T.paperDeep}`, borderRadius: R }}
          placeholder="TYPE A MESSAGE"
        />

        {labCipher === "caesar" && (
          <label className="font-mono text-[11px] flex items-center gap-2 mb-3" style={{ color: T.text }}>
            Shift: {shift}
            <input type="range" min="1" max="25" value={shift} onChange={(e) => setShift(+e.target.value)} className="flex-1" style={{ accentColor: T.red }} />
          </label>
        )}
        {labCipher === "vigenere" && (
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value.toUpperCase().slice(0, 10))}
            placeholder="KEYWORD"
            className="font-mono w-full px-3 py-2 mb-3 text-sm"
            style={{ background: T.ink, color: T.cream, border: `1px solid ${T.paperDeep}`, borderRadius: R }}
          />
        )}
        {labCipher === "railfence" && (
          <label className="font-mono text-[11px] flex items-center gap-2 mb-3" style={{ color: T.text }}>
            Rails: {rails}
            <input type="range" min="2" max="6" value={rails} onChange={(e) => setRails(+e.target.value)} className="flex-1" style={{ accentColor: T.red }} />
          </label>
        )}

        <div className="font-mono text-sm sm:text-base p-3 break-words" style={{ background: T.ink, color: T.cyan, minHeight: "3rem", borderRadius: R, border: `1px solid ${T.paperDeep}` }}>
          {labOutput}
        </div>
      </Paper>
    </div>
  );
}

/* ============================= PRACTICE TAB ============================= */
function PracticeTab({ addPoints }) {
  const [cipherId, setCipherId] = useState("caesar");
  const [difficulty, setDifficulty] = useState("easy");
  const [puzzle, setPuzzle] = useState(() => makePuzzle("caesar", "easy"));
  const [guess, setGuess] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState(null);

  function newPuzzle(cid = cipherId, diff = difficulty) {
    setPuzzle(makePuzzle(cid, diff)); setGuess(""); setHintsUsed(0); setShowHint(false); setResult(null);
  }
  function useHint() { setShowHint(true); setHintsUsed((h) => h + 1); }
  function submit() {
    const correct = normalize(guess) === normalize(puzzle.plaintext);
    setResult(correct ? "correct" : "wrong");
    if (correct) addPoints(Math.max(20, 100 - hintsUsed * 20), "cipher");
  }
  const cipherMeta = CIPHERS.find((c) => c.id === cipherId);

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Dossier 02" title="Active Case" sub="Decode the intercepted message. Hints cost points, so trust your training first." />

      <div className="flex flex-wrap gap-1.5">
        {CIPHERS.map((c) => (
          <ChipButton key={c.id} active={cipherId === c.id} onClick={() => { setCipherId(c.id); newPuzzle(c.id, difficulty); }}>{c.name}</ChipButton>
        ))}
      </div>

      <div className="flex gap-1.5">
        {["easy", "medium", "hard"].map((d) => (
          <button
            key={d}
            onClick={() => { setDifficulty(d); newPuzzle(cipherId, d); }}
            className="ca-btn font-stamp text-[11px] px-3 py-1 uppercase tracking-wider border-[1.5px]"
            style={{ borderColor: T.gold, background: difficulty === d ? T.gold : "transparent", color: difficulty === d ? T.text : T.gold, borderRadius: R }}
          >
            {d}
          </button>
        ))}
      </div>

      <Paper style={{ background: T.paper, borderRadius: R }} className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <cipherMeta.icon size={17} color={T.text} />
            <span className="font-stamp text-[15px]" style={{ color: T.text }}>{cipherMeta.name}</span>
          </div>
          <Stamp>Classified</Stamp>
        </div>

        <div className="font-mono text-lg sm:text-xl p-4 mb-3 break-words tracking-wide" style={{ background: T.ink, color: T.cyan, borderRadius: R }}>
          {puzzle.cipher}
        </div>

        {showHint && (
          <div className="text-[13px] mb-3 flex items-center gap-2" style={{ color: T.redDeep, fontFamily: "Georgia, serif" }}>
            <Lightbulb size={15} /> {puzzle.hint}
          </div>
        )}

        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type the decoded message"
          className="font-mono w-full px-3 py-2 mb-3 text-sm"
          style={{ borderRadius: R, border: `1px solid ${T.paperDeep}`, background: "#F8F3E6" }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={submit}>Submit</PrimaryButton>
          <GhostButton dark onClick={useHint} icon={Lightbulb}>Hint (-20)</GhostButton>
          <GhostButton dark onClick={() => newPuzzle()} icon={RefreshCw}>New Case</GhostButton>
        </div>

        {result && (
          <div className="mt-4 p-3 text-[13px]" style={{ background: result === "correct" ? "#DCEFE0" : "#F3D9D9", borderRadius: R, fontFamily: "Georgia, serif" }}>
            {result === "correct" ? (
              <div className="flex items-start gap-2">
                <CheckCircle2 size={17} color="#2E7D4F" />
                <div>
                  <div className="font-stamp text-[15px] mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>Case closed, agent.</div>
                  Solved in {hintsUsed} hint{hintsUsed !== 1 ? "s" : ""}. Message: "{puzzle.plaintext}"
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <XCircle size={17} color="#A22" />
                <div>
                  <div className="font-stamp text-[15px] mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>Not quite, try again.</div>
                  Check your spacing and re-read the method notes if you're stuck.
                </div>
              </div>
            )}
          </div>
        )}
      </Paper>
    </div>
  );
}

/* ============================= RIDDLES TAB ============================= */
function RiddlesTab({ addPoints }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * RIDDLES.length));
  const [revealed, setRevealed] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const riddle = RIDDLES[idx];

  function next() {
    setIdx((prev) => { let n = Math.floor(Math.random() * RIDDLES.length); while (n === prev) n = Math.floor(Math.random() * RIDDLES.length); return n; });
    setRevealed(false);
  }
  function markSolved() { addPoints(30, "riddle"); setSolvedCount((s) => s + 1); next(); }

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Dossier 03" title="Puzzle Box" sub="Riddles sharpen the kind of lateral thinking every codebreaker relies on." />

      <Paper style={{ background: T.paper, borderRadius: R }} className="p-6">
        <Stamp color={T.redDeep}>Riddle No. {idx + 1}</Stamp>
        <p className="text-lg mt-4 mb-6 leading-relaxed" style={{ color: T.text, fontFamily: "Georgia, serif" }}>{riddle.q}</p>

        {revealed ? (
          <div className="font-mono text-[15px] p-3 mb-4" style={{ background: T.ink, color: T.cyan, borderRadius: R }}>
            Answer: {riddle.a}
          </div>
        ) : (
          <div className="mb-4"><GhostButton dark onClick={() => setRevealed(true)}>Reveal Answer</GhostButton></div>
        )}

        <div className="flex flex-wrap gap-2">
          {revealed && <PrimaryButton onClick={markSolved} icon={CheckCircle2}>I solved it (+30)</PrimaryButton>}
          <GhostButton dark onClick={next} icon={ChevronRight}>Next Riddle</GhostButton>
        </div>
      </Paper>
      <p className="font-mono text-[11px]" style={{ color: T.paperDark }}>Solved this session: {solvedCount}</p>
    </div>
  );
}

/* ============================= PROGRESS TAB ============================= */
function ProgressTab({ points, cipherSolves, riddleSolves }) {
  const rank = rankFor(points);
  const nextRank = RANKS.find((r) => r.min > points);
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Dossier 04" title="Agent File" sub="Every case you close builds your record." />

      <Paper style={{ background: T.paper, borderRadius: R }} className="p-6 text-center">
        <Award size={36} className="mx-auto mb-2" color={T.redDeep} />
        <div className="font-stamp text-3xl" style={{ color: T.text }}>{rank.name}</div>
        <div className="font-mono text-sm mt-1" style={{ color: T.text }}>{points} points</div>
        {nextRank && <div className="text-xs mt-2" style={{ color: T.paperDeep, fontFamily: "Georgia, serif" }}>{nextRank.min - points} points to {nextRank.name}</div>}
      </Paper>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 text-center" style={{ background: T.inkSoft, borderRadius: R, border: `1px solid ${T.inkLine}` }}>
          <Lock size={20} className="mx-auto mb-1" color={T.cyan} />
          <div className="font-stamp text-xl" style={{ color: T.cream }}>{cipherSolves}</div>
          <div className="font-mono text-[11px]" style={{ color: T.paperDark }}>Codes cracked</div>
        </div>
        <div className="p-4 text-center" style={{ background: T.inkSoft, borderRadius: R, border: `1px solid ${T.inkLine}` }}>
          <Puzzle size={20} className="mx-auto mb-1" color={T.gold} />
          <div className="font-stamp text-xl" style={{ color: T.cream }}>{riddleSolves}</div>
          <div className="font-mono text-[11px]" style={{ color: T.paperDark }}>Riddles solved</div>
        </div>
      </div>

      <div className="p-4" style={{ background: T.ink, borderRadius: R, border: `1px dashed ${T.paperDeep}` }}>
        <div className="font-stamp text-xs uppercase tracking-wide mb-2" style={{ color: T.gold }}>Rank Ladder</div>
        <div className="space-y-1">
          {RANKS.map((r) => (
            <div key={r.name} className="font-mono text-[11px] flex justify-between" style={{ color: points >= r.min ? T.cyan : T.inkLine }}>
              <span>{r.name}</span><span>{r.min}+</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================= PERSISTENCE ============================= */
const SAVE_KEY = "agent-progress";

/* ============================= APP ============================= */
export default function CipherAcademy() {
  const [tab, setTab] = useState("learn");
  const [points, setPoints] = useState(0);
  const [cipherSolves, setCipherSolves] = useState(0);
  const [riddleSolves, setRiddleSolves] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setPoints(data.points || 0);
        setCipherSolves(data.cipherSolves || 0);
        setRiddleSolves(data.riddleSolves || 0);
      }
    } catch (err) {
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ points, cipherSolves, riddleSolves }));
      setSaveError(false);
    } catch (err) {
      setSaveError(true);
    }
  }, [points, cipherSolves, riddleSolves, loaded]);

  function addPoints(n, kind) {
    setPoints((p) => p + n);
    if (kind === "cipher") setCipherSolves((c) => c + 1);
    if (kind === "riddle") setRiddleSolves((r) => r + 1);
  }

  return (
    <div className="min-h-screen w-full" style={{ background: T.ink }}>
      <FontLoader />
      <Grain />
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <header className="mb-7 flex items-center gap-3">
          <AgencySeal />
          <div className="flex-1">
            <h1 className="font-stamp text-[26px] sm:text-4xl leading-none" style={{ color: T.cream, letterSpacing: "0.02em" }}>
              <DecryptReveal text="CIPHER ACADEMY" />
            </h1>
            <p className="text-[12px] sm:text-[13px] mt-1" style={{ color: T.paperDark, fontFamily: "Georgia, serif" }}>
              A codebreaker's training ground
            </p>
          </div>
          {!loaded && (
            <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: T.paperDark }}>Loading file&hellip;</span>
          )}
          {loaded && saveError && (
            <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: T.red }}>Not saving</span>
          )}
        </header>

        <nav className="flex gap-1 mb-0 flex-wrap">
          <FolderTab active={tab === "learn"} onClick={() => setTab("learn")} icon={FileText} label="Manual" />
          <FolderTab active={tab === "practice"} onClick={() => setTab("practice")} icon={Lock} label="Active Case" />
          <FolderTab active={tab === "riddles"} onClick={() => setTab("riddles")} icon={Puzzle} label="Puzzle Box" />
          <FolderTab active={tab === "progress"} onClick={() => setTab("progress")} icon={Award} label="Agent File" />
        </nav>

        <main className="p-5 sm:p-6" style={{ background: T.inkSoft, borderRadius: R, border: `1px solid ${T.inkLine}`, borderTopLeftRadius: 0 }}>
          {tab === "learn" && <LearnTab />}
          {tab === "practice" && <PracticeTab addPoints={addPoints} />}
          {tab === "riddles" && <RiddlesTab addPoints={addPoints} />}
          {tab === "progress" && <ProgressTab points={points} cipherSolves={cipherSolves} riddleSolves={riddleSolves} />}
        </main>
      </div>
    </div>
  );
}
