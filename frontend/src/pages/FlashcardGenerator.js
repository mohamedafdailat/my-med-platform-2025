import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  FileText, Upload, Brain, Languages, RotateCcw, Save, 
  ChevronLeft, ChevronRight, Eye, EyeOff, Settings, 
  AlertCircle, CheckCircle, Loader 
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

// ========================================
// CONFIGURATION ET CONSTANTES
// ========================================

const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TEXT_LENGTH: 15000,
  MAX_CARDS: 25,
  AI_MODEL: 'grok-beta', // Nom correct du modèle xAI
  XAI_API_URL: 'https://api.x.ai/v1/chat/completions',
  PDF_JS_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174',
};

const QUESTION_TEMPLATES = {
  easy: [
    (concept) => `Quelle est la caractéristique principale de ${concept}?`,
    (concept) => `Comment définir ${concept} en termes simples?`,
    (concept) => `À quoi sert ${concept} dans l'organisme?`,
    (concept) => `Où trouve-t-on ${concept}?`,
  ],
  medium: [
    (concept) => `Quels sont les mécanismes d'action de ${concept}?`,
    (concept) => `Comment ${concept} interagit-il avec d'autres systèmes?`,
    (concept) => `Quelles sont les conséquences d'un dysfonctionnement de ${concept}?`,
    (concept) => `Dans quelles pathologies ${concept} joue-t-il un rôle clé?`,
  ],
  hard: [
    (concept) => `Analysez les implications cliniques d'une altération de ${concept}`,
    (concept) => `Établissez un diagnostic différentiel impliquant ${concept}`,
    (concept) => `Justifiez une approche thérapeutique ciblant ${concept}`,
    (concept) => `Évaluez les facteurs pronostiques liés à ${concept}`,
  ]
};

// ========================================
// TRADUCTIONS
// ========================================

const TRANSLATIONS = {
  fr: {
    title: 'Générateur de Flashcards IA',
    subtitle: 'Créez des flashcards intelligentes à partir de vos documents PDF',
    uploadArea: 'Zone de téléchargement',
    dragDropText: 'Glissez-déposez votre PDF ici ou cliquez pour sélectionner',
    supportedFormats: 'Formats supportés: PDF (max 10MB)',
    selectFile: 'Sélectionner un fichier',
    deckSettings: 'Configuration du deck',
    deckTitle: 'Titre du deck',
    deckTitlePlaceholder: 'Ex: Anatomie Cardiovasculaire',
    numberOfCards: 'Nombre de cartes',
    difficulty: 'Difficulté',
    category: 'Catégorie',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    general: 'Général',
    medical: 'Médical',
    science: 'Sciences',
    language: 'Langues',
    generateCards: 'Générer les flashcards',
    processing: 'Traitement en cours...',
    extractingText: 'Extraction du texte...',
    generatingCards: 'Génération des flashcards avec IA...',
    cardPreview: 'Aperçu des flashcards',
    question: 'Question',
    answer: 'Réponse',
    showAnswer: 'Voir la réponse',
    hideAnswer: 'Masquer la réponse',
    nextCard: 'Suivant',
    previousCard: 'Précédent',
    saveDeck: 'Sauvegarder',
    newDeck: 'Nouveau deck',
    cardCounter: 'Carte {{current}} sur {{total}}',
    fileTooBig: 'Fichier trop volumineux (max 10MB)',
    invalidFile: 'Format de fichier non supporté',
    processingError: 'Erreur lors du traitement',
    successSaved: 'Deck sauvegardé avec succès!',
    errorSaving: 'Erreur lors de la sauvegarde',
    pdfLoadError: 'Impossible de charger le PDF. Veuillez essayer un autre fichier.',
    noTextFound: 'Aucun texte trouvé dans le PDF. Le fichier pourrait être une image scannée.',
    aiError: 'Erreur de l\'IA. Génération de flashcards basiques.',
    subscriptionRequired: 'Un abonnement payant est requis.',
    extractingPages: 'Extraction des pages {{current}}/{{total}}...'
  },
  ar: {
    title: 'مولد البطاقات التعليمية بالذكاء الاصطناعي',
    subtitle: 'أنشئ بطاقات تعليمية ذكية من مستندات PDF',
    uploadArea: 'منطقة الرفع',
    dragDropText: 'اسحب وأفلت ملف PDF هنا أو انقر للاختيار',
    supportedFormats: 'الصيغ المدعومة: PDF (حد أقصى 10 ميجابايت)',
    selectFile: 'اختيار ملف',
    deckSettings: 'إعدادات المجموعة',
    deckTitle: 'عنوان المجموعة',
    deckTitlePlaceholder: 'مثال: تشريح القلب والأوعية الدموية',
    numberOfCards: 'عدد البطاقات',
    difficulty: 'مستوى الصعوبة',
    category: 'الفئة',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    general: 'عام',
    medical: 'طبي',
    science: 'علوم',
    language: 'لغات',
    generateCards: 'إنشاء البطاقات',
    processing: 'جاري المعالجة...',
    extractingText: 'استخراج النص...',
    generatingCards: 'إنشاء البطاقات بالذكاء الاصطناعي...',
    cardPreview: 'معاينة البطاقات',
    question: 'سؤال',
    answer: 'إجابة',
    showAnswer: 'إظهار الإجابة',
    hideAnswer: 'إخفاء الإجابة',
    nextCard: 'التالي',
    previousCard: 'السابق',
    saveDeck: 'حفظ',
    newDeck: 'مجموعة جديدة',
    cardCounter: 'البطاقة {{current}} من {{total}}',
    fileTooBig: 'الملف كبير جداً (حد أقصى 10 ميجابايت)',
    invalidFile: 'صيغة الملف غير مدعومة',
    processingError: 'خطأ في المعالجة',
    successSaved: 'تم حفظ المجموعة بنجاح!',
    errorSaving: 'خطأ في الحفظ',
    pdfLoadError: 'تعذر تحميل ملف PDF. يرجى المحاولة بملف آخر.',
    noTextFound: 'لم يتم العثور على نص في ملف PDF. قد يكون الملف عبارة عن صورة ممسوحة ضوئياً.',
    aiError: 'خطأ في الذكاء الاصطناعي. إنشاء بطاقات أساسية.',
    subscriptionRequired: 'مطلوب اشتراك مدفوع.',
    extractingPages: 'استخراج الصفحات {{current}}/{{total}}...'
  }
};

