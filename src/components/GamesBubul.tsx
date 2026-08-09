import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  Trophy, 
  Zap, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Flame, 
  Award, 
  BrainCircuit, 
  Volume2, 
  VolumeX, 
  Target,
  Clock,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Share2,
  Crown
} from 'lucide-react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';
import { db, collection, setDoc, doc, onSnapshot } from '../lib/firebase';

// Helper for Web Audio API sounds
const playSoundEffect = (type: 'pop' | 'correct' | 'wrong' | 'win' | 'combo') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'combo') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {}
};

// Helper to shuffle arrays (Fisher-Yates)
const shuffleArray = <T,>(arr: T[]): T[] => {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// HARD QUIZ QUESTIONS (Soal-soal Susah Berpikir Kritis & Echo Chamber)
interface Question {
  id: number;
  category: string;
  question: string;
  scenario?: string;
  options: { text: string; isCorrect: boolean; reason: string }[];
  difficulty: 'Sangat Susah' | 'Master' | 'Ekstrem';
  explanation: string;
}

const HARD_QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Echo Chamber vs Epistemic Bubble",
    difficulty: "Master",
    question: "Apa perbedaan fundamental paling krusial antara 'Epistemic Bubble' dan 'Echo Chamber' menurut teori epistemologi sosial kontemporer?",
    scenario: "Komunitas A hanya terpapar berita dari satu kelompok karena algoritma media sosial (tidak sengaja). Komunitas B secara aktif mendiskreditkan dan menyerang semua sumber berita luar sebagai 'agen musuh'.",
    options: [
      { 
        text: "Epistemic Bubble hanya terjadi di lingkungan nyata, sedangkan Echo Chamber murni merupakan produk sampingan algoritma media sosial digital.", 
        isCorrect: false, 
        reason: "Salah. Keduanya bisa terbentuk baik secara online maupun offline." 
      },
      { 
        text: "Epistemic Bubble terbentuk karena suara luar terlewatkan, sedangkan Echo Chamber secara aktif melatih anggotanya meragukan dan menolak sumber luar.", 
        isCorrect: true, 
        reason: "Benar! Epistemic bubble adalah struktur di mana suara luar terlewatkan (omission), sedangkan Echo chamber adalah struktur di mana suara luar didiskreditkan secara sistematis (discrediting)." 
      },
      { 
        text: "Epistemic Bubble dipicu oleh manipulasi bot AI terkoordinasi, sedangkan Echo Chamber dipicu oleh tingkat pendidikan pengguna yang relatif rendah.", 
        isCorrect: false, 
        reason: "Salah. Kedua fenomena melibatkan peran psikologi kognitif manusia dan struktur komunikasi jaringan." 
      },
      { 
        text: "Tidak ada perbedaan mendasar, keduanya adalah istilah linguistik yang merujuk pada fenomena isolasi informasi yang persis sama dalam ruang sains.", 
        isCorrect: false, 
        reason: "Salah. Ahli filsafat C. Thi Nguyen membedakannya secara tajam dari aspek epistemic trust." 
      }
    ],
    explanation: "C. Thi Nguyen (2018) menjelaskan bahwa dalam 'Epistemic Bubble', anggota belum mendengar pandangan bertentangan. Namun dalam 'Echo Chamber', anggota *telah mendengar* pandangan lawan tetapi kepercayaan mereka pada sumber luar telah dihancurkan sistematis melalui teknik pendiskreditan."
  },
  {
    id: 2,
    category: "Algorithmic Amplification & Hostile Media Effect",
    difficulty: "Sangat Susah",
    question: "Manakah contoh dari 'Hostile Media Effect' yang dipicu oleh paparan berulang dalam Filter Bubble?",
    scenario: "Seorang pendukung kandidat X membaca artikel berita yang sangat netral dan objektif menyajikan data statistik berimbang dari kedua kandidat.",
    options: [
      { 
        text: "Pembaca langsung mengubah pandangan politiknya menjadi netral setelah membaca penyajian data statistik dan data fakta berimbang seluruh kandidat.", 
        isCorrect: false, 
        reason: "Salah. Efek ini justru membuat pandangan individu semakin radikal karena merasa diserang." 
      },
      { 
        text: "Pembaca membagikan artikel netral tersebut ke kelompok oposisi untuk memicu perdebatan publik yang berimbang, sehat, dan terbuka secara konstruktif.", 
        isCorrect: false, 
        reason: "Salah. Partisan yang terkena bias ini cenderung menutup diri dan mengecam media tersebut." 
      },
      { 
        text: "Pembaca menganggap laporan berita netral dan berimbang tersebut sebenarnya sangat bias membela lawan dan bagian dari agenda konspirasi media musuh.", 
        isCorrect: true, 
        reason: "Tepat! Hostile Media Effect adalah bias psikologis di mana pendukung partisan menganggap berita netral/berimbang sebagai berita yang memusuhi posisi mereka." 
      },
      { 
        text: "Pembaca mengabaikan artikel secara total karena menganggap analisis data statistik yang disajikan terlalu rumit dan membosankan untuk dipahami.", 
        isCorrect: false, 
        reason: "Salah. Ini hanyalah apatisme kognitif, bukan Hostile Media Effect." 
      }
    ],
    explanation: "Hostile Media Effect membuktikan bahwa partisan yang telah berada di dalam echo chamber akan menganggap laporan berita yang paling berimbang sekalipun sebagai cerminan bias musuh."
  },
  {
    id: 3,
    category: "Logical Fallacy & Debunking Paradox",
    difficulty: "Ekstrem",
    question: "Mengapa strategi melakukan 'Debunking' (klarifikasi mitos) terkadang memicu 'Continued Influence Effect' atau 'Backfire Effect'?",
    scenario: "Pemerintah menerbitkan spanduk raksasa: 'TIDAK BENAR BAHWA VAKSIN MENGANDUNG CHIP 5G!' di seluruh sudut kota.",
    options: [
      { 
        text: "Audiens menolak penjelasan klarifikasi karena ukuran dan gaya penulisan spanduk sosialisasi pemerintah dianggap kurang terbaca dengan jelas oleh publik.", 
        isCorrect: false, 
        reason: "Salah. Masalah utamanya ada pada pemrosesan kognitif narasi di dalam otak." 
      },
      { 
        text: "Masyarakat secara instingtif akan selalu menolak setiap bentuk instruksi atau pengumuman sosialisasi resmi yang dikeluarkan oleh instansi pemerintah.", 
        isCorrect: false, 
        reason: "Salah. Ini generalisasi berlebihan tanpa dasar psikologi kognitif." 
      },
      { 
        text: "Narasi mitos, spekulasi, dan hoaks secara mutlak selalu lebih disukai oleh sistem otak manusia dalam kondisi psikologis masyarakat apa pun.", 
        isCorrect: false, 
        reason: "Salah. Desain narasi klarifikasi (Fact First) bisa memitigasi efek ini secara efektif." 
      },
      { 
        text: "Pengulangan narasi mitos saat mengklarifikasi justru memperkuat ingatan familiaritas tentang mitos tersebut di dalam memori kognitif audiens.", 
        isCorrect: true, 
        reason: "Sangat Benar! Memuat kalimat mitos dalam pernyataan klarifikasi membuat otak mengingat mitosnya daripada fakta perbaikannya (Familiarity Backfire Effect)." 
      }
    ],
    explanation: "Menurut Debunking Handbook, ketika kita mengulang klaim bohong sebelum memberikan fakta, otak manusia cenderung memproses familiaritas ingatan. Strategi yang benar adalah 'Fact-First': Sampaikan fakta yang benar terlebih dahulu sebelum menyebutkan misinformasi."
  },
  {
    id: 4,
    category: "Bias Konfirmasi & Naive Realism",
    difficulty: "Master",
    question: "Bagaimana fenomena 'Naive Realism' secara tidak sadar memperparah Polarisasi Digital di media sosial?",
    scenario: "Pengguna media sosial meyakini bahwa pandangan pribadinya adalah objektif dan berdasarkan fakta tanpa dipengaruhi emosi.",
    options: [
      { 
        text: "Pengguna secara sadar mengakui bahwa setiap individu memiliki persepsi subjektif masing-masing berdasarkan latar belakang sosial dan budayanya.", 
        isCorrect: false, 
        reason: "Salah. Ini justru kesadaran reflektif, kebalikan dari Naive Realism." 
      },
      { 
        text: "Pengguna mengasumsikan pandangan pribadinya adalah kenyataan murni, sehingga siapa pun yang berbeda pendapat dianggap bodoh atau berniat jahat.", 
        isCorrect: true, 
        reason: "Tepat Sekali! Naive Realism membuat orang percaya pandangan mereka adalah kenyataan murni, sehingga orang yang berbeda disimpulkan sebagai pihak yang tidak rasional atau jahat." 
      },
      { 
        text: "Pengguna selalu melakukan verifikasi silang dari setidaknya 5 media independen tepercaya sebelum menulis tanggapan atau komentar di ruang publik.", 
        isCorrect: false, 
        reason: "Salah. Naive Realism menghambat verifikasi karena merasa diri sudah pasti benar." 
      },
      { 
        text: "Pengguna memutuskan untuk berhenti total menggunakan platform media sosial karena menganggap seluruh algoritma linimasa telah terkontaminasi.", 
        isCorrect: false, 
        reason: "Salah. Tidak ada hubungannya dengan pengunduran diri dari teknologi." 
      }
    ],
    explanation: "Naive Realism adalah kognisi keliru bahwa kita melihat dunia 'sebagaimana adanya'. Akibatnya, ketika orang lain melihat hal berbeda, kita tidak mempertanyakan asumsi kita sendiri, melainkan langsung menuduh mereka mengalami bias atau manipulasi."
  },
  {
    id: 5,
    category: "Manipulasi Wacana & Astroturfing",
    difficulty: "Ekstrem",
    question: "Manakah indikator teknis utama yang membedakan gerakan 'Astroturfing' buatan dari gerakan 'Grassroots' organik di linimasa?",
    scenario: "Sebuah tagar politik mendadak menempati urutan nomor 1 Trending Topic hanya dalam waktu 15 menit dengan 50.000 twit.",
    options: [
      { 
        text: "Semua akun pengunggah tagar menggunakan foto profil wajah asli yang terverifikasi serta secara aktif membalas diskusi komentar warga lain.", 
        isCorrect: false, 
        reason: "Salah. Astroturfing kerap memakai stok foto curian atau foto buatan AI generator." 
      },
      { 
        text: "Tagar yang digunakan memuat susunan kata baku bahasa Indonesia yang sangat sopan serta sesuai dengan kaidah tata bahasa publik resmi.", 
        isCorrect: false, 
        reason: "Salah. Bahasa sopan bukan pembeda gerakan organik vs terkoordinasi." 
      },
      { 
        text: "Anomali grafik temporal yang melonjak tajam (spike), koordinasi posting dengan templat kalimat seragam, serta jaringan akun baru terkoordinasi.", 
        isCorrect: true, 
        reason: "Luar biasa! Astroturfing menggunakan bot/buzzer terkoordinasi sehingga pola penyebaran waktunya tidak alami dan pesan-pesannya seragam." 
      },
      { 
        text: "Gerakan opini warga secara organik tidak akan pernah mampu menembus atau menduduki posisi pertama daftar Trending Topic utama media sosial.", 
        isCorrect: false, 
        reason: "Salah. Gerakan organik bisa trending, namun kurva pertumbuhannya eksponensial bertahap, bukan lonjakan mendadak 15 menit." 
      }
    ],
    explanation: "Astroturfing adalah simulasi opini publik buatan yang dirancang agar terlihat seperti dukungan akar rumput (grassroots). Analisis jaringan menunjukkan pola korelasi waktu ketat dan duplikasi narasi yang sangat masif."
  },
  {
    id: 6,
    category: "Mekanisme Psikologi Groupthink",
    difficulty: "Master",
    question: "Dalam konteks grup diskusi tertutup (WhatsApp Group / Discord), apa gejala utama munculnya 'Groupthink' yang mematikan penalaran kritis?",
    scenario: "Sebuah grup alumni membagikan berita spekulatif tanpa sumber. Anggota yang ragu memilih diam.",
    options: [
      { 
        text: "Munculnya 'Self-Censorship' di mana anggota kelompok sengaja menahan gagasan keraguan demi menjaga ilusi kesepakatan dan keharmonisan bersama.", 
        isCorrect: true, 
        reason: "Tepat! Self-censorship dan illusion of unanimity (ilusi kesepakatan) adalah pilar Groupthink yang mencegah validasi fakta." 
      },
      { 
        text: "Setiap anggota kelompok saling berdebat sengit dan secara aktif menukar bukti data objektif dari jurnal ilmiah tepercaya secara terbuka.", 
        isCorrect: false, 
        reason: "Salah. Perdebatan ilmiah adalah indikator diskusi yang sehat, bukan Groupthink." 
      },
      { 
        text: "Admin dan anggota kelompok secara proaktif mengundang pakar ahli atau akademisi dari luar untuk menguji kebenaran setiap klaim narasi.", 
        isCorrect: false, 
        reason: "Salah. Groupthink justru resisten terhadap pandangan pakar luar." 
      },
      { 
        text: "Kelompok diskusi tersebut secara otomatis akan dibubarkan langsung oleh para anggotanya dalam kurun waktu kurang dari 24 jam pertama.", 
        isCorrect: false, 
        reason: "Salah. Groupthink justru memperkuat ikatan fanatik antar-anggota grup." 
      }
    ],
    explanation: "Groupthink didefinisikan oleh Irving Janis sebagai fenomena psikologis di mana hasrat akan keharmonisan dalam kelompok mengesampingkan evaluasi realistis atas alternatif tindakan atau informasi."
  }
];

