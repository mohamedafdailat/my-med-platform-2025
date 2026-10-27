import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, Check, CheckCircle2, ChevronDown, CircleHelp, FolderLock, GraduationCap, Layers, ListFilter, RefreshCw, Search, ShieldCheck, Sparkles, Target, Trophy, WandSparkles, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getVisibleDocuments, getOwnQuizAttempts } from '../services/contentService';
import ContentPublication from '../components/ContentPublication';
import { hasAdminAccess } from '../utils/access';
import { filterQuizzes, normalizeQuiz, quizCategoryLabel, quizHistory, quizInSpace, quizText, quizTitle } from '../utils/quizzes';
import '../styles/quiz-library.css';

const COPY = {
  fr: {
    page: 'Vos quiz', dashboard: 'Mon tableau de bord', eyebrow: 'LE SAVOIR PASSE À L’ACTION', title: 'Une question.', accent: 'Un pas de plus.',
    subtitle: 'Mettez vos connaissances à l’épreuve, repérez vos points forts et retrouvez le plaisir de progresser.', generate: 'Créer un quiz avec l’IA', explore: 'Explorer les quiz',
    next: 'VOTRE PROCHAINE ÉTAPE', nextTitle: 'À vous de jouer.', nextDescription: 'Un quiz pour mobiliser vos connaissances. Une nouvelle occasion de comprendre.', featured: 'À découvrir', start: 'Commencer', again: 'Refaire le quiz', noQuestions: 'Questions à venir',
    accessible: 'Quiz accessibles', accessibleHint: 'Dans tous vos espaces', doneStat: 'Quiz déjà effectués', doneHint: 'Quiz distincts dans votre historique', average: 'Score moyen', averageHint: 'Sur toutes vos tentatives notées', own: 'Quiz personnels', ownHint: 'Vos créations privées',
    catalog: 'Votre terrain d’entraînement', catalogHint: 'Choisissez une notion, puis faites le premier pas.', all: 'Tout explorer', library: 'Bibliothèque', personal: 'Mes quiz privés', admin: 'Privés à gérer', spaces: 'Choisir un espace de quiz',
    search: 'Rechercher une notion, un titre, un cours…', searchLabel: 'Rechercher dans les quiz', clear: 'Effacer la recherche', category: 'Spécialité', allCategories: 'Toutes les spécialités', source: 'Origine du quiz', allSources: 'Toutes les origines', ai: 'Généré avec l’IA', standard: 'Autres quiz', progress: 'Votre activité', allProgress: 'Tous les quiz', completed: 'Déjà effectué', todo: 'À découvrir',
    sort: 'Trier les quiz', newest: 'Plus récents', oldest: 'Plus anciens', titleSort: 'Titre : A à Z', questionsSort: 'Nombre de questions', reset: 'Réinitialiser les filtres', results: 'quiz dans cette sélection', refresh: 'Actualiser les quiz',
    loading: 'Chargement de vos quiz…', historyUnavailable: 'Votre historique est momentanément indisponible. Vous pouvez continuer à explorer et à passer des quiz.', historyUnknown: 'Historique indisponible', historyPending: 'Historique en cours', error: 'Vos quiz font une petite pause.', errorHint: 'Vérifiez votre connexion et réessayez pour retrouver votre sélection.', retry: 'Réessayer',
    empty: 'Votre prochaine découverte se prépare.', emptyHint: 'Les quiz disponibles pour votre semestre et vos créations personnelles apparaîtront ici.', emptyPersonal: 'Vos idées ont leur place ici.', emptyPersonalHint: 'Créez un quiz à partir de votre cours et retrouvez-le dans votre espace privé.', noResults: 'Le bon quiz est peut-être juste à côté.', noResultsHint: 'Essayez une autre notion ou élargissez vos filtres.',
    untitled: 'Quiz sans titre', noDescription: 'Mobilisez vos acquis, question après question.', questions: 'questions', question: 'question', best: 'Meilleur score', noScore: 'Pas encore de note', unclassified: 'À classer', privateAdmin: 'Privé · administration', shared: 'Bibliothèque partagée', private: 'Votre espace privé', general: 'Tous les semestres', course: 'Cours',
    difficulty: { easy: 'Découverte', medium: 'Intermédiaire', hard: 'Approfondissement' }, method: 'Testez. Comprenez. Recommencez.', methodHint: 'Chaque tentative vous aide à repérer les notions à revoir. Prenez le temps de lire les explications et revenez quand vous le souhaitez.', cards: 'Réviser avec les flashcards',
    categories: { 'general-medicine': 'Médecine générale', cardiology: 'Cardiologie', pharmacy: 'Pharmacie', technology: 'Technologie médicale', dentaire: 'Santé dentaire', other: 'Autres', anatomy: 'Anatomie', physiology: 'Physiologie', pharmacology: 'Pharmacologie', pathology: 'Pathologie', clinical: 'Pratique clinique', terminology: 'Terminologie médicale' },
  },
  ar: {
    page: 'اختباراتك', dashboard: 'لوحة تحكمي', eyebrow: 'حوّل المعرفة إلى ممارسة', title: 'سؤال واحد.', accent: 'خطوة إلى الأمام.', subtitle: 'اختبر معارفك، واكتشف نقاط قوتك، واستمتع بالتقدّم في مراجعاتك.', generate: 'أنشئ اختباراً بالذكاء الاصطناعي', explore: 'استكشف الاختبارات',
    next: 'خطوتك التالية', nextTitle: 'حان دورك.', nextDescription: 'اختبار لاستحضار معارفك وفرصة جديدة للفهم.', featured: 'للاكتشاف', start: 'ابدأ الاختبار', again: 'أعد الاختبار', noQuestions: 'الأسئلة قريباً', accessible: 'الاختبارات المتاحة', accessibleHint: 'في جميع مساحاتك', doneStat: 'اختبارات أنجزتها', doneHint: 'اختبارات مختلفة في سجلك', average: 'متوسط النتائج', averageHint: 'جميع محاولاتك ذات النتائج', own: 'اختبارات شخصية', ownHint: 'إبداعاتك الخاصة',
    catalog: 'مساحتك للتدرّب', catalogHint: 'اختر مفهوماً وابدأ الخطوة الأولى.', all: 'استكشف الكل', library: 'المكتبة', personal: 'اختباراتي الخاصة', admin: 'محتوى خاص للإدارة', spaces: 'اختر مساحة الاختبارات', search: 'ابحث عن مفهوم أو عنوان أو درس…', searchLabel: 'البحث في الاختبارات', clear: 'مسح البحث', category: 'التخصص', allCategories: 'جميع التخصصات', source: 'مصدر الاختبار', allSources: 'جميع المصادر', ai: 'مولّد بالذكاء الاصطناعي', standard: 'اختبارات أخرى', progress: 'نشاطك', allProgress: 'جميع الاختبارات', completed: 'سبق إنجازه', todo: 'للاكتشاف',
    sort: 'ترتيب الاختبارات', newest: 'الأحدث أولاً', oldest: 'الأقدم أولاً', titleSort: 'حسب العنوان', questionsSort: 'عدد الأسئلة', reset: 'إعادة ضبط المرشحات', results: 'اختبار في هذه المجموعة', refresh: 'تحديث الاختبارات', loading: 'جارٍ تحميل اختباراتك…', historyUnavailable: 'سجلك غير متاح مؤقتاً. يمكنك متابعة الاستكشاف وإجراء الاختبارات.', historyUnknown: 'السجل غير متاح', historyPending: 'جارٍ تحميل السجل', error: 'الاختبارات في استراحة قصيرة.', errorHint: 'تحقق من اتصالك ثم أعد المحاولة لاستعادة مجموعتك.', retry: 'إعادة المحاولة',
    empty: 'اكتشافك القادم قيد التحضير.', emptyHint: 'ستظهر هنا الاختبارات المتاحة لفصلك وإبداعاتك الشخصية.', emptyPersonal: 'لأفكارك مكان هنا.', emptyPersonalHint: 'أنشئ اختباراً من درسك واحتفظ به في مساحتك الخاصة.', noResults: 'اختبارك المناسب قريب منك.', noResultsHint: 'جرّب مفهوماً آخر أو وسّع المرشحات.', untitled: 'اختبار بدون عنوان', noDescription: 'استحضر معارفك، سؤالاً بعد سؤال.', questions: 'أسئلة', question: 'سؤال', best: 'أفضل نتيجة', noScore: 'لا توجد نتيجة بعد', unclassified: 'بحاجة إلى تصنيف', privateAdmin: 'خاص · الإدارة', shared: 'المكتبة المشتركة', private: 'مساحتك الخاصة', general: 'جميع الفصول', course: 'الدرس',
    difficulty: { easy: 'اكتشاف', medium: 'متوسط', hard: 'تعمّق' }, method: 'اختبر. افهم. حاول من جديد.', methodHint: 'تساعدك كل محاولة على تحديد المفاهيم التي تحتاج إلى مراجعة. اقرأ الشروحات بتأنٍ وعُد متى شئت.', cards: 'راجع باستخدام البطاقات',
    categories: { 'general-medicine': 'الطب العام', cardiology: 'أمراض القلب', pharmacy: 'الصيدلة', technology: 'التكنولوجيا الطبية', dentaire: 'صحة الأسنان', other: 'أخرى', anatomy: 'التشريح', physiology: 'الفسيولوجيا', pharmacology: 'علم الأدوية', pathology: 'علم الأمراض', clinical: 'الممارسة السريرية', terminology: 'المصطلحات الطبية' },
  },
};