// ========================================
// UTILITAIRES
// ========================================

class TranslationService {
  static translate(language, key, params = {}) {
    let text = TRANSLATIONS[language]?.[key] || TRANSLATIONS.fr[key] || key;
    Object.keys(params).forEach(param => {
      text = text.replace(`{{${param}}}`, params[param]);
    });
    return text;
  }
}

class TextProcessor {
  static extractKeyConceptsFromText(text) {
    // Diviser le texte en sections logiques
    const sections = text.split(/\n\n|\. [A-Z]/).filter(section => section.trim().length > 500);
    
    // Extraire les concepts clés par analyse de fréquence et position
    const wordFrequency = {};
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Analyser chaque phrase pour identifier les concepts importants
    sentences.forEach(sentence => {
      const words = sentence.toLowerCase()
        .replace(/[^\w\s\u00C0-\u017F\u0600-\u06FF]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 4);
        
      words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });
    });
    
    // Identifier les termes les plus pertinents
    const keyTerms = Object.entries(wordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([term]) => term);
    
    return {
      sections: sections.slice(0, 60),
      keyTerms,
      sentences: sentences.slice(0, 100),
      totalLength: text.length
    };
  }

  static extractRelevantInfo(section, concept) {
    const sentences = section.split('.').filter(s => 
      s.toLowerCase().includes(concept.toLowerCase()) && s.length > 30
    );
    return sentences[0] || section.substring(0, 200);
  }

  static generateCreativeAnswer(concept, info, difficulty) {
    const baseInfo = info.replace(/\s+/g, ' ').trim();
    
    switch (difficulty) {
      case 'easy':
        return `${concept} est un élément fondamental caractérisé par des propriétés spécifiques. ${baseInfo.substring(0, 150)}. Cette notion constitue une base importante pour comprendre les mécanismes sous-jacents.`;
        
      case 'medium':
        return `${concept} présente des mécanismes complexes d'action et de régulation. ${baseInfo.substring(0, 200)}. Ces processus impliquent des interactions multiples avec d'autres systèmes, créant un réseau fonctionnel intégré qui maintient l'équilibre physiologique.`;
        
      case 'hard':
        return `L'analyse de ${concept} révèle une complexité remarquable au niveau moléculaire et systémique. ${baseInfo.substring(0, 250)}. Les implications cliniques sont multiples, nécessitant une approche diagnostique différentielle rigoureuse. Les dysfonctionnements peuvent entraîner des cascades pathologiques nécessitant une prise en charge personnalisée et multidisciplinaire.`;
        
      default:
        return `${concept} joue un rôle essentiel dans les processus biologiques étudiés.`;
    }
  }
}