// ARCADE POP GAME QUESTIONS (Pertanyaan Cepat untuk Game Letupkan Balon)
interface PopChallenge {
  question: string;
  targetType: 'BIAS' | 'FACT' | 'FALLACY';
  bubbles: { id: string; text: string; isCorrect: boolean }[];
}

const POP_CHALLENGES: PopChallenge[] = [
  {
    question: "PETUNJUK: Letupkan Gelembung yang memuat 'BIAS KONFIRMASI'!",
    targetType: 'BIAS',
    bubbles: [
      { id: 'b1', text: "Hanya mencari berita yang cocok dengan tebakanku", isCorrect: true },
      { id: 'b2', text: "Membaca argumen oposisi dari 3 sumber berbeda", isCorrect: false },
      { id: 'b3', text: "Mengecek kredibilitas penulis artikel ilmiah", isCorrect: false },
      { id: 'b4', text: "Melihat data statistik resmi pemerintah", isCorrect: false }
    ]
  },
  {
    question: "PETUNJUK: Letupkan Gelembung yang memuat 'LOGICAL FALLACY (Ad Hominem)'!",
    targetType: 'FALLACY',
    bubbles: [
      { id: 'b1', text: "Pendapatmu salah karena kamu masih belum lulus kuliah!", isCorrect: true },
      { id: 'b2', text: "Data ini tidak valid karena sampelnya hanya 5 orang", isCorrect: false },
      { id: 'b3', text: "Metode penelitian ini kurang merepresentasikan populasi", isCorrect: false },
      { id: 'b4', text: "Kesimpulan statistik ini mengabaikan variabel luar", isCorrect: false }
    ]
  },
  {
    question: "PETUNJUK: Letupkan Gelembung yang memuat 'INDIKATOR FILTER BUBBLE'!",
    targetType: 'BIAS',
    bubbles: [
      { id: 'b1', text: "Linimasa hanya menampilkan berita sejenis sesuai riwayat klik", isCorrect: true },
      { id: 'b2', text: "Mendapat rekomendasi konten yang bervariasi dari seluruh dunia", isCorrect: false },
      { id: 'b3', text: "Algoritma menghapus postingan spam secara otomatis", isCorrect: false },
      { id: 'b4', text: "Menampilkan peringatan verifikasi fakta di bawah artikel", isCorrect: false }
    ]
  },
  {
    question: "PETUNJUK: Letupkan Gelembung yang memuat 'TINDAKAN LITERASI DIGITAL KRITIS'!",
    targetType: 'FACT',
    bubbles: [
      { id: 'b1', text: "Melakukan Latar Belakang Cek (Lateral Reading) sebelum share", isCorrect: true },
      { id: 'b2', text: "Langsung membagikan berita headline emosional ke grup WA", isCorrect: false },
      { id: 'b3', text: "Percaya 100% pada potongan video TikTok berdurasi 5 detik", isCorrect: false },
      { id: 'b4', text: "Menganggap semua berita dari kawan dekat pasti benar", isCorrect: false }
    ]
  }
];