const Quizzes = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = COPY[language] || COPY.fr;
  const [refresh, setRefresh] = useState(0);
  const [catalog, setCatalog] = useState({ access: null, items: null, error: false });
  const [attempts, setAttempts] = useState({ owner: null, items: null, error: false });
  const [space, setSpace] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [source, setSource] = useState('all');
  const [progress, setProgress] = useState('all');
  const [sort, setSort] = useState('newest');
  const uid = user?.uid;
  const administrator = hasAdminAccess(user?.customClaims);
  const accessUser = useMemo(() => ({ uid: user?.uid, semester: user?.semester, customClaims: { role: user?.customClaims?.role, adminAccessVersion: user?.customClaims?.adminAccessVersion, unlimitedAccess: user?.customClaims?.unlimitedAccess } }), [user?.uid, user?.semester, user?.customClaims?.role, user?.customClaims?.adminAccessVersion, user?.customClaims?.unlimitedAccess]);

  useEffect(() => {
    let active = true;
    setCatalog({ access: accessUser, items: null, error: false });
    setAttempts({ owner: uid, items: null, error: false });
    if (!uid) return () => { active = false; };
    getVisibleDocuments('quizzes', accessUser).then(documents => {
      const items = documents.map(document => normalizeQuiz(document.id, document.data())).filter(Boolean);
      if (active) setCatalog({ access: accessUser, items, error: false });
    }).catch(() => { if (active) setCatalog({ access: accessUser, items: null, error: true }); });
    getOwnQuizAttempts(uid).then(items => {
      if (active) setAttempts({ owner: uid, items, error: false });
    }).catch(() => { if (active) setAttempts({ owner: uid, items: null, error: true }); });
    return () => { active = false; };
  }, [accessUser, uid, refresh]);

  const currentCatalog = catalog.access === accessUser ? catalog : { items: null, error: false };
  const currentAttempts = attempts.owner === uid ? attempts : { items: null, error: false };
  const quizzes = useMemo(() => currentCatalog.items || [], [currentCatalog.items]);
  const loading = currentCatalog.items === null && !currentCatalog.error;
  const historyReady = currentAttempts.items !== null && !currentAttempts.error;
  const history = useMemo(() => quizHistory(currentAttempts.items, uid), [currentAttempts.items, uid]);
  const activeSpace = space === 'admin' && !administrator ? 'all' : space;
  const filtered = useMemo(() => filterQuizzes(quizzes, { uid, language, search, space: activeSpace, category, source, progress: historyReady ? progress : 'all', sort, history: history.byQuiz, categoryNames: t.categories }), [quizzes, uid, language, search, activeSpace, category, source, progress, sort, historyReady, history.byQuiz, t.categories]);
  const categories = useMemo(() => [...new Set(quizzes.map(quiz => quiz.category))].sort((a, b) => quizCategoryLabel(a, t.categories).localeCompare(quizCategoryLabel(b, t.categories), language === 'ar' ? 'ar' : 'fr')), [quizzes, t.categories, language]);
  const featured = useMemo(() => [...quizzes].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0) || a.id.localeCompare(b.id)).find(quiz => quiz.questionCount > 0 && (!historyReady || !history.byQuiz.has(quiz.id))) || quizzes.find(quiz => quiz.questionCount > 0), [quizzes, historyReady, history.byQuiz]);
  const reload = () => setRefresh(value => value + 1);
  const reset = () => { setSpace('all'); setSearch(''); setCategory('all'); setSource('all'); setProgress('all'); setSort('newest'); };
  const filteredSelection = search || category !== 'all' || source !== 'all' || (historyReady && progress !== 'all');
  const locale = language === 'ar' ? 'ar-MA' : 'fr-FR';
  const number = value => value === null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const title = quiz => quizTitle(quiz.title, language);
  const categoryLabel = quiz => quizCategoryLabel(quiz.category, t.categories);
  const spaces = [{ value: 'all', label: t.all, icon: Layers }, { value: 'library', label: t.library, icon: BookOpen }, { value: 'personal', label: t.personal, icon: FolderLock }, ...(administrator ? [{ value: 'admin', label: t.admin, icon: ShieldCheck }] : [])];
  const stats = [
    { key: 'accessible', icon: Brain, value: currentCatalog.items === null ? '—' : number(quizzes.length), label: t.accessible, hint: t.accessibleHint },
    { key: 'completed', icon: CheckCircle2, value: historyReady ? number(history.completed) : '—', label: t.doneStat, hint: t.doneHint },
    { key: 'average', icon: Trophy, value: historyReady && history.average !== null ? `${number(history.average)} %` : '—', label: t.average, hint: t.averageHint },
    { key: 'personal', icon: FolderLock, value: currentCatalog.items === null ? '—' : number(quizzes.filter(quiz => quizInSpace(quiz, 'personal', uid)).length), label: t.own, hint: t.ownHint },
  ];

  return <div className="quiz-library" dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}><div className="ql-container">
    <div className="ql-page-label"><span><Brain size={19} aria-hidden="true" />{t.page}</span><Link to="/dashboard">{t.dashboard}<ArrowRight size={15} aria-hidden="true" /></Link></div>
    <section className="ql-hero" aria-labelledby="quizzes-title">
      <div className="ql-hero-copy"><span className="ql-eyebrow"><span />{t.eyebrow}</span><h1 id="quizzes-title">{t.title}<span>{t.accent}</span></h1><p>{t.subtitle}</p><div className="ql-hero-actions"><a href="#quiz-catalog" className="ql-button ql-button-white">{t.explore}<ArrowRight size={17} aria-hidden="true" /></a><Link to="/quiz-generator" className="ql-hero-generate"><WandSparkles size={17} aria-hidden="true" />{t.generate}</Link></div></div>
      <div className="ql-feature-zone"><div className="ql-orbit" aria-hidden="true" />{featured && !loading && !currentCatalog.error ? <Link to={`/quizzes/${encodeURIComponent(featured.id)}`} className="ql-featured"><span className="ql-feature-eyebrow"><Sparkles size={14} aria-hidden="true" />{t.featured}</span><div className="ql-feature-icon" aria-hidden="true"><Brain size={35} strokeWidth={1.5} /><span><Check size={13} /></span></div><h2>{title(featured)}</h2><p>{categoryLabel(featured)} · {number(featured.questionCount)} {featured.questionCount === 1 ? t.question : t.questions}</p><span className="ql-feature-action">{historyReady && history.byQuiz.has(featured.id) ? t.again : t.start}<ArrowRight size={17} aria-hidden="true" /></span></Link> : <div className="ql-hero-note"><div className="ql-hero-note-icon"><Target size={44} strokeWidth={1.4} aria-hidden="true" /></div><span>{t.next}</span><h2>{t.nextTitle}</h2><p>{t.nextDescription}</p></div>}</div>
    </section>
    <section className="ql-stats" aria-label={t.page}>{stats.map(({ key, icon: Icon, value, label, hint }) => <article className={`ql-stat ql-stat-${key}`} key={key}><span className="ql-stat-icon"><Icon size={21} aria-hidden="true" /></span><div><strong data-quiz-stat={key}>{value}</strong><h2>{label}</h2><p>{hint}</p></div></article>)}</section>
    <section id="quiz-catalog" className="ql-catalog" aria-labelledby="ql-catalog-title" aria-busy={loading}>
      <div className="ql-section-heading"><div><span className="ql-kicker">{t.page}</span><h2 id="ql-catalog-title">{t.catalog}</h2><p>{t.catalogHint}</p></div><button type="button" className="ql-icon-button" onClick={reload} disabled={loading} aria-label={t.refresh} title={t.refresh}><RefreshCw size={19} className={loading ? 'ql-spinning' : ''} aria-hidden="true" /></button></div>
      <div className="ql-spaces" role="group" aria-label={t.spaces}>{spaces.map(({ value, label, icon: Icon }) => <button type="button" key={value} data-quiz-space={value} aria-pressed={activeSpace === value} className={activeSpace === value ? 'is-active' : ''} onClick={() => setSpace(value)}><Icon size={16} aria-hidden="true" /><span>{label}</span><b>{currentCatalog.items === null ? '—' : number(quizzes.filter(quiz => quizInSpace(quiz, value, uid)).length)}</b></button>)}</div>
      <div className="ql-controls"><div className="ql-toolbar"><div className="ql-search"><Search size={19} aria-hidden="true" /><label htmlFor="quiz-search" className="sr-only">{t.searchLabel}</label><input id="quiz-search" type="search" value={search} placeholder={t.search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setSearch(''); }} aria-controls="quizzes-grid" />{search && <button type="button" onClick={() => setSearch('')} aria-label={t.clear}><X size={17} aria-hidden="true" /></button>}</div><div className="ql-sort"><ListFilter size={17} aria-hidden="true" /><label htmlFor="quiz-sort" className="sr-only">{t.sort}</label><select id="quiz-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{t.newest}</option><option value="oldest">{t.oldest}</option><option value="title">{t.titleSort}</option><option value="questions">{t.questionsSort}</option></select></div></div>
        <div className="ql-selects">{[
          { id: 'quiz-category', label: t.category, value: category, change: setCategory, options: [['all', t.allCategories], ...categories.map(key => [key, quizCategoryLabel(key, t.categories)])] },
          { id: 'quiz-source', label: t.source, value: source, change: setSource, options: [['all', t.allSources], ['ai-generated', t.ai], ['standard', t.standard]] },
          { id: 'quiz-status', label: t.progress, value: historyReady ? progress : 'all', change: setProgress, disabled: !historyReady, options: [['all', t.allProgress], ['completed', t.completed], ['todo', t.todo]] },
        ].map(control => <div className="ql-select" key={control.id}><label htmlFor={control.id}>{control.label}</label><div><select id={control.id} value={control.value} onChange={event => control.change(event.target.value)} disabled={control.disabled}>{control.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div></div>)}</div>
      </div>
      {currentAttempts.error && <div className="ql-history-alert" role="status"><CircleHelp size={19} aria-hidden="true" /><p>{t.historyUnavailable}</p><button type="button" onClick={reload}>{t.retry}</button></div>}
      <div className="ql-results"><p role="status">{loading ? t.loading : currentCatalog.error ? '' : `${number(filtered.length)} ${t.results}`}</p>{(filteredSelection || activeSpace !== 'all') && <button type="button" onClick={reset}>{t.reset}<X size={13} aria-hidden="true" /></button>}</div>
      {loading ? <div className="ql-grid" aria-hidden="true">{[0, 1, 2].map(index => <div className="ql-skeleton" key={index}><div /><span /><span /><span /></div>)}</div> : currentCatalog.error ? <div className="ql-empty" role="alert"><RefreshCw size={34} aria-hidden="true" /><h3>{t.error}</h3><p>{t.errorHint}</p><button type="button" className="ql-button" onClick={reload}>{t.retry}<ArrowRight size={16} aria-hidden="true" /></button></div> : !filtered.length ? <div className="ql-empty"><Brain size={36} aria-hidden="true" /><h3>{filteredSelection ? t.noResults : activeSpace === 'personal' ? t.emptyPersonal : t.empty}</h3><p>{filteredSelection ? t.noResultsHint : activeSpace === 'personal' ? t.emptyPersonalHint : t.emptyHint}</p>{filteredSelection ? <button type="button" className="ql-button" onClick={reset}>{t.reset}</button> : <Link to="/quiz-generator" className="ql-button"><WandSparkles size={17} aria-hidden="true" />{t.generate}</Link>}</div> : <div id="quizzes-grid" className="ql-grid">{filtered.map(quiz => {
        const record = historyReady ? history.byQuiz.get(quiz.id) : null;
        const completed = Boolean(record);
        const personal = quiz.visibility === 'private' && quiz.creatorId === uid;
        const scope = quiz.visibility === 'shared' ? t.shared : personal ? t.private : quiz.visibility === 'unclassified' ? t.unclassified : t.privateAdmin;
        const course = quizText(quiz.course, language);
        return <article key={quiz.id} className={`ql-card${completed ? ' is-completed' : ''}`} aria-labelledby={`quiz-title-${quiz.id}`} data-quiz-id={quiz.id}>
          <div className="ql-card-top"><span className={`ql-card-icon ql-icon-${quiz.category === 'cardiology' ? 'rose' : quiz.category === 'pharmacy' || quiz.category === 'pharmacology' ? 'teal' : 'blue'}`}><Brain size={25} strokeWidth={1.6} aria-hidden="true" /></span><span className={`ql-status${completed ? ' is-done' : ''}`}>{completed ? <CheckCircle2 size={13} aria-hidden="true" /> : null}{!historyReady ? currentAttempts.error ? t.historyUnknown : t.historyPending : completed ? t.completed : t.todo}</span></div>
          <div className="ql-card-tags"><span>{categoryLabel(quiz)}</span>{quiz.difficulty && <span>{t.difficulty[quiz.difficulty]}</span>}{quiz.type === 'ai-generated' && <span className="ql-ai"><Sparkles size={11} aria-hidden="true" />{t.ai}</span>}</div>
          <h3 id={`quiz-title-${quiz.id}`}>{title(quiz)}</h3><p className="ql-description">{quizText(quiz.description, language, t.noDescription)}</p>
          {course && <p className="ql-course"><BookOpen size={13} aria-hidden="true" /><span>{t.course} : {course}</span></p>}
          <div className="ql-card-info"><span><CircleHelp size={14} aria-hidden="true" />{number(quiz.questionCount)} {quiz.questionCount === 1 ? t.question : t.questions}</span>{quiz.semester && <span><GraduationCap size={14} aria-hidden="true" />{quiz.semester === 'all' ? t.general : `S${quiz.semester}`}</span>}</div>
          <div className="ql-card-score"><span>{t.best}</span><strong>{!historyReady ? '—' : record?.bestScore !== null && record?.bestScore !== undefined ? `${number(record.bestScore)} %` : t.noScore}</strong></div>
          <div className="ql-card-footer">{quiz.questionCount > 0 ? <Link to={`/quizzes/${encodeURIComponent(quiz.id)}`} className="ql-start">{completed ? t.again : t.start}<ArrowRight size={16} aria-hidden="true" /></Link> : <span className="ql-no-questions">{t.noQuestions}</span>}<span className="ql-scope" title={scope}>{quiz.visibility === 'shared' ? <BookOpen size={12} aria-hidden="true" /> : <FolderLock size={12} aria-hidden="true" />}{scope}</span></div>
          {administrator && <div className="ql-publication"><ContentPublication collectionName="quizzes" item={quiz} language={language} onUpdated={reload} /></div>}
        </article>;
      })}</div>}
    </section>
    <aside className="ql-method"><span className="ql-method-icon"><Target size={27} aria-hidden="true" /></span><div><h2>{t.method}</h2><p>{t.methodHint}</p></div><Link to="/flashcards">{t.cards}<ArrowRight size={16} aria-hidden="true" /></Link></aside>
  </div></div>;
};

export default Quizzes;
