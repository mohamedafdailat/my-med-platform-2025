import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownWideNarrow, ArrowRight, BookOpen, Check, Film, Grid2X2, Layers, List, Play, RefreshCw, Search, Share2, SlidersHorizontal, Sparkles, Video, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getVisibleDocuments } from '../services/contentService';
import { toDate } from '../utils/dates';
import { localizedVideoText, normalizeVideo, videoSearchText } from '../utils/videos';
import '../styles/video-library.css';

const copy = {
  fr: {
    eyebrow: 'VOTRE CAMPUS EN VIDÉO', title: 'Un déclic à chaque vidéo.', subtitle: 'Comprenez les notions essentielles, explorez vos spécialités et avancez à votre rythme.',
    library: 'Bibliothèque vidéo', videos: 'vidéos disponibles', categories: 'spécialités à explorer', semester: 'Semestre', general: 'Tous les semestres',
    featured: 'À découvrir', watch: 'Regarder la vidéo', explore: 'Explorer la bibliothèque', back: 'Mon tableau de bord', all: 'Tout explorer',
    search: 'Rechercher une notion, un titre, une spécialité…', searchLabel: 'Rechercher dans les vidéos', clearSearch: 'Effacer la recherche',
    sort: 'Trier les vidéos', newest: 'Plus récentes', oldest: 'Plus anciennes', titleSort: 'Titre : A à Z', filter: 'Filtrer par spécialité',
    grid: 'Affichage en grille', list: 'Affichage en liste', results: 'résultat(s)', reset: 'Réinitialiser les filtres',
    empty: 'Votre bibliothèque se prépare.', emptyText: 'Les vidéos disponibles pour votre semestre apparaîtront ici. En attendant, explorez vos autres ressources.', courses: 'Explorer les cours',
    noResults: 'Pas encore la bonne vidéo ?', noResultsText: 'Essayez une autre notion ou élargissez votre sélection de spécialités.',
    error: 'La bibliothèque est momentanément indisponible.', errorText: 'Vérifiez votre connexion puis réessayez pour retrouver vos vidéos.', retry: 'Réessayer', refresh: 'Actualiser la bibliothèque', loading: 'Chargement de votre bibliothèque…',
    uploaded: 'Vidéo de cours', share: 'Partager', copied: 'Lien copié', shareError: 'Le partage est indisponible dans ce navigateur.',
    tipTitle: 'Voir. Comprendre. Retenir.', tip: 'Après une vidéo, testez vos connaissances avec un quiz ou une session de flashcards.', practice: 'Passer aux quiz', noTitle: 'Vidéo sans titre', noDescription: 'Une nouvelle notion à explorer pour enrichir vos révisions.',
    categoryNames: { 'general-medicine': 'Médecine générale', cardiology: 'Cardiologie', pharmacy: 'Pharmacie', technology: 'Technologie médicale', dentaire: 'Santé dentaire', other: 'Autres' },
  },
  ar: {
    eyebrow: 'فضاؤك للتعلّم بالفيديو', title: 'فهم أعمق مع كل فيديو.', subtitle: 'افهم المفاهيم الأساسية، واستكشف التخصصات، وتقدّم بالوتيرة التي تناسبك.',
    library: 'مكتبة الفيديو', videos: 'فيديو متاح', categories: 'تخصصات للاستكشاف', semester: 'الفصل', general: 'جميع الفصول',
    featured: 'للاكتشاف', watch: 'مشاهدة الفيديو', explore: 'استكشاف المكتبة', back: 'لوحة التحكم', all: 'استكشاف الكل',
    search: 'ابحث عن مفهوم أو عنوان أو تخصص…', searchLabel: 'البحث في الفيديوهات', clearSearch: 'مسح البحث',
    sort: 'ترتيب الفيديوهات', newest: 'الأحدث أولاً', oldest: 'الأقدم أولاً', titleSort: 'حسب العنوان', filter: 'التصفية حسب التخصص',
    grid: 'عرض شبكي', list: 'عرض قائمة', results: 'نتيجة', reset: 'إعادة ضبط المرشحات',
    empty: 'مكتبتك قيد التحضير.', emptyText: 'ستظهر هنا الفيديوهات المتاحة لفصلك. يمكنك استكشاف بقية الموارد في الأثناء.', courses: 'استكشاف الدروس',
    noResults: 'لم تجد الفيديو المناسب؟', noResultsText: 'جرّب مفهوماً آخر أو وسّع اختيار التخصصات.',
    error: 'المكتبة غير متاحة مؤقتاً.', errorText: 'تحقق من اتصالك ثم حاول مجدداً لاستعادة الفيديوهات.', retry: 'إعادة المحاولة', refresh: 'تحديث المكتبة', loading: 'جاري تحميل مكتبتك…',
    uploaded: 'فيديو تعليمي', share: 'مشاركة', copied: 'تم نسخ الرابط', shareError: 'المشاركة غير متاحة في هذا المتصفح.',
    tipTitle: 'شاهد. افهم. تذكّر.', tip: 'بعد الفيديو، اختبر معلوماتك باختبار أو بجلسة بطاقات تعليمية.', practice: 'الانتقال إلى الاختبارات', noTitle: 'فيديو بدون عنوان', noDescription: 'مفهوم جديد لاستكشافه وإثراء مراجعتك.',
    categoryNames: { 'general-medicine': 'الطب العام', cardiology: 'أمراض القلب', pharmacy: 'الصيدلة', technology: 'التكنولوجيا الطبية', dentaire: 'صحة الأسنان', other: 'أخرى' },
  },
};

