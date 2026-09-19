// C:\my-med-platform\frontend\src\pages\AdminDashboard.js

import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Users,
  BookOpen,
  HelpCircle,
  Layers,
  FileText,
  PlusCircle,
  Settings,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';

const AdminDashboard = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const t = {
    fr: {
      title: 'Tableau de bord Admin',
      subtitle:
        'Gérez les contenus, les utilisateurs, les vidéos, les cours et les outils pédagogiques de MedPlatform Maroc.',
      quickActions: 'Actions rapides',
      contentManagement: 'Gestion du contenu',
      platformManagement: 'Gestion de la plateforme',
      open: 'Ouvrir',
      statsTitle: 'Vue d’ensemble',
      stats: {
        content: 'Contenus pédagogiques',
        users: 'Gestion utilisateurs',
        security: 'Accès administrateur',
      },
      cards: {
        addVideo: {
          title: 'Ajouter une vidéo',
          description: 'Importer une vidéo ou ajouter un lien YouTube.',
        },
        videos: {
          title: 'Gérer les vidéos',
          description: 'Consulter, supprimer ou organiser les vidéos.',
        },
        courses: {
          title: 'Gérer les cours',
          description: 'Ajouter des cours, PDF, catégories et niveaux.',
        },
        addFlashcards: {
          title: 'Ajouter des flashcards',
          description: 'Créer des cartes de révision manuelles.',
        },
        flashcards: {
          title: 'Gérer les flashcards',
          description: 'Consulter et organiser les flashcards existantes.',
        },
        qcms: {
          title: 'Gérer les QCMs',
          description: 'Administrer les quiz et évaluations.',
        },
        users: {
          title: 'Gérer les utilisateurs',
          description: 'Suivre les comptes, rôles et abonnements.',
        },
        settings: {
          title: 'Paramètres admin',
          description: 'Configurer les paramètres de la plateforme.',
        },
      },
      backHome: 'Retour à l’accueil',
    },
    ar: {
      title: 'لوحة التحكم الإدارية',
      subtitle:
        'إدارة المحتوى، المستخدمين، الفيديوهات، الدروس والأدوات التعليمية في MedPlatform Maroc.',
      quickActions: 'إجراءات سريعة',
      contentManagement: 'إدارة المحتوى',
      platformManagement: 'إدارة المنصة',
      open: 'فتح',
      statsTitle: 'نظرة عامة',
      stats: {
        content: 'محتوى تعليمي',
        users: 'إدارة المستخدمين',
        security: 'صلاحيات الإدارة',
      },
      cards: {
        addVideo: {
          title: 'إضافة فيديو',
          description: 'رفع فيديو أو إضافة رابط YouTube.',
        },
        videos: {
          title: 'إدارة الفيديوهات',
          description: 'عرض، حذف أو تنظيم الفيديوهات.',
        },
        courses: {
          title: 'إدارة الدروس',
          description: 'إضافة دروس، ملفات PDF، فئات ومستويات.',
        },
        addFlashcards: {
          title: 'إضافة بطاقات تعليمية',
          description: 'إنشاء بطاقات مراجعة يدوياً.',
        },
        flashcards: {
          title: 'إدارة البطاقات التعليمية',
          description: 'عرض وتنظيم البطاقات الموجودة.',
        },
        qcms: {
          title: 'إدارة الاختبارات',
          description: 'إدارة الاختبارات والتقييمات.',
        },
        users: {
          title: 'إدارة المستخدمين',
          description: 'متابعة الحسابات، الأدوار والاشتراكات.',
        },
        settings: {
          title: 'إعدادات الإدارة',
          description: 'تكوين إعدادات المنصة.',
        },
      },
      backHome: 'العودة إلى الرئيسية',
    },
  }[language];

  const quickActions = [
    {
      key: 'addVideo',
      to: '/admin/add-video',
      icon: PlusCircle,
      color: 'from-blue-600 to-indigo-700',
    },
    {
      key: 'courses',
      to: '/admin/courses',
      icon: BookOpen,
      color: 'from-emerald-600 to-teal-700',
    },
    {
      key: 'addFlashcards',
      to: '/admin/add-flashcards',
      icon: Layers,
      color: 'from-purple-600 to-fuchsia-700',
    },
    {
      key: 'qcms',
      to: '/admin/qcms',
      icon: HelpCircle,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const contentLinks = [
    {
      key: 'videos',
      to: '/admin/videos',
      icon: Video,
    },
    {
      key: 'courses',
      to: '/admin/courses',
      icon: BookOpen,
    },
    {
      key: 'flashcards',
      to: '/admin/flashcards',
      icon: FileText,
    },
    {
      key: 'qcms',
      to: '/admin/qcms',
      icon: HelpCircle,
    },
  ];

  const platformLinks = [
    {
      key: 'users',
      to: '/admin/users',
      icon: Users,
    },
    {
      key: 'settings',
      to: '/admin/settings',
      icon: Settings,
    },
  ];

  const StatCard = ({ icon: Icon, label, value }) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );

  const ActionCard = ({ item }) => {
    const Icon = item.icon;
    const content = t.cards[item.key];

    return (
      <Link
        to={item.to}
        className={`group rounded-3xl bg-gradient-to-br ${item.color} p-6 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Icon className="h-7 w-7" />
          </div>
          <ArrowRight
            className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
              isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''
            }`}
          />
        </div>

        <h3 className="text-xl font-bold">{content.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/85">
          {content.description}
        </p>
      </Link>
    );
  };

  const LinkRow = ({ item }) => {
    const Icon = item.icon;
    const content = t.cards[item.key];

    return (
      <Link
        to={item.to}
        className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-700">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{content.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{content.description}</p>
          </div>
        </div>

        <span className="hidden rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 group-hover:bg-blue-600 group-hover:text-white sm:inline-flex">
          {t.open}
        </span>
      </Link>
    );
  };

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </div>

              <h1 className="text-3xl font-bold md:text-5xl">{t.title}</h1>
              <p className="mt-4 max-w-3xl text-blue-100">{t.subtitle}</p>
            </div>

            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10">
              <LayoutDashboard className="h-14 w-14 text-white/90" />
            </div>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            {t.statsTitle}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard icon={BookOpen} value="Cours / Quiz" label={t.stats.content} />
            <StatCard icon={Users} value="Users" label={t.stats.users} />
            <StatCard icon={ShieldCheck} value="Admin" label={t.stats.security} />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            {t.quickActions}
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((item) => (
              <ActionCard key={item.key} item={item} />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              {t.contentManagement}
            </h2>

            <div className="space-y-4">
              {contentLinks.map((item) => (
                <LinkRow key={item.key} item={item} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              {t.platformManagement}
            </h2>

            <div className="space-y-4">
              {platformLinks.map((item) => (
                <LinkRow key={item.key} item={item} />
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <h3 className="font-bold text-blue-900">
                {language === 'fr'
                  ? 'Conseil admin'
                  : 'نصيحة للمسؤول'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-blue-700">
                {language === 'fr'
                  ? 'Ajoutez d’abord les cours et vidéos, puis reliez-les aux quiz et flashcards pour créer un parcours pédagogique complet.'
                  : 'أضف الدروس والفيديوهات أولاً، ثم اربطها بالاختبارات والبطاقات التعليمية لإنشاء مسار تعليمي متكامل.'}
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            {t.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;