class TranslationHelper {
  static translateToArabic(questionFr, concept) {
    const basicTranslations = {
      'Quelle est la caractéristique principale de': 'ما هي الخاصية الرئيسية لـ',
      'Comment définir': 'كيف نعرف',
      'À quoi sert': 'ما هي وظيفة',
      'Où trouve-t-on': 'أين نجد',
      'Quels sont les mécanismes': 'ما هي آليات',
      'Comment': 'كيف',
      'Quelles sont les conséquences': 'ما هي عواقب',
      'Dans quelles pathologies': 'في أي أمراض'
    };
    
    for (const [fr, ar] of Object.entries(basicTranslations)) {
      if (questionFr.includes(fr)) {
        return questionFr.replace(fr, ar) + ` ${concept}؟`;
      }
    }
    
    return `سؤال حول ${concept}؟`;
  }
  
  static translateAnswerToArabic(answerFr, concept) {
    return `${concept} هو عنصر مهم في العلوم الطبية. ` + answerFr.substring(0, 100) + '...';
  }
}

class QualityCalculator {
  static calculateScore(cards) {
    let score = 0;
    cards.forEach(card => {
      const questionFr = card.question?.fr || '';
      const answerFr = card.answer?.fr || '';
      
      // Points pour la longueur appropriée
      if (questionFr.length > 20 && questionFr.length < 150) score += 10;
      if (answerFr.length > 50 && answerFr.length < 300) score += 10;
      
      // Points pour l'absence de références au document
      if (!questionFr.toLowerCase().includes('document') && 
          !questionFr.toLowerCase().includes('texte') &&
          !answerFr.toLowerCase().includes('selon')) score += 15;
      
      // Points pour la créativité (questions variées)
      if (questionFr.includes('?') && !questionFr.startsWith('Qu\'est-ce que')) score += 10;
      
      // Points pour le contenu bilingue
      if (card.question?.ar && card.answer?.ar) score += 5;
    });
    
    return Math.min(100, Math.round(score / cards.length));
  }
}

// ========================================
// SERVICES
// ========================================

