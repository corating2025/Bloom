import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Heart, Mic, MicOff, RefreshCw, 
  Droplet, Sun, Sprout, Send, Terminal, Shield, CheckCircle,
  Download, FileImage, Gift
} from 'lucide-react';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface VocabularyItem {
  value: string;
  isPositive: boolean;
  img: string;
}

interface MatchCard {
  id: string;
  type: 'word' | 'image';
  value: string;
  img: string;
  solved: boolean;
  flipped: boolean;
}

// 9 Illustrated WebP Links exactly specified by the user
const vocabularyDatabase: VocabularyItem[] = [
  { value: 'wonderful', isPositive: true, img: '/WONDERFUL.png' },
  { value: 'beautiful', isPositive: true, img: '/BEAUTIFUL.png' },
  { value: 'kind', isPositive: true, img: '/KIND.png' },
  { value: 'caring', isPositive: true, img: '/CARING.png' },
  { value: 'helpful', isPositive: true, img: '/HELPFUL.png' },
  { value: 'silly', isPositive: false, img: '/SILLY.png' },
  { value: 'ugly', isPositive: false, img: '/UGLY.png' },
  { value: 'mean', isPositive: false, img: '/MEAN.png' },
  { value: 'unhelpful', isPositive: false, img: '/UNHELPFUL.png' }
];

// Fallback graphics and aesthetics in case the image fails to load
const fallbackStyling: Record<string, { emoji: string; bg: string; border: string; text: string }> = {
  wonderful: { emoji: '✨🌈', bg: 'from-amber-50 to-orange-100', border: 'border-amber-200', text: 'text-amber-700' },
  beautiful: { emoji: '🌸🦋', bg: 'from-pink-50 to-rose-100', border: 'border-pink-200', text: 'text-pink-700' },
  kind: { emoji: '💝🎁', bg: 'from-emerald-50 to-teal-100', border: 'border-emerald-200', text: 'text-emerald-700' },
  caring: { emoji: '❤️🤗', bg: 'from-sky-50 to-blue-100', border: 'border-sky-200', text: 'text-sky-700' },
  helpful: { emoji: '🤝🌟', bg: 'from-indigo-50 to-purple-100', border: 'border-indigo-200', text: 'text-indigo-700' },
  silly: { emoji: '🤪🎈', bg: 'from-yellow-50 to-amber-100', border: 'border-yellow-200', text: 'text-yellow-700' },
  ugly: { emoji: '🥺💔', bg: 'from-purple-50 to-slate-200', border: 'border-purple-200', text: 'text-purple-700' },
  mean: { emoji: '😠⚡', bg: 'from-rose-50 to-red-100', border: 'border-rose-200', text: 'text-rose-700' },
  unhelpful: { emoji: '🙅‍♂️🚫', bg: 'from-gray-50 to-slate-200', border: 'border-gray-200', text: 'text-gray-700' }
};

interface StageProperties {
  stemD: string;
  stemColor: string;
  headTransform: string;
  coreColor: string;
  petalFill: string;
  eyeLD: string;
  eyeRD: string;
  mouthD: string;
  p1: { cx: number; cy: number; r: number };
  p2: { cx: number; cy: number; r: number };
  p3: { cx: number; cy: number; r: number };
  healthWidth: string;
  statusText: string;
  healthBarClass: string;
  leafColor: string;
}

const stageProps: Record<number, StageProperties> = {
  1: {
    stemD: 'M150,280 C135,240 120,205 125,185',
    stemColor: '#9e9d24',
    headTransform: 'translate(125, 180) scale(0.55) rotate(-25)',
    coreColor: '#b0bec5',
    petalFill: '#c2185b',
    eyeLD: 'M-8,1 L-2,-3',
    eyeRD: 'M2,-3 L8,1',
    mouthD: 'M-4,8 Q0,4 4,8',
    p1: { cx: -5, cy: -5, r: 20 },
    p2: { cx: 5, cy: -5, r: 20 },
    p3: { cx: 0, cy: 8, r: 20 },
    healthWidth: '10%',
    statusText: '🥀 Dying & Shriveled',
    healthBarClass: 'bg-rose-500',
    leafColor: '#9e9d24'
  },
  2: {
    stemD: 'M150,280 C145,230 140,180 138,150',
    stemColor: '#a1887f',
    headTransform: 'translate(138, 150) scale(0.85) rotate(-10)',
    coreColor: '#fff59d',
    petalFill: '#e91e63',
    eyeLD: 'M-8,-2 L-2,-2',
    eyeRD: 'M2,-2 L8,-2',
    mouthD: 'M-4,6 L4,6',
    p1: { cx: -10, cy: -10, r: 21 },
    p2: { cx: 10, cy: -10, r: 21 },
    p3: { cx: 0, cy: 12, r: 21 },
    healthWidth: '40%',
    statusText: '🌱 Sprouting',
    healthBarClass: 'bg-amber-400',
    leafColor: '#c0ca33'
  },
  3: {
    stemD: 'M150,280 C148,210 145,150 145,120',
    stemColor: '#8bc34a',
    headTransform: 'translate(145, 120) scale(1.15) rotate(5)',
    coreColor: '#ffee58',
    petalFill: '#ec407a',
    eyeLD: 'M-8,-1 Q-5,-6 -2,-1',
    eyeRD: 'M2,-1 Q5,-6 8,-1',
    mouthD: 'M-5,4 Q0,10 5,4',
    p1: { cx: -16, cy: -16, r: 22 },
    p2: { cx: 16, cy: -16, r: 22 },
    p3: { cx: 0, cy: 18, r: 22 },
    healthWidth: '65%',
    statusText: '🌿 Growing Stronger',
    healthBarClass: 'bg-emerald-400',
    leafColor: '#8bc34a'
  },
  4: {
    stemD: 'M150,280 C150,190 150,130 150,90',
    stemColor: '#4caf50',
    headTransform: 'translate(150, 85) scale(1.45) rotate(0)',
    coreColor: '#ffca28',
    petalFill: '#f48fb1',
    eyeLD: 'M-10,-2 Q-6,-9 -2,-2',
    eyeRD: 'M2,-2 Q6,-9 10,-2',
    mouthD: 'M-6,2 Q0,11 6,2',
    p1: { cx: -20, cy: -20, r: 24 },
    p2: { cx: 20, cy: -20, r: 24 },
    p3: { cx: 0, cy: 22, r: 24 },
    healthWidth: '80%',
    statusText: '🌿 Fully Grown - Ready for Empathy!',
    healthBarClass: 'bg-emerald-400',
    leafColor: '#4caf50'
  },
  5: {
    stemD: 'M150,280 C150,190 150,130 150,90',
    stemColor: '#4caf50',
    headTransform: 'translate(150, 75) scale(2.0) rotate(0)',
    coreColor: '#ffca28',
    petalFill: '#ff4081',
    eyeLD: 'M-10,-4 Q-6,-11 -2,-4',
    eyeRD: 'M2,-4 Q6,-11 10,-4',
    mouthD: 'M-8,1 Q0,12 8,1 Z',
    p1: { cx: -26, cy: -26, r: 25 },
    p2: { cx: 26, cy: -26, r: 25 },
    p3: { cx: 0, cy: 30, r: 25 },
    healthWidth: '100%',
    statusText: '🌸 Blooming Beautifully!',
    healthBarClass: 'bg-pink-500',
    leafColor: '#4caf50'
  },
  6: {
    stemD: 'M150,280 C130,220 120,170 115,145',
    stemColor: '#9e9d24',
    headTransform: 'translate(115, 140) scale(0.95) rotate(-30)',
    coreColor: '#cfd8dc',
    petalFill: '#d81b60',
    eyeLD: 'M-8,-8 L-2,-2 M-2,-8 L-8,-2',
    eyeRD: 'M2,-8 L8,-2 M8,-8 L2,-2',
    mouthD: 'M-5,8 Q0,2 5,8',
    p1: { cx: -6, cy: -6, r: 20 },
    p2: { cx: 6, cy: -6, r: 20 },
    p3: { cx: 0, cy: 8, r: 20 },
    healthWidth: '10%',
    statusText: '😢 Hurt & Crying',
    healthBarClass: 'bg-rose-600',
    leafColor: '#9e9d24'
  }
};

