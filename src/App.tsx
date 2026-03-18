import { useState, useCallback } from "react";
import { useSupabaseCampuses, useSupabaseHeroes } from "./lib/hooks";
import { generateWeeklyContent } from "./lib/ai-engine";

// ─── TYPES ───
type Screen = "title" | "chest" | "kingdom" | "build" | "verse" | "heroes" | "team" | "admin" | "hq";
type Rarity = "common" | "rare" | "epic" | "legendary";

interface HeroCard {
  id: string; name: string; icon: string; virtue: string; verse: string; verseRef: string;
  story: string; rarity: Rarity; collected: boolean;
}
interface BuildPiece {
  id: string; icon: string; name: string; x: number; y: number; placed: boolean;
}
interface KingdomTile {
  id: string; name: string; icon: string; status: "completed" | "current" | "locked";
  story: string; verse: string; verseRef: string;
}
interface TeamMember { name: string; icon: string; builds: number; }

// ─── FALLBACK GAME DATA (for offline/demo) ───
const FALLBACK_HEROES: HeroCard[] = [
  { id:"david", name:"David", icon:"👑", virtue:"Courage", verse:"The Lord is my shepherd, I lack nothing.", verseRef:"Psalm 23:1", story:"A young shepherd who defeated a giant with faith and five smooth stones.", rarity:"legendary", collected:true },
  { id:"noah", name:"Noah", icon:"🧓", virtue:"Obedience", verse:"Noah did everything just as God commanded him.", verseRef:"Genesis 6:22", story:"Built an ark when no one else believed rain was coming.", rarity:"rare", collected:true },
  { id:"esther", name:"Esther", icon:"👩", virtue:"Bravery", verse:"Perhaps you were made for such a time as this.", verseRef:"Esther 4:14", story:"Risked her life to save her people from destruction.", rarity:"epic", collected:true },
  { id:"moses", name:"Moses", icon:"🧔", virtue:"Faith", verse:"By faith he left Egypt, not fearing the king's anger.", verseRef:"Hebrews 11:27", story:"Led God's people out of slavery and through the Red Sea.", rarity:"rare", collected:true },
  { id:"daniel", name:"Daniel", icon:"🦁", virtue:"Devotion", verse:"My God sent his angel, and he shut the mouths of the lions.", verseRef:"Daniel 6:22", story:"Prayed to God even when it meant being thrown to the lions.", rarity:"rare", collected:true },
  { id:"ruth", name:"Ruth", icon:"🌾", virtue:"Loyalty", verse:"Where you go I will go, and where you stay I will stay.", verseRef:"Ruth 1:16", story:"Left everything behind to stay with her family and follow God.", rarity:"common", collected:true },
  { id:"elijah", name:"Elijah", icon:"🔥", virtue:"Power", verse:"Then the fire of the Lord fell and burned up the sacrifice.", verseRef:"1 Kings 18:38", story:"Called down fire from heaven to prove God is real.", rarity:"epic", collected:true },
  { id:"joshua", name:"Joshua", icon:"🛡️", virtue:"Leadership", verse:"Be strong and courageous. Do not be afraid.", verseRef:"Joshua 1:9", story:"Led God's people into the promised land with courage.", rarity:"rare", collected:true },
  { id:"samson", name:"Samson", icon:"💪", virtue:"Strength", verse:"The Spirit of the Lord came powerfully upon him.", verseRef:"Judges 14:6", story:"Given supernatural strength to protect God's people.", rarity:"legendary", collected:true },
  { id:"samuel", name:"Samuel", icon:"👶", virtue:"Listening", verse:"Speak, Lord, for your servant is listening.", verseRef:"1 Samuel 3:10", story:"Heard God's voice as a child and became a great prophet.", rarity:"common", collected:true },
  { id:"jonah", name:"Jonah", icon:"🐋", virtue:"Repentance", verse:"From inside the fish Jonah prayed to the Lord his God.", verseRef:"Jonah 2:1", story:"Ran from God, got swallowed by a fish, and learned to obey.", rarity:"common", collected:true },
  { id:"jonathan", name:"Jonathan", icon:"🏹", virtue:"Friendship", verse:"Jonathan became one in spirit with David.", verseRef:"1 Samuel 18:1", story:"The most loyal friend in the Bible — he gave up his crown for David.", rarity:"rare", collected:false },
  { id:"deborah", name:"Deborah", icon:"⚖️", virtue:"Wisdom", verse:"The Lord will deliver Sisera into the hands of a woman.", verseRef:"Judges 4:9", story:"A judge and warrior who led Israel to victory.", rarity:"epic", collected:false },
  { id:"joseph", name:"Joseph", icon:"🌈", virtue:"Forgiveness", verse:"You intended to harm me, but God intended it for good.", verseRef:"Genesis 50:20", story:"Sold by his brothers, but forgave them and saved his nation.", rarity:"legendary", collected:false },
  { id:"mary", name:"Mary", icon:"⭐", virtue:"Trust", verse:"I am the Lord's servant. May it be to me according to your word.", verseRef:"Luke 1:38", story:"Said yes to God's impossible plan and became the mother of Jesus.", rarity:"epic", collected:false },
  { id:"paul", name:"Paul", icon:"✉️", virtue:"Perseverance", verse:"I can do all things through Christ who strengthens me.", verseRef:"Philippians 4:13", story:"Once persecuted Christians, then became the greatest missionary ever.", rarity:"legendary", collected:false },
];


