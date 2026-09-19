import React, { useState, useCallback, useEffect, Component } from 'react';
import {
  Brain,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  Save,
  Trophy,
  Loader,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { NavLink } from 'react-router-dom';
import api from '../services/api';

const XAI_MODEL = 'grok-4.20-reasoning';

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h1 className="text-2xl text-red-500 mb-4">
              Erreur dans QuizGenerator: {this.state.error.message}
            </h1>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const QuizGenerator = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [currentStep, setCurrentStep] = useState('config');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [error, setError] = useState('');

  const [quizConfig, setQuizConfig] = useState({
    courseName: '',
    quizTitle: '',
    numberOfQuestions: 10,
    difficulty: 'medium',
    category: 'anatomy',
    questionType: 'multiple_choice',
  });

  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [savedQuizzes, setSavedQuizzes] = useState([]);

  const translations = {
    fr: {
      title: 'Générateur de Quiz IA',
      subtitle: 'Créez des quiz personnalisés basés sur vos cours de médecine',
      courseName: 'Nom du cours',
      courseNamePlaceholder: 'Ex: Anatomie du système cardiovasculaire',
      quizTitle: 'Titre du quiz',
      quizTitlePlaceholder: 'Ex: Quiz - Cœur et circulation sanguine',
      numberOfQuestions: 'Nombre de questions',
      difficulty: 'Niveau de difficulté',
      category: 'Catégorie médicale',
      questionType: 'Type de questions',
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile',
      anatomy: 'Anatomie',
      physiology: 'Physiologie',
      pharmacology: 'Pharmacologie',
      pathology: 'Pathologie',
      clinical: 'Pratique clinique',
      terminology: 'Terminologie médicale',
      multiple_choice: 'Choix multiples (QCM)',
      true_false: 'Vrai/Faux',
      short_answer: 'Réponse courte',
      generateQuiz: 'Générer le quiz avec IA',
      generating: 'Génération en cours...',
      creatingQuestions: 'Création des questions avec xAI Grok...',
      analyzingContent: 'Analyse du contenu médical...',
      optimizingQuestions: 'Optimisation des questions...',
      finalizingQuiz: 'Finalisation du quiz...',
      startQuiz: 'Commencer le quiz',
      question: 'Question',
      nextQuestion: 'Question suivante',
      previousQuestion: 'Question précédente',
      submitQuiz: 'Terminer le quiz',
      results: 'Résultats',
      score: 'Score',
      timeSpent: 'Temps passé',
      correct: 'Correct',
      incorrect: 'Incorrect',
      accuracy: 'Précision',
      saveQuiz: 'Sauvegarder le quiz',
      newQuiz: 'Nouveau quiz',
      backToConfig: 'Retour à la configuration',
      minutes: 'min',
      seconds: 's',
      congratulations: 'Félicitations !',
      quizComplete: 'Quiz terminé !',
      yourScore: 'Votre score',
      reviewAnswers: 'Revoir les réponses',
      showExplanation: "Voir l'explication",
      hideExplanation: "Masquer l'explication",
      explanation: 'Explication',
      trueLabel: 'Vrai',
      falseLabel: 'Faux',
      answerPlaceholder: 'Tapez votre réponse ici...',
      questionsAnswered: 'questions répondues',
      progress: 'Progression',
      savedQuizzes: 'Quiz sauvegardés',
      questions: 'questions',
      generateError: 'Erreur lors de la génération du quiz',
      subscriptionRequired: 'Abonnement payant requis pour cette fonctionnalité',
      required: 'requis',
      configuration: 'Configuration du quiz',
      aiError: 'Erreur IA. Génération de questions de base.',
      fallbackGenerated: 'Questions générées en mode de secours',
      noSavedQuizzes: 'Aucun quiz sauvegardé',
      error: 'Une erreur est survenue',
      success: 'Opération réussie',
      course: 'Cours',
    },
    ar: {
      title: 'مولد الاختبارات بالذكاء الاصطناعي',
      subtitle: 'أنشئ اختبارات شخصية بناءً على دروسك الطبية',
      courseName: 'اسم المقرر',
      courseNamePlaceholder: 'مثال: تشريح الجهاز القلبي الوعائي',
      quizTitle: 'عنوان الاختبار',
      quizTitlePlaceholder: 'مثال: اختبار - القلب والدورة الدموية',
      numberOfQuestions: 'عدد الأسئلة',
      difficulty: 'مستوى الصعوبة',
      category: 'الفئة الطبية',
      questionType: 'نوع الأسئلة',
      easy: 'سهل',
      medium: 'متوسط',
      hard: 'صعب',
      anatomy: 'تشريح',
      physiology: 'فسيولوجيا',
      pharmacology: 'علم الصيدلة',
      pathology: 'علم الأمراض',
      clinical: 'الممارسة السريرية',
      terminology: 'المصطلحات الطبية',
      multiple_choice: 'اختيار متعدد',
      true_false: 'صح/خطأ',
      short_answer: 'إجابة قصيرة',
      generateQuiz: 'إنشاء الاختبار بالذكاء الاصطناعي',
      generating: 'جاري الإنشاء...',
      creatingQuestions: 'إنشاء الأسئلة بـ xAI Grok...',
      analyzingContent: 'تحليل المحتوى الطبي...',
      optimizingQuestions: 'تحسين الأسئلة...',
      finalizingQuiz: 'إنهاء الاختبار...',
      startQuiz: 'بدء الاختبار',
      question: 'سؤال',
      nextQuestion: 'السؤال التالي',
      previousQuestion: 'السؤال السابق',
      submitQuiz: 'إنهاء الاختبار',
      results: 'النتائج',
      score: 'النتيجة',
      timeSpent: 'الوقت المستغرق',
      correct: 'صحيح',
      incorrect: 'خاطئ',
      accuracy: 'الدقة',
      saveQuiz: 'حفظ الاختبار',
      newQuiz: 'اختبار جديد',
      backToConfig: 'العودة للإعدادات',
      minutes: 'د',
      seconds: 'ث',
      congratulations: 'تهانينا !',
      quizComplete: 'انتهى الاختبار !',
      yourScore: 'نتيجتك',
      reviewAnswers: 'مراجعة الإجابات',
      showExplanation: 'إظهار التفسير',
      hideExplanation: 'إخفاء التفسير',
      explanation: 'التفسير',
      trueLabel: 'صحيح',
      falseLabel: 'خاطئ',
      answerPlaceholder: 'اكتب إجابتك هنا...',
      questionsAnswered: 'أسئلة مُجابة',
      progress: 'التقدم',
      savedQuizzes: 'الاختبارات المحفوظة',
      questions: 'أسئلة',
      generateError: 'خطأ في إنشاء الاختبار',
      subscriptionRequired: 'اشتراك مدفوع مطلوب لهذه الميزة',
      required: 'مطلوب',
      configuration: 'إعداد الاختبار',
      aiError: 'خطأ في الذكاء الاصطناعي. إنشاء أسئلة أساسية.',
      fallbackGenerated: 'تم إنشاء أسئلة في الوضع الاحتياطي',
      noSavedQuizzes: 'لا توجد اختبارات محفوظة',
      error: 'حدث خطأ',
      success: 'تمت العملية بنجاح',
      course: 'الدورة',
    },
  };

  const t = useCallback(
    (key) => translations[language]?.[key] || translations.fr[key] || key,
    [language]
  );

  const isRTL = language === 'ar';

  const categories = [
    { id: 'anatomy', label: t('anatomy'), icon: '🫁' },
    { id: 'physiology', label: t('physiology'), icon: '⚡' },
    { id: 'pharmacology', label: t('pharmacology'), icon: '💊' },
    { id: 'pathology', label: t('pathology'), icon: '🦠' },
    { id: 'clinical', label: t('clinical'), icon: '🩺' },
    { id: 'terminology', label: t('terminology'), icon: '📚' },
  ];

  const difficulties = [
    { id: 'easy', label: t('easy') },
    { id: 'medium', label: t('medium') },
    { id: 'hard', label: t('hard') },
  ];

  const questionTypes = [
    { id: 'multiple_choice', label: t('multiple_choice'), icon: '☑️' },
    { id: 'true_false', label: t('true_false'), icon: '✅' },
    { id: 'short_answer', label: t('short_answer'), icon: '✍️' },
  ];

  const fetchSavedQuizzes = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const quizzesQuery = query(
        collection(db, 'quizzes'),
        where('creatorId', '==', user.uid),
        where('type', '==', 'ai-generated'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(quizzesQuery);

      const processedQuizzes = querySnapshot.docs.map((quizDoc) => {
        const data = quizDoc.data();

        return {
          id: quizDoc.id,
          title: data.title || { fr: 'Titre non disponible', ar: 'عنوان غير متاح' },
          course: data.course || 'Cours non spécifié',
          category: data.category || 'other',
          difficulty: data.difficulty || 'medium',
          questions: data.questions || [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });

      setSavedQuizzes(processedQuizzes);
    } catch (err) {
      console.error('Erreur lors de la récupération des quiz sauvegardés:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedQuizzes();
  }, [fetchSavedQuizzes]);

  const extractJsonObject = (content) => {
    if (!content) throw new Error("Aucune réponse de l'IA");

    let safeContent = typeof content === 'string' ? content.trim() : content;

    if (typeof safeContent !== 'string') return safeContent;

    const firstBrace = safeContent.indexOf('{');
    const lastBrace = safeContent.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      safeContent = safeContent.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(safeContent);
  };

  const normalizeQuizFromAI = (parsedQuiz, config) => {
    const quiz = parsedQuiz.quiz || parsedQuiz;

    if (!quiz || !Array.isArray(quiz.questions)) {
      throw new Error('Structure de quiz invalide');
    }

    const normalizedQuestions = quiz.questions
      .slice(0, config.numberOfQuestions)
      .map((question, index) => {
        const questionId = question.id || `q${index + 1}`;

        const baseQuestion = {
          id: questionId,
          question:
            typeof question.question === 'object'
              ? question.question
              : { fr: String(question.question || ''), ar: String(question.question || '') },
          type: question.type || config.questionType,
          explanation:
            typeof question.explanation === 'object'
              ? question.explanation
              : {
                  fr: String(question.explanation || ''),
                  ar: String(question.explanation || ''),
                },
        };

        if (baseQuestion.type === 'multiple_choice') {
          return {
            ...baseQuestion,
            options: question.options || {
              fr: ['Option A', 'Option B', 'Option C', 'Option D'],
              ar: ['الخيار أ', 'الخيار ب', 'الخيار ج', 'الخيار د'],
            },
            correctAnswer:
              typeof question.correctAnswer === 'number' ? question.correctAnswer : 0,
          };
        }

        if (baseQuestion.type === 'true_false') {
          return {
            ...baseQuestion,
            correctAnswer:
              typeof question.correctAnswer === 'boolean'
                ? question.correctAnswer
                : Boolean(question.correctAnswer),
          };
        }

        return {
          ...baseQuestion,
          correctAnswer:
            typeof question.correctAnswer === 'object'
              ? question.correctAnswer
              : {
                  fr: String(question.correctAnswer || ''),
                  ar: String(question.correctAnswer || ''),
                },
        };
      });

    return {
      title: quiz.title || config.quizTitle,
      course: quiz.course || config.courseName,
      category: quiz.category || config.category,
      difficulty: quiz.difficulty || config.difficulty,
      type: quiz.type || config.questionType,
      questions: normalizedQuestions,
    };
  };

  const generateFallbackQuiz = async (config) => {
    console.log('🔄 Génération de quiz de secours...');
    setProcessingStage(t('fallbackGenerated'));

    const fallbackQuiz = {
      title: config.quizTitle,
      course: config.courseName,
      category: config.category,
      difficulty: config.difficulty,
      type: config.questionType,
      questions: [],
    };

    const medicalContent = {
      anatomy: {
        topics: ['cœur', 'poumons', 'foie', 'reins', 'cerveau', 'muscles', 'os'],
        concepts: ['structure', 'localisation', 'fonction', 'vascularisation'],
      },
      physiology: {
        topics: ['circulation', 'respiration', 'digestion', 'excrétion'],
        concepts: ['mécanisme', 'régulation', 'adaptation', 'homéostasie'],
      },
      pharmacology: {
        topics: ['antibiotiques', 'analgésiques', 'antihypertenseurs', 'diurétiques'],
        concepts: ["mécanisme d'action", 'indication', 'effet secondaire'],
      },
      pathology: {
        topics: ['inflammation', 'infection', 'tumeur', 'ischémie'],
        concepts: ['cause', 'symptôme', 'évolution', 'complication'],
      },
      clinical: {
        topics: ['examen clinique', 'diagnostic', 'traitement', 'surveillance'],
        concepts: ['procédure', 'indication', 'complication'],
      },
      terminology: {
        topics: ['préfixes médicaux', 'suffixes médicaux', 'abréviations'],
        concepts: ['définition', 'étymologie', 'usage'],
      },
    };

    const categoryData = medicalContent[config.category] || medicalContent.anatomy;

    for (let i = 0; i < config.numberOfQuestions; i += 1) {
      const topic = categoryData.topics[i % categoryData.topics.length];
      const concept = categoryData.concepts[i % categoryData.concepts.length];
      const questionId = `q${i + 1}`;

      if (config.questionType === 'multiple_choice') {
        fallbackQuiz.questions.push({
          id: questionId,
          question: {
            fr: `Quelle est la ${concept} principale de ${topic} ?`,
            ar: `ما هو ${concept} الرئيسي لـ ${topic}؟`,
          },
          type: 'multiple_choice',
          options: {
            fr: [
              `${concept} principale de ${topic}`,
              `${concept} secondaire de ${topic}`,
              `${concept} alternative de ${topic}`,
              `${concept} pathologique de ${topic}`,
            ],
            ar: [
              `${concept} الرئيسي لـ ${topic}`,
              `${concept} الثانوي لـ ${topic}`,
              `${concept} البديل لـ ${topic}`,
              `${concept} المرضي لـ ${topic}`,
            ],
          },
          correctAnswer: 0,
          explanation: {
            fr: `La ${concept} principale de ${topic} est une notion importante en ${config.category}.`,
            ar: `${concept} الرئيسي لـ ${topic} مفهوم مهم في ${config.category}.`,
          },
        });
      } else if (config.questionType === 'true_false') {
        fallbackQuiz.questions.push({
          id: questionId,
          question: {
            fr: `${topic} possède une ${concept} importante en médecine.`,
            ar: `${topic} له ${concept} مهمة في الطب.`,
          },
          type: 'true_false',
          correctAnswer: true,
          explanation: {
            fr: `Cette affirmation est vraie car ${topic} est lié à la notion de ${concept}.`,
            ar: `هذه العبارة صحيحة لأن ${topic} مرتبط بمفهوم ${concept}.`,
          },
        });
      } else {
        fallbackQuiz.questions.push({
          id: questionId,
          question: {
            fr: `Nommez la ${concept} principale de ${topic}.`,
            ar: `اذكر ${concept} الرئيسي لـ ${topic}.`,
          },
          type: 'short_answer',
          correctAnswer: {
            fr: concept,
            ar: concept,
          },
          explanation: {
            fr: `La réponse attendue est "${concept}", car c’est l’élément central de ${topic}.`,
            ar: `الإجابة المتوقعة هي "${concept}" لأنه عنصر أساسي مرتبط بـ ${topic}.`,
          },
        });
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setProgress(100);

    return fallbackQuiz;
  };

  const generateQuizWithAI = async (config) => {
    setProgress(10);
    setProcessingStage(t('analyzingContent'));

    if (!user || user.subscriptionStatus !== 'paid') {
      throw new Error(t('subscriptionRequired'));
    }

    try {
      const difficultyInstructions = {
        easy:
          'Questions de base sur les définitions, fonctions et concepts fondamentaux du domaine médical.',
        medium:
          'Questions qui demandent une compréhension approfondie des mécanismes et relations entre concepts médicaux.',
        hard:
          'Questions d’analyse, de cas cliniques, de diagnostic différentiel ou de raisonnement médical avancé.',
      };

      const categoryInstructions = {
        anatomy:
          "Questions sur l'anatomie humaine : structures, fonctions, rapports anatomiques et pathologies associées.",
        physiology:
          'Questions sur la physiologie : mécanismes de régulation, fonctions des organes et déséquilibres.',
        pharmacology:
          "Questions sur la pharmacologie : mécanismes d'action, indications, effets secondaires et interactions.",
        pathology:
          'Questions sur la pathologie : mécanismes des maladies, signes cliniques, évolution et complications.',
        clinical:
          'Questions sur la pratique clinique : diagnostic, examens complémentaires, prise en charge et conduite à tenir.',
        terminology:
          'Questions sur la terminologie médicale : définitions, abréviations et vocabulaire technique.',
      };

      const typeInstructions = {
        multiple_choice:
          'Créer des questions à choix multiples avec 4 options dont une seule correcte.',
        true_false:
          'Créer des questions Vrai/Faux avec des affirmations précises et non ambiguës.',
        short_answer:
          'Créer des questions nécessitant une réponse courte et précise.',
      };

      setProgress(25);
      setProcessingStage(t('creatingQuestions'));

      const systemPrompt = `Tu es un expert en pédagogie médicale spécialisé dans la création d'évaluations pour étudiants en médecine.

MISSION :
Créer exactement ${config.numberOfQuestions} questions de quiz de haute qualité pour le cours "${config.courseName}".

PARAMÈTRES :
- Cours : ${config.courseName}
- Titre : ${config.quizTitle}
- Catégorie : ${config.category}
- Difficulté : ${config.difficulty}
- Type : ${config.questionType}

INSTRUCTIONS :
${difficultyInstructions[config.difficulty]}
${categoryInstructions[config.category]}
${typeInstructions[config.questionType]}

RÈGLES :
1. Créer des questions pertinentes, éducatives et autonomes.
2. Pour les QCM : 4 options avec des distracteurs plausibles.
3. Pour Vrai/Faux : affirmation claire.
4. Pour réponse courte : réponse concise.
5. Ajouter une explication pédagogique.
6. Chaque élément doit être bilingue français/arabe.
7. Retourner uniquement un JSON valide.

FORMAT JSON :
{
  "quiz": {
    "title": "${config.quizTitle}",
    "course": "${config.courseName}",
    "category": "${config.category}",
    "difficulty": "${config.difficulty}",
    "type": "${config.questionType}",
    "questions": [
      {
        "id": "q1",
        "question": {
          "fr": "Question en français",
          "ar": "السؤال بالعربية"
        },
        "type": "${config.questionType}",
        ${
          config.questionType === 'multiple_choice'
            ? `"options": {
          "fr": ["Option A", "Option B", "Option C", "Option D"],
          "ar": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"]
        },
        "correctAnswer": 0,`
            : ''
        }
        ${
          config.questionType === 'true_false'
            ? `"correctAnswer": true,`
            : ''
        }
        ${
          config.questionType === 'short_answer'
            ? `"correctAnswer": {
          "fr": "Réponse correcte",
          "ar": "الإجابة الصحيحة"
        },`
            : ''
        }
        "explanation": {
          "fr": "Explication détaillée",
          "ar": "شرح مفصل"
        }
      }
    ]
  }
}`;

      setProgress(50);
      setProcessingStage(t('optimizingQuestions'));

      console.log('🚀 Envoi de la requête à xAI Grok...');

      const response = await api.post('/ai/xai-chat', {
        model: XAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Crée maintenant ${config.numberOfQuestions} questions de quiz pour "${config.courseName}" - "${config.quizTitle}". Catégorie : ${config.category}. Niveau : ${config.difficulty}. Type : ${config.questionType}.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      });

      setProgress(75);
      setProcessingStage(t('finalizingQuiz'));

      const content = response.data?.choices?.[0]?.message?.content;
      const parsedQuiz = extractJsonObject(content);
      const normalizedQuiz = normalizeQuizFromAI(parsedQuiz, config);

      if (!normalizedQuiz.questions.length) {
        throw new Error('Aucune question générée');
      }

      setProgress(100);
      console.log('✅ Quiz généré avec succès:', normalizedQuiz);

      return normalizedQuiz;
    } catch (apiError) {
      console.error('💥 Erreur lors de la génération avec xAI:', apiError);
      setError(t('aiError'));
      return generateFallbackQuiz(config);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizConfig.courseName.trim() || !quizConfig.quizTitle.trim()) {
      const message = `${t('courseName')} et ${t('quizTitle')} sont ${t('required')}.`;
      setError(message);
      toast.error(message);
      return;
    }

    setIsGenerating(true);
    setCurrentStep('generating');
    setProgress(0);
    setError('');

    try {
      const quiz = await generateQuizWithAI(quizConfig);
      setGeneratedQuiz(quiz);
      setCurrentStep('quiz');
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowResults(false);
      setShowExplanations(false);
      setQuizStartTime(Date.now());
      console.log('✅ Quiz prêt:', quiz);
    } catch (generationError) {
      console.error('❌ Erreur génération:', generationError);
      setError(`${t('generateError')}: ${generationError.message}`);
      toast.error(`${t('generateError')}: ${generationError.message}`);
      setCurrentStep('config');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const isAnswerCorrect = (question, answer) => {
    if (answer === undefined || answer === null) return false;

    if (question.type === 'multiple_choice') {
      return answer === question.correctAnswer;
    }

    if (question.type === 'true_false') {
      return answer === question.correctAnswer;
    }

    const expected =
      question.correctAnswer?.[language] ||
      question.correctAnswer?.fr ||
      String(question.correctAnswer || '');

    return String(answer).toLowerCase().trim() === String(expected).toLowerCase().trim();
  };

  const calculateResults = () => {
    if (!generatedQuiz) {
      return { score: 0, total: 0, percentage: 0, timeSpent: 0 };
    }

    let correct = 0;
    const total = generatedQuiz.questions.length;

    generatedQuiz.questions.forEach((question) => {
      if (isAnswerCorrect(question, userAnswers[question.id])) {
        correct += 1;
      }
    });

    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const timeSpent = quizStartTime
      ? Math.floor((Date.now() - quizStartTime) / 1000)
      : 0;

    return { score: correct, total, percentage, timeSpent };
  };

  const saveQuiz = async (quizData) => {
    if (!user?.uid) {
      toast.error(t('subscriptionRequired'));
      return null;
    }

    try {
      const quizToSave = {
        title: {
          fr: quizData.title,
          ar: quizData.title,
        },
        description: {
          fr: '',
          ar: '',
        },
        category: quizData.category || 'other',
        type: 'ai-generated',
        status: 'active',
        creatorId: user.uid,
        createdAt: new Date(),
        questions: quizData.questions,
        difficulty: quizData.difficulty,
        course: quizData.course,
        attempts: [],
        bestScore: 0,
        aiProvider: 'xai',
        aiModel: XAI_MODEL,
      };

      const docRef = await addDoc(collection(db, 'quizzes'), quizToSave);

      setSavedQuizzes((prev) => [
        {
          id: docRef.id,
          ...quizToSave,
        },
        ...prev,
      ]);

      toast.success(`${t('saveQuiz')} : ${t('success')}`);
      return docRef.id;
    } catch (saveError) {
      console.error('❌ Erreur sauvegarde:', saveError);
      toast.error(t('error'));
      throw saveError;
    }
  };

  const handleSubmitQuiz = () => {
    setShowResults(true);
  };

  const resetQuiz = () => {
    setCurrentStep('config');
    setGeneratedQuiz(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setShowExplanations(false);
    setError('');
    setQuizStartTime(null);
    setQuizConfig({
      courseName: '',
      quizTitle: '',
      numberOfQuestions: 10,
      difficulty: 'medium',
      category: 'anatomy',
      questionType: 'multiple_choice',
    });
  };

  const renderConfigStep = () => (
    <div className={`max-w-4xl mx-auto space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mr-4 shadow-lg">
            <Brain className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            {t('title')}
          </h1>
        </div>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {t('subtitle')}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-semibold mb-8 flex items-center">
          <Settings className="w-7 h-7 mr-3 text-blue-600" />
          {t('configuration')}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="w-6 h-6 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('courseName')} <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={quizConfig.courseName}
              onChange={(event) =>
                setQuizConfig((prev) => ({
                  ...prev,
                  courseName: event.target.value,
                }))
              }
              placeholder={t('courseNamePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('quizTitle')} <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={quizConfig.quizTitle}
              onChange={(event) =>
                setQuizConfig((prev) => ({
                  ...prev,
                  quizTitle: event.target.value,
                }))
              }
              placeholder={t('quizTitlePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('numberOfQuestions')}
            </label>

            <select
              value={quizConfig.numberOfQuestions}
              onChange={(event) =>
                setQuizConfig((prev) => ({
                  ...prev,
                  numberOfQuestions: Number(event.target.value),
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            >
              <option value={5}>5 {t('questions')}</option>
              <option value={10}>10 {t('questions')}</option>
              <option value={15}>15 {t('questions')}</option>
              <option value={20}>20 {t('questions')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('difficulty')}
            </label>

            <select
              value={quizConfig.difficulty}
              onChange={(event) =>
                setQuizConfig((prev) => ({
                  ...prev,
                  difficulty: event.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty.id} value={difficulty.id}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('category')}
            </label>

            <select
              value={quizConfig.category}
              onChange={(event) =>
                setQuizConfig((prev) => ({
                  ...prev,
                  category: event.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('questionType')}
            </label>

            <select
              value={quizConfig.questionType}
              onChange={(event) =>
                setQuizConfig((prev) => ({
                  ...prev,
                  questionType: event.target.value,
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            >
              {questionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateQuiz}
          disabled={isGenerating}
          className={`mt-8 w-full py-3 px-6 text-lg font-semibold rounded-xl flex items-center justify-center transition-all duration-200 ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Brain className="w-6 h-6 mr-2" />
          {t('generateQuiz')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-semibold mb-8 flex items-center">
          <BookOpen className="w-7 h-7 mr-3 text-blue-600" />
          {t('savedQuizzes')}
        </h2>

        {savedQuizzes.length === 0 ? (
          <p className="text-gray-600 text-center">{t('noSavedQuizzes')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {savedQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <h3 className="font-semibold text-lg text-gray-900">
                  {quiz.title?.[language] || quiz.title?.fr || quiz.title}
                </h3>

                <p className="text-gray-600 text-sm">
                  {t('course')}: {quiz.course}
                </p>

                <p className="text-gray-600 text-sm">
                  {t('category')}: {t(quiz.category)}
                </p>

                <p className="text-gray-600 text-sm">
                  {t('difficulty')}: {t(quiz.difficulty)}
                </p>

                <p className="text-gray-600 text-sm">
                  {quiz.questions.length} {t('questions')}
                </p>

                <NavLink
                  to={`/quizzes/${quiz.id}`}
                  className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm"
                >
                  {t('startQuiz')}
                </NavLink>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className={`min-h-screen flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="text-center">
        <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {t('generating')}
        </h2>
        <p className="text-gray-600 mb-4">{processingStage}</p>

        <div className="w-64 bg-gray-200 rounded-full h-2.5 mx-auto">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
          />
        </div>
      </div>
    </div>
  );

  const renderQuizStep = () => {
    if (!generatedQuiz || !generatedQuiz.questions?.length) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-800">{t('error')}</p>
          <button
            type="button"
            onClick={resetQuiz}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('newQuiz')}
          </button>
        </div>
      );
    }

    if (showResults) {
      return renderResultsStep();
    }

    const currentQuestion = generatedQuiz.questions[currentQuestionIndex];
    const isAnswered = userAnswers[currentQuestion.id] !== undefined;
    const isLastQuestion = currentQuestionIndex === generatedQuiz.questions.length - 1;

    return (
      <div className={`max-w-4xl mx-auto py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6">
            {generatedQuiz.title} ({t('question')} {currentQuestionIndex + 1}/
            {generatedQuiz.questions.length})
          </h2>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / generatedQuiz.questions.length) * 100
                }%`,
              }}
            />
          </div>

          <div className="mb-6">
            <p className="text-lg font-medium text-gray-800">
              {currentQuestion.question?.[language] || currentQuestion.question?.fr}
            </p>
          </div>

          {currentQuestion.type === 'multiple_choice' && (
            <div className="space-y-4">
              {(currentQuestion.options?.[language] ||
                currentQuestion.options?.fr ||
                []).map((option, index) => (
                <button
                  key={`${currentQuestion.id}-option-${index}`}
                  type="button"
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                    userAnswers[currentQuestion.id] === index
                      ? 'bg-blue-100 border-blue-500'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'true_false' && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleAnswerSelect(currentQuestion.id, true)}
                className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 ${
                  userAnswers[currentQuestion.id] === true
                    ? 'bg-blue-100 border-blue-500'
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                {t('trueLabel')}
              </button>

              <button
                type="button"
                onClick={() => handleAnswerSelect(currentQuestion.id, false)}
                className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 ${
                  userAnswers[currentQuestion.id] === false
                    ? 'bg-blue-100 border-blue-500'
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                {t('falseLabel')}
              </button>
            </div>
          )}

          {currentQuestion.type === 'short_answer' && (
            <input
              type="text"
              value={userAnswers[currentQuestion.id] || ''}
              onChange={(event) =>
                handleAnswerSelect(currentQuestion.id, event.target.value)
              }
              placeholder={t('answerPlaceholder')}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 border-gray-300"
            />
          )}

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${
                currentQuestionIndex === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              {t('previousQuestion')}
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={Object.keys(userAnswers).length !== generatedQuiz.questions.length}
                className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${
                  Object.keys(userAnswers).length === generatedQuiz.questions.length
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('submitQuiz')}
                <CheckCircle className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                disabled={!isAnswered}
                className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${
                  isAnswered
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('nextQuestion')}
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResultsStep = () => {
    const { score, total, percentage, timeSpent } = calculateResults();
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    return (
      <div className={`max-w-4xl mx-auto py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6" />

          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {t('congratulations')}
          </h2>

          <p className="text-xl text-gray-600 mb-6">{t('quizComplete')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div>
              <p className="text-gray-600">{t('score')}</p>
              <p className="text-2xl font-semibold text-blue-600">
                {score}/{total}
              </p>
            </div>

            <div>
              <p className="text-gray-600">{t('accuracy')}</p>
              <p className="text-2xl font-semibold text-blue-600">{percentage}%</p>
            </div>

            <div>
              <p className="text-gray-600">{t('timeSpent')}</p>
              <p className="text-2xl font-semibold text-blue-600">
                {minutes > 0 ? `${minutes} ${t('minutes')} ` : ''}
                {seconds} {t('seconds')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => setShowExplanations((prev) => !prev)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              <BookOpen className="w-5 h-5 mr-2 inline" />
              {t('reviewAnswers')}
            </button>

            <button
              type="button"
              onClick={resetQuiz}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 mr-2 inline" />
              {t('newQuiz')}
            </button>

            {user && generatedQuiz && (
              <button
                type="button"
                onClick={() => saveQuiz(generatedQuiz)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
              >
                <Save className="w-5 h-5 mr-2 inline" />
                {t('saveQuiz')}
              </button>
            )}
          </div>
        </div>

        {showExplanations && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4">{t('reviewAnswers')}</h3>

            {generatedQuiz.questions.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const correct = isAnswerCorrect(question, userAnswer);

              return (
                <div
                  key={question.id}
                  className="bg-white rounded-lg p-6 mb-4 border border-gray-100"
                >
                  <p className="text-lg font-medium mb-2">
                    {t('question')} {index + 1}:{' '}
                    {question.question?.[language] || question.question?.fr}
                  </p>

                  <p className="flex items-center text-gray-600">
                    {correct ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mr-2" />
                    )}

                    {correct ? t('correct') : t('incorrect')}
                  </p>

                  <p className="text-gray-600 mt-2">
                    {t('explanation')}:{' '}
                    {question.explanation?.[language] || question.explanation?.fr}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50 py-12">
        {currentStep === 'config' && renderConfigStep()}
        {currentStep === 'generating' && renderGeneratingStep()}
        {currentStep === 'quiz' && renderQuizStep()}
      </main>
    </ErrorBoundary>
  );
};

export default QuizGenerator;