const VideoArtwork = ({ video, title }) => {
  const [failed, setFailed] = useState(false);
  return <div className={`vl-art vl-art-${video.category === 'cardiology' ? 'rose' : video.category === 'pharmacy' ? 'teal' : 'blue'}`}>
    <div className="vl-art-pattern" aria-hidden="true" />
    <svg className="vl-wave" viewBox="0 0 420 140" fill="none" aria-hidden="true"><path d="M0 78h90l17-19 18 42 26-81 29 105 20-47h40l14-21 18 39 20-18h128" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /></svg>
    {video.youtubeId && !failed && <img src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
    <span className="vl-play"><Play size={23} fill="currentColor" aria-hidden="true" /><span className="sr-only">{title}</span></span>
    {video.duration && <span className="vl-duration">{video.duration}</span>}
  </div>;
};

const Videos = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = copy[language] || copy.fr;
  const [records, setVideos] = useState([]);
  const [loadedAccess, setLoadedAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('grid');
  const [shareStatus, setShareStatus] = useState({});
  const accessUser = useMemo(() => ({ uid: user?.uid, semester: user?.semester, customClaims: { role: user?.customClaims?.role, adminAccessVersion: user?.customClaims?.adminAccessVersion, unlimitedAccess: user?.customClaims?.unlimitedAccess } }), [user?.uid, user?.semester, user?.customClaims?.role, user?.customClaims?.adminAccessVersion, user?.customClaims?.unlimitedAccess]);
  const videos = useMemo(() => loadedAccess === accessUser ? records : [], [loadedAccess, accessUser, records]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(false); setVideos([]);
    getVisibleDocuments('videos', accessUser).then(documents => {
      if (active) {
        setVideos(documents.map(document => normalizeVideo(document.id, document.data())).filter(Boolean).sort((a, b) => (toDate(b.uploadedAt)?.getTime() || 0) - (toDate(a.uploadedAt)?.getTime() || 0)));
        setLoadedAccess(accessUser);
      }
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accessUser, refreshKey]);

  const categories = useMemo(() => [...new Set(videos.map(video => video.category))], [videos]);
  const filtered = useMemo(() => {
    const term = videoSearchText(search);
    return videos.filter(video => (category === 'all' || video.category === category) && videoSearchText(`${localizedVideoText(video.title, language)} ${localizedVideoText(video.description, language)} ${t.categoryNames[video.category] || video.category}`).includes(term)).sort((a, b) => sort === 'title' ? localizedVideoText(a.title, language).localeCompare(localizedVideoText(b.title, language), language === 'ar' ? 'ar' : 'fr') : ((toDate(b.uploadedAt)?.getTime() || 0) - (toDate(a.uploadedAt)?.getTime() || 0)) * (sort === 'oldest' ? -1 : 1));
  }, [videos, category, search, sort, language, t.categoryNames]);
  const featured = videos[0];
  const reset = () => { setSearch(''); setCategory('all'); setSort('newest'); };
  const categoryLabel = video => t.categoryNames[video.category] || video.category;
  const title = video => localizedVideoText(video.title, language, t.noTitle);

  const share = async video => {
    const url = `${window.location.origin}/videos/${encodeURIComponent(video.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: title(video), url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setShareStatus({ id: video.id, message: t.copied }); }
      else setShareStatus({ id: video.id, message: t.shareError });
    } catch (err) { if (err.name !== 'AbortError') setShareStatus({ id: video.id, message: t.shareError }); }
  };

  return <div className="video-library" dir={language === 'ar' ? 'rtl' : 'ltr'}><div className="vl-container">
    <div className="vl-page-label"><span><Video size={18} aria-hidden="true" />{t.library}</span><Link to="/dashboard">{t.back}<ArrowRight size={15} aria-hidden="true" /></Link></div>
    <section className="vl-hero" aria-labelledby="vl-title"><div className="vl-hero-copy">
      <span className="vl-eyebrow"><span />{t.eyebrow}</span><h1 id="vl-title">{t.title}</h1><p>{t.subtitle}</p>
      <a href="#video-catalog" className="vl-button vl-button-light"><Play size={17} fill="currentColor" aria-hidden="true" />{t.explore}<ArrowRight size={17} aria-hidden="true" /></a>
      <div className="vl-hero-stats" aria-busy={loading}><div><strong>{loading || error ? '—' : videos.length}</strong><span>{t.videos}</span></div><div><strong>{loading || error ? '—' : categories.length}</strong><span>{t.categories}</span></div>{user?.semester && <div><strong>S{user.semester}</strong><span>{t.semester}</span></div>}</div>
    </div>{featured && !loading && !error ? <Link to={`/videos/${encodeURIComponent(featured.id)}`} className="vl-featured"><VideoArtwork key={featured.id} video={featured} title={t.watch} /><div className="vl-featured-copy"><span><Sparkles size={13} aria-hidden="true" />{t.featured} · {categoryLabel(featured)}</span><h2>{title(featured)}</h2><span className="vl-featured-action">{t.watch}<ArrowRight size={16} aria-hidden="true" /></span></div></Link> : <div className="vl-hero-illustration" aria-hidden="true"><div className="vl-illustration-ring" /><div className="vl-illustration-card"><Video size={46} strokeWidth={1.3} /><div /><div /><span><Play size={16} fill="currentColor" /></span></div><span className="vl-illustration-float"><BookOpen size={23} /></span><span className="vl-illustration-float"><Layers size={23} /></span></div>}</section>

    <section id="video-catalog" className="vl-catalog" aria-labelledby="vl-catalog-title">
      <div className="vl-section-title"><div><span className="vl-kicker">{t.library}</span><h2 id="vl-catalog-title">{t.all}</h2></div><button type="button" className="vl-icon-button" disabled={loading} onClick={() => setRefreshKey(key => key + 1)} aria-label={t.refresh} title={t.refresh}><RefreshCw size={18} className={loading ? 'vl-spinning' : ''} aria-hidden="true" /></button></div>
      <div className="vl-toolbar"><div className="vl-search"><Search size={20} aria-hidden="true" /><label htmlFor="video-search" className="sr-only">{t.searchLabel}</label><input id="video-search" type="search" placeholder={t.search} value={search} onChange={event => setSearch(event.target.value)} />{search && <button type="button" onClick={() => setSearch('')} aria-label={t.clearSearch}><X size={17} aria-hidden="true" /></button>}</div><div className="vl-sort"><ArrowDownWideNarrow size={17} aria-hidden="true" /><label htmlFor="video-sort" className="sr-only">{t.sort}</label><select id="video-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{t.newest}</option><option value="oldest">{t.oldest}</option><option value="title">{t.titleSort}</option></select></div></div>
      <div className="vl-filters-row"><div className="vl-filters" role="group" aria-label={t.filter}><button type="button" className={category === 'all' ? 'is-active' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}><SlidersHorizontal size={14} aria-hidden="true" />{t.all}<span>{videos.length}</span></button>{categories.map(key => <button type="button" key={key} className={category === key ? 'is-active' : ''} aria-pressed={category === key} onClick={() => setCategory(key)}>{t.categoryNames[key] || key}<span>{videos.filter(video => video.category === key).length}</span></button>)}</div><div className="vl-view" role="group" aria-label={t.library}><button type="button" aria-label={t.grid} aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Grid2X2 size={17} aria-hidden="true" /></button><button type="button" aria-label={t.list} aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={19} aria-hidden="true" /></button></div></div>
      <div className="vl-results-bar"><p role="status">{loading ? t.loading : error ? '' : `${filtered.length} ${t.results}`}</p>{(search || category !== 'all') && <button type="button" onClick={reset}>{t.reset}<X size={13} aria-hidden="true" /></button>}</div>
      {loading ? <div className="vl-grid" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(index => <div key={index} className="vl-skeleton"><div /><span /><span /><span /></div>)}</div> : error ? <div className="vl-empty" role="alert"><RefreshCw size={32} aria-hidden="true" /><h3>{t.error}</h3><p>{t.errorText}</p><button type="button" className="vl-button" onClick={() => setRefreshKey(key => key + 1)}>{t.retry}<ArrowRight size={16} aria-hidden="true" /></button></div> : !filtered.length ? <div className="vl-empty"><Film size={36} aria-hidden="true" /><h3>{videos.length ? t.noResults : t.empty}</h3><p>{videos.length ? t.noResultsText : t.emptyText}</p>{videos.length ? <button type="button" className="vl-button" onClick={reset}>{t.reset}</button> : <Link to="/courses" className="vl-button">{t.courses}<ArrowRight size={16} aria-hidden="true" /></Link>}</div> : <div className={`vl-grid ${view === 'list' ? 'vl-list' : ''}`}>{filtered.map(video => <article key={video.id} className="vl-card">
        <Link to={`/videos/${encodeURIComponent(video.id)}`} className="vl-card-art" aria-label={`${t.watch} : ${title(video)}`}><VideoArtwork video={video} title={t.watch} /><span className="vl-source">{video.type === 'youtube' ? 'YouTube' : <><Video size={12} aria-hidden="true" />{t.uploaded}</>}</span></Link>
        <div className="vl-card-body"><div className="vl-card-meta"><span className="vl-category">{categoryLabel(video)}</span>{video.semester && <span>{video.semester === 'all' ? t.general : `S${video.semester}`}</span>}</div><h3><Link to={`/videos/${encodeURIComponent(video.id)}`}>{title(video)}</Link></h3><p className="vl-description">{localizedVideoText(video.description, language, t.noDescription)}</p><div className="vl-card-footer"><Link to={`/videos/${encodeURIComponent(video.id)}`} className="vl-watch"><Play size={14} fill="currentColor" aria-hidden="true" />{t.watch}<ArrowRight size={15} aria-hidden="true" /></Link><button type="button" className="vl-icon-button" onClick={() => share(video)} aria-label={`${t.share} : ${title(video)}`} title={t.share}>{shareStatus.id === video.id && shareStatus.message === t.copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}</button></div>{shareStatus.id === video.id && <p className="vl-share-status" role="status">{shareStatus.message}</p>}</div>
      </article>)}</div>}
    </section>
    <aside className="vl-study-tip"><div className="vl-tip-icon"><Layers size={25} aria-hidden="true" /></div><div><h2>{t.tipTitle}</h2><p>{t.tip}</p></div><Link to="/quizzes">{t.practice}<ArrowRight size={17} aria-hidden="true" /></Link></aside>
  </div></div>;
};

export default Videos;