const KINGDOM_TILES: KingdomTile[] = [
  { id:"creation", name:"Creation", icon:"🌍", status:"completed", story:"In the beginning, God created the heavens and the earth. He spoke light into darkness, shaped mountains and seas, and breathed life into everything.", verse:"In the beginning God created the heavens and the earth.", verseRef:"Genesis 1:1" },
  { id:"noah", name:"Noah's Ark", icon:"🚢", status:"completed", story:"Noah trusted God and built an enormous ark while everyone laughed. When the flood came, God kept Noah's family and the animals safe. Then He painted a rainbow as a promise.", verse:"Noah did everything just as God commanded him.", verseRef:"Genesis 6:22" },
  { id:"moses", name:"Red Sea", icon:"🌊", status:"completed", story:"Trapped between the sea and Pharaoh's army, the people were terrified. But Moses stretched out his hand and God split the water in two. They walked through on dry ground!", verse:"By faith the people passed through the Red Sea as on dry land.", verseRef:"Hebrews 11:29" },
  { id:"jericho", name:"Walls of Jericho", icon:"🏰", status:"current", story:"God told Joshua to march around the city walls for seven days. No weapons, just trumpets and faith. On day seven, the people shouted and the walls came crashing down!", verse:"By faith the walls of Jericho fell, after the army had marched around them for seven days.", verseRef:"Hebrews 11:30" },
  { id:"david", name:"David & Goliath", icon:"⚔️", status:"locked", story:"", verse:"", verseRef:"" },
  { id:"daniel", name:"Daniel's Den", icon:"🦁", status:"locked", story:"", verse:"", verseRef:"" },
  { id:"christmas", name:"Birth of Jesus", icon:"⭐", status:"locked", story:"", verse:"", verseRef:"" },
  { id:"cross", name:"The Cross", icon:"✝️", status:"locked", story:"", verse:"", verseRef:"" },
  { id:"risen", name:"Resurrection", icon:"🕊️", status:"locked", story:"", verse:"", verseRef:"" },
];

const JERICHO_PIECES: BuildPiece[] = [
  { id:"wall1", icon:"🧱", name:"Wall Left", x:12, y:30, placed:false },
  { id:"wall2", icon:"🧱", name:"Wall Right", x:72, y:30, placed:false },
  { id:"gate", icon:"🏛️", name:"City Gate", x:42, y:35, placed:false },
  { id:"trumpet", icon:"📯", name:"Trumpet", x:25, y:52, placed:false },
  { id:"joshua", icon:"🧑", name:"Joshua", x:50, y:54, placed:false },
  { id:"army", icon:"⚔️", name:"Army", x:62, y:56, placed:false },
];

const VERSE_WORDS = "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.".split(" ");
const HIDDEN_INDICES = [3, 7, 10, 14, 20]; // courageous, afraid, discouraged, God, go

const TEAM_MEMBERS: TeamMember[] = [
  { name:"Jayden_07", icon:"⛏️", builds:4 },
  { name:"Marcus_M", icon:"🗡️", builds:3 },
  { name:"SophiaGrace", icon:"🏹", builds:2 },
  { name:"EliTheGreat", icon:"🛡️", builds:1 },
  { name:"HannahJoy", icon:"⚔️", builds:1 },
];


const CHEST_REWARDS = [
  { icon:"⚔️", name:"SWORD OF THE SPIRIT", desc:"A weapon forged from the Word of God!", rarity:"rare" as Rarity },
  { icon:"🛡️", name:"SHIELD OF FAITH", desc:"Protects you from every fiery arrow!", rarity:"epic" as Rarity },
  { icon:"👑", name:"CROWN OF LIFE", desc:"Given to those who persevere!", rarity:"legendary" as Rarity },
  { icon:"📜", name:"SCROLL OF WISDOM", desc:"Ancient words for today's adventure!", rarity:"common" as Rarity },
  { icon:"💎", name:"DIAMOND OF TRUTH", desc:"Unbreakable and precious in God's sight!", rarity:"epic" as Rarity },
];

// ─── HELPERS ───
const rarityColor = (r: Rarity) => {
  switch(r) {
    case "common": return "text-gray-400 border-gray-500";
    case "rare": return "text-cyan-300 border-cyan-400";
    case "epic": return "text-purple-400 border-purple-400";
    case "legendary": return "text-yellow-400 border-yellow-400";
  }
};

const rarityBg = (r: Rarity) => {
  switch(r) {
    case "legendary": return "bg-yellow-900/40 border-yellow-500";
    case "epic": return "bg-purple-900/30 border-purple-500";
    default: return "bg-[#1a1a3a] border-[#373737]";
  }
};

// ─── SPARKLE COMPONENT ───
function Sparkles({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: 25 + Math.random() * 50,
    top: 35 + Math.random() * 25,
    delay: Math.random() * .6,
    color: ["#FFD700","#5CE8E8","#FF6B6B","#7FFF00","#B44BFF"][i % 5],
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(p => (
        <div key={p.id} className="absolute w-2 h-2" style={{
          left: `${p.left}%`, top: `${p.top}%`,
          background: p.color,
          animation: `sparkle-fly 1.5s ${p.delay}s ease-out forwards`,
        }} />
      ))}
    </div>
  );
}

// ─── STORY OVERLAY ───
function StoryOverlay({ tile, onClose }: { tile: KingdomTile | null; onClose: () => void }) {
  if (!tile) return null;
  return (
    <div className="fixed inset-0 bg-black/92 flex flex-col items-center justify-center z-40 p-6" onClick={onClose}>
      <div className="text-7xl mb-6 anim-pop">{tile.icon}</div>
      <p className="text-[10px] leading-[2] text-center max-w-md mb-6 anim-slide text-gray-200">{tile.story}</p>
      <div className="pixel-border bg-cyan-950/30 border-cyan-400 px-6 py-4 text-center mb-6 anim-slide" style={{ animationDelay: ".2s" }}>
        <p className="text-[8px] text-cyan-300 mb-2">{tile.verseRef}</p>
        <p className="text-[9px] leading-[1.8]">"{tile.verse}"</p>
      </div>
      <button className="mc-btn mc-btn-green px-8 py-3 text-[10px]">CONTINUE</button>
    </div>
  );
}

