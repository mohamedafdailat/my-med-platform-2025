import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, Upload, Brain, Languages, RotateCcw, Save, ChevronLeft, ChevronRight, 
  Eye, EyeOff, Settings, AlertCircle, CheckCircle, Loader, Play, Trash2, Home,
  Shuffle, XCircle, Clock, Trophy, Target, Volume2, Pause
} from 'lucide-react';

const FlashcardsApp = () => {
  // App state
  const [currentView, setCurrentView] = useState('library');
  const [language, setLanguage] = useState('fr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [error, setError] = useState('');

  // File handling
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Flashcards data
  const [decks, setDecks] = useState([]);
  const [currentDeckIndex, setCurrentDeckIndex] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState([]);
  const [isShuffled, setIsShuffled] = useState(false);

  // Study tracking
  const [studyStats, setStudyStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    startTime: Date.now(),
    cardProgress: []
  });

  // Deck configuration
  const [deckConfig, setDeckConfig] = useState({
    title: '',
    numberOfCards: 10,
    difficulty: 'medium',
    category: 'general'
  });

  // Settings
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Default decks with medical content
  const defaultFlashcardDecks = [
    {
      id: 'default-1',
      title: 'Anatomie Cardiovasculaire',
      description: 'Système circulatoire et structures cardiaques',
      category: 'anatomy',
      difficulty: 'medium',
      type: 'default',
      createdAt: '2024-01-01',
      cards: [
        {
          id: 'card-1',
          front: 'Quelle est la fonction principale du ventricule gauche ?',
          back: 'Pomper le sang oxygéné vers tout le corps via l\'aorte',
          difficulty: 'medium',
          category: 'anatomy'
        },
        {
          id: 'card-2',
          front: 'Où se situe la valve tricuspide ?',
          back: 'Entre l\'oreillette droite et le ventricule droit',
          difficulty: 'easy',
          category: 'anatomy'
        },
        {
          id: 'card-3',
          front: 'Qu\'est-ce que la circulation pulmonaire ?',
          back: 'Circuit sanguin entre le cœur et les poumons pour l\'oxygénation',
          difficulty: 'medium',
          category: 'anatomy'
        },
        {
          id: 'card-4',
          front: 'Définir la systole cardiaque',
          back: 'Phase de contraction du muscle cardiaque qui éjecte le sang',
          difficulty: 'hard',
          category: 'anatomy'
        }
      ]
    },
    {
      id: 'default-2',
      title: 'Pharmacologie Clinique',
      description: 'Médicaments et leurs mécanismes d\'action',
      category: 'pharmacology',
      difficulty: 'hard',
      type: 'default',
      createdAt: '2024-01-01',
      cards: [
        {
          id: 'card-5',
          front: 'Mécanisme d\'action de l\'aspirine',
          back: 'Inhibition irréversible de la cyclooxygénase (COX-1 et COX-2)',
          difficulty: 'hard',
          category: 'pharmacology'
        },
        {
          id: 'card-6',
          front: 'Indication principale des inhibiteurs de l\'ECA',
          back: 'Hypertension artérielle et insuffisance cardiaque',
          difficulty: 'medium',
          category: 'pharmacology'
        },
        {
          id: 'card-7',
          front: 'Effet secondaire majeur des opioïdes',
          back: 'Dépression respiratoire et risque de dépendance',
          difficulty: 'hard',
          category: 'pharmacology'
        }
      ]
    },
    {
      id: 'default-3',
      title: 'Physiologie Respiratoire',
      description: 'Fonctionnement du système respiratoire',
      category: 'physiology',
      difficulty: 'medium',
      type: 'default',
      createdAt: '2024-01-01',
      cards: [
        {
          id: 'card-8',
          front: 'Qu\'est-ce que la capacité vitale ?',
          back: 'Volume maximal d\'air expiré après une inspiration maximale (≈4500ml)',
          difficulty: 'medium',
          category: 'physiology'
        },
        {
          id: 'card-9',
          front: 'Rôle du surfactant pulmonaire',
          back: 'Réduire la tension superficielle et empêcher l\'affaissement alvéolaire',
          difficulty: 'hard',
          category: 'physiology'
        }
      ]
    }
  ];

  const categories = [
    { id: 'all', label: { fr: 'Tous', ar: 'الكل' } },
    { id: 'anatomy', label: { fr: 'Anatomie', ar: 'التشريح' } },
    { id: 'physiology', label: { fr: 'Physiologie', ar: 'علم وظائف الأعضاء' } },
    { id: 'pharmacology', label: { fr: 'Pharmacologie', ar: 'علم الأدوية' } },
    { id: 'general', label: { fr: 'Général', ar: 'عام' } },
    { id: 'clinical', label: { fr: 'Pratique clinique', ar: 'الممارسة السريرية' } }
  ];

  const translations = {
    title: { fr: 'Flashcards Médicales', ar: 'البطاقات التعليمية الطبية' },
    subtitle: { fr: 'Apprenez et révisez efficacement', ar: 'تعلم وراجع بفعالية' },
    library: { fr: 'Ma Bibliothèque', ar: 'مكتبتي' },
    generator: { fr: 'Générateur IA', ar: 'مولد الذكاء الاصطناعي' },
    createFromPDF: { fr: 'Créer depuis PDF', ar: 'إنشاء من PDF' },
    study: { fr: 'Étudier', ar: 'دراسة' },
    cards: { fr: 'cartes', ar: 'بطاقات' },
    delete: { fr: 'Supprimer', ar: 'حذف' },
    noDecks: { fr: 'Aucun deck trouvé', ar: 'لم يتم العثور على مجموعات' },
    dragDropText: { fr: 'Glissez-déposez votre PDF ici', ar: 'اسحب وأفلت ملف PDF هنا' },
    generateCards: { fr: 'Générer les flashcards', ar: 'إنشاء البطاقات' },
    processing: { fr: 'Traitement en cours...', ar: 'جاري المعالجة...' },
    showAnswer: { fr: 'Voir la réponse', ar: 'إظهار الإجابة' },
    hideAnswer: { fr: 'Masquer la réponse', ar: 'إخفاء الإجابة' },
    nextCard: { fr: 'Suivant', ar: 'التالي' },
    previousCard: { fr: 'Précédent', ar: 'السابق' },
    correct: { fr: 'Correct', ar: 'صحيح' },
    incorrect: { fr: 'Incorrect', ar: 'خاطئ' },
    skip: { fr: 'Passer', ar: 'تخطي' },
    backToLibrary: { fr: 'Retour à la bibliothèque', ar: 'العودة إلى المكتبة' },
    deckTitle: { fr: 'Titre du deck', ar: 'عنوان المجموعة' },
    numberOfCards: { fr: 'Nombre de cartes', ar: 'عدد البطاقات' },
    difficulty: { fr: 'Difficulté', ar: 'مستوى الصعوبة' },
    category: { fr: 'Catégorie', ar: 'الفئة' },
    easy: { fr: 'Facile', ar: 'سهل' },
    medium: { fr: 'Moyen', ar: 'متوسط' },
    hard: { fr: 'Difficile', ar: 'صعب' },
    progress: { fr: 'Progression', ar: 'التقدم' },
    statistics: { fr: 'Statistiques', ar: 'الإحصائيات' },
    timeSpent: { fr: 'Temps passé', ar: 'الوقت المستغرق' },
    accuracy: { fr: 'Précision', ar: 'الدقة' },
    studyComplete: { fr: 'Étude terminée !', ar: 'انتهت الدراسة!' },
    congratulations: { fr: 'Félicitations !', ar: 'تهانينا!' },
    studyAgain: { fr: 'Étudier à nouveau', ar: 'ادرس مرة أخرى' },
    autoAdvance: { fr: 'Avancement automatique', ar: 'التقدم التلقائي' },
    shuffle: { fr: 'Mélanger', ar: 'خلط' },
    reset: { fr: 'Recommencer', ar: 'إعادة تعيين' },
    settings: { fr: 'Paramètres', ar: 'الإعدادات' }
  };

  const t = useCallback((key) => {
    return translations[key]?.[language] || translations[key]?.fr || key;
  }, [language]);

  // Initialize decks on component mount
  useEffect(() => {
    const savedDecks = JSON.parse(localStorage.getItem('customFlashcards') || '[]');
    setDecks([...defaultFlashcardDecks, ...savedDecks]);
  }, []);

  // Helper functions
  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getProgressColor = useCallback((status) => {
    switch (status) {
      case 'correct': return 'bg-green-500';
      case 'incorrect': return 'bg-red-500';
      case 'skip': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  }, []);

  const formatTime = useCallback((ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // File handling
  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    setError('');
    
    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 10MB)');
      return;
    }
    
    if (!file.type.includes('pdf')) {
      setError('Veuillez sélectionner un fichier PDF');
      return;
    }
    
    setSelectedFile(file);
    setDeckConfig(prev => ({
      ...prev,
      title: file.name.replace('.pdf', '')
    }));
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Mock PDF processing and AI generation
  const processFile = async () => {
    if (!selectedFile || !deckConfig.title.trim()) return;
    
    setIsProcessing(true);
    setProgress(0);
    setError('');
    
    try {
      // Simulate file processing
      setProcessingStage('Extraction du texte PDF...');
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStage('Analyse du contenu médical...');
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingStage('Génération des flashcards...');
      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate sample cards based on configuration
      const sampleCards = [
        {
          id: `generated-${Date.now()}-1`,
          front: 'Qu\'est-ce que l\'hypertension artérielle ?',
          back: 'Pression artérielle élevée (≥140/90 mmHg) pouvant endommager les organes',
          difficulty: deckConfig.difficulty,
          category: deckConfig.category
        },
        {
          id: `generated-${Date.now()}-2`,
          front: 'Principales complications du diabète',
          back: 'Rétinopathie, néphropathie, neuropathie, maladies cardiovasculaires',
          difficulty: deckConfig.difficulty,
          category: deckConfig.category
        },
        {
          id: `generated-${Date.now()}-3`,
          front: 'Signes cliniques de l\'insuffisance cardiaque',
          back: 'Dyspnée, œdème, fatigue, orthopnée, tachycardie',
          difficulty: deckConfig.difficulty,
          category: deckConfig.category
        }
      ].slice(0, Math.min(deckConfig.numberOfCards, 3));
      
      const newDeck = {
        id: `custom-${Date.now()}`,
        title: deckConfig.title,
        description: `Généré depuis ${selectedFile.name}`,
        category: deckConfig.category,
        difficulty: deckConfig.difficulty,
        type: 'custom',
        createdAt: new Date().toISOString(),
        cards: sampleCards
      };
      
      // Save to localStorage
      const savedDecks = JSON.parse(localStorage.getItem('customFlashcards') || '[]');
      const updatedSavedDecks = [...savedDecks, newDeck];
      localStorage.setItem('customFlashcards', JSON.stringify(updatedSavedDecks));
      
      // Update state
      setDecks(prev => [...prev, newDeck]);
      
      setProgress(100);
      setProcessingStage('Génération terminée !');
      
      // Reset form
      setTimeout(() => {
        setSelectedFile(null);
        setDeckConfig({
          title: '',
          numberOfCards: 10,
          difficulty: 'medium',
          category: 'general'
        });
        setCurrentView('library');
        setIsProcessing(false);
        setProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Processing error:', error);
      setError('Erreur lors du traitement du fichier');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Study session management
  const startStudying = (deckIndex) => {
    setCurrentDeckIndex(deckIndex);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setCurrentView('player');
    setStudyComplete(false);
    setIsShuffled(false);
    
    const deck = decks[deckIndex];
    setShuffledIndices(deck.cards.map((_, index) => index));
    setStudyStats({
      correct: 0,
      incorrect: 0,
      skipped: 0,
      startTime: Date.now(),
      cardProgress: new Array(deck.cards.length).fill('unseen')
    });
  };

  const nextCard = () => {
    const currentDeck = decks[currentDeckIndex];
    if (!currentDeck) return;
    
    const nextIndex = (currentCardIndex + 1) % currentDeck.cards.length;
    setCurrentCardIndex(nextIndex);
    setShowAnswer(false);
    
    // Check if study is complete
    if (nextIndex === 0 && studyStats.cardProgress.every(status => status !== 'unseen')) {
      setStudyComplete(true);
    }
  };

  const previousCard = () => {
    const currentDeck = decks[currentDeckIndex];
    if (!currentDeck) return;
    
    setCurrentCardIndex((prev) => (prev - 1 + currentDeck.cards.length) % currentDeck.cards.length);
    setShowAnswer(false);
  };

  const shuffleCards = () => {
    const currentDeck = decks[currentDeckIndex];
    if (!currentDeck) return;
    
    const indices = [...Array(currentDeck.cards.length).keys()];
    const shuffled = indices.sort(() => Math.random() - 0.5);
    
    setShuffledIndices(shuffled);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setIsShuffled(true);
  };

  const resetStudy = () => {
    const currentDeck = decks[currentDeckIndex];
    if (!currentDeck) return;
    
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setIsShuffled(false);
    setStudyComplete(false);
    setShuffledIndices(currentDeck.cards.map((_, index) => index));
    setStudyStats({
      correct: 0,
      incorrect: 0,
      skipped: 0,
      startTime: Date.now(),
      cardProgress: new Array(currentDeck.cards.length).fill('unseen')
    });
  };

  const handleCardResponse = (response) => {
    const newStats = { ...studyStats };
    const newProgress = [...newStats.cardProgress];
    
    newProgress[currentCardIndex] = response;
    
    switch (response) {
      case 'correct':
        newStats.correct++;
        break;
      case 'incorrect':
        newStats.incorrect++;
        break;
      case 'skip':
        newStats.skipped++;
        break;
    }
    
    newStats.cardProgress = newProgress;
    setStudyStats(newStats);
    
    if (autoAdvance) {
      setTimeout(nextCard, 500);
    }
  };

  const deleteDeck = (deckId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce deck ?')) {
      const updatedDecks = decks.filter(deck => deck.id !== deckId);
      setDecks(updatedDecks);
      
      // Update localStorage for custom decks
      const customDecks = updatedDecks.filter(deck => deck.type === 'custom');
      localStorage.setItem('customFlashcards', JSON.stringify(customDecks));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (currentView !== 'player') return;

    const handleKeyPress = (e) => {
      if (studyComplete) return;
      
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          setShowAnswer(!showAnswer);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousCard();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextCard();
          break;
        case '1':
          e.preventDefault();
          if (showAnswer) handleCardResponse('incorrect');
          break;
        case '2':
          e.preventDefault();
          if (showAnswer) handleCardResponse('skip');
          break;
        case '3':
          e.preventDefault();
          if (showAnswer) handleCardResponse('correct');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentView, showAnswer, studyComplete]);

  // Render functions
  const renderLibrary = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('title')}</h1>
        <p className="text-xl text-gray-600">{t('subtitle')}</p>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">{t('library')}</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setCurrentView('generator')}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Brain className="w-5 h-5 mr-2" />
            {t('createFromPDF')}
          </button>
          
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('noDecks')}</h3>
          <p className="text-gray-600 mb-6">Créez votre premier deck à partir d'un PDF</p>
          <button
            onClick={() => setCurrentView('generator')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('createFromPDF')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck, index) => (
            <div key={deck.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{deck.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(deck.difficulty)}`}>
                  {t(deck.difficulty)}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">
                {deck.cards.length} {t('cards')} • {categories.find(c => c.id === deck.category)?.label[language] || deck.category}
              </p>
              
              {deck.description && (
                <p className="text-gray-500 text-sm mb-4">{deck.description}</p>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => startStudying(index)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t('study')}
                </button>
                
                {deck.type === 'custom' && (
                  <button
                    onClick={() => deleteDeck(deck.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGenerator = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-8">
        <button
          onClick={() => setCurrentView('library')}
          className="mr-4 p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{t('generator')}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {isProcessing ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">{t('processing')}</h2>
          <p className="text-gray-600 mb-6">{processingStage}</p>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{progress}%</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upload area */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <FileText className="w-16 h-16 text-green-600 mx-auto" />
                  <div>
                    <p className="text-lg font-medium">{selectedFile.name}</p>
                    <p className="text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Changer de fichier
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 text-blue-600 mx-auto" />
                  <p className="text-lg text-gray-700">{t('dragDropText')}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sélectionner un fichier
                  </button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
            </div>
          </div>

          {/* Configuration */}
          {selectedFile && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6">Configuration du deck</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('deckTitle')}
                  </label>
                  <input
                    type="text"
                    value={deckConfig.title}
                    onChange={(e) => setDeckConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mon deck médical"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('numberOfCards')}
                  </label>
                  <select
                    value={deckConfig.numberOfCards}
                    onChange={(e) => setDeckConfig(prev => ({ ...prev, numberOfCards: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5 cartes</option>
                    <option value={10}>10 cartes</option>
                    <option value={15}>15 cartes</option>
                    <option value={20}>20 cartes</option>
                    <option value={25}>25 cartes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('difficulty')}
                  </label>
                  <select
                    value={deckConfig.difficulty}
                    onChange={(e) => setDeckConfig(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="easy">{t('easy')}</option>
                    <option value="medium">{t('medium')}</option>
                    <option value="hard">{t('hard')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('category')}
                  </label>
                  <select
                    value={deckConfig.category}
                    onChange={(e) => setDeckConfig(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.filter(cat => cat.id !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.label[language] || category.label.fr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={processFile}
                disabled={!selectedFile || !deckConfig.title.trim()}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {t('generateCards')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderPlayer = () => {
    if (currentDeckIndex === null || !decks[currentDeckIndex]) {
      return (
        <div className="max-w-4xl mx-auto p-6 text-center">
          <p className="text-gray-600">Deck non trouvé</p>
          <button
            onClick={() => setCurrentView('library')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('backToLibrary')}
          </button>
        </div>
      );
    }

    const currentDeck = decks[currentDeckIndex];
    const actualCardIndex = isShuffled ? shuffledIndices[currentCardIndex] : currentCardIndex;
    const currentCard = currentDeck.cards[actualCardIndex];
    const totalAnswered = studyStats.correct + studyStats.incorrect + studyStats.skipped;
    const progressPercentage = (totalAnswered / currentDeck.cards.length) * 100;

    if (studyComplete) {
      const totalTime = Date.now() - studyStats.startTime;
      const accuracy = studyStats.correct + studyStats.incorrect > 0 
        ? Math.round((studyStats.correct / (studyStats.correct + studyStats.incorrect)) * 100) 
        : 0;

      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('congratulations')}</h2>
            <p className="text-xl text-gray-600 mb-8">{t('studyComplete')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-green-600">{studyStats.correct}</div>
                <div className="text-green-800">{t('correct')}</div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-red-600">{studyStats.incorrect}</div>
                <div className="text-red-800">{t('incorrect')}</div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-yellow-600">{studyStats.skipped}</div>
                <div className="text-yellow-800">{t('skip')}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="font-medium">{t('timeSpent')}</span>
                </div>
                <div className="text-lg font-bold">{formatTime(totalTime)}</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="font-medium">{t('accuracy')}</span>
                </div>
                <div className="text-lg font-bold">{accuracy}%</div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetStudy}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('studyAgain')}
              </button>
              
              <button
                onClick={() => setCurrentView('library')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {t('backToLibrary')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentView('library')}
              className="mr-4 p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{currentDeck.title}</h1>
              <p className="text-gray-600">
                Carte {currentCardIndex + 1} sur {currentDeck.cards.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={shuffleCards}
              className={`p-2 rounded-lg shadow hover:shadow-md transition-all ${
                isShuffled ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>
            
            <button
              onClick={resetStudy}
              className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <RotateCcw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{t('progress')}</span>
            <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Card progress indicators */}
          <div className="flex gap-1 mt-3">
            {studyStats.cardProgress.map((status, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full ${getProgressColor(status)}`}
              />
            ))}
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">{t('autoAdvance')}</span>
              </label>
            </div>
          </div>
        )}

        {/* Flashcard */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 min-h-[400px] flex flex-col justify-center">
          <div className="text-center">
            <div className="mb-6">
              <span className={`px-3 py-1 text-sm rounded-full ${getDifficultyColor(currentCard.difficulty)}`}>
                {t(currentCard.difficulty)}
              </span>
            </div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('question')}</h2>
              <p className="text-xl text-gray-700 leading-relaxed">{currentCard.front}</p>
            </div>

            {showAnswer && (
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('answer')}</h3>
                <p className="text-lg text-gray-700 leading-relaxed">{currentCard.back}</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {/* Answer toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              {showAnswer ? (
                <>
                  <EyeOff className="w-6 h-6 mr-2" />
                  {t('hideAnswer')}
                </>
              ) : (
                <>
                  <Eye className="w-6 h-6 mr-2" />
                  {t('showAnswer')}
                </>
              )}
            </button>
          </div>

          {/* Response buttons */}
          {showAnswer && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleCardResponse('incorrect')}
                className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-5 h-5 mr-2" />
                {t('incorrect')} (1)
              </button>
              
              <button
                onClick={() => handleCardResponse('skip')}
                className="flex items-center justify-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Clock className="w-5 h-5 mr-2" />
                {t('skip')} (2)
              </button>
              
              <button
                onClick={() => handleCardResponse('correct')}
                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {t('correct')} (3)
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={previousCard}
              className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              {t('previousCard')}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Utilisez ← → pour naviguer, Espace pour révéler
              </p>
            </div>

            <button
              onClick={nextCard}
              className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t('nextCard')}
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>

          {/* Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{studyStats.correct}</div>
                <div className="text-sm text-gray-600">{t('correct')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{studyStats.incorrect}</div>
                <div className="text-sm text-gray-600">{t('incorrect')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{studyStats.skipped}</div>
                <div className="text-sm text-gray-600">{t('skip')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentView === 'library' && renderLibrary()}
      {currentView === 'generator' && renderGenerator()}
      {currentView === 'player' && renderPlayer()}
    </div>
  );
};

export default FlashcardsApp;