class PDFService {
  static async extractText(file, setProgress, setProcessingStage, t) {
    return new Promise((resolve, reject) => {
      setProcessingStage(t('extractingText'));
      setProgress(10);
      
      const loadPDFJS = () => {
        return new Promise((resolveLoad, rejectLoad) => {
          if (window.pdfjsLib) {
            resolveLoad();
            return;
          }
          
          const script = document.createElement('script');
          script.src = `${CONFIG.PDF_JS_CDN}/pdf.min.js`;
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${CONFIG.PDF_JS_CDN}/pdf.worker.min.js`;
            resolveLoad();
          };
          script.onerror = () => rejectLoad(new Error('Impossible de charger PDF.js'));
          document.head.appendChild(script);
        });
      };

      loadPDFJS().then(() => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let extractedText = '';
            
            setProgress(20);
            const totalPages = pdf.numPages;
            console.log(`📄 PDF détecté avec ${totalPages} pages`);
            
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
              setProcessingStage(t('extractingPages', { current: pageNum, total: totalPages }));
              
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              
              const pageText = textContent.items
                .map(item => {
                  let text = item.str || '';
                  if (item.hasEOL) text += '\n';
                  return text;
                })
                .join('')
                .replace(/\s+/g, ' ')
                .trim();
              
              if (pageText.length > 10) {
                extractedText += pageText + ' ';
              }
              
              setProgress(20 + (pageNum / totalPages) * 40);
            }
            
            extractedText = extractedText
              .replace(/\s+/g, ' ')
              .replace(/[^\w\s\u00C0-\u017F\u0600-\u06FF.,;:!?()\-'"]/g, '')
              .trim();
            
            console.log(`📝 Texte extrait: ${extractedText.length} caractères`);
            
            if (extractedText.length < 50) {
              throw new Error('noTextFound');
            }
            
            if (extractedText.length > CONFIG.MAX_TEXT_LENGTH) {
              const firstPart = extractedText.substring(0, 7500);
              const secondPart = extractedText.substring(
                Math.floor(extractedText.length / 2), 
                Math.floor(extractedText.length / 2) + 7500
              );
              extractedText = firstPart + '\n...\n' + secondPart;
            }
            
            setProgress(60);
            resolve(extractedText);
            
          } catch (error) {
            console.error('Erreur extraction PDF:', error);
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('pdfLoadError'));
        reader.readAsArrayBuffer(file);
        
      }).catch(error => reject(error));
    });
  }
}

class AIService {
  static createSystemPrompt(config) {
    return `Tu es un expert pédagogue médical spécialisé dans la création de flashcards éducatives. 

MISSION: Créer ${config.numberOfCards} flashcards ORIGINALES et CRÉATIVES basées sur le contenu fourni.

RÈGLES STRICTES:
1. ✅ CRÉATIVITÉ MAXIMALE: Invente des questions uniques et engageantes
2. ✅ ZÉRO RÉFÉRENCE: Ne mentionne JAMAIS "le document", "le texte", "selon...", "d'après..."
3. ✅ SPÉCIFICITÉ: Base-toi sur le contenu réel mais formule de manière originale  
4. ✅ AUTONOMIE: Chaque flashcard doit être auto-suffisante et claire
5. ✅ DIVERSITÉ: Varie les types de questions

NIVEAU ${config.difficulty.toUpperCase()}:
${config.difficulty === 'easy' ? 
  'Questions directes sur les concepts de base. Réponses claires en 2-3 phrases.' :
  config.difficulty === 'medium' ?
  'Questions de compréhension et analyse. Réponses détaillées en 4-5 phrases avec exemples.' :
  'Questions complexes d\'analyse critique et diagnostic. Réponses approfondies en 6-8 phrases avec justifications.'}

CATÉGORIE ${config.category.toUpperCase()}:
Adapte le vocabulaire et l'approche à cette spécialité médicale.

EXEMPLES DE FORMULATIONS CRÉATIVES:
❌ Mauvais: "Selon le document, qu'est-ce que l'hypertension?"
✅ Bon: "Quels sont les mécanismes physiologiques qui conduisent à une élévation persistante de la pression artérielle?"

❌ Mauvais: "Le texte mentionne que..."  
✅ Bon: "Dans quelles circonstances cliniques observe-t-on..."

FORMAT DE RÉPONSE OBLIGATOIRE:
{
  "flashcards": [
    {
      "question": {
        "fr": "Question originale et engageante sans référence au document",
        "ar": "سؤال أصلي وجذاب دون إشارة للوثيقة"
      },
      "answer": {
        "fr": "Réponse complète, autonome et éducative basée sur le contenu",
        "ar": "إجابة كاملة ومستقلة وتعليمية مبنية على المحتوى"
      },
      "difficulty": "${config.difficulty}",
      "category": "${config.category}",
      "concept_source": "concept_principal_identifié"
    }
  ]
}`;
  }

  static createUserPrompt(conceptData, config) {
    return `CONTENU D'APPRENTISSAGE À ANALYSER:

SECTIONS PRINCIPALES:
${conceptData.sections.slice(0, 5).join('\n\n')}

TERMES CLÉS IDENTIFIÉS:
${conceptData.keyTerms.slice(0, 10).join(', ')}

PHRASES INFORMATIVES:
${conceptData.sentences.slice(0, 10).join('. ')}

INSTRUCTIONS SPÉCIFIQUES:
- Analyse ce contenu médical et identifie les concepts les plus importants
- Crée ${config.numberOfCards} flashcards ORIGINALES niveau "${config.difficulty}"
- Catégorie: "${config.category}"
- Chaque question doit être UNIQUE et CRÉATIVE
- Évite absolument toute référence au document source
- Base-toi sur le contenu mais reformule complètement
- Assure-toi que chaque flashcard enseigne quelque chose de concret

GÉNÈRE LES FLASHCARDS AU FORMAT JSON:`;
  }

  static async generateFlashcards(text, config, setProcessingStage, setProgress) {
    setProcessingStage(TranslationService.translate(config.language || 'fr', 'generatingCards'));
    setProgress(75);
    
    // Liste des modèles à essayer par ordre de préférence
    const modelsToTry = [
      'grok-beta',           // Modèle principal
      'grok-2',              // Alternative
      'grok-1',              // Fallback
      'grok'                 // Dernière chance
    ];
    
    let lastError = null;
    
    // Essayer chaque modèle
    for (const modelName of modelsToTry) {
      try {
        const conceptData = TextProcessor.extractKeyConceptsFromText(text);
        console.log('🧠 Concepts extraits:', conceptData.keyTerms.slice(0, 10));
        
        const systemPrompt = this.createSystemPrompt(config);
        const userPrompt = this.createUserPrompt(conceptData, config);
        
        console.log(`🚀 Tentative avec le modèle: ${modelName}`);
        
        const response = await fetch(CONFIG.XAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_XAI_API_KEY}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 6000,
            response_format: { type: "json_object" }
          })
        });

        if (response.ok) {
          console.log(`✅ Succès avec le modèle: ${modelName}`);
          return await this.processAIResponse(response, setProgress);
        } else {
          const errorData = await response.json().catch(() => ({}));
          lastError = new Error(`Erreur API xAI avec ${modelName} (${response.status}): ${errorData.error?.message || errorData.error || 'Modèle non disponible'}`);
          console.warn(`⚠️ Échec avec ${modelName}:`, lastError.message);
          
          // Si c'est une erreur 404 (modèle non trouvé), continuer avec le suivant
          if (response.status === 404) {
            continue;
          }
          // Pour les autres erreurs, on peut aussi continuer
          if (response.status >= 500) {
            continue;
          }
        }
      } catch (modelError) {
        lastError = modelError;
        console.warn(`⚠️ Erreur avec ${modelName}:`, modelError.message);
        continue;
      }
    }
    
    // Si aucun modèle n'a fonctionné, lancer la dernière erreur
    console.error('💥 Tous les modèles ont échoué');
    throw lastError || new Error('Tous les modèles xAI ont échoué. Vérifiez votre clé API sur https://console.x.ai.');
  }

  static async processAIResponse(response, setProgress) {
    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (content) {
      let safeContent = content.trim();
      
      const firstBrace = safeContent.indexOf('{');
      const lastBrace = safeContent.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        safeContent = safeContent.substring(firstBrace, lastBrace + 1);
      }
      
      try {
        const flashcardsData = JSON.parse(safeContent);
        console.log('✅ Flashcards créatives générées:', flashcardsData.flashcards?.length || 0);
        
        // Vérifier la qualité des flashcards générées
        const validFlashcards = this.validateFlashcards(flashcardsData.flashcards);
        
        if (validFlashcards.length > 0) {
          setProgress(100);
          return validFlashcards;
        } else {
          throw new Error('Flashcards de qualité insuffisante générées');
        }
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError.message);
        throw new Error('Format de réponse invalide de l\'IA');
      }
    } else {
      throw new Error('Aucune réponse de l\'IA');
    }
  }

  static validateFlashcards(flashcards) {
    return flashcards?.filter(card => {
      const questionFr = card.question?.fr || '';
      const answerFr = card.answer?.fr || '';
      
      // Filtrer les références au document
      const hasDocReference = questionFr.toLowerCase().includes('document') || 
                             questionFr.toLowerCase().includes('texte') ||
                             questionFr.toLowerCase().includes('selon') ||
                             answerFr.toLowerCase().includes('le document') ||
                             answerFr.toLowerCase().includes('d\'après');
      
      return !hasDocReference && questionFr.length > 10 && answerFr.length > 20;
    }) || [];
  }
}

class FallbackService {
  static generateCreativeFallbackCards(text, config) {
    console.log('🔄 Génération créative de secours...');
    
    const conceptData = TextProcessor.extractKeyConceptsFromText(text);
    const cards = [];
    const templates = QUESTION_TEMPLATES[config.difficulty] || QUESTION_TEMPLATES.medium;
    const maxCards = Math.min(config.numberOfCards, conceptData.keyTerms.length, conceptData.sections.length);
    
    for (let i = 0; i < maxCards; i++) {
      const concept = conceptData.keyTerms[i] || `concept ${i + 1}`;
      const section = conceptData.sections[i % conceptData.sections.length] || '';
      const template = templates[i % templates.length];
      
      const relevantInfo = TextProcessor.extractRelevantInfo(section, concept);
      const questionFr = template(concept);
      const answerFr = TextProcessor.generateCreativeAnswer(concept, relevantInfo, config.difficulty);
      
      cards.push({
        question: {
          fr: questionFr,
          ar: TranslationHelper.translateToArabic(questionFr, concept)
        },
        answer: {
          fr: answerFr,
          ar: TranslationHelper.translateAnswerToArabic(answerFr, concept)
        },
        difficulty: config.difficulty,
        category: config.category,
        concept_source: concept
      });
    }
    
    console.log(`✅ ${cards.length} flashcards créatives de secours générées`);
    return cards;
  }
}

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

const FlashcardGenerator = ({ onDeckSaved, onClose }) => {
  // ========================================
  // ÉTAT DU COMPOSANT
  // ========================================
  
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [currentStep, setCurrentStep] = useState('upload');
  const [language, setLanguage] = useState('fr');
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const [deckConfig, setDeckConfig] = useState({
    title: '',
    numberOfCards: 10,
    difficulty: 'medium',
    category: 'general'
  });
  
  const [error, setError] = useState('');
  const [savedDecks, setSavedDecks] = useState([]);

  // ========================================
  // UTILITAIRES COMPOSANT
  // ========================================

  const t = useCallback((key, params = {}) => {
    return TranslationService.translate(language, key, params);
  }, [language]);

  const isAuthenticatedAndPaid = useCallback(() => {
    return user && (
      user.role === 'student' || 
      user.customClaims?.role === 'student' || 
      (!user.role && !user.customClaims?.role)
    ) && user.subscriptionStatus === 'paid';
  }, [user]);

  // ========================================
  // EFFETS
  // ========================================

  // Récupération du rôle utilisateur
  useEffect(() => {
    const getUserRole = async () => {
      if (user && user.getIdTokenResult) {
        try {
          const tokenResult = await user.getIdTokenResult();
          const role = tokenResult.claims?.role || user.role || null;
          setUserRole(role);
        } catch (error) {
          console.error('Error getting user role:', error);
          setUserRole(user?.role || null);
        }
      } else {
        setUserRole(null);
      }
    };
    getUserRole();
  }, [user]);

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    
    setError('');
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      setError(t('fileTooBig'));
      return;
    }
    
    if (!file.type.includes('pdf')) {
      setError(t('invalidFile'));
      return;
    }
    
    setSelectedFile(file);
    setDeckConfig(prev => ({
      ...prev,
      title: file.name.replace('.pdf', '')
    }));
  }, [t]);

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

  // ========================================
  // FONCTIONS PRINCIPALES
  // ========================================

  const processFile = async () => {
    if (!isAuthenticatedAndPaid()) {
      setError(t('subscriptionRequired'));
      return;
    }
    if (!selectedFile || !deckConfig.title.trim()) return;
    
    // Vérifier si la clé API est configurée
    if (!process.env.REACT_APP_XAI_API_KEY) {
      setError('❌ Clé API xAI manquante. Veuillez configurer REACT_APP_XAI_API_KEY dans vos variables d\'environnement.');
      return;
    }
    
    setIsProcessing(true);
    setCurrentStep('processing');
    setProgress(0);
    setError('');
    
    try {
      // Extraction du texte PDF
      const extractedText = await PDFService.extractText(selectedFile, setProgress, setProcessingStage, t);
      console.log(`📄 Texte extrait: ${extractedText.length} caractères`);
      
      // Génération des flashcards avec IA
      let generatedCards;
      try {
        generatedCards = await AIService.generateFlashcards(extractedText, deckConfig, setProcessingStage, setProgress);
      } catch (aiError) {
        console.error('❌ Erreur IA:', aiError);
        
        // Messages d'erreur plus spécifiques
        let errorMessage = `Erreur IA: ${aiError.message}`;
        if (aiError.message.includes('404')) {
          errorMessage += '\n🔧 Suggestion: Le modèle xAI demandé n\'existe pas. Vérifiez les modèles disponibles sur https://console.x.ai/';
        } else if (aiError.message.includes('401') || aiError.message.includes('403')) {
          errorMessage += '\n🔑 Suggestion: Vérifiez votre clé API xAI sur https://console.x.ai/';
        } else if (aiError.message.includes('429')) {
          errorMessage += '\n⏰ Suggestion: Limite de taux atteinte. Attendez quelques minutes avant de réessayer.';
        } else if (aiError.message.includes('500')) {
          errorMessage += '\n🚨 Suggestion: Erreur serveur xAI. Réessayez dans quelques minutes.';
        }
        
        setError(errorMessage + '\n\n⚡ Génération de flashcards créatives de base...');
        generatedCards = FallbackService.generateCreativeFallbackCards(extractedText, deckConfig);
      }
      
      if (generatedCards && generatedCards.length > 0) {
        console.log(`✅ ${generatedCards.length} flashcards créatives générées`);
        setFlashcards(generatedCards);
        setCurrentStep('preview');
        setCurrentCardIndex(0);
        setShowAnswer(false);
      } else {
        throw new Error('Aucune flashcard générée');
      }
      
    } catch (error) {
      console.error('❌ Erreur traitement:', error);
      setError(t(error.message) || t('processingError') + ': ' + (error.message || t('aiError')));
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const saveDeck = async () => {
    if (!isAuthenticatedAndPaid()) {
      setError(t('subscriptionRequired'));
      return;
    }
    
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid || 'anonymous';
      const newDeck = {
        title: deckConfig.title,
        category: deckConfig.category,
        difficulty: deckConfig.difficulty,
        cardCount: flashcards.length,
        createdAt: new Date().toISOString(),
        cards: flashcards,
        ownerId: userId,
        extractionMethod: 'intelligent_concept_extraction',
        aiModel: CONFIG.AI_MODEL,
        qualityScore: QualityCalculator.calculateScore(flashcards)
      };
      
      const docRef = await addDoc(collection(db, 'flashcards'), newDeck);
      console.log('Deck créatif sauvegardé avec ID:', docRef.id);
      
      const savedDeck = { ...newDeck, id: docRef.id };
      setSavedDecks(prev => [...prev, savedDeck]);
      alert(t('successSaved'));
      
      if (onDeckSaved) {
        onDeckSaved(savedDeck);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setError(t('errorSaving'));
    }
  };

  // ========================================
  // NAVIGATION DES CARTES
  // ========================================

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  };

  const previousCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setShowAnswer(false);
  };

  const startOver = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setFlashcards([]);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setError('');
    setProgress(0);
    setProcessingStage('');
    setDeckConfig({
      title: '',
      numberOfCards: 10,
      difficulty: 'medium',
      category: 'general'
    });
    if (onClose) onClose();
  };

  // ========================================
  // COMPOSANTS DE RENDU
  // ========================================

  const renderUploadStep = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mr-4">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800">{t('title')}</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('subtitle')}</p>
        <div className="mt-4 text-sm text-purple-600 bg-purple-50 rounded-lg px-4 py-2 inline-block">
          ✨ Génération créative • Extraction intelligente • Questions originales
        </div>
      </div>

      {/* Zone d'upload */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <Upload className="w-6 h-6 mr-3 text-blue-600" />
          {t('uploadArea')}
        </h2>
        
        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
            isDragging 
              ? 'border-purple-500 bg-purple-50 scale-105' 
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="text-sm text-green-600 mt-1">🧠 Analyse créative activée</p>
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
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-lg text-gray-700">{t('dragDropText')}</p>
                <p className="text-sm text-gray-500 mt-2">{t('supportedFormats')}</p>
                <p className="text-xs text-purple-600 mt-1">🎯 Questions créatives et originales</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                {t('selectFile')}
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

      {/* Configuration du deck */}
      {selectedFile && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <Settings className="w-6 h-6 mr-3 text-gray-600" />
            {t('deckSettings')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('deckTitle')}
              </label>
              <input
                type="text"
                value={deckConfig.title}
                onChange={(e) => setDeckConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('deckTitlePlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('numberOfCards')}
              </label>
              <select
                value={deckConfig.numberOfCards}
                onChange={(e) => setDeckConfig(prev => ({ ...prev, numberOfCards: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={5}>5 cartes créatives</option>
                <option value={10}>10 cartes créatives</option>
                <option value={15}>15 cartes créatives</option>
                <option value={20}>20 cartes créatives</option>
                <option value={25}>25 cartes créatives</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('difficulty')}
              </label>
              <select
                value={deckConfig.difficulty}
                onChange={(e) => setDeckConfig(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="easy">🟢 {t('easy')} - Questions directes</option>
                <option value="medium">🟡 {t('medium')} - Questions analytiques</option>
                <option value="hard">🔴 {t('hard')} - Questions complexes</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('category')} - Spécialité médicale
              </label>
              <select
                value={deckConfig.category}
                onChange={(e) => setDeckConfig(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="general">🏥 {t('general')} - Médecine générale</option>
                <option value="anatomy">🫀 Anatomie - Structures & Fonctions</option>
                <option value="physiology">⚡ Physiologie - Mécanismes</option>
                <option value="pathology">🔬 Pathologie - Maladies</option>
                <option value="pharmacology">💊 Pharmacologie - Traitements</option>
                <option value="clinical">👨‍⚕️ Clinique - Diagnostic</option>
                <option value="public_health">🌍 Santé publique</option>
                <option value="terminology">📚 Terminologie</option>
              </select>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mt-6">
            <h4 className="text-sm font-semibold text-purple-800 mb-2">🎯 Mode créatif activé:</h4>
            <div className="text-sm text-purple-700 grid grid-cols-2 gap-2">
              <span>• Questions originales</span>
              <span>• Zéro référence au document</span>
              <span>• Analyse intelligente du contenu</span>
              <span>• Formulations créatives</span>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={processFile}
              disabled={!deckConfig.title.trim() || isProcessing}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Brain className="w-5 h-5 mr-2" />
              {t('generateCards')} créatives
            </button>
          </div>
        </div>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderProcessingStep = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Brain className="w-10 h-10 text-purple-600 animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Création en cours...</h2>
        <p className="text-gray-600 mb-6">{processingStage}</p>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
            style={{ width: `${progress}%` }}
          >
            {progress > 10 && (
              <span className="text-xs text-white font-medium">{progress}%</span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mt-6">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress > 10 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            Analyse du PDF
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress > 60 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            Extraction concepts
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress > 75 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            Génération créative
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            Questions originales
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const currentCard = flashcards[currentCardIndex];
    const qualityScore = QualityCalculator.calculateScore([currentCard]);
    
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('cardPreview')}</h1>
          <p className="text-xl text-gray-600">
            {t('cardCounter', { current: currentCardIndex + 1, total: flashcards.length })}
          </p>
          <div className="mt-2 text-sm">
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full mr-2">
              {deckConfig.difficulty}
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full mr-2">
              {deckConfig.category}
            </span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              Qualité: {qualityScore}%
            </span>
          </div>
        </div>

        {/* Carte actuelle */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{t('question')}</h3>
              <div className="flex gap-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  #{currentCardIndex + 1}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                  🎯 Créative
                </span>
              </div>
            </div>
            <p className="text-lg leading-relaxed">
              {currentCard?.question?.[language] || currentCard?.question?.fr || 'Question non disponible'}
            </p>
          </div>
          
          {showAnswer ? (
            <div className="p-6 bg-green-50">
              <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {t('answer')}
              </h4>
              <div className="text-green-700 leading-relaxed mb-4 whitespace-pre-line">
                {currentCard?.answer?.[language] || currentCard?.answer?.fr || 'Réponse non disponible'}
              </div>
              {currentCard?.concept_source && (
                <div className="mb-4">
                  <p className="text-sm text-green-600 mb-2">🧠 Concept source:</p>
                  <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                    {currentCard.concept_source}
                  </span>
                </div>
              )}
              <button
                onClick={() => setShowAnswer(false)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                {t('hideAnswer')}
              </button>
            </div>
          ) : (
            <div className="p-6">
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors transform hover:scale-105"
              >
                <Eye className="w-5 h-5 mr-2" />
                {t('showAnswer')}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={previousCard}
            disabled={flashcards.length <= 1}
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('previousCard')}
          </button>
          
          <div className="flex space-x-2 max-w-md overflow-x-auto">
            {flashcards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentCardIndex(index);
                  setShowAnswer(false);
                }}
                className={`w-3 h-3 rounded-full transition-colors flex-shrink-0 ${
                  index === currentCardIndex ? 'bg-purple-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Carte ${index + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={nextCard}
            disabled={flashcards.length <= 1}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('nextCard')}
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={saveDeck}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {t('saveDeck')}
          </button>
          
          <button
            onClick={startOver}
            className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 transform hover:scale-105"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            {t('newDeck')}
          </button>
        </div>

        {/* Sélecteur de langue */}
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow p-3 flex items-center space-x-3">
            <Languages className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600 font-medium">Langue:</span>
            <button
              onClick={() => setLanguage('fr')}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                language === 'fr' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                language === 'ar' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🇲🇦 العربية
            </button>
          </div>
        </div>

        {/* Decks sauvegardés */}
        {savedDecks.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              Decks créatifs sauvegardés ({savedDecks.length})
            </h3>
            <div className="grid gap-3 max-h-64 overflow-y-auto">
              {savedDecks.map((deck) => (
                <div key={deck.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-l-4 border-purple-500">
                  <div>
                    <p className="font-medium text-gray-800">{deck.title}</p>
                    <p className="text-sm text-gray-600">
                      {deck.cardCount} cartes • {deck.difficulty} • {deck.category}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {deck.aiModel && (
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          🤖 {deck.aiModel}
                        </span>
                      )}
                      {deck.qualityScore && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          ⭐ {deck.qualityScore}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {new Date(deck.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <div className="text-xs text-green-600">
                      ✓ Créatif
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  const renderContent = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep();
      case 'processing':
        return renderProcessingStep();
      case 'preview':
        return renderPreviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      {renderContent()}
    </div>
  );
};

export default FlashcardGenerator;