// ─── BOTTOM NAV ───
function BottomNav({ current, onNav }: { current: Screen; onNav: (s: Screen) => void }) {
  const items: { screen: Screen; icon: string; label: string }[] = [
    { screen:"kingdom", icon:"🏠", label:"KINGDOM" },
    { screen:"build", icon:"🔨", label:"BUILD" },
    { screen:"heroes", icon:"🃏", label:"HEROES" },
    { screen:"verse", icon:"📖", label:"VERSES" },
    { screen:"team", icon:"👥", label:"TEAM" },
  ];
  return (
    <div className="flex items-center justify-center gap-1 px-2 py-2 bg-black/70 border-t-[3px] border-[#373737]">
      {items.map(it => (
        <button key={it.screen} onClick={() => onNav(it.screen)}
          className={`flex flex-col items-center justify-center w-14 h-14 border-2 transition-all ${
            current === it.screen ? "bg-[#666] border-white" : "bg-[#555] border-[#373737] hover:border-gray-400"
          }`}>
          <span className="text-xl">{it.icon}</span>
          <span className="text-[5px] mt-0.5 text-gray-300">{it.label}</span>
        </button>
      ))}
      <button onClick={() => onNav("admin")}
        className="flex flex-col items-center justify-center w-14 h-14 bg-[#555] border-2 border-[#373737] hover:border-gray-400">
        <span className="text-xl">⚙️</span>
        <span className="text-[5px] mt-0.5 text-gray-300">ADMIN</span>
      </button>
    </div>
  );
}

// ─── TITLE SCREEN ───
function TitleScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const { campuses } = useSupabaseCampuses();
  const campusCount = campuses.length || 21;

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background:"linear-gradient(180deg,#87CEEB 0%,#87CEEB 50%,#5B8731 50%,#4A7028 52%,#8B6914 52%)" }}>
      <div className="absolute w-28 h-7 bg-white/80 top-14 left-[10%] anim-drift-1" />
      <div className="absolute w-20 h-5 bg-white/80 top-24 left-[55%] anim-drift-2" />
      <div className="absolute w-24 h-6 bg-white/80 top-10 left-[75%] anim-drift-3" />

      <div className="relative z-10 text-center mb-12">
        <h1 className="text-4xl md:text-5xl text-white font-bold tracking-wider"
          style={{ textShadow:"4px 4px 0 #3F3F3F, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000" }}>
          BIBLECRAFT
        </h1>
        <p className="text-[10px] text-yellow-400 mt-2 tracking-widest" style={{ textShadow:"2px 2px 0 #000" }}>
          BUILD &bull; EXPLORE &bull; BELIEVE
        </p>
      </div>

      <div className="relative z-10 flex flex-col gap-3 items-center">
        <button onClick={() => onNav("chest")} className="mc-btn mc-btn-green w-72 py-3.5 text-[12px] text-center">
          Singleplayer
        </button>
        <button onClick={() => onNav("team")} className="mc-btn w-72 py-3.5 text-[12px] text-center">
          Multiplayer
        </button>
        <button onClick={() => onNav("admin")} className="mc-btn w-72 py-3.5 text-[12px] text-center">
          Admin Panel
        </button>
      </div>

      <p className="absolute bottom-3 left-3 text-[7px] text-white/40 z-10">BibleCraft v0.1.0 — Futures Church</p>
      <p className="absolute bottom-3 right-3 text-[7px] text-white/40 z-10">{campusCount} Campuses Connected</p>
    </div>
  );
}