export default function App() {
  // Navigation & Step Tracking
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [step2SubMode, setStep2SubMode] = useState<'explore' | 'match'>('explore');
  
  // Step 4: Daily Life Empathy State
  const [step4Inputs, setStep4Inputs] = useState<Record<string, string>>({
    homework: '',
    dinner: '',
    sports: '',
    piano: '',
    cleaning: '',
    bedtime: ''
  });
  const [step4Submitted, setStep4Submitted] = useState<Record<string, boolean>>({
    homework: false,
    dinner: false,
    sports: false,
    piano: false,
    cleaning: false,
    bedtime: false
  });
  const [step4Checking, setStep4Checking] = useState<Record<string, boolean>>({
    homework: false,
    dinner: false,
    sports: false,
    piano: false,
    cleaning: false,
    bedtime: false
  });
  const [step4Feedbacks, setStep4Feedbacks] = useState<Record<string, string>>({
    homework: '',
    dinner: '',
    sports: '',
    piano: '',
    cleaning: '',
    bedtime: ''
  });

  // Step 5: Thanks Card State & Prompt Builder
  const [step5Message, setStep5Message] = useState<string>('Thank you very much for being so patient and supportive. I feel so lucky to have you as my English teacher.');
  const [cardRecipient, setCardRecipient] = useState<string>('my English teacher');
  const [cardSender, setCardSender] = useState<string>('Your loving student');
  const [cardStyle, setCardStyle] = useState<string>('pink and purple style');
  const [cardSticker, setCardSticker] = useState<string>('a cute cat sticker');
  const [step5ImageUrl, setStep5ImageUrl] = useState<string | null>(null);
  const [step5Generating, setStep5Generating] = useState<boolean>(false);
  const [step5Error, setStep5Error] = useState<string | null>(null);
  
  // Plant State Tracking
  const [physicalState, setPhysicalState] = useState({ water: false, soil: false, sun: false });
  const [plantStage, setPlantStage] = useState<number>(1);
  const [step1Stage, setStep1Stage] = useState<number>(0); // 0: idle, 1: dry, 2: sprout needs food, 3: growing needs sun, 4: complete
  const [speechBubble, setSpeechBubble] = useState<string>('Welcome! Help me recover...');

  // Weather Overlays
  const [showWaterDrops, setShowWaterDrops] = useState(false);
  const [showFertilizer, setShowFertilizer] = useState(false);
  const [showSunlight, setShowSunlight] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [isErrorShiver, setIsErrorShiver] = useState(false);

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'System initialized. Waiting to care for the dying plant...'
  ]);

  // Match Game States
  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [solvedPairs, setSolvedPairs] = useState<number>(0);

  // Speaking / Voice states
  const [typedSentence, setTypedSentence] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastHeard, setLastHeard] = useState<string>('');
  const [micError, setMicError] = useState<string>('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll log console
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Clean up WebSpeech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  // Sync initialization
  useEffect(() => {
    initMatchGame();
  }, []);

  const writeToTerminal = (text: string) => {
    setTerminalLogs(prev => [...prev, text]);
  };

  // Pure Browser Oscillators Sound Engine
  const playSoundEffect = (type: 'action' | 'bloom' | 'cry') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'action') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'bloom') {
        const frequencies = [523.25, 659.25, 783.99, 1046.50];
        frequencies.forEach((f, idx) => {
          const oscNode = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscNode.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscNode.type = 'triangle';
          oscNode.frequency.setValueAtTime(f, audioCtx.currentTime + idx * 0.08);
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime + idx * 0.08);
          gainNode.gain.linearRampToValueAtTime(0, idx * 0.08 + 0.35);
          oscNode.start(audioCtx.currentTime + idx * 0.08);
          oscNode.stop(audioCtx.currentTime + idx * 0.08 + 0.35);
        });
      } else if (type === 'cry') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(85, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      console.log('AudioContext initialized lazily upon click event.', e);
    }
  };

  const textToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-GB';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Nav across panels with Auto-Bypass
  const handleStepSwitch = (stepNum: 1 | 2 | 3 | 4 | 5) => {
    setActiveStep(stepNum);
    if ((stepNum === 2 || stepNum === 3 || stepNum === 4 || stepNum === 5) && step1Stage < 4) {
      setStep1Stage(4);
      setPlantStage(4);
      setPhysicalState({ water: true, soil: true, sun: true });
      writeToTerminal('Curriculum Auto-Bypass: Plant physical care complete. READY FOR WORDS OF EMPATHY!');
    } else {
      writeToTerminal(`Workspace set to Step ${stepNum}.`);
    }
  };

  // Step 1: Start Caring Diagnostic Flow
  const startStep1Flow = () => {
    setStep1Stage(1);
    playSoundEffect('action');
    setSpeechBubble('I am so dry... Please water me! 💧');
    writeToTerminal('Diagnostic: Plant is dry & thirsty.');
    textToSpeech('I am so dry. Please water me.');
  };

  // Physical Care nutrients validation engine
  const applyNutrient = (type: 'water' | 'soil' | 'sun') => {
    if (step1Stage === 1) {
      if (type === 'water') {
        playSoundEffect('action');
        setShowWaterDrops(true);
        setTimeout(() => setShowWaterDrops(false), 2500);
        setPhysicalState(prev => ({ ...prev, water: true }));
        setStep1Stage(2);
        setPlantStage(2);
        setSpeechBubble('Ah, water feels amazing! But my soil is empty... I need Fertilizer! 🪱🍂');
        writeToTerminal('Water applied! Sprouting break soil.');
        textToSpeech('Ah, water feels amazing! But my soil is empty. I need Fertilizer.');
      } else {
        playSoundEffect('cry');
        triggerErrorFace();
        setSpeechBubble('Ouch! Incorrect. roots dry, I need Water first! 💧');
        textToSpeech('Ouch! That is incorrect. My roots are dry, I need Water first.');
      }
    } else if (step1Stage === 2) {
      if (type === 'soil') {
        playSoundEffect('action');
        setShowFertilizer(true);
        setTimeout(() => setShowFertilizer(false), 2500);
        setPhysicalState(prev => ({ ...prev, soil: true }));
        setStep1Stage(3);
        setPlantStage(3);
        setSpeechBubble('Rich food! stronger stronger! too dark... I need Sunlight! ☀️');
        writeToTerminal('Fertilizer applied! Stem rising.');
        textToSpeech('Rich food! I am growing stronger, but it is too dark. I need Sunlight.');
      } else {
        playSoundEffect('cry');
        triggerErrorFace();
        setSpeechBubble('No, no! My soil empty. I need rich Fertilizer strong stem! 🪱🍂');
        textToSpeech('No, no! My soil is empty. I need rich Fertilizer to grow a strong stem.');
      }
    } else if (step1Stage === 3) {
      if (type === 'sun') {
        playSoundEffect('action');
        setShowSunlight(true);
        setTimeout(() => setShowSunlight(false), 2500);
        setPhysicalState(prev => ({ ...prev, sun: true }));
        setStep1Stage(4);
        setPlantStage(4);
        setSpeechBubble('Amazing! warmth... thank you for reviving me! 🌿');
        writeToTerminal('Solar energy triggered maturity. Step 1 COMPLETE.');
        textToSpeech('Amazing! Thank you for reviving me.');
      } else {
        playSoundEffect('cry');
        triggerErrorFace();
        setSpeechBubble('Oops! wrong. have water and food, now I need warm Sunlight! ☀️');
        textToSpeech('Oops! That is wrong. I have water and food, now I need warm Sunlight.');
      }
    }
  };

  const triggerErrorFace = () => {
    setIsErrorShiver(true);
    setTimeout(() => {
      setIsErrorShiver(false);
    }, 1200);
  };

  // Student Lexical validation engine
  const interpretWords = (sentence: string) => {
    const cleanSentence = sentence.toLowerCase().trim();
    writeToTerminal(`System analyzing student speech pattern: "${sentence}"`);
    setLastHeard(sentence);
    
    if (step1Stage < 4) {
      writeToTerminal(`⚠️ weak plant ignored spoken words! FINISH STEP 1 first!`);
      playSoundEffect('cry');
      return;
    }
    
    const words = cleanSentence.split(/[^a-zA-Z]+/);

    const positiveVocab = [
      'wonderful', 'beautiful', 'fantastic', 'kind', 'caring', 'helpful', 'lovely', 'nice', 
      'polite', 'supportive', 'generous', 'thoughtful', 'encouraging', 'patient', 'understanding',
      'brave', 'honest', 'grateful', 'friendly', 'gentle', 'sweet', 'warm', 'cheerful', 'positive',
      'love', 'like', 'appreciate', 'thank', 'thanks', 'glad', 'happy', 'great', 
      'awesome', 'amazing', 'cool', 'excellent', 'good', 'super', 'cute', 'smart', 'clever', 
      'perfect', 'precious', 'special', 'fine', 'cozy', 'soft', 'strong', 'wise', 'brilliant', 
      'creative', 'active', 'neat', 'tidy', 'loved', 'valued'
    ];
    const negativeVocab = [
      'silly', 'bad', 'ugly', 'stupid', 'hate', 'wither', 'mean', 'unhelpful', 
      'rude', 'selfish', 'impatient', 'dislike', 'hurt', 'cry', 'sad', 'angry', 
      'mad', 'cruel', 'terrible', 'horrible', 'worst', 'dumb', 'foolish', 'annoyed', 
      'useless', 'harsh', 'offensive', 'lazy', 'weak', 'picky', 'untidy', 'dirty', 'messy', 
      'bored', 'lonely', 'scared', 'afraid', 'tired', 'careless', 'cold', 'noisy', 'boring', 
      'disgusting', 'fool', 'shame', 'shamed', 'broken', 'evil', 'wicked', 'gross'
    ];
    
    const isPositiveWord = positiveVocab.some(word => words.includes(word));
    const isNegativeWord = negativeVocab.some(word => words.includes(word));
    
    if (isPositiveWord) { 
      const matched = positiveVocab.find(word => words.includes(word));
      bloomPlant(sentence, matched); 
    } else if (isNegativeWord) { 
      const matched = negativeVocab.find(word => words.includes(word));
      cryPlant(sentence, matched); 
    } else { 
      setSpeechBubble(`I heard "${sentence}", but I don't know that adjective yet! 💭 Try saying something like: "You are kind!" or "You are wonderful!"`);
      writeToTerminal(`💬 system heard "${sentence}" but plant ignored it. Try expressions containing positive words like love, helpful, kind, cute, or negative ones like bad, mean, lazy!`); 
    }
  };

  const bloomPlant = (sentence: string, matchedWord?: string) => {
    setPlantStage(5); 
    playSoundEffect('bloom'); 
    textToSpeech(sentence);
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 3000);
    const displayWord = matchedWord ? `"${matchedWord}"` : 'your kind words';
    setSpeechBubble(`Thank you! Speaking ${displayWord} makes me feel so loved and happy! ✨🌸`);
    writeToTerminal(`💖 Joy event! Spoken words bloomed flower: "${sentence}".`);
  };

  const cryPlant = (sentence: string, matchedWord?: string) => {
    setPlantStage(6); 
    playSoundEffect('cry'); 
    textToSpeech(sentence);
    const displayWord = matchedWord ? `"${matchedWord}"` : 'hurtful words';
    setSpeechBubble(`Ouch... Speaking ${displayWord} makes my leaves wither. Please use gentle words! 💔🥀`);
    writeToTerminal(`💔 Sad event! hurt spoken words carried bad standard energy: "${sentence}".`);
  };

  // Image Fallback error handler
  const handleImageError = (word: string) => {
    setFailedImages(prev => ({ ...prev, [word]: true }));
  };

  // Vocabulary Explorer card trigger
  const handleExploreWord = (word: string) => {
    expressWord(word);
  };

  const expressWord = (word: string) => { 
    interpretWords(`You are ${word}!`); 
  };

  // Match Game Card logic - ALL cards are face down by default (flipped: false)
  const initMatchGame = () => {
    setSelectedCardIndex(null); 
    setSolvedPairs(0);
    setIsComparing(false);
    
    // Shuffle database copy
    const dbCopy = [...vocabularyDatabase].sort(() => Math.random() - 0.5);
    // Select 6 random vocabulary entries
    const selectedVocab = dbCopy.slice(0, 6);
    
    const generatedCards: MatchCard[] = [];
    selectedVocab.forEach((item, index) => {
      // word card: face down
      generatedCards.push({ id: `text-${index}`, type: 'word', value: item.value, img: item.img, solved: false, flipped: false });
      // image card: face down
      generatedCards.push({ id: `image-${index}`, type: 'image', value: item.value, img: item.img, solved: false, flipped: false });
    });
    
    // Shuffle the cards so words and images are mixed
    const shuffledCards = generatedCards.sort(() => Math.random() - 0.5);
    setMatchCards(shuffledCards);
  };

  const handleMatchCardClick = (index: number) => {
    // If we're comparing, or the card is already solved or flipped, ignore clicks
    if (isComparing || matchCards[index].solved || matchCards[index].flipped) return;
    
    playSoundEffect('action');
    
    // Flip the clicked card face up
    const updatedCards = [...matchCards];
    updatedCards[index] = { ...updatedCards[index], flipped: true };
    setMatchCards(updatedCards);

    const prevIndex = selectedCardIndex;
    if (prevIndex === null) {
      // First card flipped
      setSelectedCardIndex(index);
      return;
    }

    // Second card flipped, compare values
    const prevCard = matchCards[prevIndex];
    const currentCard = matchCards[index];

    if (prevCard.value === currentCard.value && prevCard.type !== currentCard.type) {
      // Match found!
      setIsComparing(true);
      setTimeout(() => {
        const solvedCards = updatedCards.map((card, idx) => {
          if (idx === prevIndex || idx === index) {
            return { ...card, solved: true, flipped: false };
          }
          return card;
        });
        setMatchCards(solvedCards);
        const newSolvedPairs = solvedPairs + 1;
        setSolvedPairs(newSolvedPairs);
        setSelectedCardIndex(null);
        setIsComparing(false);
        
        interpretWords(`You are ${currentCard.value}`);

        if (newSolvedPairs === 6) { 
          writeToTerminal(`🏆 COMPLETE! You solved all Memory Card pairs!`); 
        }
      }, 600);
    } else {
      // Mismatch, shake and flip back down
      setIsComparing(true);
      playSoundEffect('cry');
      
      setTimeout(() => {
        const resetCards = updatedCards.map((card, idx) => {
          if (idx === prevIndex || idx === index) {
            return { ...card, flipped: false };
          }
          return card;
        });
        setMatchCards(resetCards);
        setSelectedCardIndex(null);
        setIsComparing(false);
      }, 1000);
    }
  };

  // Speech Recognition safely implemented as standard React state machine
  const startVoiceRecognition = () => {
    try {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) {
        writeToTerminal('⚠️ Standard Voice recognition NOT supported by this browser. Type instead!');
        setMicError('Speech recognition not supported in this browser.');
        return;
      }

      setMicError('');

      if (isListening) {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsListening(false);
        return;
      }

      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError('');
        writeToTerminal('🎤 Listening to standard speech... Speak now!');
      };

      recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        writeToTerminal(`🎤 Spoken input recognized: "${result}"`);
        interpretWords(result);
      };

      recognition.onerror = (e: any) => {
        writeToTerminal(`🎤 Standard Microphone error: ${e.error}`);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setMicError('Permission blocked. Please allow microphone in your browser settings.');
        } else {
          setMicError(`Microphone error: ${e.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error(err);
      writeToTerminal(`⚠️ Microphone access blocked by secure sandbox origin policy. Please use the Typing Input box on the right instead!`);
      setIsListening(false);
      setMicError('Microphone blocked by secure iframe sandboxing. Please use Typing Input on the right instead!');
    }
  };

  const submitTypedSentence = () => {
    if (typedSentence.trim() !== '') {
      interpretWords(typedSentence);
      setTypedSentence('');
    }
  };

  const handlePrefillSentence = (sentence: string) => {
    setTypedSentence(sentence);
  };

  const handleMindmapWord = (word: string, isPositive: boolean) => {
    setTypedSentence(`You are so ${word}!`);
    writeToTerminal(`Mind Map shortcut selected: "${word}". Prefilled template.`);
  };

  // Step 4 Scenarios & Evaluation
  const step4Scenarios = [
    {
      id: 'homework',
      title: 'Homework Helper 📚',
      subtitle: 'MATH HOMEWORK TIME',
      parentComplaint: '“Yuen, why are you so LAZY today? Finish your math now!”',
      boyResponse: '“Okay, Dad...”',
      emoji: '📚✏️',
      advice: 'Dad is angry and uses the negative label "LAZY". Yuen feels pressured and sad. How could Dad say this with empathy?',
      suggestedPlaceholder: 'e.g., "Math can be tough, Yuen. Do you need a short break or some help?"',
      img: '/01.png'
    },
    {
      id: 'dinner',
      title: 'Dinner Drama 🍲',
      subtitle: 'AT THE DINNER TABLE',
      parentComplaint: '“You’re so PICKY! Eat everything on your plate. Other kids have nothing to eat!”',
      boyResponse: '“Yes, Mom.”',
      emoji: '🍲🥦',
      advice: 'Mom labels Yuen as "PICKY" and tries to guilt-trip him. Yuen feels ashamed. How could Mom express understanding about his appetite?',
      suggestedPlaceholder: 'e.g., "I know you don\'t like this vegetable. How about we try just three small bites?"',
      img: '/02.png'
    },
    {
      id: 'sports',
      title: 'Sports Day Failure 🏃‍♂️',
      subtitle: 'ON THE RUNNING TRACK',
      parentComplaint: '“Run faster! Don’t be so WEAK! You must practice more!”',
      boyResponse: '“Trying my best...”',
      emoji: '🏃‍♂️⏱️',
      advice: 'Mom yells "WEAK" and demands more effort. Yuen is already running his hardest and feels exhausted. How could Mom cheer his effort?',
      suggestedPlaceholder: 'e.g., "You are working so hard out there! I am proud of your effort, Yuen!"',
      img: '/03.png'
    },
    {
      id: 'piano',
      title: 'Piano Practice 🎹',
      subtitle: 'SITTING AT THE PIANO',
      parentComplaint: '“That was TERRIBLE! You are not practicing hard enough. Again!”',
      boyResponse: '“But Mom...”',
      emoji: '🎹🎵',
      advice: 'Mom harshly calls his play "TERRIBLE". Yuen feels helpless and starts crying. How could Mom encourage him to try again gently?',
      suggestedPlaceholder: 'e.g., "That was a tricky part! Let\'s slow down and practice this melody together."',
      img: '/04.png'
    },
    {
      id: 'cleaning',
      title: 'Cleaning Chaos 🧹',
      subtitle: 'IN THE MESSY BEDROOM',
      parentComplaint: '“This room is DISGUSTING! You are so UNTIDY! Clean it up!”',
      boyResponse: '“I will...”',
      emoji: '🧹🧸',
      advice: 'Dad shouts "DISGUSTING" and "UNTIDY". Yuen is overwhelmed by the mess. How could Dad guide him to clean up supportively?',
      suggestedPlaceholder: 'e.g., "There are many toys here! Let\'s clean them up together. Which box should we start with?"',
      img: '/05.png'
    },
    {
      id: 'bedtime',
      title: 'Bedtime Blues 🛌',
      subtitle: 'LYING IN BED AT NIGHT',
      parentComplaint: 'Parents are always angry and criticize Yuen with words: LAZY, PICKY, WEAK, TERRIBLE, UNTIDY.',
      boyResponse: '“I try so hard, but they are always angry...”',
      emoji: '🛌🌙',
      advice: 'Yuen lies awake feeling unloved and anxious. Write a healing, comforting message of empathy directly to Yuen to help him feel valued.',
      suggestedPlaceholder: 'e.g., "Yuen, you are not weak or lazy. You are trying your best, and your effort is beautiful."',
      img: '/06.png'
    }
  ];

  const handleStep4Submit = async (key: string) => {
    const text = step4Inputs[key];
    if (text.trim().length < 4) {
      playSoundEffect('cry');
      const errText = 'Please write a more thoughtful response of at least 4 letters! 💖';
      setSpeechBubble(errText);
      setStep4Feedbacks(prev => ({ ...prev, [key]: errText }));
      return;
    }

    // Client-side check for negative labels and critical expressions
    const lower = text.toLowerCase();
    const negativeWords = ["lazy", "picky", "weak", "terrible", "untidy", "disgusting", "stupid", "bad", "angry", "silly", "messy", "ugly", "mean", "hate", "useless", "dumb", "fool", "shame", "disappointed"];
    const foundWord = negativeWords.find(w => lower.includes(w));

    if (foundWord) {
      playSoundEffect('cry');
      const errorMsg = `⚠️ Oops! You included a negative label or expression: "${foundWord}". True empathy means helping children feel understood rather than labeling them. Try rewriting it with positive, warm words! ❤️`;
      setSpeechBubble(errorMsg);
      setStep4Feedbacks(prev => ({ ...prev, [key]: errorMsg }));
      writeToTerminal(`[Step 4] Empathy check failed: contained negative label "${foundWord}".`);
      return;
    }

    setStep4Checking(prev => ({ ...prev, [key]: true }));
    const scenario = step4Scenarios.find(s => s.id === key);

    try {
      const response = await fetch('/api/empathy/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: key,
          complaint: scenario?.parentComplaint || "",
          advice: scenario?.advice || "",
          userInput: text
        })
      });

      const result = await response.json();
      setStep4Checking(prev => ({ ...prev, [key]: false }));
      setStep4Feedbacks(prev => ({ ...prev, [key]: result.feedback || '' }));

      if (result.isEmpathetic) {
        setStep4Submitted(prev => {
          const next = { ...prev, [key]: true };
          const submittedCount = Object.values(next).filter(Boolean).length;
          
          playSoundEffect('bloom');
          setShowSparkles(true);
          setTimeout(() => setShowSparkles(false), 2000);

          if (submittedCount === 6) {
            setPlantStage(5); // Bloom completely!
            setSpeechBubble('🎉 Incredible! You solved all 6 empathy scenarios with true empathy! I am blooming completely with love! 🌸');
            writeToTerminal('🏆 Congratulations! You successfully transformed all parent language with deep empathy!');
            textToSpeech('Incredible! You completed all empathy lessons. I am blooming with love.');
          } else {
            setSpeechBubble(result.feedback || `Empathetic response accepted! (${submittedCount}/6) Keep helping Yuen! 💖`);
            writeToTerminal(`[Step 4] Empathy accepted for "${key}". Teacher feedback: ${result.feedback}`);
            // Gradually change flower stages
            if (submittedCount === 1 || submittedCount === 2) setPlantStage(2);
            if (submittedCount === 3 || submittedCount === 4) setPlantStage(3);
            if (submittedCount === 5) setPlantStage(4);
          }

          return next;
        });
      } else {
        playSoundEffect('cry');
        setSpeechBubble(`Teacher Feedback: ${result.feedback} 💖`);
        writeToTerminal(`[Step 4] Rewrite rejected for "${key}". Teacher feedback: ${result.feedback}`);
      }
    } catch (error) {
      console.error("Error evaluating empathy:", error);
      setStep4Checking(prev => ({ ...prev, [key]: false }));
      setStep4Feedbacks(prev => ({ ...prev, [key]: "Empathy analysis offline, but we believe in your kindness! ❤️" }));
      // Graceful fallback: accept as correct
      setStep4Submitted(prev => {
        const next = { ...prev, [key]: true };
        const submittedCount = Object.values(next).filter(Boolean).length;
        playSoundEffect('bloom');
        if (submittedCount === 6) {
          setPlantStage(5);
        }
        return next;
      });
      setSpeechBubble("Communication is sweet! Your response is unlocked! ❤️");
    }
  };

  const generateStep5Card = async () => {
    if (!step5Message.trim()) {
      setStep5Error("Please write a warm message for your card first! 💖");
      return;
    }
    
    setStep5Generating(true);
    setStep5Error(null);
    setStep5ImageUrl(null);
    playSoundEffect('action');
    setSpeechBubble('Magic is on the way... Painting a beautiful personalized card art background... 🎨');
    writeToTerminal('[Step 5] Generating digital thank you card background via Gemini image model...');

    // Compile dynamic custom prompt from user inputs
    const compiledPrompt = `Please create an image for a thank-you card for ${cardRecipient || 'someone special'}. Color & style: ${cardStyle || 'beautiful colors'}. Decoration elements: ${cardSticker || 'cute details'}.`;

    try {
      const response = await fetch('/api/card/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: step5Message,
          customPrompt: compiledPrompt,
          recipient: cardRecipient,
          style: cardStyle,
          sticker: cardSticker
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate background. Make sure your Gemini API key is configured!");
      }

      const result = await response.json();
      if (result.imageUrl) {
        setStep5ImageUrl(result.imageUrl);
        playSoundEffect('bloom');
        setShowSparkles(true);
        setTimeout(() => setShowSparkles(false), 2000);
        setSpeechBubble(`🎉 Presto! The AI has created a gorgeous card background styled with ${cardStyle}! 🌸`);
        writeToTerminal('[Step 5] Thank you card background generated successfully!');
      } else {
        throw new Error("No image URL returned from API");
      }
    } catch (err: any) {
      console.error("Gemini image API is currently offline/exhausted. Generating cozy dynamic custom vector illustration:", err);
      
      // Beautiful local SVG watercolor vector fallback pattern customized by the student's choices!
      const generateLocalCustomSvg = (style: string = '', sticker: string = '', recipient: string = '') => {
        const styleLower = (style || '').toLowerCase();
        const stickerLower = (sticker || '').toLowerCase();
        
        let bgGradient = {
          start: '#fff5f5',
          end: '#fef2f2',
          accent: '#fecdd3',
          border: '#fda4af',
          leafColor: '#fb7185'
        };
        
        if (styleLower.includes('pink') || styleLower.includes('purple') || styleLower.includes('violet') || styleLower.includes('lavender')) {
          bgGradient = {
            start: '#fff1f2',
            end: '#f5f3ff',
            accent: '#fbcfe8',
            border: '#f472b6',
            leafColor: '#c084fc'
          };
        } else if (styleLower.includes('sunset') || styleLower.includes('orange') || styleLower.includes('peach') || styleLower.includes('warm') || styleLower.includes('red') || styleLower.includes('coral')) {
          bgGradient = {
            start: '#fff5f5',
            end: '#fef3c7',
            accent: '#fed7aa',
            border: '#fb923c',
            leafColor: '#f59e0b'
          };
        } else if (styleLower.includes('floral') || styleLower.includes('green') || styleLower.includes('yellow') || styleLower.includes('garden') || styleLower.includes('leaf') || styleLower.includes('nature')) {
          bgGradient = {
            start: '#f0fdf4',
            end: '#fefce8',
            accent: '#bbf7d0',
            border: '#86efac',
            leafColor: '#22c55e'
          };
        } else if (styleLower.includes('blue') || styleLower.includes('sky') || styleLower.includes('ocean') || styleLower.includes('cold') || styleLower.includes('cool')) {
          bgGradient = {
            start: '#ecfeff',
            end: '#eff6ff',
            accent: '#bae6fd',
            border: '#60a5fa',
            leafColor: '#38bdf8'
          };
        }

        const splatters = `
          <g opacity="0.35">
            <path d="M 60,110 C 160,60 260,160 210,260 C 130,330 90,210 60,110 Z" fill="${bgGradient.start}" filter="blur(30px)" />
            <path d="M 490,90 C 540,190 390,230 370,330 C 340,410 470,490 490,90 Z" fill="${bgGradient.end}" filter="blur(35px)" />
            <path d="M 130,470 C 230,510 190,410 310,490 C 210,570 90,540 130,470 Z" fill="${bgGradient.accent}" filter="blur(40px)" />
          </g>
        `;

        let floralDecorations = '';
        if (styleLower.includes('sunset') || styleLower.includes('sky')) {
          floralDecorations = `
            <g transform="translate(60, 60)">
              <path d="M 0,-15 L 4,-4 L 15,0 L 4,4 L 0,15 L -4,4 L -15,0 L -4,-4 Z" fill="#fef08a" opacity="0.9" />
              <path d="M 20,-20 L 22,-5 L 37,-3 L 22,-1 L 20,14 L 18,-1 L 3,-3 L 18,-5 Z" fill="#fef08a" opacity="0.6" transform="scale(0.6)" />
            </g>
            <g transform="translate(520, 60)" opacity="0.85">
              <path d="M0,10 C-15,10 -25,0 -20,-15 C-15,-30 5,-30 15,-20 C25,-30 45,-25 45,-10 C55,-10 60,5 45,15 C35,25 15,20 0,10 Z" fill="#ffffff" />
              <path d="M10,15 C-5,15 -15,5 -10,-10 C-5,-25 15,-25 25,-15 C35,-25 55,-20 55,-5 C65,-5 70,10 55,20 C45,30 25,25 10,15 Z" fill="#fef2f2" opacity="0.5" transform="translate(-10, -5) scale(0.9)" />
            </g>
            <g transform="translate(70, 520)" opacity="0.8">
              <path d="M0,0 A 20,20 0 1,0 30,-10 A 15,15 0 1,1 0,0" fill="#fef08a" />
            </g>
          `;
        } else {
          floralDecorations = `
            <g transform="translate(60, 60)">
              <path d="M-40,0 C-20,-30 10,-30 20,0 C30,30 0,40 -40,0 Z" fill="${bgGradient.leafColor}" opacity="0.25" transform="rotate(-15)"/>
              <path d="M0,-40 C30,-20 30,10 0,20 C-30,30 -40,0 0,-40 Z" fill="${bgGradient.leafColor}" opacity="0.2" transform="rotate(45)"/>
              <circle cx="0" cy="0" r="16" fill="${bgGradient.border}" opacity="0.8" />
              <circle cx="6" cy="-6" r="12" fill="${bgGradient.accent}" opacity="0.7" />
              <circle cx="-6" cy="6" r="12" fill="${bgGradient.accent}" opacity="0.7" />
              <circle cx="0" cy="0" r="6" fill="#ffffff" opacity="0.9" />
            </g>
            <g transform="translate(540, 60)">
              <path d="M0,0 Q-40,-20 -80,10" fill="none" stroke="${bgGradient.leafColor}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
              <path d="M0,0 Q20,-40 -10,-60" fill="none" stroke="${bgGradient.leafColor}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
              <circle cx="-40" cy="-10" r="8" fill="${bgGradient.border}" opacity="0.7"/>
              <circle cx="-70" cy="5" r="5" fill="${bgGradient.accent}" opacity="0.8"/>
            </g>
            <g transform="translate(60, 540)">
              <circle cx="0" cy="0" r="15" fill="${bgGradient.border}" opacity="0.7"/>
              <circle cx="-10" cy="-10" r="12" fill="${bgGradient.accent}" opacity="0.6"/>
              <circle cx="10" cy="10" r="10" fill="${bgGradient.leafColor}" opacity="0.4"/>
            </g>
          `;
        }

        let stickerElement = '';
        if (stickerLower.includes('cat') || stickerLower.includes('kitty')) {
          stickerElement = `
            <g transform="translate(460, 460)">
              <path d="M -50,5 C -55,-25 -45,-45 -25,-45 C -15,-45 -10,-35 0,-35 C 10,-35 15,-45 25,-45 C 45,-45 55,-25 50,5 C 45,35 25,45 0,45 C -25,45 -45,35 -50,5 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
              <ellipse cx="0" cy="8" rx="35" ry="25" fill="#fdbaf8" />
              <ellipse cx="0" cy="8" rx="32" ry="22" fill="#fbcfe8" />
              <circle cx="0" cy="-12" r="22" fill="#fbcfe8" />
              <polygon points="-18,-24 -8,-10 -22,-6" fill="#f9a8d4" />
              <polygon points="-16,-20 -10,-11 -19,-8" fill="#f472b6" />
              <polygon points="18,-24 8,-10 22,-6" fill="#f9a8d4" />
              <polygon points="16,-20 10,-11 19,-8" fill="#f472b6" />
              <path d="M -12,-12 Q -8,-15 -4,-12" fill="none" stroke="#6b21a8" stroke-width="2.5" stroke-linecap="round" />
              <path d="M 4,-12 Q 8,-15 12,-12" fill="none" stroke="#6b21a8" stroke-width="2.5" stroke-linecap="round" />
              <circle cx="-13" cy="-6" r="4" fill="#f43f5e" opacity="0.6" />
              <circle cx="13" cy="-6" r="4" fill="#f43f5e" opacity="0.6" />
              <polygon points="-1,-8 1,-8 0,-7" fill="#be185d" />
              <path d="M -3,-5 Q 0,-3 3,-5" fill="none" stroke="#6b21a8" stroke-width="2" stroke-linecap="round" />
              <ellipse cx="-12" cy="18" rx="7" ry="5" fill="#ffffff" />
              <ellipse cx="12" cy="18" rx="7" ry="5" fill="#ffffff" />
              <path d="M 28,15 Q 40,25 45,10" fill="none" stroke="#fbcfe8" stroke-width="6" stroke-linecap="round" />
            </g>
          `;
        } else if (stickerLower.includes('sun') || stickerLower.includes('sunshine')) {
          stickerElement = `
            <g transform="translate(460, 460)">
              <circle cx="0" cy="0" r="48" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
              <g stroke="#f59e0b" stroke-width="6" stroke-linecap="round" opacity="0.8">
                <line x1="0" y1="-38" x2="0" y2="-30" />
                <line x1="0" y1="30" x2="0" y2="38" />
                <line x1="-30" y1="0" x2="-38" y2="0" />
                <line x1="30" y1="0" x2="38" y2="0" />
                <line x1="-24" y1="-24" x2="-19" y2="-19" />
                <line x1="19" y1="19" x2="24" y2="24" />
                <line x1="24" y1="-24" x2="19" y2="-19" />
                <line x1="-19" y1="19" x2="-24" y2="24" />
              </g>
              <circle cx="0" cy="0" r="28" fill="#fbbf24" />
              <circle cx="0" cy="0" r="25" fill="#fef08a" />
              <circle cx="-8" cy="-4" r="3" fill="#78350f" />
              <circle cx="8" cy="-4" r="3" fill="#78350f" />
              <circle cx="-12" cy="3" r="4" fill="#f43f5e" opacity="0.6" />
              <circle cx="12" cy="3" r="4" fill="#f43f5e" opacity="0.6" />
              <path d="M -5,4 Q 0,9 5,4" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />
            </g>
          `;
        } else if (stickerLower.includes('bear')) {
          stickerElement = `
            <g transform="translate(460, 460)">
              <path d="M -42,10 C -48,-15 -42,-35 -25,-40 C -15,-42 -5,-35 0,-35 C 5,-35 15,-42 25,-40 C 42,-35 48,-15 42,10 C 38,32 20,44 0,44 C -20,44 -38,32 -42,10 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
              <circle cx="0" cy="2" r="28" fill="#b45309" />
              <circle cx="0" cy="2" r="25" fill="#d97706" />
              <circle cx="-20" cy="-18" r="10" fill="#b45309" />
              <circle cx="-20" cy="-18" r="6" fill="#fef3c7" />
              <circle cx="20" cy="-18" r="10" fill="#b45309" />
              <circle cx="20" cy="-18" r="6" fill="#fef3c7" />
              <ellipse cx="0" cy="8" rx="10" ry="7" fill="#fef3c7" />
              <polygon points="-3,5 3,5 0,8" fill="#78350f" />
              <path d="M -12,0 Q -8,-3 -4,0" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />
              <path d="M 4,0 Q 8,-3 12,0" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />
              <circle cx="-14" cy="7" r="3" fill="#f43f5e" opacity="0.6" />
              <circle cx="14" cy="7" r="3" fill="#f43f5e" opacity="0.6" />
            </g>
          `;
        } else if (stickerLower.includes('flower') || stickerLower.includes('floral') || stickerLower.includes('rose') || stickerLower.includes('blossom')) {
          stickerElement = `
            <g transform="translate(460, 460)">
              <path d="M -35,5 C -45,-25 -15,-45 10,-35 C 35,-45 45,-15 35,15 C 25,35 -15,45 -35,5 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
              <circle cx="-6" cy="-6" r="16" fill="#fda4af" opacity="0.9" />
              <circle cx="8" cy="8" r="14" fill="#fecdd3" opacity="0.9" />
              <circle cx="10" cy="-10" r="15" fill="#f472b6" opacity="0.8" />
              <circle cx="-10" cy="10" r="12" fill="#fb7185" opacity="0.8" />
              <circle cx="0" cy="0" r="8" fill="#be123c" />
              <circle cx="0" cy="0" r="4" fill="#ffffff" />
              <path d="M 24,20 C 35,28 35,12 28,8 Z" fill="#4ade80" />
              <path d="M -24,-20 C -35,-28 -35,-12 -28,-8 Z" fill="#4ade80" />
            </g>
          `;
        } else if (stickerLower.includes('heart') || stickerLower.includes('love')) {
          stickerElement = `
            <g transform="translate(460, 460)">
              <path d="M -30,-15 C -45,-35 -5,-45 10,-20 C 25,-45 50,-30 35,0 C 20,25 0,40 -10,42 C -25,30 -45,10 -30,-15 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
              <path d="M 5,-10 C 15,-25 35,-15 25,5 C 15,20 0,32 -5,32 C -15,25 -30,5 -20,-10 C -10,-25 0,-15 5,-10 Z" fill="#f43f5e" />
              <ellipse cx="-10" cy="-6" rx="4" ry="7" fill="#ffffff" opacity="0.4" transform="rotate(-30 -10 -6)" />
              <path d="M -15,10 C -10,2 -2,6 -5,15 C -8,20 -15,25 -17,25 C -20,22 -25,18 -22,12 C -20,8 -17,10 -15,10 Z" fill="#ec4899" opacity="0.9" />
            </g>
          `;
        } else {
          stickerElement = `
            <g transform="translate(460, 460)">
              <path d="M 0,-40 L 12,-12 L 40,-8 L 18,12 L 25,40 L 0,22 L -25,40 L -18,12 L -40,-8 L -12,-12 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" stroke="#ffffff" stroke-width="8" stroke-linejoin="round" />
              <path d="M 0,-34 L 10,-10 L 34,-7 L 15,10 L 21,34 L 0,19 L -21,34 L -15,10 L -34,-7 L -10,-10 Z" fill="#f59e0b" />
              <path d="M 0,-34 L 10,-10 L 34,-7 L 15,10 L 21,34 L 0,19 Z" fill="#fbbf24" />
              <circle cx="0" cy="0" r="4" fill="#ffffff" opacity="0.9" />
              <circle cx="-15" cy="-20" r="3" fill="#ffffff" />
              <circle cx="15" cy="20" r="2.5" fill="#ffffff" />
            </g>
          `;
        }

        const svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
            <defs>
              <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${bgGradient.start}" />
                <stop offset="100%" stop-color="${bgGradient.end}" />
              </linearGradient>
              <filter id="paperTexture" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.04 0" />
                <feBlend mode="multiply" in="SourceGraphic" in2="noise" />
              </filter>
            </defs>

            <rect width="600" height="600" fill="url(#cardGrad)" rx="24" />
            <rect width="600" height="600" fill="none" rx="24" filter="url(#paperTexture)" />

            ${splatters}
            ${floralDecorations}

            <rect x="25" y="25" width="550" height="550" fill="none" stroke="${bgGradient.border}" stroke-width="2.5" stroke-dasharray="8 6" rx="18" opacity="0.6" />

            <g transform="translate(300, 52)">
              <text text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="12" fill="${bgGradient.leafColor}" font-weight="bold" letter-spacing="1.5" opacity="0.8">
                ESPECIALLY MADE FOR ${(recipient || '').toUpperCase()}
              </text>
            </g>

            ${stickerElement}
          </svg>
        `;

        return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgContent.trim())))}`;
      };

      const fallbackSvg = generateLocalCustomSvg(cardStyle, cardSticker, cardRecipient);
      setStep5ImageUrl(fallbackSvg);
      playSoundEffect('bloom');
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 2000);
      setSpeechBubble(`🎉 Presto! I have painted a beautiful watercolor card themed with ${cardStyle} and adorned with ${cardSticker}! 🌸`);
      writeToTerminal('[Step 5] Thank you card background generated dynamically!');
    } finally {
      setStep5Generating(false);
    }
  };

  const loadStep5Template = (recipient: string, message: string, style: string, sticker: string) => {
    setCardRecipient(recipient);
    setStep5Message(message);
    setCardStyle(style);
    setCardSticker(sticker);
    playSoundEffect('bloom');
    setSpeechBubble(`Template loaded! Feel free to customize any part! ✨`);
    writeToTerminal(`[Step 5] Pre-filled thank-you card builder template for "${recipient}".`);
  };

  const downloadMergedCard = () => {
    if (!step5ImageUrl) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw background
      ctx.drawImage(img, 0, 0, 800, 800);
      
      // Draw a semi-transparent white parchment overlays to make the text incredibly readable!
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.beginPath();
      ctx.roundRect(80, 80, 640, 640, 30);
      ctx.fill();
      
      // Draw double card border
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(100, 100, 600, 600, 20);
      ctx.stroke();

      // Draw custom font headings
      ctx.fillStyle = '#be123c';
      ctx.font = 'bold 32px Georgia, serif';
      ctx.textAlign = 'center';
      const headingText = cardRecipient ? `To: ${cardRecipient}` : 'Thank You!';
      ctx.fillText(headingText, 400, 175);

      // Draw horizontal line divider
      ctx.strokeStyle = '#fecdd3';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(250, 210);
      ctx.lineTo(550, 210);
      ctx.stroke();

      // Wrap and draw message
      ctx.fillStyle = '#374151';
      ctx.font = 'italic 24px Georgia, serif';
      ctx.textAlign = 'center';
      
      const words = step5Message.split(' ');
      let line = '';
      const lines = [];
      const maxWidth = 520;
      
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      let y = 265;
      const lineHeight = 38;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), 400, y);
        y += lineHeight;
      }
      
      // Draw heartwarming footer
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.fillText('❤️ Made with Bloom Empathy Game ❤️', 400, 640);
      
      if (cardSender) {
        ctx.fillStyle = '#be123c';
        ctx.font = 'bold italic 22px Georgia, serif';
        ctx.fillText(`From: ${cardSender}`, 400, 675);
      }
      
      // Trigger download
      try {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Thank_You_Card.png`;
        link.href = url;
        link.click();
        writeToTerminal('[Step 5] Downloaded fully merged custom greeting card successfully!');
      } catch (err) {
        console.error("Failed to generate download URL", err);
        const link = document.createElement('a');
        link.download = `Card_Background.png`;
        link.href = step5ImageUrl;
        link.click();
      }
    };
    img.src = step5ImageUrl;
  };

  const currentStageProps = stageProps[plantStage] || stageProps[1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center p-4 font-sans antialiased text-slate-800">
      
      <div className="max-w-6xl w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-emerald-100/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: Interactive Visual Canvas Stage */}
        <div className="lg:col-span-5 bg-gradient-to-b from-emerald-100/40 to-teal-50 p-6 flex flex-col justify-between items-center border-b lg:border-b-0 lg:border-r border-emerald-100 relative overflow-hidden">
          
          {activeStep === 4 ? (
            <>
              {/* Interactive Header Metadata for Step 4 */}
              <div className="w-full text-center z-10 animate-fadeIn">
                <span className="px-3 py-1 bg-indigo-200 text-indigo-800 text-xs font-bold uppercase tracking-wider rounded-full">
                  Empathy Healing Studio
                </span>
                <h1 className="font-heading text-3xl text-indigo-900 mt-2">Yuen's Heart</h1>
                <p className="text-xs text-indigo-600/80 mt-1 font-semibold">Transforming Hurt into Healing</p>
              </div>

              {/* Spacious Stage Container for Yuen's Dynamic Heart and Boy Character */}
              <div className="relative w-full h-[380px] max-w-[368px] my-4 flex flex-col items-center justify-between p-6 bg-white/50 rounded-3xl border border-indigo-100/40 shadow-inner overflow-hidden">
                
                {/* Floating Hearts Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Object.values(step4Submitted).filter(Boolean).map((isDone, idx) => isDone && (
                    <span 
                      key={idx}
                      className="absolute text-red-500 text-2xl animate-float"
                      style={{ 
                        left: `${15 + idx * 14}%`, 
                        bottom: `${10 + (idx % 3) * 20}%`,
                        animationDelay: `${idx * 0.4}s`,
                        animationDuration: `${3 + (idx % 2) * 2}s`
                      }}
                    >
                      ❤️
                    </span>
                  ))}
                  {/* Sad tear drops if none completed */}
                  {Object.values(step4Submitted).filter(Boolean).length === 0 && (
                    <span className="absolute text-blue-300 text-xl animate-bounce" style={{ left: '30%', top: '30%' }}>💧</span>
                  )}
                  {Object.values(step4Submitted).filter(Boolean).length === 0 && (
                    <span className="absolute text-blue-300 text-xl animate-bounce" style={{ right: '30%', top: '40%', animationDelay: '0.5s' }}>💧</span>
                  )}
                </div>

                {/* Dynamic Boy Avatar SVG */}
                <div className="w-full flex-1 flex items-center justify-center relative">
                  {(() => {
                    const solvedCount = Object.values(step4Submitted).filter(Boolean).length;
                    
                    let boyMoodEmoji = "😭";
                    let boyMoodText = "Deeply Sad";
                    let bubbleBg = "bg-rose-50 border-rose-100 text-rose-900";
                    let boySpeak = "No one hears me... they just call me lazy and messy.";
                    
                    let blushOpacity = 0;
                    let tearOpacity = 1;
                    let mouthPath = "M 130 205 Q 150 190 170 205"; // Crying/downward curve
                    let eyePathLeft = "M 115 155 Q 125 165 135 155"; // Sad drooping eye line
                    let eyePathRight = "M 165 155 Q 175 165 185 155";
                    
                    if (solvedCount === 1 || solvedCount === 2) {
                      boyMoodEmoji = "🥺";
                      boyMoodText = "Feeling Heard";
                      bubbleBg = "bg-amber-50 border-amber-100 text-amber-900";
                      boySpeak = "Someone is speaking up for me... is there hope?";
                      blushOpacity = 0.25;
                      tearOpacity = 0.4;
                      mouthPath = "M 135 200 L 165 200"; // Neutral line
                      eyePathLeft = "M 115 155 A 10 10 0 0 1 135 155"; // Rounded curious eyes
                      eyePathRight = "M 165 155 A 10 10 0 0 1 185 155";
                    } else if (solvedCount === 3 || solvedCount === 4) {
                      boyMoodEmoji = "😊";
                      boyMoodText = "Warm & Relieved";
                      bubbleBg = "bg-sky-50 border-sky-100 text-sky-900";
                      boySpeak = "Wow, changing those words makes me feel so much lighter!";
                      blushOpacity = 0.6;
                      tearOpacity = 0;
                      mouthPath = "M 135 195 Q 150 208 165 195"; // Gentle smile
                      eyePathLeft = "M 115 155 Q 125 145 135 155"; // Smiling arc eye
                      eyePathRight = "M 165 155 Q 175 145 185 155";
                    } else if (solvedCount === 5) {
                      boyMoodEmoji = "🥰";
                      boyMoodText = "Loved & Strong";
                      bubbleBg = "bg-pink-50 border-pink-100 text-pink-900";
                      boySpeak = "Thank you for understanding how hard I am trying!";
                      blushOpacity = 0.8;
                      tearOpacity = 0;
                      mouthPath = "M 130 195 Q 150 215 170 195"; // Large open happy smile
                      eyePathLeft = "M 115 155 Q 125 142 135 155";
                      eyePathRight = "M 165 155 Q 175 142 185 155";
                    } else if (solvedCount === 6) {
                      boyMoodEmoji = "👑🌈";
                      boyMoodText = "Completely Healed!";
                      bubbleBg = "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100 text-emerald-950";
                      boySpeak = "I am blooming with love! My heart is full of joy! Thank you! 🎉";
                      blushOpacity = 1.0;
                      tearOpacity = 0;
                      mouthPath = "M 125 190 Q 150 225 175 190"; // Extremely joyous laugh
                      eyePathLeft = "M 115 150 L 125 160 L 135 150 M 115 160 L 125 150 L 135 160"; 
                      eyePathRight = "M 165 150 L 175 160 L 185 150 M 165 160 L 175 150 L 185 160";
                    }

                    return (
                      <div className="flex flex-col items-center w-full animate-fadeIn">
                        {/* Interactive Character Speech Bubble */}
                        <div className={`w-full ${bubbleBg} border p-3 rounded-2xl shadow-sm text-center font-bold text-xs italic mb-4 relative`}>
                          "{boySpeak}"
                          <div className={`absolute bottom-[-6px] left-[50%] translate-x-[-50%] w-3 h-3 rotate-45 border-r border-b ${bubbleBg}`}></div>
                        </div>

                        {/* Interactive Boy Face SVG */}
                        <svg className="w-[180px] h-[180px] drop-shadow-md" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Shirt Collar */}
                          <path d="M 110 260 L 150 285 L 190 260 L 150 295 Z" fill="#60a5fa" stroke="#3b82f6" strokeWidth="3" />
                          <path d="M 80 270 C 100 250, 200 250, 220 270 L 210 300 L 90 300 Z" fill="#93c5fd" />
                          
                          {/* Face base */}
                          <circle cx="150" cy="170" r="75" fill="#fed7aa" stroke="#f97316" strokeWidth="4" />
                          
                          {/* Ears */}
                          <circle cx="70" cy="170" r="14" fill="#fed7aa" stroke="#f97316" strokeWidth="3" />
                          <circle cx="230" cy="170" r="14" fill="#fed7aa" stroke="#f97316" strokeWidth="3" />
                          
                          {/* Hair (messy cute little boy style) */}
                          <path d="M 70 140 C 70 70, 230 70, 230 140 C 210 110, 190 120, 180 100 C 160 120, 140 100, 130 110 C 110 100, 90 110, 70 140 Z" fill="#334155" stroke="#1e293b" strokeWidth="4" />
                          
                          {/* Cheeks Blush */}
                          <circle cx="105" cy="185" r="12" fill="#f43f5e" opacity={blushOpacity * 0.6} />
                          <circle cx="195" cy="185" r="12" fill="#f43f5e" opacity={blushOpacity * 0.6} />

                          {/* Tear drops */}
                          {tearOpacity > 0 && (
                            <g opacity={tearOpacity} className="animate-pulse">
                              <path d="M 115 165 C 115 180, 105 180, 105 165 Z" fill="#38bdf8" />
                              <path d="M 185 165 C 185 180, 195 180, 195 165 Z" fill="#38bdf8" />
                            </g>
                          )}

                          {/* Eyes */}
                          <path d={eyePathLeft} stroke="#334155" strokeWidth="4" strokeLinecap="round" fill="none" />
                          <path d={eyePathRight} stroke="#334155" strokeWidth="4" strokeLinecap="round" fill="none" />
                          
                          {/* Mouth */}
                          <path d={mouthPath} stroke="#334155" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                {/* Healing Index Text */}
                <div className="text-center w-full mt-2">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Yuen's Emotional Status</span>
                  <p className="text-xs font-black text-indigo-700">
                    {(() => {
                      const count = Object.values(step4Submitted).filter(Boolean).length;
                      if (count === 0) return "😭 Deeply Sad & Hurt (0/6)";
                      if (count === 1) return "🥺 Seeking Solace (1/6)";
                      if (count === 2) return "🙂 Sensing Care (2/6)";
                      if (count === 3) return "😊 Feeling Light (3/6)";
                      if (count === 4) return "✨ Heart Warming Up (4/6)";
                      if (count === 5) return "💖 Confident & Loved (5/6)";
                      return "🥰 Completely Healed & Loved (6/6) 🎉";
                    })()}
                  </p>
                </div>

              </div>

              {/* Step 4 Custom Dashboard */}
              <div className="w-full bg-white/80 border border-indigo-100/80 rounded-2xl p-4 shadow-sm z-10 text-center animate-fadeIn">
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">Yuen's Heart Vitality</span>
                <div className="text-lg font-bold text-slate-800 mt-1">
                  {(() => {
                    const count = Object.values(step4Submitted).filter(Boolean).length;
                    return count === 6 ? "🌈 Sunshine Healing Complete!" : `💖 Healing: ${Math.round((count / 6) * 100)}%`;
                  })()}
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-1000"
                    style={{ width: `${(Object.values(step4Submitted).filter(Boolean).length / 6) * 100}%` }}
                  ></div>
                </div>

                {/* List of 6 Scenarios Checklist */}
                <div className="grid grid-cols-3 gap-1.5 mt-3.5 text-[9px] text-slate-500 font-medium text-left">
                  {step4Scenarios.map((s) => {
                    const done = step4Submitted[s.id];
                    return (
                      <span key={s.id} className={`flex items-center gap-1 p-1 rounded border transition-all ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        {done ? '✅' : '❌'} {s.subtitle}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Interactive Header Metadata */}
              <div className="w-full text-center z-10">
                <span className="px-3 py-1 bg-emerald-200/50 text-emerald-800 text-xs font-bold uppercase tracking-wider rounded-full">
                  Interactive Values Education
                </span>
                <h1 className="font-heading text-3xl text-emerald-800 mt-2">Let's Bloom!</h1>
                <p className="text-xs text-emerald-600/80 mt-1 font-semibold">Based on the Story of "Bloom"</p>
              </div>

              {/* Spacious Stage Container preventing any flower clipping */}
              <div className="relative w-full h-[380px] max-w-[368px] my-4 flex items-center justify-center bg-white/40 rounded-3xl border border-emerald-100/30 shadow-inner overflow-hidden">
                
                {/* Sparkles Overlay (positive events) */}
                {showSparkles && (
                  <div id="sparkle-layer" className="absolute inset-0 pointer-events-none">
                    <span className="absolute text-yellow-400 text-2xl particle" style={{ left: '15%', top: '25%', animationDelay: '0s' }}>✨</span>
                    <span className="absolute text-pink-400 text-xl particle" style={{ left: '85%', top: '20%', animationDelay: '0.5s' }}>🌸</span>
                    <span className="absolute text-yellow-300 text-3xl particle" style={{ left: '50%', top: '10%', animationDelay: '0.2s' }}>✨</span>
                    <span className="absolute text-emerald-400 text-lg particle" style={{ left: '25%', top: '35%', animationDelay: '0.8s' }}>🌱</span>
                    <span className="absolute text-pink-300 text-2xl particle" style={{ left: '75%', top: '40%', animationDelay: '1.1s' }}>🌸</span>
                  </div>
                )}

                {/* SVG Plant Canvas */}
                <svg 
                  id="plant-svg" 
                  className={`w-full h-full ${isErrorShiver ? 'animate-shiver' : 'animate-sway'}`} 
                  viewBox="0 0 300 370" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Water Droplets Layer */}
                  {showWaterDrops && (
                    <g id="anim-water-drops">
                      <circle cx="90" cy="20" r="4.5" fill="#29b6f6" className="water-drop-particle" style={{ animationDelay: '0s' }}/>
                      <circle cx="120" cy="10" r="5.5" fill="#29b6f6" className="water-drop-particle" style={{ animationDelay: '0.3s' }}/>
                      <circle cx="150" cy="30" r="4" fill="#03a9f4" className="water-drop-particle" style={{ animationDelay: '0.1s' }}/>
                      <circle cx="180" cy="15" r="6" fill="#29b6f6" className="water-drop-particle" style={{ animationDelay: '0.5s' }}/>
                      <circle cx="210" cy="25" r="4.5" fill="#03a9f4" className="water-drop-particle" style={{ animationDelay: '0.2s' }}/>
                    </g>
                  )}

                  {/* Natural Fertilizer Layer */}
                  {showFertilizer && (
                    <g id="anim-fertilizer-particles">
                      <circle cx="105" cy="40" r="4.5" fill="#8d6e63" className="fertilizer-particle" style={{ animationDelay: '0s' }}/>
                      <circle cx="135" cy="30" r="3.5" fill="#a1887f" className="fertilizer-particle" style={{ animationDelay: '0.4s' }}/>
                      <circle cx="165" cy="45" r="5" fill="#8d6e63" className="fertilizer-particle" style={{ animationDelay: '0.1s' }}/>
                      <circle cx="195" cy="35" r="3.5" fill="#a1887f" className="fertilizer-particle" style={{ animationDelay: '0.6s' }}/>
                    </g>
                  )}

                  {/* Sunlight Layer */}
                  {showSunlight && (
                    <g id="anim-sunlight-rays">
                      <circle cx="260" cy="50" r="24" fill="#fbc02d" opacity="0.9"/>
                      <circle cx="260" cy="50" r="34" fill="#fdd835" opacity="0.4" className="sun-ray-pulse"/>
                      <line x1="230" y1="80" x2="160" y2="160" stroke="#fbc02d" strokeWidth="3" strokeLinecap="round" className="sun-ray-pulse" style={{ animationDelay: '0s' }}/>
                      <line x1="250" y1="90" x2="190" y2="180" stroke="#fbc02d" strokeWidth="2" strokeLinecap="round" className="sun-ray-pulse" style={{ animationDelay: '0.3s' }}/>
                      <line x1="210" y1="60" x2="135" y2="140" stroke="#fbc02d" strokeWidth="2" strokeLinecap="round" className="sun-ray-pulse" style={{ animationDelay: '0.6s' }}/>
                    </g>
                  )}

                  {/* Plant Body with 10% translation down to avoid truncation */}
                  <g id="entire-plant" transform="translate(0, 35)">
                    {/* Ceramic Pot & Organic Soil */}
                    <path d="M100,280 L200,280 L185,330 L115,330 Z" fill="#b08968" stroke="#8d6e63" strokeWidth="4" strokeLinejoin="round"/>
                    <ellipse cx="150" cy="280" rx="48" ry="10" fill="#6d4c41"/>
                    <path d="M115,280 C130,285 170,285 185,280" stroke="#5d4037" strokeWidth="2"/>

                    {/* Leaves */}
                    <path id="leaf-left" d="M125,230 C95,225 80,245 85,255 C100,260 120,240 125,230 Z" fill={currentStageProps.leafColor} stroke="#827717" strokeWidth="3"/>
                    <path id="leaf-right" d="M175,215 C205,210 215,230 205,240 C190,245 180,225 175,215 Z" fill={currentStageProps.leafColor} stroke="#827717" strokeWidth="3"/>

                    {/* Tears Layer (Visible when crying) */}
                    {plantStage === 6 && (
                      <g id="tears-group">
                        <path className="tear-drop fill-blue-400" d="M120,130 Q115,145 120,150 Q125,145 120,130 Z" style={{ animationDelay: '0s' }}/>
                        <path className="tear-drop fill-blue-400" d="M180,140 Q185,155 180,160 Q175,155 180,140 Z" style={{ animationDelay: '0.7s' }}/>
                      </g>
                    )}

                    {/* Main Stem */}
                    <path id="plant-stem" d={currentStageProps.stemD} stroke={currentStageProps.stemColor} strokeWidth="10" strokeLinecap="round"/>

                    {/* Flower Head Group */}
                    <g id="flower-head" transform={currentStageProps.headTransform}>
                      {/* Back petals */}
                      <circle id="petal-back-1" cx="0" cy="-28" r="18" fill="#c2185b" className="opacity-80"/>
                      <circle id="petal-back-2" cx="-26" cy="12" r="18" fill="#c2185b" className="opacity-80"/>
                      <circle id="petal-back-3" cx="26" cy="12" r="18" fill="#c2185b" className="opacity-80"/>

                      {/* Front closed petals */}
                      <circle id="petal-front-1" cx={currentStageProps.p1.cx} cy={currentStageProps.p1.cy} r={currentStageProps.p1.r} fill={currentStageProps.petalFill}/>
                      <circle id="petal-front-2" cx={currentStageProps.p2.cx} cy={currentStageProps.p2.cy} r={currentStageProps.p2.r} fill={currentStageProps.petalFill}/>
                      <circle id="petal-front-3" cx={currentStageProps.p3.cx} cy={currentStageProps.p3.cy} r={currentStageProps.p3.r} fill={currentStageProps.petalFill}/>

                      {/* Flower Center Core */}
                      <circle id="flower-core" cx="0" cy="0" r="24" fill={currentStageProps.coreColor} stroke="#90a4ae" strokeWidth="2.5"/>

                      {/* Layered Background Face (Empathetic Face) */}
                      <g id="flower-back-face" opacity={plantStage === 5 ? 0.35 : 0} style={{ transition: 'opacity 0.8s ease' }}>
                        <circle cx="0" cy="-28" r="18" fill="#ec407a" className="opacity-80"/>
                        <path id="back-eye-left" d="M-8,1 L-2,-3" stroke="#5d4037" strokeWidth="3" fill="none" strokeLinecap="round"/>
                        <path id="back-eye-right" d="M2,-3 L8,1" stroke="#5d4037" strokeWidth="3" fill="none" strokeLinecap="round"/>
                        <path id="back-mouth" d="M-4,8 Q0,4 4,8" stroke="#5d4037" strokeWidth="3" fill="none" strokeLinecap="round"/>
                      </g>
                      
                      {/* Standard Facial Features */}
                      <path id="eye-left" d={currentStageProps.eyeLD} stroke="#5d4037" strokeWidth="3" fill="none" strokeLinecap="round"/>
                      <path id="eye-right" d={currentStageProps.eyeRD} stroke="#5d4037" strokeWidth="3" fill="none" strokeLinecap="round"/>
                      <path id="mouth" d={currentStageProps.mouthD} stroke="#5d4037" strokeWidth="3" fill="none" strokeLinecap="round"/>
                    </g>
                  </g>
                </svg>
              </div>

              {/* Plant Vitality Metric Dashboard */}
              <div className="w-full bg-white/80 border border-emerald-100/80 rounded-2xl p-4 shadow-sm z-10 text-center">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Plant Vitality</span>
                <div id="status-text" className="text-xl font-bold text-slate-800 mt-1">
                  {currentStageProps.statusText}
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div 
                    id="health-bar" 
                    className={`${currentStageProps.healthBarClass} h-full transition-all duration-1000`}
                    style={{ width: currentStageProps.healthWidth }}
                  ></div>
                </div>
                
                <div className="flex justify-center gap-3 mt-3 text-xs text-slate-500 font-medium">
                  <span id="chk-water" className={`flex items-center gap-1 transition-opacity ${physicalState.water ? 'opacity-100 font-bold text-emerald-700' : 'opacity-30'}`}>
                    💧 Water
                  </span>
                  <span id="chk-soil" className={`flex items-center gap-1 transition-opacity ${physicalState.soil ? 'opacity-100 font-bold text-emerald-700' : 'opacity-30'}`}>
                    🪱 Fertilizer
                  </span>
                  <span id="chk-sun" className={`flex items-center gap-1 transition-opacity ${physicalState.sun ? 'opacity-100 font-bold text-emerald-700' : 'opacity-30'}`}>
                    ☀️ Sunlight
                  </span>
                </div>
              </div>
            </>
          )}
          
        </div>

        {/* Right Column: Step-by-Step Lesson Panel */}
        <div className="lg:col-span-7 p-8 flex flex-col justify-between">
          
          <div>
            {/* Step Selection Banner */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 justify-between gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button 
                id="banner-step-1" 
                type="button" 
                onClick={() => handleStepSwitch(1)} 
                className={`flex-1 py-2 text-center rounded-xl text-[11px] font-bold transition-all px-2 ${activeStep === 1 ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                1. Care 🌱
              </button>
              <button 
                id="banner-step-2" 
                type="button" 
                onClick={() => handleStepSwitch(2)} 
                className={`flex-1 py-2 text-center rounded-xl text-[11px] font-bold transition-all px-2 ${activeStep === 2 ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                2. Words 🌟
              </button>
              <button 
                id="banner-step-3" 
                type="button" 
                onClick={() => handleStepSwitch(3)} 
                className={`flex-1 py-2 text-center rounded-xl text-[11px] font-bold transition-all px-2 ${activeStep === 3 ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                3. Practice 🎙️
              </button>
              <button 
                id="banner-step-4" 
                type="button" 
                onClick={() => handleStepSwitch(4)} 
                className={`flex-1 py-2 text-center rounded-xl text-[11px] font-bold transition-all px-2 ${activeStep === 4 ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                4. Daily Empathy 🏡
              </button>
              <button 
                id="banner-step-5" 
                type="button" 
                onClick={() => handleStepSwitch(5)} 
                className={`flex-1 py-2 text-center rounded-xl text-[11px] font-bold transition-all px-2 ${activeStep === 5 ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                5. Thanks Card 💌
              </button>
            </div>

            {/* Panel Step 1: Physical Care */}
            {activeStep === 1 && (
              <div id="panel-step-1" className="transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">1</span>
                  <h3 className="font-bold text-slate-700 text-lg">Step 1: Physical Care & Nutrients</h3>
                </div>
                
                {step1Stage === 0 ? (
                  <div id="step1-start-container" className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center my-4 space-y-4">
                    <p className="text-slate-600 font-semibold text-base">Look at this shriveled plant! What does it need to come back to life?</p>
                    <p className="text-xs text-slate-400">The plant is currently too weak to show any option. Tap the button to diagnose its needs.</p>
                    <button 
                      type="button" 
                      onClick={startStep1Flow} 
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-all animate-bounce"
                    >
                      START CARING 🔄
                    </button>
                  </div>
                ) : (
                  <div id="step1-nutrition-center" className="space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center relative overflow-hidden">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">Plant's Message:</span>
                      <p id="plant-speech-bubble" className="text-slate-800 font-bold text-lg italic">
                        {speechBubble}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        id="btn-water" 
                        type="button" 
                        onClick={() => applyNutrient('water')} 
                        className="flex flex-col items-center justify-center py-4 px-4 rounded-2xl border border-blue-100 bg-blue-50/40 hover:bg-blue-100 text-blue-800 font-bold text-sm transition-all gap-1.5 shadow-sm"
                      >
                        <span className="text-3xl">💧</span>
                        <span>Water</span>
                      </button>
                      <button 
                        id="btn-soil" 
                        type="button" 
                        onClick={() => applyNutrient('soil')} 
                        className="flex flex-col items-center justify-center py-4 px-4 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-100 text-amber-800 font-bold text-sm transition-all gap-1.5 shadow-sm"
                      >
                        <span className="text-3xl">🪱🍂</span>
                        <span>Fertilizer</span>
                      </button>
                      <button 
                        id="btn-sun" 
                        type="button" 
                        onClick={() => applyNutrient('sun')} 
                        className="flex flex-col items-center justify-center py-4 px-4 rounded-2xl border border-yellow-100 bg-yellow-50/40 hover:bg-yellow-100 text-yellow-800 font-bold text-sm transition-all gap-1.5 shadow-sm"
                      >
                        <span className="text-3xl">☀️</span>
                        <span>Sunlight</span>
                      </button>
                    </div>
                  </div>
                )}

                {step1Stage === 4 && (
                  <div id="step1-complete-card" className="bg-emerald-100/50 border border-emerald-200 rounded-2xl p-4 text-center mt-4">
                    <p className="text-emerald-800 font-bold text-sm">
                      🎉 You successfully revived the physical plant! It is now ready for empathy and words of kindness.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => handleStepSwitch(2)} 
                      className="mt-3 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Proceed to Step 2: Kindness Words ➔
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Panel Step 2: Kindness Words & Match Game */}
            {activeStep === 2 && (
              <div id="panel-step-2" className="transition-all duration-300">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">2</span>
                    <h3 className="font-bold text-slate-700 text-lg">Step 2: Words of Kindness</h3>
                  </div>
                  
                  {/* Dynamic sub-mode toggler fixing the sub-mode switching issue */}
                  <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-bold gap-1">
                    <button 
                      id="subtab-explore" 
                      type="button" 
                      onClick={() => setStep2SubMode('explore')} 
                      className={`px-3 py-1.5 rounded-md transition-all ${step2SubMode === 'explore' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Vocabulary Explorer 🌟
                    </button>
                    <button 
                      id="subtab-matchgame" 
                      type="button" 
                      onClick={() => { setStep2SubMode('match'); initMatchGame(); }} 
                      className={`px-3 py-1.5 rounded-md transition-all ${step2SubMode === 'match' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Match-up Game 🧩
                    </button>
                  </div>
                </div>

                {/* Submode A: Vocabulary Explorer */}
                {step2SubMode === 'explore' && (
                  <div id="step2-explore-container" className="space-y-4">
                    <p className="text-xs text-slate-400">Click the positive adjectives to make the healthy plant bloom; or see what happens when you use negative/careless words.</p>
                    
                    <div className="space-y-6">
                      {/* Positive Words Section */}
                      <div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-3">Positive Adjectives (Evoke Good Feelings)</span>
                        <div id="explore-positive-grid" class="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {vocabularyDatabase.filter(item => item.isPositive).map(item => (
                            <button 
                              key={item.value}
                              type="button" 
                              onClick={() => handleExploreWord(item.value)} 
                              className="flex flex-col bg-white border border-slate-100 hover:border-emerald-300 hover:shadow-md rounded-2xl p-2 text-center transition-all h-44 justify-between"
                            >
                              <div className="w-full h-32 overflow-hidden rounded-xl bg-slate-50 relative flex items-center justify-center">
                                {failedImages[item.value] ? (
                                  <div className={`w-full h-full flex flex-col items-center justify-center rounded-xl bg-gradient-to-br ${fallbackStyling[item.value]?.bg || 'from-slate-50 to-slate-100'} border ${fallbackStyling[item.value]?.border || 'border-slate-200'} relative overflow-hidden shadow-inner`}>
                                    <span className="text-2xl animate-bounce" style={{ animationDuration: '3.5s' }}>
                                      {fallbackStyling[item.value]?.emoji || '✨'}
                                    </span>
                                  </div>
                                ) : (
                                  <img 
                                    src={item.img} 
                                    alt={item.value} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                    onError={() => handleImageError(item.value)}
                                  />
                                )}
                              </div>
                              <span className="text-xs font-bold text-emerald-800 capitalize mt-1">{item.value}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Negative Words Section */}
                      <div>
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block mb-3">Negative Words (Hurt Feelings)</span>
                        <div id="explore-negative-grid" class="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {vocabularyDatabase.filter(item => !item.isPositive).map(item => (
                            <button 
                              key={item.value}
                              type="button" 
                              onClick={() => handleExploreWord(item.value)} 
                              className="flex flex-col bg-white border border-slate-100 hover:border-emerald-300 hover:shadow-md rounded-2xl p-2 text-center transition-all h-44 justify-between"
                            >
                              <div className="w-full h-32 overflow-hidden rounded-xl bg-slate-50 relative flex items-center justify-center">
                                {failedImages[item.value] ? (
                                  <div className={`w-full h-full flex flex-col items-center justify-center rounded-xl bg-gradient-to-br ${fallbackStyling[item.value]?.bg || 'from-slate-50 to-slate-100'} border ${fallbackStyling[item.value]?.border || 'border-slate-200'} relative overflow-hidden shadow-inner`}>
                                    <span className="text-2xl animate-bounce" style={{ animationDuration: '3.5s' }}>
                                      {fallbackStyling[item.value]?.emoji || '✨'}
                                    </span>
                                  </div>
                                ) : (
                                  <img 
                                    src={item.img} 
                                    alt={item.value} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                    onError={() => handleImageError(item.value)}
                                  />
                                )}
                              </div>
                              <span className="text-xs font-bold text-rose-800 capitalize mt-1">{item.value}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submode B: Matching Game */}
                {step2SubMode === 'match' && (
                  <div id="step2-match-container" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">Match the correct Card illustration with its matching English word! Correct matches make the plant react!</p>
                      <button 
                        type="button" 
                        onClick={initMatchGame} 
                        className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-md transition-all"
                      >
                        Shuffle / Restart 🔄
                      </button>
                    </div>

                    {/* Shuffled card grid */}
                    <div id="match-grid" className="grid grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[220px]">
                      {matchCards.map((card, idx) => {
                        if (card.solved) {
                          return (
                            <button 
                              key={card.id}
                              type="button"
                              disabled
                              className="flex flex-col items-center justify-center border border-emerald-100 bg-emerald-50/50 rounded-xl p-2 opacity-50 cursor-not-allowed h-24 w-full"
                            >
                              {card.type === 'word' ? (
                                <span className="text-xs font-bold text-emerald-800 capitalize">{card.value}</span>
                              ) : (
                                failedImages[card.value] ? (
                                  <span className="text-xl">{fallbackStyling[card.value]?.emoji || '✨'}</span>
                                ) : (
                                  <img 
                                    src={card.img} 
                                    className="w-14 h-14 object-cover rounded-lg opacity-80" 
                                    alt={card.value}
                                    referrerPolicy="no-referrer"
                                    onError={() => handleImageError(card.value)}
                                  />
                                )
                              )}
                            </button>
                          );
                        }

                        if (card.flipped) {
                          return (
                            <button 
                              key={card.id}
                              type="button"
                              className="flex flex-col items-center justify-center border-2 border-indigo-400 bg-white rounded-xl p-2 transition-all relative overflow-hidden h-24 w-full"
                            >
                              {card.type === 'word' ? (
                                <span className="text-xs font-bold text-slate-700 capitalize">{card.value}</span>
                              ) : (
                                failedImages[card.value] ? (
                                  <span className="text-xl">{fallbackStyling[card.value]?.emoji || '✨'}</span>
                                ) : (
                                  <img 
                                    src={card.img} 
                                    className="w-14 h-14 object-cover rounded-lg" 
                                    alt={card.value}
                                    referrerPolicy="no-referrer"
                                    onError={() => handleImageError(card.value)}
                                  />
                                )
                              )}
                            </button>
                          );
                        }

                        // Face-down card state
                        return (
                          <button 
                            key={card.id}
                            type="button"
                            onClick={() => handleMatchCardClick(idx)}
                            className="flex flex-col items-center justify-center border border-slate-200 bg-gradient-to-br from-indigo-500 to-indigo-700 hover:scale-105 rounded-xl p-2 transition-all h-24 w-full cursor-pointer shadow-md"
                          >
                            <span className="text-2xl animate-pulse">🌸</span>
                            <span className="text-[9px] text-indigo-200 font-bold uppercase tracking-widest mt-1">FLIP ME</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-slate-600 px-1 bg-white p-3 border border-slate-100 rounded-xl">
                      <span>Pairs Solved: <span id="solved-count" className="text-emerald-600">{solvedPairs} / 6</span></span>
                      {solvedPairs === 6 && (
                        <span id="match-win-msg" className="text-pink-600 animate-pulse">🎉 Congratulations! Complete Match-up Success!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Panel Step 3: Speak & Mind Map */}
            {activeStep === 3 && (
              <div id="panel-step-3" className="transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">3</span>
                  <h3 className="font-bold text-slate-700 text-lg">Step 3: Speaking & Mind Map</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">Express empathy using full sentences. Use your microphone, type below, or explore the mind map brainstorm.</p>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch mb-4">
                  
                  {/* Microphone Box - Completely safe from page-scrolling navigation jumps */}
                  <div className="flex-1 flex flex-col justify-center items-center p-3 bg-white border border-slate-100 rounded-xl text-center">
                    <button 
                      id="mic-btn" 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); startVoiceRecognition(); }} 
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 ${isListening ? 'bg-red-500 hover:bg-red-600 shadow-red-200 animate-pulse' : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200'}`}
                    >
                      {isListening ? (
                        <MicOff className="h-6 w-6 text-white" />
                      ) : (
                        <Mic className="h-6 w-6 text-white" />
                      )}
                    </button>
                    <span id="mic-label" className="text-xs font-bold text-slate-700 mt-2">
                      {isListening ? '🎙️ Listening... Speak!' : 'Click to Speak English'}
                    </span>
                    <span className={`text-[10px] mt-1 ${micError ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                      {micError ? micError : (isListening ? 'Try saying: "You are kind!"' : 'Requires microphone permission.')}
                    </span>
                    {lastHeard && (
                      <div className="mt-2.5 w-full px-2 py-1 bg-indigo-50/75 border border-indigo-100 rounded-lg text-[10px] text-indigo-700 font-mono text-center">
                        Last heard: <span className="font-semibold italic">"{lastHeard}"</span>
                      </div>
                    )}
                  </div>

                  {/* Sentence Input Sandbox */}
                  <div className="flex-[1.5] flex flex-col justify-between gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        id="sentence-input" 
                        value={typedSentence}
                        onChange={(e) => setTypedSentence(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTypedSentence(); } }}
                        className="w-full h-full min-h-[50px] bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-300 pr-10" 
                        placeholder="e.g. 'You are wonderful!' or 'Thank you for being helpful.'"
                      />
                      <button 
                        type="button" 
                        onClick={(e) => { e.preventDefault(); submitTypedSentence(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all"
                      >
                        ➔
                      </button>
                    </div>
                    
                    {/* Helpers Patterns */}
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => handlePrefillSentence('You are so kind!')} 
                        className="text-[10px] bg-slate-200/60 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition-all"
                      >
                        "You are..."
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handlePrefillSentence('Thank you for being wonderful.')} 
                        className="text-[10px] bg-slate-200/60 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition-all"
                      >
                        "Thank you for..."
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handlePrefillSentence('Bloom, you silly flower!')} 
                        className="text-[10px] bg-slate-200/60 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition-all"
                      >
                        "You silly..."
                      </button>
                    </div>
                  </div>

                </div>

                {/* Mind Map Sections */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block mb-3">
                    🧠 Brainstorming Mind Map (Click to fill template)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Positive Nodes */}
                    <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                      <span className="font-bold text-emerald-800 block mb-2">🌸 Positive Words</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['polite', 'supportive', 'generous', 'thoughtful', 'encouraging', 'patient', 'understanding', 'brave', 'honest', 'grateful', 'friendly', 'gentle', 'sweet', 'warm', 'cheerful', 'positive', 'helpful', 'kind', 'caring', 'wonderful', 'beautiful'].map(word => (
                          <button 
                            key={word}
                            type="button" 
                            onClick={() => handleMindmapWord(word, true)} 
                            className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1.5 rounded-md transition-all text-xs font-semibold"
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Negative Nodes */}
                    <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100">
                      <span className="font-bold text-rose-800 block mb-2">🥀 Negative Words</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['rude', 'selfish', 'impatient', 'lazy', 'weak', 'picky', 'terrible', 'untidy', 'angry', 'mean', 'ugly', 'silly', 'unhelpful', 'harsh', 'cruel', 'careless', 'cold', 'noisy', 'boring'].map(word => (
                          <button 
                            key={word}
                            type="button" 
                            onClick={() => handleMindmapWord(word, false)} 
                            className="bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 px-2 py-1.5 rounded-md transition-all text-xs font-semibold"
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Panel Step 4: Daily Life Empathy */}
            {activeStep === 4 && (
              <div id="panel-step-4" className="transition-all duration-300 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">4</span>
                  <h3 className="font-bold text-slate-700 text-lg">Step 4: Daily Empathy Practice</h3>
                </div>
                
                 <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-center">
                  <div className="w-full md:w-1/3 flex justify-center">
                    <img 
                      src="/child-parent-fighting.png" 
                      alt="Parent and Child Communication" 
                      className="rounded-2xl shadow-md border border-slate-200/60 max-h-[160px] object-cover hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="w-full md:w-2/3 text-xs text-slate-600 leading-relaxed space-y-2">
                    <p className="font-bold text-indigo-900 text-sm">💡 Classroom Empathy Mission:</p>
                    <p>In our daily lives, parents always want us to grow, learn, and be our best. However, sometimes their anger and frustration lead to hurtful words and negative labels.</p>
                    <p>Look at the 6 comic scenarios below. Read the parent’s harsh complaint and Yuen's sad reaction. **Your mission is to rewrite the parent’s words using empathy and support**, so that Yuen feels loved, understood, and motivated to try his best!</p>
                  </div>
                </div>

                {/* 6 Comic Scenarios Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {step4Scenarios.map((scenario) => {
                    const isSubmitted = step4Submitted[scenario.id];
                    return (
                      <div 
                        key={scenario.id} 
                        className={`border-2 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 ${
                          isSubmitted 
                            ? 'border-emerald-200 bg-emerald-50/20 shadow-sm' 
                            : 'border-slate-200 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md'
                        }`}
                      >
                        {/* Panel Header */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                            {scenario.subtitle}
                          </span>
                          <span className="text-xl">{scenario.emoji}</span>
                        </div>
                        
                        <h4 className="font-bold text-slate-800 text-sm mb-3">
                          {scenario.title}
                        </h4>

                        {/* Scenario Illustration */}
                        {scenario.img && (
                          <div className="mb-4 overflow-hidden rounded-xl border border-slate-100 flex justify-center bg-slate-50 h-[180px] w-full">
                            <img 
                              src={scenario.img} 
                              alt={scenario.title} 
                              className="h-full w-full object-contain rounded-xl transition-transform hover:scale-102 duration-300"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Speech Bubbles Container */}
                        <div className="space-y-3 mb-4">
                          {/* Parent Hurtful Bubble */}
                          <div className="flex items-start gap-2">
                            <span className="text-lg mt-1">😠</span>
                            <div className="relative bg-rose-50 border border-rose-100 text-rose-950 px-3 py-2 rounded-xl text-xs font-semibold leading-relaxed w-full">
                              <span className="font-bold text-rose-800 text-[10px] block mb-0.5 uppercase tracking-wide">Parent's Complaint:</span>
                              {scenario.parentComplaint}
                              {/* Triangular tail */}
                              <div className="absolute top-3 -left-1.5 w-3 h-3 bg-rose-50 border-l border-b border-rose-100 rotate-45"></div>
                            </div>
                          </div>

                          {/* Boy Sad Response Bubble */}
                          <div className="flex items-start gap-2 justify-end">
                            <div className="relative bg-blue-50 border border-blue-100 text-blue-950 px-3 py-2 rounded-xl text-xs font-medium leading-relaxed w-full text-right">
                              <span className="font-bold text-blue-800 text-[10px] block mb-0.5 uppercase tracking-wide">Yuen's Reaction:</span>
                              {scenario.boyResponse}
                              {/* Triangular tail */}
                              <div className="absolute top-3 -right-1.5 w-3 h-3 bg-blue-50 border-r border-t border-blue-100 rotate-45"></div>
                            </div>
                            <span className="text-lg mt-1">👦😢</span>
                          </div>
                        </div>

                        {/* Advice Info Box */}
                        <p className="text-[10px] text-slate-500 italic mb-3 leading-relaxed">
                          ⚠️ {scenario.advice}
                        </p>

                        {/* Interactive Text Input Area */}
                        <div className="space-y-3">
                          <textarea
                            value={step4Inputs[scenario.id]}
                            onChange={(e) => {
                              if (!isSubmitted) {
                                setStep4Inputs(prev => ({ ...prev, [scenario.id]: e.target.value }));
                              }
                            }}
                            disabled={isSubmitted}
                            className={`w-full min-h-[70px] text-xs p-3 rounded-xl border focus:outline-none transition-all ${
                              isSubmitted
                                ? 'bg-slate-50 border-emerald-100 text-emerald-800 font-semibold'
                                : 'bg-white border-slate-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100'
                            }`}
                            placeholder={scenario.suggestedPlaceholder}
                          />

                          {/* Live Teacher Feedback Block */}
                          {step4Feedbacks[scenario.id] && (
                            <div className={`p-3 rounded-xl border text-xs leading-relaxed transition-all duration-300 animate-fadeIn ${
                              isSubmitted
                                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                : 'bg-rose-50/80 border-rose-200 text-rose-900'
                            }`}>
                              <span className="font-bold flex items-center gap-1 mb-1 text-[11px] uppercase tracking-wider">
                                {isSubmitted ? '👩‍🏫 Approved feedback:' : '👩‍🏫 Teacher Guidance (Please retry):'}
                              </span>
                              <p className="italic">"{step4Feedbacks[scenario.id]}"</p>
                            </div>
                          )}

                          {/* Submit / Status Button */}
                          {isSubmitted ? (
                            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-100/50 py-1.5 px-3 rounded-lg justify-center border border-emerald-200">
                              <CheckCircle className="w-4 h-4" />
                              <span>Empathetic Language Unlocked! 🌸</span>
                            </div>
                          ) : step4Checking[scenario.id] ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-2 bg-indigo-400 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-not-allowed"
                            >
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Teacher Evaluating Empathy...</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStep4Submit(scenario.id)}
                              className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                            >
                              <span>✨ Transform with Empathy</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Overall Step 4 Progress Bar */}
                <div className="bg-gradient-to-r from-indigo-550 to-indigo-700 text-white rounded-2xl p-5 shadow-md border border-indigo-600/20">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h4 className="font-bold text-sm">Empathy Transformation Progress</h4>
                      <p className="text-[10px] text-indigo-100 mt-1">Submit beautiful empathetic language for all 6 scenarios to watch the flower bloom completely!</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg bg-indigo-800/60 px-3 py-1 rounded-xl">
                        {Object.values(step4Submitted).filter(Boolean).length} / 6
                      </span>
                      {Object.values(step4Submitted).filter(Boolean).length === 6 && (
                        <span className="text-xs font-bold text-yellow-300 animate-bounce">🏆 MASTER OF EMPATHY!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Panel Step 5: Thanks to Mom Card */}
            {activeStep === 5 && (
              <div id="panel-step-5" className="transition-all duration-300 space-y-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">5</span>
                  <h3 className="font-bold text-slate-700 text-lg">Step 5: Write & Generate a Heartfelt "Thank You" Card 💌</h3>
                </div>

                {/* 1. Prompt Example Card (Educational Modelling) */}
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    <h4 className="font-bold text-slate-800 text-xs">How to write an effective Image Generation Prompt:</h4>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    To instruct an AI model (like an AI Illustrator) to generate a customized card background, an effective prompt divides details into: **Recipient**, **Message Space**, **Style/Colors**, and **Illustration Stickers**. 
                  </p>
                  <div className="bg-white/80 border border-violet-200/60 rounded-xl p-4 text-[11px] font-medium text-slate-700 space-y-2">
                    <div className="font-bold text-[10px] uppercase text-violet-600 tracking-wider mb-1">Example Prompt Model:</div>
                    <p className="italic text-slate-500">I need to generate a thank-you card.</p>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-700 pl-1">
                      <li>Please create an image for a thank-you card for <span className="font-semibold text-indigo-700">my teacher</span>.</li>
                      <li>In the card, please write: <span className="font-semibold text-rose-700">“Thank you very much for being so patient and supportive. I feel so lucky to have you as my English teacher.”</span></li>
                      <li>Please use <span className="font-semibold text-pink-600">pink and purple</span> for the card.</li>
                      <li>Please add <span className="font-semibold text-emerald-700">a cute cat sticker</span>.</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => loadStep5Template(
                        "my English teacher",
                        "Thank you very much for being so patient and supportive. I feel so lucky to have you as my English teacher.",
                        "pink and purple style",
                        "a cute cat sticker"
                      )}
                      className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-800 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🚀 Load English Teacher Example</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadStep5Template(
                        "my mother",
                        "Dear Mom, thank you so much for always taking such wonderful care of me, making delicious dinners, and hugging me when I feel down. I love you!",
                        "warm watercolor floral design with pastel yellow",
                        "sweet pink flowers and hearts"
                      )}
                      className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>❤️ Load Mom Card Example</span>
                    </button>
                  </div>
                </div>

                {/* 2. Dynamic Guided Prompt Builder */}
                <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/50 border border-rose-100 rounded-2xl p-6 space-y-4">
                  <div className="border-b border-rose-100 pb-2">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span>✍️ Guided Card & Prompt Builder</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Fill in each part to construct your final custom prompt for the AI!</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Part 1: Recipient */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        Part 1: Who is this card for? (Recipient)
                      </label>
                      <input
                        type="text"
                        value={cardRecipient}
                        onChange={(e) => setCardRecipient(e.target.value)}
                        placeholder="e.g., my English teacher, my mom, my best friend"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100 text-slate-700 font-medium"
                        disabled={step5Generating}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {['my teacher', 'my mother', 'my father', 'my best friend'].map((rec) => (
                          <button
                            key={rec}
                            type="button"
                            onClick={() => setCardRecipient(rec)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-medium border transition-all cursor-pointer ${
                              cardRecipient === rec
                                ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {rec}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Part 2: Sender */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        Part 2: Who is writing this card? (Sender)
                      </label>
                      <input
                        type="text"
                        value={cardSender}
                        onChange={(e) => setCardSender(e.target.value)}
                        placeholder="e.g., Your loving student, Tommy, your son"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100 text-slate-700 font-medium"
                        disabled={step5Generating}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {['Your loving student', 'Your child', 'Your best friend'].map((send) => (
                          <button
                            key={send}
                            type="button"
                            onClick={() => setCardSender(send)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-medium border transition-all cursor-pointer ${
                              cardSender === send
                                ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {send}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Part 3: Heartfelt Letter Text */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      Part 3: What message do you want written on the card? (Card Body)
                    </label>
                    <textarea
                      value={step5Message}
                      onChange={(e) => setStep5Message(e.target.value)}
                      className="w-full min-h-[90px] p-3 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100 text-slate-700 font-medium"
                      placeholder="e.g. Thank you very much for being so patient and supportive. I feel so lucky to have you as my English teacher."
                      disabled={step5Generating}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Part 4: Color Style */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        Part 4: What style & colors should it have?
                      </label>
                      <input
                        type="text"
                        value={cardStyle}
                        onChange={(e) => setCardStyle(e.target.value)}
                        placeholder="e.g., pink and purple style, warm pastel yellow floral design"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100 text-slate-700 font-medium"
                        disabled={step5Generating}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'cute cartoon design',
                          'warm watercolor floral',
                          'modern minimalist line-art',
                          'beautiful oil painting style',
                          'cozy sunset background',
                          'adorable crayon illustration',
                          'soft pastel sparkles'
                        ].map((sty) => (
                          <button
                            key={sty}
                            type="button"
                            onClick={() => setCardStyle(sty)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-medium border transition-all cursor-pointer ${
                              cardStyle === sty
                                ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {sty}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Part 5: Sticker Element */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        Part 5: What cute stickers/drawings to add?
                      </label>
                      <input
                        type="text"
                        value={cardSticker}
                        onChange={(e) => setCardSticker(e.target.value)}
                        placeholder="e.g., a cute cat sticker, sleeping bear sticker, hearts"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-100 text-slate-700 font-medium"
                        disabled={step5Generating}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {['a cute cat sticker', 'sweet pink flowers', 'cozy smiling sun'].map((stk) => (
                          <button
                            key={stk}
                            type="button"
                            onClick={() => setCardSticker(stk)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-medium border transition-all cursor-pointer ${
                              cardSticker === stk
                                ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {stk}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* LIVE PROMPT COMPILED BOX */}
                  <div className="bg-slate-900 text-slate-300 rounded-xl p-3.5 border border-slate-800 space-y-1.5 font-mono text-[10px]">
                    <div className="text-indigo-400 font-bold flex items-center justify-between">
                      <span>🤖 Compiled AI Image Generation Prompt Preview:</span>
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">AUTO-COMPILED</span>
                    </div>
                    <p className="leading-relaxed text-slate-100 select-all">
                      "Please create an image for a thank-you card for <span className="text-yellow-300 font-semibold">{cardRecipient || '(recipient)'}</span>. Color & style: <span className="text-green-300 font-semibold">{cardStyle || '(style)'}</span>. Decoration elements: <span className="text-pink-300 font-semibold">{cardSticker || '(sticker)'}</span>."
                    </p>
                  </div>

                  {step5Error && (
                    <div className="text-xs text-rose-600 font-semibold bg-rose-100/50 p-2.5 rounded-lg">
                      ⚠️ {step5Error}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={generateStep5Card}
                      disabled={step5Generating || !step5Message.trim() || !cardRecipient.trim()}
                      className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {step5Generating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Painting Watercolor Art...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Card Background via AI 🎨</span>
                        </>
                      )}
                    </button>

                    {step5ImageUrl && (
                      <button
                        type="button"
                        onClick={downloadMergedCard}
                        className="py-3 px-5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Completed Card 💖</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Animated cozy paint mixer loader when generating */}
                {step5Generating && (
                  <div className="border border-rose-100 bg-rose-50/20 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 animate-pulse">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin"></div>
                      <div className="absolute inset-2 bg-rose-100/30 rounded-full flex items-center justify-center">
                        <Gift className="w-6 h-6 text-rose-500 animate-bounce" />
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-xs text-rose-800">Magic is on the way...</h4>
                      <p className="text-[10px] text-slate-500">Mixing beautiful colors and placing {cardSticker || 'decorations'} in the canvas...</p>
                    </div>
                  </div>
                )}

                {/* Render the actual merged card preview! */}
                {step5ImageUrl && !step5Generating && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-700 text-sm text-center">✨ Your Custom Greeting Card Preview ✨</h4>
                    
                    <div className="flex justify-center">
                      {/* The physical card container */}
                      <div 
                        className="relative w-full max-w-[450px] aspect-square rounded-2xl shadow-xl overflow-hidden border border-rose-100"
                        style={{
                          backgroundImage: `url(${step5ImageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {/* Parchment Overlay Sheet */}
                        <div className="absolute inset-[10%] bg-white/85 rounded-xl border-2 border-rose-200/50 p-6 flex flex-col justify-between items-center text-center shadow-inner">
                          {/* Top heading */}
                          <div className="space-y-1 w-full">
                            <span className="text-rose-600 font-serif italic text-xs block font-bold tracking-widest uppercase">To: {cardRecipient}</span>
                            <div className="w-12 h-[1px] bg-rose-200 mx-auto"></div>
                          </div>

                          {/* Heartfelt Letter Text Body */}
                          <div className="flex-1 flex items-center justify-center px-2 py-4">
                            <p className="font-serif italic text-sm md:text-base text-slate-700 leading-relaxed max-h-[220px] overflow-y-auto pr-1">
                              "{step5Message}"
                            </p>
                          </div>

                          {/* Card Footer sign-off */}
                          <div className="space-y-1 w-full">
                            <div className="w-12 h-[1px] bg-rose-200 mx-auto"></div>
                            <span className="text-rose-500 text-[10px] font-bold block mt-1">With All My Empathy & Love ❤️</span>
                            {cardSender && (
                              <span className="text-rose-600 font-serif italic text-xs block font-bold tracking-wider mt-0.5">
                                From: {cardSender}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center italic mt-2">
                      💡 Click "Download Completed Card" to download this fully personalized physical card as an image!
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>



        </div>

      </div>

    </div>
  );
}