export default function GamesBubul() {
  const { user, addXP } = useStore();
  const [gameMode, setGameMode] = useState<'menu' | 'arcade' | 'quiz' | 'leaderboard'>('menu');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- SHUFFLED QUESTION STATES ---
  const [quizQuestions, setQuizQuestions] = useState<Question[]>(() =>
    shuffleArray(HARD_QUESTIONS).map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }))
  );

  const [popChallenges, setPopChallenges] = useState<PopChallenge[]>(() =>
    shuffleArray(POP_CHALLENGES).map((c) => ({
      ...c,
      bubbles: shuffleArray(c.bubbles),
    }))
  );

  // --- QUIZ MODE STATES ---
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [quizSelectedOpt, setQuizSelectedOpt] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizTimeLeft, setQuizTimeLeft] = useState(25);
  const [quizFinished, setQuizFinished] = useState(false);

  // --- ARCADE POP STATES ---
  const [popChallengeIdx, setPopChallengeIdx] = useState(0);
  const [popScore, setPopScore] = useState(0);
  const [popCombo, setPopCombo] = useState(1);
  const [poppedIds, setPoppedIds] = useState<string[]>([]);
  const [popTimeLeft, setPopTimeLeft] = useState(30);
  const [popFinished, setPopFinished] = useState(false);

  // --- LEADERBOARD & FIRESTORE STATES ---
  const [leaderboardData, setLeaderboardData] = useState<{ name: string; score: number; mode: string; avatar: string }[]>([]);

  // Sound wrapper
  const triggerSound = (type: 'pop' | 'correct' | 'wrong' | 'win' | 'combo') => {
    if (soundEnabled) playSoundEffect(type);
  };

  // Helper to load local saved scores
  const getLocalLeaderboard = () => {
    try {
      const stored = localStorage.getItem("outbubble_game_lb");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Helper to merge and sort leaderboard items from real user entries
  const mergeLeaderboards = (firestoreList: any[]) => {
    const localList = getLocalLeaderboard();
    const map = new Map<string, any>();

    // Add local list
    localList.forEach((item: any) => {
      const key = `${item.name}-${item.mode}`;
      const existing = map.get(key);
      if (!existing || item.score > existing.score) {
        map.set(key, item);
      }
    });

    // Add firestore list
    firestoreList.forEach((item: any) => {
      const key = `${item.name}-${item.mode}`;
      const existing = map.get(key);
      if (!existing || item.score > existing.score) {
        map.set(key, item);
      }
    });

    const combined = Array.from(map.values());
    combined.sort((a, b) => (b.score || 0) - (a.score || 0));
    return combined.slice(0, 10);
  };

  // Sync Leaderboard from Firestore & LocalStorage
  useEffect(() => {
    let unsub = () => {};
    try {
      const lbRef = collection(db, "game_leaderboard");
      unsub = onSnapshot(lbRef, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data());
        });
        const merged = mergeLeaderboards(list);
        setLeaderboardData(merged);
      }, () => {
        setLeaderboardData(mergeLeaderboards([]));
      });
    } catch (e) {
      setLeaderboardData(mergeLeaderboards([]));
    }
    return () => unsub();
  }, []);

  // Save High Score helper
  const saveHighScore = async (finalScore: number, modeName: string) => {
    const username = user?.username || "Warga OutBubble";
    const avatar = user?.photoUrl || "Felix";
    
    // Add XP to user store
    if (addXP) addXP(Math.round(finalScore / 2));

    const newEntry = {
      name: username,
      score: finalScore,
      mode: modeName,
      avatar: avatar,
      timestamp: Date.now()
    };

    // 1. Save to local storage immediately
    try {
      const localList = getLocalLeaderboard();
      const updatedLocal = [...localList.filter((item: any) => !(item.name === username && item.mode === modeName)), newEntry];
      localStorage.setItem("outbubble_game_lb", JSON.stringify(updatedLocal));
      setLeaderboardData(mergeLeaderboards([]));
    } catch (e) {}

    // 2. Save to Firestore in background
    try {
      const docId = `score-${user?.id || 'anon'}-${modeName.replace(/\s+/g, '')}`;
      await setDoc(doc(db, "game_leaderboard", docId), newEntry);
    } catch (e) {}
  };

  // --- QUIZ TIMER LOGIC ---
  useEffect(() => {
    if (gameMode !== 'quiz' || quizAnswered || quizFinished) return;

    if (quizTimeLeft <= 0) {
      // Time's up -> handle as wrong
      setQuizAnswered(true);
      setQuizStreak(0);
      triggerSound('wrong');
      return;
    }

    const timer = setInterval(() => {
      setQuizTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode, quizTimeLeft, quizAnswered, quizFinished]);

  // --- ARCADE POP TIMER LOGIC ---
  useEffect(() => {
    if (gameMode !== 'arcade' || popFinished) return;

    if (popTimeLeft <= 0) {
      setPopFinished(true);
      triggerSound('win');
      saveHighScore(popScore, "Arcade Pop");
      return;
    }

    const timer = setInterval(() => {
      setPopTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode, popTimeLeft, popFinished, popScore]);

  // Start Quiz Mode with reshuffled options & questions
  const startQuizMode = () => {
    const preparedQuestions = shuffleArray(HARD_QUESTIONS).map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }));
    setQuizQuestions(preparedQuestions);
    setCurrentQuizIdx(0);
    setQuizScore(0);
    setQuizStreak(0);
    setQuizSelectedOpt(null);
    setQuizAnswered(false);
    setQuizTimeLeft(25);
    setQuizFinished(false);
    setGameMode('quiz');
  };

  // Start Arcade Mode with reshuffled challenge bubbles
  const startArcadeMode = () => {
    const preparedChallenges = shuffleArray(POP_CHALLENGES).map((c) => ({
      ...c,
      bubbles: shuffleArray(c.bubbles),
    }));
    setPopChallenges(preparedChallenges);
    setPopChallengeIdx(0);
    setPopScore(0);
    setPopCombo(1);
    setPoppedIds([]);
    setPopTimeLeft(35);
    setPopFinished(false);
    setGameMode('arcade');
  };

  // Handle Quiz Answer Choice
  const handleQuizAnswer = (optIdx: number) => {
    if (quizAnswered) return;

    setQuizSelectedOpt(optIdx);
    setQuizAnswered(true);

    const activeList = quizQuestions.length > 0 ? quizQuestions : HARD_QUESTIONS;
    const q = activeList[currentQuizIdx];
    const isCorrect = q.options[optIdx].isCorrect;

    if (isCorrect) {
      triggerSound('correct');
      const timeBonus = quizTimeLeft * 10;
      const streakBonus = quizStreak * 25;
      const earned = 100 + timeBonus + streakBonus;
      setQuizScore((prev) => prev + earned);
      setQuizStreak((prev) => prev + 1);
    } else {
      triggerSound('wrong');
      setQuizStreak(0);
    }
  };

  // Next Quiz Question
  const handleNextQuizQuestion = () => {
    const activeList = quizQuestions.length > 0 ? quizQuestions : HARD_QUESTIONS;
    if (currentQuizIdx + 1 < activeList.length) {
      setCurrentQuizIdx((prev) => prev + 1);
      setQuizSelectedOpt(null);
      setQuizAnswered(false);
      setQuizTimeLeft(25);
    } else {
      setQuizFinished(true);
      triggerSound('win');
      saveHighScore(quizScore, "Master Quiz");
    }
  };

  // Handle Pop Bubble Click
  const handlePopBubble = (bubbleId: string, isCorrect: boolean) => {
    if (poppedIds.includes(bubbleId) || popFinished) return;

    triggerSound('pop');
    setPoppedIds((prev) => [...prev, bubbleId]);

    const activePopList = popChallenges.length > 0 ? popChallenges : POP_CHALLENGES;
    const currentCh = activePopList[popChallengeIdx];

    if (isCorrect) {
      triggerSound('combo');
      const added = 50 * popCombo;
      setPopScore((prev) => prev + added);
      setPopCombo((prev) => Math.min(prev + 1, 5));

      // Check if all correct ones are popped
      const correctBubbles = currentCh.bubbles.filter((b) => b.isCorrect).map((b) => b.id);
      const remainingCorrect = correctBubbles.filter((id) => !poppedIds.includes(id) && id !== bubbleId);

      if (remainingCorrect.length === 0) {
        // Move to next challenge after brief pause
        setTimeout(() => {
          if (popChallengeIdx + 1 < activePopList.length) {
            setPopChallengeIdx((prev) => prev + 1);
            setPoppedIds([]);
          } else {
            // Loop back to challenge 0 with bonus time
            setPopChallengeIdx(0);
            setPoppedIds([]);
            setPopTimeLeft((prev) => prev + 10);
          }
        }, 500);
      }
    } else {
      triggerSound('wrong');
      setPopCombo(1);
      setPopScore((prev) => Math.max(0, prev - 30));
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 font-['Plus_Jakarta_Sans'] min-h-[calc(100vh-100px)]">
      
      {/* TOP HEADER CONTROL */}
      <div className="bg-gradient-to-r from-[#031466] via-indigo-900 to-[#031466] rounded-[32px] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 font-black text-xs uppercase tracking-widest">
              <Sparkles size={14} className="animate-spin" />
              GAMES BUBUL OUTBUBBLE
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Arena Refleksi & Tantangan Bubul 🫧
            </h1>
            <p className="text-blue-200 font-medium text-xs sm:text-sm max-w-xl">
              Uji ketajaman berpikir kritismu! Meletupkan gelembung bias konfirmasi, pecahkan teka-teki echo chamber, dan kumpulkan skor tertinggi.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              title={soundEnabled ? "Matikan Suara" : "Aktifkan Suara"}
            >
              {soundEnabled ? <Volume2 size={20} className="text-emerald-400" /> : <VolumeX size={20} className="text-rose-400" />}
            </button>

            {gameMode !== 'menu' && (
              <button
                onClick={() => setGameMode('menu')}
                className="px-5 py-3 bg-white text-[#031466] hover:bg-blue-50 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <RotateCcw size={16} />
                Menu Utama
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODE 1: MENU SELECTION */}
      {gameMode === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* CARD 1: DETEKTIF ECHO CHAMBER (QUIZ SUSAH) */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white rounded-[32px] p-6 sm:p-8 border-2 border-indigo-100 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400 transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
                <BrainCircuit size={28} />
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider">
                Level: Sangat Susah & Master
              </div>
              <h3 className="text-xl font-black text-slate-800">
                Detektif Echo Chamber
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                Asah logika epistemologi! 6 Soal analisis tingkat tinggi tentang Hostile Media Effect, Groupthink, Astroturfing, dan Naive Realism.
              </p>
            </div>

            <div className="pt-6 space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Hadiah XP:</span>
                <span className="text-amber-600 font-black">+300 XP</span>
              </div>
              <button
                onClick={startQuizMode}
                className="w-full py-4 bg-gradient-to-r from-[#031466] to-indigo-800 text-white font-black rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Mulai Tantangan Kritis</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>

          {/* CARD 2: BUBUL POP ARENA (ARCADE FAST) */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white rounded-[32px] p-6 sm:p-8 border-2 border-cyan-100 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-400 transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 bg-cyan-100 text-cyan-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
                <Zap size={28} />
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 font-extrabold text-[11px] uppercase tracking-wider">
                Kecepatan & Refleks
              </div>
              <h3 className="text-xl font-black text-slate-800">
                Bubul Pop Arena 🫧
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                Game cepat letupkan balon! Analisis pernyataan mana yang merupakan bias konfirmasi atau ad hominem dalam batas waktu 35 detik.
              </p>
            </div>

            <div className="pt-6 space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Multiplikator Combo:</span>
                <span className="text-emerald-600 font-black">Hingga 5x Score</span>
              </div>
              <button
                onClick={startArcadeMode}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-black rounded-2xl shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Mainkan Arcade Pop</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>

          {/* CARD 3: PAPAN PERINGKAT WARGA BUBUL */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white rounded-[32px] p-6 sm:p-8 border-2 border-amber-100 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-400 transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
                <Trophy size={28} />
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[11px] uppercase tracking-wider">
                Peringkat Warga
              </div>
              <h3 className="text-xl font-black text-slate-800">
                Papan Peringkat
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                Lihat siapa pemikir paling kritis di OutBubble. Skor permainanmu langsung tersinkronisasi secara real-time ke seluruh warga!
              </p>
            </div>

            <div className="pt-6 space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Top Player:</span>
                <span className="text-[#031466] font-black">{leaderboardData[0]?.name || "Warga OutBubble"}</span>
              </div>
              <button
                onClick={() => setGameMode('leaderboard')}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black rounded-2xl shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Lihat Peringkat</span>
                <Crown size={18} />
              </button>
            </div>
          </motion.div>

        </div>
      )}

      {/* MODE 2: MASTER QUIZ (DETEKTIF ECHO CHAMBER) */}
      {gameMode === 'quiz' && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {!quizFinished && (quizQuestions[currentQuizIdx] || HARD_QUESTIONS[currentQuizIdx]) ? (
            <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-200 shadow-2xl space-y-8 relative overflow-hidden">
              
              {/* STATUS BAR */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1 bg-indigo-100 text-indigo-800 font-black rounded-full text-xs">
                    Soal {currentQuizIdx + 1} / {quizQuestions.length || HARD_QUESTIONS.length}
                  </span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 font-extrabold rounded-full text-xs">
                    Tingkat: {(quizQuestions[currentQuizIdx] || HARD_QUESTIONS[currentQuizIdx]).difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  {/* Streak indicator */}
                  <div className="flex items-center gap-1.5 text-orange-600 font-black text-sm">
                    <Flame size={18} className="fill-orange-500 animate-bounce" />
                    <span>{quizStreak} Streak</span>
                  </div>

                  {/* Timer Bar */}
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-sm border shadow-sm",
                    quizTimeLeft <= 5 ? "bg-rose-100 text-rose-700 border-rose-300 animate-pulse" : "bg-blue-50 text-[#031466] border-blue-200"
                  )}>
                    <Clock size={16} />
                    <span>{quizTimeLeft}s</span>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-black uppercase block">Skor Kamu</span>
                    <span className="text-xl font-black text-[#031466]">{quizScore}</span>
                  </div>
                </div>
              </div>

              {/* QUESTION SCENARIO & PROMPT */}
              <div className="space-y-4">
                <div className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                  Kategori: {(quizQuestions[currentQuizIdx] || HARD_QUESTIONS[currentQuizIdx]).category}
                </div>

                {(quizQuestions[currentQuizIdx] || HARD_QUESTIONS[currentQuizIdx]).scenario && (
                  <div className="p-4 bg-slate-50 border-l-4 border-indigo-600 rounded-2xl text-slate-700 text-xs sm:text-sm font-semibold italic">
                    📌 Studi Kasus: "{(quizQuestions[currentQuizIdx] || HARD_QUESTIONS[currentQuizIdx]).scenario}"
                  </div>
                )}

                <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                  {(quizQuestions[currentQuizIdx] || HARD_QUESTIONS[currentQuizIdx]).question}
                </h2>
              </div>

              {/* OPTIONS LIST */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {(quizQuestions[currentQuizIdx] || HARD_QUESTIONS[currentQuizIdx]).options.map((opt, idx) => {
                  const isSelected = quizSelectedOpt === idx;
                  let btnStyle = "bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50";

                  if (quizAnswered) {
                    if (opt.isCorrect) {
                      btnStyle = "bg-emerald-500 text-white border-emerald-600 shadow-lg scale-[1.01]";
                    } else if (isSelected) {
                      btnStyle = "bg-rose-500 text-white border-rose-600 shadow-lg";
                    } else {
                      btnStyle = "bg-slate-100 text-slate-400 border-slate-200 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(idx)}
                      disabled={quizAnswered}
                      className={cn(
                        "p-4 sm:p-5 rounded-2xl border-2 text-left font-bold text-xs sm:text-sm transition-all flex items-start justify-between gap-4 cursor-pointer",
                        btnStyle
                      )}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center shrink-0 font-black text-xs">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-relaxed">{opt.text}</span>
                      </div>

                      {quizAnswered && opt.isCorrect && (
                        <CheckCircle2 size={20} className="shrink-0 text-white" />
                      )}
                      {quizAnswered && isSelected && !opt.isCorrect && (
                        <XCircle size={20} className="shrink-0 text-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* EXPLANATION & NEXT BUTTON */}
              {quizAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 p-5 rounded-2xl bg-indigo-50 border border-indigo-200"
                >
                  <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                    <BrainCircuit size={18} />
                    <span>Penjelasan Akademis & Refleksi:</span>
                  </div>
                  <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
                    {(quizQuestions[currentQuizIdx] || HARD_QUESTIONS[currentQuizIdx]).explanation}
                  </p>

                  <div className="pt-2 text-right">
                    <button
                      onClick={handleNextQuizQuestion}
                      className="px-8 py-3.5 bg-[#031466] text-white font-black rounded-xl text-xs sm:text-sm hover:bg-indigo-900 transition-all shadow-md cursor-pointer active:scale-95 inline-flex items-center gap-2"
                    >
                      <span>{currentQuizIdx + 1 === (quizQuestions.length || HARD_QUESTIONS.length) ? "Lihat Hasil Akhir" : "Soal Berikutnya"}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          ) : (
            /* FINISHED QUIZ CARD */
            <div className="bg-white rounded-[32px] p-8 sm:p-12 border border-slate-200 shadow-2xl text-center space-y-6">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Trophy size={40} />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900">Tantangan Selesai! 🎉</h2>
                <p className="text-slate-600 font-bold text-sm">
                  Hebat! Kamu telah menyelesaikan evaluasi penalaran kritis Detektif Echo Chamber.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-2">
                <span className="text-xs font-black uppercase text-slate-400">Total Skor Akhir</span>
                <div className="text-5xl font-black text-[#031466]">{quizScore}</div>
                <p className="text-xs font-bold text-emerald-600">+ {Math.round(quizScore / 2)} XP ditambahkan ke profilmu!</p>
              </div>

              <div className="flex justify-center gap-4 pt-4 flex-wrap">
                <button
                  onClick={startQuizMode}
                  className="px-6 py-3.5 bg-slate-100 text-slate-800 font-black rounded-2xl text-xs sm:text-sm hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Coba Lagi
                </button>
                <button
                  onClick={() => setGameMode('leaderboard')}
                  className="px-8 py-3.5 bg-[#031466] text-white font-black rounded-2xl text-xs sm:text-sm hover:bg-indigo-900 transition-all shadow-lg cursor-pointer"
                >
                  Lihat Papan Peringkat
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODE 3: ARCADE POP GAME */}
      {gameMode === 'arcade' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {!popFinished && (popChallenges[popChallengeIdx] || POP_CHALLENGES[popChallengeIdx]) ? (
            <div className="bg-gradient-to-b from-slate-900 to-[#031466] rounded-[32px] p-6 sm:p-10 text-white shadow-2xl space-y-8 relative overflow-hidden border border-cyan-500/30">
              
              {/* ARCADE HEADER BAR */}
              <div className="flex items-center justify-between border-b border-white/10 pb-6 gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-black rounded-full text-xs">
                    Ronde {popChallengeIdx + 1}
                  </span>
                  <div className="px-3 py-1 bg-amber-400/20 text-amber-300 font-extrabold rounded-full text-xs flex items-center gap-1">
                    <Flame size={14} />
                    <span>Combo {popCombo}x</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Timer */}
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-sm border",
                    popTimeLeft <= 10 ? "bg-rose-500/30 border-rose-400 text-rose-300 animate-ping" : "bg-white/10 border-white/20 text-white"
                  )}>
                    <Clock size={16} />
                    <span>{popTimeLeft}s</span>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="text-[10px] text-blue-300 font-black uppercase block">Skor Pop</span>
                    <span className="text-2xl font-black text-amber-300">{popScore}</span>
                  </div>
                </div>
              </div>

              {/* CHALLENGE INSTRUCTION */}
              <div className="text-center space-y-2 py-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-400/20 rounded-full border border-cyan-400/40 text-cyan-200 font-black text-xs uppercase tracking-wider">
                  <Target size={14} />
                  Misi Meletupkan Balon
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white max-w-2xl mx-auto">
                  {(popChallenges[popChallengeIdx] || POP_CHALLENGES[popChallengeIdx]).question}
                </h2>
              </div>

              {/* FLOATING BUBBLES GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 min-h-[300px]">
                {(popChallenges[popChallengeIdx] || POP_CHALLENGES[popChallengeIdx]).bubbles.map((b, i) => {
                  const isPopped = poppedIds.includes(b.id);

                  return (
                    <AnimatePresence key={b.id}>
                      {!isPopped ? (
                        <motion.button
                          initial={{ scale: 0.8, opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
                          exit={{ scale: 1.3, opacity: 0 }}
                          transition={{ 
                            y: { duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }
                          }}
                          onClick={() => handlePopBubble(b.id, b.isCorrect)}
                          className="p-6 rounded-3xl bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/30 text-white font-black text-sm sm:text-base text-center shadow-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center min-h-[120px] group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent group-hover:opacity-100 transition-opacity" />
                          <span className="relative z-10 leading-snug">{b.text}</span>
                          <span className="absolute bottom-2 right-3 text-[10px] opacity-40 font-mono">POPMU 🫧</span>
                        </motion.button>
                      ) : (
                        <div key={b.id} className="min-h-[120px] border-2 border-dashed border-white/10 rounded-3xl flex items-center justify-center text-white/30 font-black text-xs uppercase">
                          Gelembung Meletup! 💥
                        </div>
                      )}
                    </AnimatePresence>
                  );
                })}
              </div>

            </div>
          ) : (
            /* FINISHED ARCADE CARD */
            <div className="bg-white rounded-[32px] p-8 sm:p-12 border border-slate-200 shadow-2xl text-center space-y-6">
              <div className="w-20 h-20 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Zap size={40} />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900">Waktu Habis! ⏱️</h2>
                <p className="text-slate-600 font-bold text-sm">
                  Refleks analisis bias kamu luar biasa! Skor arcade kamu telah disimpan.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-2">
                <span className="text-xs font-black uppercase text-slate-400">Total Skor Pop</span>
                <div className="text-5xl font-black text-cyan-700">{popScore}</div>
                <p className="text-xs font-bold text-emerald-600">+ {Math.round(popScore / 2)} XP ditambahkan ke profilmu!</p>
              </div>

              <div className="flex justify-center gap-4 pt-4 flex-wrap">
                <button
                  onClick={startArcadeMode}
                  className="px-6 py-3.5 bg-slate-100 text-slate-800 font-black rounded-2xl text-xs sm:text-sm hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Main Lagi
                </button>
                <button
                  onClick={() => setGameMode('leaderboard')}
                  className="px-8 py-3.5 bg-[#031466] text-white font-black rounded-2xl text-xs sm:text-sm hover:bg-indigo-900 transition-all shadow-lg cursor-pointer"
                >
                  Lihat Papan Peringkat
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 4: LEADERBOARD BOARD */}
      {gameMode === 'leaderboard' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                  <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Peringkat Warga Bubul</h2>
                  <p className="text-xs font-bold text-slate-400">Tersinkronkan secara real-time ke seluruh jaringan OutBubble</p>
                </div>
              </div>

              <button
                onClick={() => setGameMode('menu')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-xs transition-all cursor-pointer"
              >
                Kembali
              </button>
            </div>

            {/* LEADERBOARD TABLE */}
            <div className="space-y-3">
              {leaderboardData.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all",
                    idx === 0 ? "bg-amber-50/60 border-amber-300 shadow-md" :
                    idx === 1 ? "bg-slate-50 border-slate-300" :
                    idx === 2 ? "bg-orange-50/50 border-orange-200" : "bg-white border-slate-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0",
                      idx === 0 ? "bg-amber-400 text-white" :
                      idx === 1 ? "bg-slate-300 text-slate-800" :
                      idx === 2 ? "bg-orange-400 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      #{idx + 1}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xs text-[#031466] overflow-hidden shrink-0">
                        {item.avatar && item.avatar.startsWith('http') ? (
                          <img src={item.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          item.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-xs sm:text-sm">{item.name}</h4>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">{item.mode || "Game Pop"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-[#031466]">{item.score}</span>
                    <span className="text-[10px] font-bold text-slate-400 block">PTS</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