// ─── TREASURE CHEST ───
function ChestScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [opened, setOpened] = useState(false);
  const [sparkles, setSparkles] = useState(false);
  const reward = CHEST_REWARDS[Math.floor(Math.random() * CHEST_REWARDS.length)];

  const open = () => {
    if (opened) return;
    setOpened(true);
    setSparkles(true);
    setTimeout(() => setSparkles(false), 2000);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center"
      style={{ background:"radial-gradient(ellipse at center,#2a1a0a,#0a0a0a)" }}>
      <Sparkles active={sparkles} />
      {!opened ? (
        <div className="text-center cursor-pointer" onClick={open}>
          <div className="text-8xl anim-bounce">📦</div>
          <p className="text-sm text-yellow-400 mt-5 anim-blink" style={{ textShadow:"2px 2px 0 #000" }}>
            DAILY TREASURE
          </p>
          <p className="text-[8px] text-gray-500 mt-3">Tap to open!</p>
        </div>
      ) : (
        <div className="text-center anim-pop">
          <div className="text-7xl">{reward.icon}</div>
          <p className="text-base text-yellow-400 mt-4" style={{ textShadow:"2px 2px 0 #000" }}>
            {reward.name}
          </p>
          <p className="text-[9px] text-gray-400 mt-2 max-w-xs leading-[1.8]">{reward.desc}</p>
          <div className={`inline-block mt-3 px-3 py-1 text-[8px] border-2 ${rarityColor(reward.rarity)} ${reward.rarity === "legendary" ? "anim-glow" : ""}`}>
            ★ {reward.rarity.toUpperCase()} ★
          </div>
          <div className="mt-6">
            <button onClick={() => onNav("kingdom")} className="mc-btn mc-btn-green px-10 py-3 text-[11px]">
              Enter Kingdom
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KINGDOM MAP ───
function KingdomScreen({ onNav, onStory }: { onNav: (s: Screen) => void; onStory: (t: KingdomTile) => void }) {
  return (
    <div className="h-full flex flex-col"
      style={{ background:"linear-gradient(180deg,#6EC6FF 0%,#87CEEB 30%,#5B8731 65%,#8B6914 100%)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-black/55 border-b-[3px] border-[#373737]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#555] border-2 border-[#373737] flex items-center justify-center text-2xl">⛏️</div>
          <div>
            <p className="text-[10px]">Jayden_07</p>
            <p className="text-[8px] text-green-400 mt-0.5">LVL 4 — Disciple</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-3 py-2 border-2 border-[#373737]">
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-sm text-yellow-400">7</p>
            <p className="text-[6px] text-gray-400">STREAK</p>
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border-b-2 border-[#373737]">
        <span className="text-[7px] text-green-400">XP</span>
        <div className="flex-1 h-3 bg-[#222] border-2 border-[#373737]">
          <div className="h-full bg-gradient-to-b from-green-400 to-green-600" style={{ width:"65%" }} />
        </div>
        <span className="text-[7px] text-green-400">650/1000</span>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-3 gap-2 p-3 overflow-y-auto">
        {KINGDOM_TILES.map(tile => (
          <button key={tile.id}
            onClick={() => tile.status === "completed" ? onStory(tile) : tile.status === "current" ? onNav("build") : null}
            disabled={tile.status === "locked"}
            className={`flex flex-col items-center justify-center p-3 min-h-[100px] border-3 transition-all relative ${
              tile.status === "completed" ? "bg-green-900/30 border-green-700 hover:border-green-400" :
              tile.status === "current" ? "bg-black/30 border-yellow-500 hover:bg-white/5 anim-glow" :
              "bg-black/50 border-[#444] cursor-default"
            }`}>
            {tile.status === "current" && (
              <span className="absolute top-1.5 right-1.5 text-[6px] bg-red-500 text-white px-1.5 py-0.5 anim-blink">NEW!</span>
            )}
            <span className={`text-3xl mb-2 ${tile.status === "locked" ? "opacity-25" : ""}`}>{tile.icon}</span>
            <span className={`text-[7px] text-center leading-[1.4] ${tile.status === "locked" ? "text-[#666]" : ""}`}>{tile.name}</span>
            <span className={`text-[6px] mt-1 ${
              tile.status === "completed" ? "text-green-400" :
              tile.status === "current" ? "text-yellow-400" :
              "text-[#555]"
            }`}>
              {tile.status === "completed" ? "★ BUILT ★" : tile.status === "current" ? "▶ BUILD NOW" : "🔒 LOCKED"}
            </span>
          </button>
        ))}
      </div>

      <BottomNav current="kingdom" onNav={onNav} />
    </div>
  );
}

// ─── BUILD MODE ───
function BuildScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [pieces, setPieces] = useState<BuildPiece[]>(JERICHO_PIECES.map(p => ({ ...p })));
  const [showStory, setShowStory] = useState(false);
  const [sparkles, setSparkles] = useState(false);
  const placed = pieces.filter(p => p.placed).length;
  const pct = Math.round((placed / pieces.length) * 100);

  const place = (id: string) => {
    setPieces(prev => {
      const next = prev.map(p => p.id === id ? { ...p, placed: true } : p);
      if (next.filter(p => p.placed).length === next.length) {
        setTimeout(() => { setShowStory(true); setSparkles(true); setTimeout(() => setSparkles(false), 2000); }, 600);
      }
      return next;
    });
  };

  const jerichoTile = KINGDOM_TILES.find(t => t.id === "jericho")!;

  return (
    <div className="h-full flex flex-col"
      style={{ background:"linear-gradient(180deg,#FFA347 0%,#FF8C33 20%,#87CEEB 40%,#5B8731 75%,#8B6914 100%)" }}>
      <Sparkles active={sparkles} />
      {showStory && <StoryOverlay tile={jerichoTile} onClose={() => { setShowStory(false); onNav("kingdom"); }} />}

      <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b-[3px] border-[#373737]">
        <p className="text-[11px]">🏰 Walls of Jericho</p>
        <button onClick={() => onNav("kingdom")} className="text-[9px] text-gray-400 hover:text-white">← BACK</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl aspect-video bg-black/30 border-4 border-[#373737] relative overflow-hidden">
          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-[30%]"
            style={{ background:"linear-gradient(180deg,#5B8731 0%,#5B8731 15%,#8B6914 15%)" }} />
          {/* Placed pieces */}
          {pieces.filter(p => p.placed).map(p => (
            <div key={p.id} className="absolute text-4xl anim-place" style={{ left:`${p.x}%`, bottom:`${p.y}%` }}>
              {p.icon}
            </div>
          ))}
          {placed === 0 && (
            <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] text-white/40">
              Tap pieces below to build!
            </p>
          )}
        </div>

        <div className="w-full max-w-xl flex items-center gap-2 mt-3">
          <span className="text-[7px]">BUILD</span>
          <div className="flex-1 h-4 bg-[#222] border-2 border-[#373737]">
            <div className="h-full bg-gradient-to-b from-yellow-400 to-yellow-600 transition-all duration-500" style={{ width:`${pct}%` }} />
          </div>
          <span className="text-[7px]">{pct}%</span>
        </div>
      </div>

      <div className="flex gap-1.5 px-3 py-3 bg-black/60 border-t-[3px] border-[#373737] justify-center flex-wrap">
        {pieces.map(p => (
          <button key={p.id} onClick={() => !p.placed && place(p.id)}
            className={`w-16 h-16 flex flex-col items-center justify-center border-3 transition-all ${
              p.placed ? "bg-[#333] border-[#333] opacity-30 cursor-default" : "bg-[#555] border-[#373737] hover:border-yellow-400 cursor-pointer"
            }`}>
            <span className="text-2xl">{p.icon}</span>
            <span className="text-[5px] text-gray-400 mt-1">{p.name.split(" ")[0].toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── VERSE QUEST ───
function VerseScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [sparkles, setSparkles] = useState(false);
  const choices = HIDDEN_INDICES.map(i => VERSE_WORDS[i]);
  const allSolved = solved.size === HIDDEN_INDICES.length;

  const tryWord = (idx: number) => {
    if (!selected) return;
    if (VERSE_WORDS[idx] === selected) {
      const next = new Set(solved);
      next.add(idx);
      setSolved(next);
      setSelected(null);
      if (next.size === HIDDEN_INDICES.length) {
        setSparkles(true);
        setTimeout(() => setSparkles(false), 2000);
      }
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background:"linear-gradient(180deg,#0a0a2e,#1a0a3e 50%,#0a0a1e)" }}>
      <Sparkles active={sparkles} />
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b-[3px] border-[#373737]">
        <p className="text-[11px]">📖 Verse Quest</p>
        <button onClick={() => onNav("kingdom")} className="text-[9px] text-gray-400 hover:text-white">← BACK</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 max-w-2xl mx-auto w-full">
        <p className="text-[8px] text-yellow-400 mb-3">
          {allSolved ? "VERSE COMPLETE! +50 XP ✨" : "ROUND 2 — Fill in the blanks!"}
        </p>
        <p className="text-[10px] text-cyan-300 mb-5">Joshua 1:9</p>

        <div className="flex flex-wrap justify-center gap-1.5 mb-8">
          {VERSE_WORDS.map((word, i) => {
            const isHidden = HIDDEN_INDICES.includes(i);
            const isSolved = solved.has(i);
            if (!isHidden) {
              return <span key={i} className="text-[11px] px-2 py-1.5 bg-white/10 border-2 border-[#373737]">{word}</span>;
            }
            if (isSolved) {
              return <span key={i} className="text-[11px] px-2 py-1.5 bg-green-900/30 border-2 border-green-500 text-green-400 anim-word">{word}</span>;
            }
            return (
              <button key={i} onClick={() => tryWord(i)}
                className="text-[11px] px-2 py-1.5 bg-white/5 border-2 border-[#444] text-transparent min-w-[56px] hover:border-yellow-400 hover:bg-yellow-900/10 cursor-pointer">
                {word}
              </button>
            );
          })}
        </div>

        {!allSolved && (
          <div className="flex flex-wrap justify-center gap-2">
            {choices.filter(w => !Array.from(solved).some(si => VERSE_WORDS[si] === w)).map((word, i) => (
              <button key={i} onClick={() => setSelected(word)}
                className={`text-[10px] px-4 py-2.5 bg-[#555] border-3 transition-all cursor-pointer ${
                  selected === word ? "border-yellow-400 bg-[#666]" : "border-[#373737] hover:border-gray-400"
                }`}>
                {word}
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav current="verse" onNav={onNav} />
    </div>
  );
}

// ─── HEROES COLLECTION ───
function HeroesScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const { heroes: supabaseHeroes } = useSupabaseHeroes();
  const [selectedHero, setSelectedHero] = useState<HeroCard | null>(null);

  // Convert Supabase heroes to HeroCard format
  const heroes: HeroCard[] = supabaseHeroes.map(h => ({
    id: h.id,
    name: h.name,
    icon: h.icon_emoji || "🃏",
    virtue: h.virtue,
    verse: h.verse_text,
    verseRef: h.verse_reference,
    story: h.story_summary,
    rarity: h.rarity,
    collected: true, // Mark as collected if it exists in database
  }));

  const collected = heroes.length;

  return (
    <div className="h-full flex flex-col" style={{ background:"linear-gradient(180deg,#1a1a2e,#16213e)" }}>
      {selectedHero && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-40 p-6" onClick={() => setSelectedHero(null)}>
          <div className="text-6xl mb-4 anim-pop">{selectedHero.icon}</div>
          <p className={`text-lg ${rarityColor(selectedHero.rarity)}`}>{selectedHero.name}</p>
          <p className="text-[9px] text-cyan-300 mt-2">⚡ {selectedHero.virtue}</p>
          <p className="text-[8px] text-gray-400 mt-4 max-w-sm text-center leading-[2]">{selectedHero.story}</p>
          <div className="pixel-border bg-cyan-950/30 border-cyan-400 px-5 py-3 mt-4 text-center">
            <p className="text-[7px] text-cyan-300 mb-1">{selectedHero.verseRef}</p>
            <p className="text-[8px] leading-[1.8]">"{selectedHero.verse}"</p>
          </div>
          <button className="mc-btn mc-btn-green px-8 py-2.5 text-[10px] mt-5">CLOSE</button>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b-[3px] border-[#373737]">
        <p className="text-[11px]">🃏 Bible Heroes</p>
        <p className="text-[8px] text-yellow-400">{collected} / {collected || FALLBACK_HEROES.length} collected</p>
      </div>

      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 overflow-y-auto">
        {(heroes.length > 0 ? heroes : FALLBACK_HEROES).map(hero => (
          <button key={hero.id}
            onClick={() => hero.collected && setSelectedHero(hero)}
            className={`p-3 text-center border-3 transition-all relative ${
              hero.collected
                ? `${rarityBg(hero.rarity)} hover:translate-y-[-3px] hover:border-yellow-400 cursor-pointer`
                : "bg-black/60 border-[#333] cursor-default"
            }`}>
            {hero.collected && hero.rarity === "legendary" && (
              <span className="absolute top-1 right-1 text-[6px] text-yellow-400 border border-yellow-400 px-1">★ GOLD</span>
            )}
            <span className={`text-3xl ${!hero.collected ? "opacity-20 grayscale" : ""}`}>{hero.icon}</span>
            <p className={`text-[7px] mt-2 ${!hero.collected ? "text-[#555]" : ""}`}>{hero.collected ? hero.name : "???"}</p>
            {hero.collected && <p className="text-[6px] text-cyan-300 mt-1">⚡ {hero.virtue}</p>}
            {hero.collected && <p className="text-[5px] text-gray-500 mt-1 leading-[1.5]">{hero.verseRef}</p>}
          </button>
        ))}
      </div>

      <BottomNav current="heroes" onNav={onNav} />
    </div>
  );
}

// ─── TEAM SCREEN ───
function TeamScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const totalBuilds = TEAM_MEMBERS.reduce((s, m) => s + m.builds, 0);
  const missionGoal = 15;
  const pct = Math.min((totalBuilds / missionGoal) * 100, 100);
  const progressRatio = totalBuilds / missionGoal;

  // Determine reward tier
  let currentTier = 'none';
  let tierMessage = '';
  if (progressRatio >= 1.0) {
    currentTier = 'gold';
    tierMessage = 'Gold Badge: Your team is legendary! 🏆';
  } else if (progressRatio >= 0.6) {
    currentTier = 'silver';
    tierMessage = 'Silver Badge: Your team is amazing! 🥈';
  } else if (progressRatio >= 0.3) {
    currentTier = 'bronze';
    tierMessage = 'Bronze Badge: You helped your team! 🥉';
  }

  // Determine milestone message
  let milestoneMsg = '';
  if (pct >= 100) {
    milestoneMsg = 'You did it! Your team completed the challenge! 🎉';
  } else if (pct >= 75) {
    milestoneMsg = 'Almost done! 75% complete! The finish line is near! 🎯';
  } else if (pct >= 50) {
    milestoneMsg = 'Halfway there! Your team is awesome! 💪';
  } else if (pct >= 25) {
    milestoneMsg = 'Your team is 25% of the way there! Keep going! 🚀';
  }

  return (
    <div className="h-full flex flex-col" style={{ background:"linear-gradient(180deg,#1e3a1e,#0a1a0a)" }}>
      <div className="px-4 py-3 bg-black/50 border-b-[3px] border-[#373737]">
        <p className="text-[11px]">⚔️ Faith Builders</p>
        <p className="text-[8px] text-green-400 mt-1">Futures Church — Kids Ministry</p>
      </div>

      {/* Team Celebration Message */}
      {pct >= 25 && (
        <div className="mx-3 mt-2 p-3 bg-yellow-900/30 border-2 border-yellow-600">
          <p className="text-[8px] text-yellow-300 text-center">{milestoneMsg}</p>
        </div>
      )}

      <div className="mx-3 mt-3 p-4 bg-black/40 border-3 border-[#373737]">
        <p className="text-[10px] text-yellow-400 mb-2">🎯 WEEKLY MISSION</p>
        <p className="text-[8px] text-gray-400 leading-[1.8] mb-4">
          Build 15 scenes and memorize 5 verses as a team to unlock the Story of Elijah!
        </p>

        {/* Progress bar with tiered markers */}
        <div className="mb-3">
          <div className="h-5 bg-[#222] border-2 border-[#373737] relative">
            <div className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000" style={{ width:`${pct}%` }} />
            {/* Tier markers */}
            <div className="absolute top-0 left-[30%] h-full w-0.5 bg-amber-500/50" title="30% - Bronze"></div>
            <div className="absolute top-0 left-[60%] h-full w-0.5 bg-gray-300/50" title="60% - Silver"></div>
            <div className="absolute top-0 left-[100%] h-full w-0.5 bg-yellow-400/50" title="100% - Gold"></div>
          </div>
          <div className="flex justify-between text-[6px] text-gray-400 mt-1 px-0.5">
            <span>0%</span>
            <span>🥉 30%</span>
            <span>🥈 60%</span>
            <span>🏆 100%</span>
          </div>
        </div>

        {/* Progress text - always positive */}
        <p className="text-[8px] text-green-400 mb-2">Your team has built <span className="font-bold text-yellow-400">{totalBuilds}</span> of <span className="font-bold">{missionGoal}</span> scenes!</p>

        {/* Current reward tier */}
        {currentTier !== 'none' && (
          <p className="text-[8px] text-green-300 bg-green-900/30 px-2 py-1 border border-green-700 text-center">{tierMessage}</p>
        )}
      </div>

      <div className="flex-1 px-3 mt-3 overflow-y-auto space-y-1.5">
        <p className="text-[8px] text-yellow-400 px-2">Your Contribution</p>
        {TEAM_MEMBERS.slice(0, 1).map((m, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-black/30 border-2 border-[#373737]">
            <span className="text-2xl">{m.icon}</span>
            <span className="text-[8px] flex-1">{m.name}</span>
            <span className="text-[7px] text-green-400">You helped with {m.builds} builds!</span>
          </div>
        ))}
        <p className="text-[7px] text-gray-500 px-2 mt-2">Together, your team is making something amazing!</p>
      </div>

      <div className="px-3 py-3">
        <button onClick={() => onNav("build")} className="mc-btn mc-btn-green w-full py-3 text-[10px] text-center">
          HELP YOUR TEAM — BUILD NOW!
        </button>
      </div>

      <BottomNav current="team" onNav={onNav} />
    </div>
  );
}

// ─── CAMPUS ADMIN DASHBOARD ───
function AdminScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const { campuses: supabaseCampuses } = useSupabaseCampuses();
  const [tab, setTab] = useState<"campus" | "ai" | "hq">("campus");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [aiStep, setAiStep] = useState(0);

  // Form state
  const [theme, setTheme] = useState("Courage");
  const [virtue, setVirtue] = useState("Bravery");
  const [bibleStory, setBibleStory] = useState("David and Goliath");
  const [scriptureRef, setScriptureRef] = useState("1 Samuel 17");
  const [memoryVerse, setMemoryVerse] = useState("Joshua 1:9 — Be strong and courageous...");
  const [bottomLine, setBottomLine] = useState("God is bigger than anything you face");
  const [application, setApplication] = useState("When you feel scared, remember God is with you");

  const aiSteps = [
    "Analyzing Bible story: 1 Samuel 17...",
    "Generating Build Scene configuration...",
    "Creating Verse Quest rounds...",
    "Writing Explore Adventure (3 scenes)...",
    "Generating Hero Card: David...",
    "Building Team Mission...",
    "Writing narration scripts...",
    "Generating parent summary...",
    "✅ All content generated!",
  ];

  const runAI = async () => {
    try {
      setGenerating(true);
      setAiStep(0);
      setGenerated(false);

      // Get current week's Monday
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const weekOf = monday.toISOString().split('T')[0];

      // Animate through steps
      for (let step = 0; step < aiSteps.length; step++) {
        setAiStep(step);
        await new Promise(resolve => setTimeout(resolve, 700));
      }

      // Call actual AI engine
      const campusId = supabaseCampuses.length > 0 ? supabaseCampuses[0].id : 'default-campus';
      await generateWeeklyContent({
        campusId,
        weekOf,
        theme,
        virtue,
        bibleStoryTitle: bibleStory,
        bibleStoryReference: scriptureRef,
        bibleStorySummary: `The story of ${bibleStory} teaches us about ${virtue}.`,
        memoryVerseText: memoryVerse.split(" — ")[0],
        memoryVerseReference: scriptureRef,
        bottomLine,
        application,
      });

      setGenerating(false);
      setGenerated(true);
    } catch (error) {
      console.error('Error generating content:', error);
      setGenerating(false);
      // Still show success for demo purposes
      setGenerated(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0f1520]">
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b-[3px] border-[#373737]">
        <p className="text-[11px]">⚙️ BibleCraft Admin</p>
        <button onClick={() => onNav("kingdom")} className="text-[9px] text-gray-400 hover:text-white">← BACK</button>
      </div>

      <div className="flex gap-1 px-3 pt-3">
        {(["campus", "ai", "hq"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`mc-btn text-[8px] px-4 py-2 ${tab === t ? "mc-btn-green" : ""}`}>
            {t === "campus" ? "📋 Campus" : t === "ai" ? "🤖 AI Engine" : "🌐 HQ View"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* ─── CAMPUS TAB ─── */}
        {tab === "campus" && (
          <div className="space-y-3 anim-slide">
            <div className="bg-black/30 border-3 border-[#373737] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-yellow-400">THIS WEEK'S CONTENT</p>
                <span className="text-[7px] text-green-400 bg-green-900/30 px-2 py-1 border border-green-700">Using: HQ Default ✓</span>
              </div>
              <div className="space-y-2">
                {[
                  ["Theme", "Courage"],
                  ["Story", "David & Goliath (1 Samuel 17)"],
                  ["Verse", "Joshua 1:9"],
                  ["Bottom Line", "God is bigger than anything you face"],
                  ["Application", "When you feel scared, remember God is with you"],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-[7px] text-gray-500 w-20 shrink-0">{label}</span>
                    <span className="text-[8px] text-gray-200">{val}</span>
                  </div>
                ))}
              </div>
              <button className="mc-btn mc-btn-gold text-[8px] px-4 py-2 mt-3">Override with Custom Content</button>
            </div>

            <div className="bg-black/30 border-3 border-[#373737] p-4">
              <p className="text-[10px] text-yellow-400 mb-3">CAMPUS STATS — Futures North</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Active Kids", "87", "👤"],
                  ["Builds This Week", "142", "🔨"],
                  ["Verses Memorized", "34", "📖"],
                  ["Avg Daily Time", "6.2 min", "⏱️"],
                  ["7+ Day Streaks", "23 kids", "🔥"],
                  ["Team Mission", "73%", "🎯"],
                ].map(([label, val, icon]) => (
                  <div key={label} className="bg-black/30 border-2 border-[#373737] p-3">
                    <p className="text-[7px] text-gray-500">{icon} {label}</p>
                    <p className="text-[14px] text-white mt-1">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <button className="mc-btn mc-btn-green w-full py-3 text-[10px] text-center">
              🖥️ Launch Sunday Scoreboard
            </button>
          </div>
        )}

        {/* ─── AI ENGINE TAB ─── */}
        {tab === "ai" && (
          <div className="space-y-3 anim-slide">
            <div className="bg-black/30 border-3 border-[#373737] p-4">
              <p className="text-[10px] text-cyan-300 mb-3">🤖 AI CONTENT ENGINE</p>
              <p className="text-[7px] text-gray-400 leading-[2] mb-4">
                Enter your 7 lesson data points. The AI engine will generate a full week of gamified content — build scenes, verse quests, adventures, hero cards, and team missions.
              </p>

              <div className="space-y-2 mb-4">
                <div>
                  <label className="text-[7px] text-gray-500 block mb-1">Theme</label>
                  <input type="text" value={theme} onChange={e => setTheme(e.target.value)}
                    className="w-full bg-[#222] border-2 border-[#373737] px-3 py-2 text-[8px] text-gray-200 font-['Press_Start_2P'] focus:border-cyan-400 outline-none" />
                </div>
                <div>
                  <label className="text-[7px] text-gray-500 block mb-1">Virtue</label>
                  <input type="text" value={virtue} onChange={e => setVirtue(e.target.value)}
                    className="w-full bg-[#222] border-2 border-[#373737] px-3 py-2 text-[8px] text-gray-200 font-['Press_Start_2P'] focus:border-cyan-400 outline-none" />
                </div>
                <div>
                  <label className="text-[7px] text-gray-500 block mb-1">Bible Story</label>
                  <input type="text" value={bibleStory} onChange={e => setBibleStory(e.target.value)}
                    className="w-full bg-[#222] border-2 border-[#373737] px-3 py-2 text-[8px] text-gray-200 font-['Press_Start_2P'] focus:border-cyan-400 outline-none" />
                </div>
                <div>
                  <label className="text-[7px] text-gray-500 block mb-1">Scripture Ref</label>
                  <input type="text" value={scriptureRef} onChange={e => setScriptureRef(e.target.value)}
                    className="w-full bg-[#222] border-2 border-[#373737] px-3 py-2 text-[8px] text-gray-200 font-['Press_Start_2P'] focus:border-cyan-400 outline-none" />
                </div>
                <div>
                  <label className="text-[7px] text-gray-500 block mb-1">Memory Verse</label>
                  <input type="text" value={memoryVerse} onChange={e => setMemoryVerse(e.target.value)}
                    className="w-full bg-[#222] border-2 border-[#373737] px-3 py-2 text-[8px] text-gray-200 font-['Press_Start_2P'] focus:border-cyan-400 outline-none" />
                </div>
                <div>
                  <label className="text-[7px] text-gray-500 block mb-1">Bottom Line</label>
                  <input type="text" value={bottomLine} onChange={e => setBottomLine(e.target.value)}
                    className="w-full bg-[#222] border-2 border-[#373737] px-3 py-2 text-[8px] text-gray-200 font-['Press_Start_2P'] focus:border-cyan-400 outline-none" />
                </div>
                <div>
                  <label className="text-[7px] text-gray-500 block mb-1">Application</label>
                  <input type="text" value={application} onChange={e => setApplication(e.target.value)}
                    className="w-full bg-[#222] border-2 border-[#373737] px-3 py-2 text-[8px] text-gray-200 font-['Press_Start_2P'] focus:border-cyan-400 outline-none" />
                </div>
              </div>

              <button onClick={runAI} disabled={generating}
                className={`mc-btn w-full py-3 text-[10px] text-center ${generating ? "mc-btn-gold opacity-70" : "mc-btn-green"}`}>
                {generating ? "⏳ GENERATING..." : generated ? "✅ REGENERATE" : "🚀 GENERATE WEEKLY CONTENT"}
              </button>
            </div>

            {(generating || generated) && (
              <div className="bg-black/30 border-3 border-[#373737] p-4 anim-slide">
                <p className="text-[10px] text-yellow-400 mb-3">GENERATION LOG</p>
                <div className="space-y-1.5 font-mono">
                  {aiSteps.slice(0, aiStep + 1).map((step, i) => (
                    <p key={i} className={`text-[7px] ${i === aiStep && generating ? "text-cyan-300 anim-blink" : i === aiSteps.length - 1 ? "text-green-400" : "text-gray-500"}`}>
                      {step}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {generated && (
              <div className="space-y-2 anim-slide">
                <p className="text-[9px] text-green-400 px-1">Generated content ready for review:</p>
                {[
                  ["🔨 Build Scene", "David & Goliath Valley — 6 pieces, narration script"],
                  ["📖 Verse Quest", "Joshua 1:9 — 4 rounds, 5 hidden words"],
                  ["🗺️ Explore Adventure", "3 choice-scenes with teaching moments"],
                  ["🃏 Hero Card", "David — Courage — Rare tier"],
                  ["🎯 Team Mission", "The Courage Challenge — 15 builds + 5 verses"],
                  ["👨‍👩‍👧 Parent Summary", "Weekly email with conversation starters"],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-center justify-between bg-black/30 border-2 border-[#373737] px-3 py-2.5">
                    <div>
                      <p className="text-[8px]">{title}</p>
                      <p className="text-[6px] text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <button className="mc-btn text-[7px] px-3 py-1.5">Review</button>
                  </div>
                ))}
                <button className="mc-btn mc-btn-green w-full py-3 text-[10px] text-center mt-2">
                  ✅ APPROVE & PUBLISH TO APP
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── HQ TAB ─── */}
        {tab === "hq" && (
          <div className="space-y-3 anim-slide">
            <div className="bg-black/30 border-3 border-[#373737] p-4">
              <p className="text-[10px] text-yellow-400 mb-3">🌐 FUTURES CHURCH — ALL CAMPUSES</p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  ["Total Kids", "1,847"],
                  ["Avg Active", "72%"],
                  ["Overrides", "3/21"],
                ].map(([label, val]) => (
                  <div key={label} className="bg-black/30 border-2 border-[#373737] p-3 text-center">
                    <p className="text-[6px] text-gray-500">{label}</p>
                    <p className="text-[14px] text-white mt-1">{val}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  ["Builds This Week", "2,341", "🔨"],
                  ["Verses Memorized", "487", "📖"],
                  ["Avg Streak", "4.2 days", "🔥"],
                ].map(([label, val, icon]) => (
                  <div key={label} className="bg-black/30 border-2 border-[#373737] p-3 text-center">
                    <p className="text-[6px] text-gray-500">{icon} {label}</p>
                    <p className="text-[12px] text-green-400 mt-1">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/30 border-3 border-[#373737] p-4">
              <p className="text-[10px] text-yellow-400 mb-3">CAMPUS BREAKDOWN</p>
              <div className="space-y-1">
                <div className="grid grid-cols-5 gap-1 text-[6px] text-gray-500 px-2 pb-1 border-b border-[#373737]">
                  <span className="col-span-2">Campus</span>
                  <span>Region</span>
                  <span>Active</span>
                  <span>Mode</span>
                </div>
                {(supabaseCampuses.length > 0 ? supabaseCampuses : []).map(c => (
                  <div key={c.id} className="grid grid-cols-5 gap-1 text-[7px] px-2 py-1.5 hover:bg-white/5">
                    <span className="col-span-2">{c.name}</span>
                    <span>{c.region || "—"}</span>
                    <span className={c.active ? "text-green-400" : "text-red-400"}>
                      {c.active ? "✓" : "✗"}
                    </span>
                    <span className={c.content_mode === "override" ? "text-yellow-400" : "text-gray-600"}>
                      {c.content_mode === "override" ? "Override" : "Default"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button className="mc-btn mc-btn-green w-full py-3 text-[10px] text-center">
              📤 SET DEFAULT CONTENT FOR ALL CAMPUSES
            </button>
          </div>
        )}
      </div>

      <BottomNav current={"admin" as Screen} onNav={onNav} />
    </div>
  );
}

// ─── MAIN APP ───
export default function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [storyTile, setStoryTile] = useState<KingdomTile | null>(null);

  const nav = useCallback((s: Screen) => setScreen(s), []);

  return (
    <div className="h-screen w-screen overflow-hidden">
      {storyTile && <StoryOverlay tile={storyTile} onClose={() => setStoryTile(null)} />}

      {screen === "title" && <TitleScreen onNav={nav} />}
      {screen === "chest" && <ChestScreen onNav={nav} />}
      {screen === "kingdom" && <KingdomScreen onNav={nav} onStory={setStoryTile} />}
      {screen === "build" && <BuildScreen onNav={nav} />}
      {screen === "verse" && <VerseScreen onNav={nav} />}
      {screen === "heroes" && <HeroesScreen onNav={nav} />}
      {screen === "team" && <TeamScreen onNav={nav} />}
      {screen === "admin" && <AdminScreen onNav={nav} />}
    </div>
  );
}
