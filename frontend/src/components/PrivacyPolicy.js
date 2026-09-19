import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Info,
  ShieldCheck,
  Database,
  Cookie,
  Mail,
  Phone,
  Lock,
  UserCheck,
  Share2,
  ArrowLeft,
  FileText,
} from 'lucide-react';

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const privacyText = {
    fr: {
      title: 'Politique de confidentialité',
      subtitle:
        'Nous protégeons vos données personnelles et expliquons clairement comment elles sont utilisées sur MedPlatform Maroc.',
      lastUpdated: 'Dernière mise à jour : 4 août 2025',
      backHome: 'Retour à l’accueil',
      summaryTitle: 'En résumé',
      summaryItems: [
        'Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme.',
        'Vos données servent à gérer votre compte, votre progression et vos services éducatifs.',
        'Nous ne vendons jamais vos données personnelles.',
        'Vous pouvez demander l’accès, la correction ou la suppression de vos données.',
      ],
      sections: [
        {
          id: 'intro',
          icon: Info,
          title: 'Introduction',
          content:
            'Chez MedPlatform Maroc, nous nous engageons à protéger votre vie privée. Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme.',
        },
        {
          id: 'dataCollection',
          icon: Database,
          title: 'Données collectées',
          content:
            'Nous pouvons collecter des informations telles que votre nom, votre adresse e-mail, votre rôle utilisateur, votre semestre, vos données de progression, vos quiz, vos flashcards, vos interactions avec les cours, ainsi que certaines données techniques nécessaires au bon fonctionnement du service.',
        },
        {
          id: 'dataUsage',
          icon: UserCheck,
          title: 'Utilisation des données',
          content:
            'Vos données sont utilisées pour créer et gérer votre compte, personnaliser votre expérience, suivre votre progression, générer des contenus pédagogiques, fournir les fonctionnalités de la plateforme, améliorer nos services et communiquer avec vous si nécessaire.',
        },
        {
          id: 'cookies',
          icon: Cookie,
          title: 'Cookies et données techniques',
          content:
            'La plateforme peut utiliser des cookies ou technologies similaires pour maintenir votre session, améliorer la sécurité, mesurer l’usage de la plateforme et optimiser l’expérience utilisateur. Vous pouvez gérer certains paramètres depuis votre navigateur.',
        },
        {
          id: 'sharing',
          icon: Share2,
          title: 'Partage des données',
          content:
            'Nous ne vendons jamais vos données personnelles. Certaines données peuvent être partagées uniquement avec des prestataires techniques de confiance, par exemple pour l’hébergement, l’authentification, la base de données, le paiement ou les services nécessaires à la plateforme.',
        },
        {
          id: 'security',
          icon: Lock,
          title: 'Sécurité des données',
          content:
            'Nous mettons en place des mesures techniques et organisationnelles raisonnables pour protéger vos informations contre l’accès non autorisé, la perte, l’altération ou la divulgation. Cependant, aucun système numérique ne peut garantir une sécurité absolue.',
        },
        {
          id: 'rights',
          icon: ShieldCheck,
          title: 'Vos droits',
          content:
            'Vous pouvez demander l’accès à vos données personnelles, leur correction, leur suppression, la limitation de leur traitement ou vous opposer à certains usages. Pour exercer ces droits, contactez-nous à contact@medplatform.ma.',
        },
        {
          id: 'retention',
          icon: FileText,
          title: 'Conservation des données',
          content:
            'Nous conservons vos données uniquement pendant la durée nécessaire à la fourniture de nos services, au respect de nos obligations légales ou à la résolution d’éventuels litiges. Certaines données peuvent être supprimées ou anonymisées lorsque votre compte est clôturé.',
        },
      ],
      contact: {
        title: 'Contact',
        content:
          'Pour toute question concernant cette politique de confidentialité ou l’exercice de vos droits, vous pouvez nous contacter :',
        emailLabel: 'Email',
        email: 'contact@medplatform.ma',
        phoneLabel: 'Téléphone',
        phone: '+212 6 46 56 97 88',
      },
    },
    ar: {
      title: 'سياسة الخصوصية',
      subtitle:
        'نحمي بياناتك الشخصية ونوضح لك بطريقة شفافة كيفية استخدامها على منصة MedPlatform Maroc.',
      lastUpdated: 'آخر تحديث: 4 أغسطس 2025',
      backHome: 'العودة إلى الصفحة الرئيسية',
      summaryTitle: 'باختصار',
      summaryItems: [
        'نجمع فقط البيانات الضرورية لتشغيل المنصة.',
        'تُستخدم بياناتك لإدارة حسابك وتتبع تقدمك وتقديم الخدمات التعليمية.',
        'لا نبيع بياناتك الشخصية أبدًا.',
        'يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها.',
      ],
      sections: [
        {
          id: 'intro',
          icon: Info,
          title: 'المقدمة',
          content:
            'في MedPlatform Maroc، نلتزم بحماية خصوصيتك. توضح هذه السياسة كيفية جمع معلوماتك الشخصية واستخدامها وتخزينها وحمايتها عند استخدامك للمنصة.',
        },
        {
          id: 'dataCollection',
          icon: Database,
          title: 'البيانات التي نجمعها',
          content:
            'قد نجمع معلومات مثل الاسم، البريد الإلكتروني، نوع المستخدم، الفصل الدراسي، بيانات التقدم، الاختبارات، البطاقات التعليمية، التفاعل مع الدروس، وبعض البيانات التقنية الضرورية لتشغيل الخدمة بشكل صحيح.',
        },
        {
          id: 'dataUsage',
          icon: UserCheck,
          title: 'استخدام البيانات',
          content:
            'تُستخدم بياناتك لإنشاء حسابك وإدارته، تخصيص تجربتك، تتبع تقدمك، إنشاء محتوى تعليمي، توفير وظائف المنصة، تحسين خدماتنا والتواصل معك عند الحاجة.',
        },
        {
          id: 'cookies',
          icon: Cookie,
          title: 'ملفات تعريف الارتباط والبيانات التقنية',
          content:
            'قد تستخدم المنصة ملفات تعريف الارتباط أو تقنيات مشابهة للحفاظ على جلسة الدخول، تحسين الأمان، قياس استخدام المنصة وتحسين تجربة المستخدم. يمكنك إدارة بعض الإعدادات من خلال المتصفح.',
        },
        {
          id: 'sharing',
          icon: Share2,
          title: 'مشاركة البيانات',
          content:
            'لا نبيع بياناتك الشخصية أبدًا. قد تتم مشاركة بعض البيانات فقط مع مزودي خدمات موثوقين، مثل خدمات الاستضافة، المصادقة، قواعد البيانات، الدفع أو الخدمات الضرورية لتشغيل المنصة.',
        },
        {
          id: 'security',
          icon: Lock,
          title: 'أمان البيانات',
          content:
            'نطبق إجراءات تقنية وتنظيمية معقولة لحماية معلوماتك من الوصول غير المصرح به أو الفقدان أو التعديل أو الإفصاح. ومع ذلك، لا يمكن لأي نظام رقمي ضمان أمان مطلق.',
        },
        {
          id: 'rights',
          icon: ShieldCheck,
          title: 'حقوقك',
          content:
            'يمكنك طلب الوصول إلى بياناتك الشخصية، تصحيحها، حذفها، تقييد معالجتها أو الاعتراض على بعض الاستخدامات. لممارسة هذه الحقوق، تواصل معنا عبر contact@medplatform.ma.',
        },
        {
          id: 'retention',
          icon: FileText,
          title: 'مدة الاحتفاظ بالبيانات',
          content:
            'نحتفظ ببياناتك فقط للمدة اللازمة لتقديم خدماتنا، احترام الالتزامات القانونية أو حل النزاعات المحتملة. يمكن حذف بعض البيانات أو إخفاء هويتها عند إغلاق الحساب.',
        },
      ],
      contact: {
        title: 'التواصل معنا',
        content:
          'لأي سؤال بخصوص سياسة الخصوصية أو ممارسة حقوقك، يمكنك التواصل معنا عبر:',
        emailLabel: 'البريد الإلكتروني',
        email: 'contact@medplatform.ma',
        phoneLabel: 'الهاتف',
        phone: '+212 6 46 56 97 88',
      },
    },
  };

  const t = privacyText[language] || privacyText.fr;

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium transition-colors"
              aria-label={t.backHome}
            >
              <ArrowLeft
                className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
              {t.backHome}
            </Link>
          </div>

          <header className="bg-white border border-blue-100 rounded-3xl shadow-sm p-8 sm:p-10 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shrink-0">
                <ShieldCheck className="w-8 h-8" aria-hidden="true" />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-700 mb-2">
                  MedPlatform Maroc
                </p>

                <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-4">
                  {t.title}
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                  {t.subtitle}
                </p>

                <p className="text-sm text-gray-500 mt-5">{t.lastUpdated}</p>
              </div>
            </div>
          </header>

          <section className="bg-blue-600 text-white rounded-3xl shadow-lg p-7 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <Info className="w-6 h-6" aria-hidden="true" />
              <h2 className="text-2xl font-bold">{t.summaryTitle}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.summaryItems.map((item, index) => (
                <div
                  key={`summary-${index}`}
                  className="bg-white/10 border border-white/20 rounded-2xl p-4"
                >
                  <p className="leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.sections.map((section) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.id}
                  className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 pt-2">
                      {section.title}
                    </h2>
                  </div>

                  <p className="text-gray-600 leading-relaxed">
                    {section.content}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-8 bg-white border border-gray-100 rounded-3xl shadow-sm p-7 sm:p-8">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" aria-hidden="true" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t.contact.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {t.contact.content}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <a
                href={`mailto:${t.contact.email}`}
                className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-800 hover:bg-blue-100 transition-colors"
                aria-label={`${t.contact.emailLabel}: ${t.contact.email}`}
              >
                <Mail className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="block">{t.contact.emailLabel}</strong>
                  {t.contact.email}
                </span>
              </a>

              <a
                href={`tel:${t.contact.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-800 hover:bg-blue-100 transition-colors"
                aria-label={`${t.contact.phoneLabel}: ${t.contact.phone}`}
              >
                <Phone className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="block">{t.contact.phoneLabel}</strong>
                  {t.contact.phone}
                </span>
              </a>
            </div>
          </section>

          <div className="mt-10 text-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              aria-label={t.backHome}
            >
              {t.backHome}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PrivacyPolicy;