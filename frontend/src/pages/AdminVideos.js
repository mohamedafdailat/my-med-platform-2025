// C:\my-med-platform\frontend\src\pages\AdminVideos.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ContentSemesterEditor from '../components/ContentSemesterEditor';
import { NavLink } from 'react-router-dom';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import {
  AlertCircle,
  CheckCircle,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Video,
  Youtube,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { db, storage } from '../firebase';

const AdminVideos = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [videos, setVideos] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState('all');
  const [filteredType, setFilteredType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const t = useMemo(
    () =>
      ({
        fr: {
          title: 'Gestion des vidéos',
          subtitle: 'Gérez les vidéos importées et les liens YouTube de la plateforme.',
          addVideo: 'Ajouter une vidéo',
          refresh: 'Actualiser',
          loading: 'Chargement des vidéos...',
          noVideos: 'Aucune vidéo trouvée',
          noResults: 'Aucune vidéo ne correspond à votre recherche.',
          search: 'Rechercher une vidéo...',
          allCategories: 'Toutes les catégories',
          allTypes: 'Tous les types',
          upload: 'Fichier importé',
          youtube: 'YouTube',
          active: 'Active',
          inactive: 'Inactive',
          premium: 'Premium',
          free: 'Gratuit',
          titleCol: 'Vidéo',
          categoryCol: 'Catégorie',
          typeCol: 'Type',
          statusCol: 'Statut',
          dateCol: 'Date',
          actionsCol: 'Actions',
          open: 'Ouvrir',
          publish: 'Activer',
          unpublish: 'Désactiver',
          delete: 'Supprimer',
          confirmDelete:
            'Confirmer la suppression ? Cette action supprimera aussi le fichier Storage si disponible.',
          deleteSuccess: 'Vidéo supprimée avec succès.',
          statusSuccess: 'Statut mis à jour.',
          loadError: 'Erreur lors du chargement des vidéos.',
          deleteError: 'Erreur lors de la suppression.',
          statusError: 'Erreur lors de la mise à jour du statut.',
          storageWarning:
            'Document supprimé, mais le fichier Storage n’a pas pu être supprimé.',
          unknownTitle: 'Sans titre',
          unknownDate: 'Date inconnue',
          categories: {
            'general-medicine': 'Médecine générale',
            anatomy: 'Anatomie',
            physiology: 'Physiologie',
            pharmacology: 'Pharmacologie',
            pathology: 'Pathologie',
            cardiology: 'Cardiologie',
            dentistry: 'Dentaire',
            surgery: 'Chirurgie',
            clinical: 'Pratique clinique',
            technology: 'Technologie médicale',
            other: 'Autres',
          },
        },
        ar: {
          title: 'إدارة الفيديوهات',
          subtitle: 'إدارة الفيديوهات المرفوعة وروابط YouTube داخل المنصة.',
          addVideo: 'إضافة فيديو',
          refresh: 'تحديث',
          loading: 'جاري تحميل الفيديوهات...',
          noVideos: 'لا توجد فيديوهات',
          noResults: 'لا يوجد فيديو مطابق للبحث.',
          search: 'ابحث عن فيديو...',
          allCategories: 'كل الفئات',
          allTypes: 'كل الأنواع',
          upload: 'ملف مرفوع',
          youtube: 'YouTube',
          active: 'مفعل',
          inactive: 'غير مفعل',
          premium: 'مدفوع',
          free: 'مجاني',
          titleCol: 'الفيديو',
          categoryCol: 'الفئة',
          typeCol: 'النوع',
          statusCol: 'الحالة',
          dateCol: 'التاريخ',
          actionsCol: 'الإجراءات',
          open: 'فتح',
          publish: 'تفعيل',
          unpublish: 'تعطيل',
          delete: 'حذف',
          confirmDelete:
            'تأكيد الحذف؟ سيتم حذف ملف Storage أيضاً إذا كان متاحاً.',
          deleteSuccess: 'تم حذف الفيديو بنجاح.',
          statusSuccess: 'تم تحديث الحالة.',
          loadError: 'خطأ أثناء تحميل الفيديوهات.',
          deleteError: 'خطأ أثناء الحذف.',
          statusError: 'خطأ أثناء تحديث الحالة.',
          storageWarning:
            'تم حذف الوثيقة، لكن تعذر حذف ملف Storage.',
          unknownTitle: 'بدون عنوان',
          unknownDate: 'تاريخ غير معروف',
          categories: {
            'general-medicine': 'الطب العام',
            anatomy: 'علم التشريح',
            physiology: 'علم وظائف الأعضاء',
            pharmacology: 'علم الأدوية',
            pathology: 'علم الأمراض',
            cardiology: 'أمراض القلب',
            dentistry: 'طب الأسنان',
            surgery: 'الجراحة',
            clinical: 'الممارسة السريرية',
            technology: 'التكنولوجيا الطبية',
            other: 'أخرى',
          },
        },
      }[language] || {}),
    [language]
  );

  const getLocalizedText = useCallback(
    (value) => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      return value[language] || value.fr || value.ar || '';
    },
    [language]
  );

  const formatDate = useCallback(
    (value) => {
      if (!value) return t.unknownDate;

      let date;

      if (value?.toDate) {
        date = value.toDate();
      } else {
        date = new Date(value);
      }

      if (Number.isNaN(date.getTime())) return t.unknownDate;

      return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'ar-MA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
    [language, t.unknownDate]
  );

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const snapshot = await getDocs(collection(db, 'videos'));

      const videosList = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setVideos(videosList);
    } catch (err) {
      console.error('Fetch videos error:', err);
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const categories = useMemo(() => {
    const unique = new Set(videos.map((videoItem) => videoItem.category).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [videos]);

  const filteredVideos = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return videos.filter((videoItem) => {
      const title = getLocalizedText(videoItem.title).toLowerCase();
      const description = getLocalizedText(videoItem.description).toLowerCase();
      const category = videoItem.category || 'other';
      const type = videoItem.type || videoItem.fileType || 'upload';

      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        category.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        filteredCategory === 'all' || category === filteredCategory;

      const matchesType =
        filteredType === 'all' ||
        type === filteredType ||
        videoItem.fileType === filteredType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [
    videos,
    searchTerm,
    filteredCategory,
    filteredType,
    getLocalizedText,
  ]);

  const getStorageRefFromVideo = (videoItem) => {
    if (videoItem.storagePath) {
      return ref(storage, videoItem.storagePath);
    }

    if (
      videoItem.videoUrl &&
      typeof videoItem.videoUrl === 'string' &&
      videoItem.videoUrl.startsWith('gs://')
    ) {
      return ref(storage, videoItem.videoUrl);
    }

    return null;
  };

  const handleDelete = async (videoItem) => {
    const confirmed = window.confirm(t.confirmDelete);
    if (!confirmed) return;

    setActionLoadingId(videoItem.id);
    setError('');
    setSuccess('');

    try {
      const storageReference = getStorageRefFromVideo(videoItem);
      let storageDeleteFailed = false;

      if (storageReference && videoItem.type !== 'youtube') {
        try {
          await deleteObject(storageReference);
        } catch (storageError) {
          storageDeleteFailed = true;
          console.warn('Storage delete warning:', storageError);
        }
      }

      await deleteDoc(doc(db, 'videos', videoItem.id));

      setVideos((prev) => prev.filter((item) => item.id !== videoItem.id));

      setSuccess(
        storageDeleteFailed
          ? `${t.deleteSuccess} ${t.storageWarning}`
          : t.deleteSuccess
      );
    } catch (err) {
      console.error('Delete video error:', err);
      setError(t.deleteError);
    } finally {
      setActionLoadingId('');
    }
  };

  const toggleStatus = async (videoItem) => {
    setActionLoadingId(videoItem.id);
    setError('');
    setSuccess('');

    const currentStatus = videoItem.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      await updateDoc(doc(db, 'videos', videoItem.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });

      setVideos((prev) =>
        prev.map((item) =>
          item.id === videoItem.id ? { ...item, status: nextStatus } : item
        )
      );

      setSuccess(t.statusSuccess);
    } catch (err) {
      console.error('Update status error:', err);
      setError(t.statusError);
    } finally {
      setActionLoadingId('');
    }
  };

  const getVideoTypeLabel = (videoItem) => {
    const type = videoItem.type || videoItem.fileType;
    return type === 'youtube' ? t.youtube : t.upload;
  };

  const getVideoUrl = (videoItem) => {
    if (videoItem.type === 'youtube' && videoItem.youtubeId) {
      return `https://www.youtube.com/watch?v=${videoItem.youtubeId}`;
    }

    return `/videos/${videoItem.id}`;
  };

  return (
    <main
      className={`min-h-screen bg-gray-50 px-4 py-10 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Video className="h-8 w-8" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold">{t.title}</h1>
              <p className="mt-2 max-w-2xl text-blue-100">{t.subtitle}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={fetchVideos}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                {t.refresh}
              </button>

              <NavLink
                to="/admin/add-video"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
              >
                <Plus className="h-5 w-5" />
                {t.addVideo}
              </NavLink>
            </div>
          </div>
        </header>

        {(error || success) && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
              success
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
            role="alert"
          >
            {success ? (
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{success || error}</p>
          </div>
        )}

        <section className="mb-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${
                  isRTL ? 'right-4' : 'left-4'
                }`}
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t.search}
                className={`w-full rounded-2xl border border-gray-200 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                  isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'
                }`}
              />
            </div>

            <select
              value={filteredCategory}
              onChange={(event) => setFilteredCategory(event.target.value)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all'
                    ? t.allCategories
                    : t.categories[category] || category}
                </option>
              ))}
            </select>

            <select
              value={filteredType}
              onChange={(event) => setFilteredType(event.target.value)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">{t.allTypes}</option>
              <option value="upload">{t.upload}</option>
              <option value="youtube">{t.youtube}</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-gray-600">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="font-medium">{t.loading}</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <Video className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t.noVideos}</h2>
                <p className="mt-1 text-gray-500">{t.subtitle}</p>
              </div>
              <NavLink
                to="/admin/add-video"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                {t.addVideo}
              </NavLink>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center text-gray-600">
              <Search className="h-10 w-10 text-gray-400" />
              <p className="font-semibold">{t.noResults}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-6 py-4">{t.titleCol}</th>
                      <th className="px-6 py-4">{t.categoryCol}</th>
                      <th className="px-6 py-4">{t.typeCol}</th>
                      <th className="px-6 py-4">{t.statusCol}</th>
                      <th className="px-6 py-4">{t.dateCol}</th>
                      <th className="px-6 py-4 text-right">{t.actionsCol}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredVideos.map((videoItem) => {
                      const title = getLocalizedText(videoItem.title) || t.unknownTitle;
                      const isBusy = actionLoadingId === videoItem.id;
                      const isActive = (videoItem.status || 'active') === 'active';

                      return (
                        <tr key={videoItem.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                {videoItem.type === 'youtube' ? (
                                  <Youtube className="h-5 w-5" />
                                ) : (
                                  <Video className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{title}</p>
                                <ContentSemesterEditor collectionName="videos" item={videoItem} language={language} onUpdated={fetchVideos} />
                                <p className="line-clamp-1 max-w-xs text-xs text-gray-500">
                                  {getLocalizedText(videoItem.description)}
                                </p>
                                {videoItem.isPremium && (
                                  <span className="mt-1 inline-flex rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                    {t.premium}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-gray-700">
                            {t.categories[videoItem.category] || videoItem.category || '-'}
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                              {getVideoTypeLabel(videoItem)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                isActive
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {isActive ? t.active : t.inactive}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-gray-600">
                            {formatDate(videoItem.uploadedAt)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <a
                                href={getVideoUrl(videoItem)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
                                title={t.open}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>

                              <button
                                type="button"
                                onClick={() => toggleStatus(videoItem)}
                                disabled={isBusy}
                                className="rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                                title={isActive ? t.unpublish : t.publish}
                              >
                                {isActive ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(videoItem)}
                                disabled={isBusy}
                                className="rounded-xl border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                title={t.delete}
                              >
                                {isBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-100 md:hidden">
                {filteredVideos.map((videoItem) => {
                  const title = getLocalizedText(videoItem.title) || t.unknownTitle;
                  const isBusy = actionLoadingId === videoItem.id;
                  const isActive = (videoItem.status || 'active') === 'active';

                  return (
                    <article key={videoItem.id} className="p-5">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          {videoItem.type === 'youtube' ? (
                            <Youtube className="h-6 w-6" />
                          ) : (
                            <Video className="h-6 w-6" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="font-bold text-gray-900">{title}</h2>
                          <ContentSemesterEditor collectionName="videos" item={videoItem} language={language} onUpdated={fetchVideos} />
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {getLocalizedText(videoItem.description)}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                          {t.categories[videoItem.category] || videoItem.category || '-'}
                        </span>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                          {getVideoTypeLabel(videoItem)}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 ${
                            isActive
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isActive ? t.active : t.inactive}
                        </span>
                        {videoItem.isPremium && (
                          <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">
                            {t.premium}
                          </span>
                        )}
                      </div>

                      <p className="mb-4 text-xs text-gray-500">
                        {formatDate(videoItem.uploadedAt)}
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        <a
                          href={getVideoUrl(videoItem)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {t.open}
                        </a>

                        <button
                          type="button"
                          onClick={() => toggleStatus(videoItem)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
                        >
                          {isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          {isActive ? t.unpublish : t.publish}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(videoItem)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {t.delete}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminVideos;
