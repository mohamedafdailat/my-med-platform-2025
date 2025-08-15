import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Info } from 'lucide-react';

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const privacyText = {
    fr: {
      title: 'Politique de confidentialité',
      lastUpdated: 'Dernière mise à jour : 4 août 2025',
      intro: {
        title: 'Introduction',
        content:
          'Chez MedPlatform Maroc, nous nous engageons à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles.',
      },
      dataCollection: {
        title: 'Collecte des données',
        content:
          'Nous collectons des informations telles que votre nom, adresse e-mail, et données de navigation lorsque vous utilisez notre plateforme. Ces données sont collectées via des formulaires d’inscription, des interactions avec notre site, et des cookies.',
      },
      dataUsage: {
        title: 'Utilisation des données',
        content:
          'Vos données sont utilisées pour personnaliser votre expérience, fournir des services éducatifs, et améliorer notre plateforme. Nous pouvons également utiliser ces données pour vous envoyer des newsletters ou des mises à jour, avec votre consentement.',
      },
      dataSharing: {
        title: 'Partage des données',
        content:
          'Nous ne partageons vos informations personnelles qu’avec des partenaires de confiance pour fournir nos services (par exemple, processeurs de paiement). Nous ne vendons jamais vos données à des tiers.',
      },
      userRights: {
        title: 'Vos droits',
        content:
          'Vous avez le droit d’accéder, de corriger, de supprimer ou de limiter l’utilisation de vos données personnelles. Contactez-nous à contact@medplatform.ma pour exercer ces droits.',
      },
      contact: {
        title: 'Contactez-nous',
        content:
          'Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à :',
        email: 'Email : contact@medplatform.ma',
        phone: 'Téléphone : +212 6 46 56 97 88',
      },
    },
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث: 4 أغسطس 2025',
      intro: {
        title: 'المقدمة',
        content:
          'في منصة ميدبلانتفورم المغرب، نحن ملتزمون بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمعنا لمعلوماتك الشخصية واستخدامها ومشاركتها وحمايتها.',
      },
      dataCollection: {
        title: 'جمع البيانات',
        content:
          'نجمع معلومات مثل اسمك، عنوان بريدك الإلكتروني، وبيانات التصفح عند استخدامك لمنصتنا. يتم جمع هذه البيانات من خلال نماذج التسجيل، التفاعلات مع موقعنا، وملفات تعريف الارتباط (الكوكيز).',
      },
      dataUsage: {
        title: 'استخدام البيانات',
        content:
          'تُستخدم بياناتك لتخصيص تجربتك، تقديم خدمات تعليمية، وتحسين منصتنا. يمكننا أيضًا استخدام هذه البيانات لإرسال نشرات إخبارية أو تحديثات بموافقتك.',
      },
      dataSharing: {
        title: 'مشاركة البيانات',
        content:
          'لا نشارك معلوماتك الشخصية إلا مع شركاء موثوقين لتقديم خدماتنا (مثل معالجي الدفع). لا نبيع بياناتك أبدًا لأطراف ثالثة.',
      },
      userRights: {
        title: 'حقوقك',
        content:
          'لك الحق في الوصول إلى بياناتك الشخصية، تصحيحها، حذفها، أو تقييد استخدامها. تواصل معنا على contact@medplatform.ma لممارسة هذه الحقوق.',
      },
      contact: {
        title: 'اتصل بنا',
        content: 'لأي استفسارات حول سياسة الخصوصية هذه، يرجى التواصل معنا على:',
        email: 'البريد الإلكتروني: contact@medplatform.ma',
        phone: 'الهاتف: +212 6 46 56 97 88',
      },
    },
  };

  const t = privacyText[language] || privacyText.fr;

  return (
    <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
      <h1 className="text-3xl font-bold text-gray-900 mb-4 animate-fade-in flex items-center gap-2">
        <Info className="w-8 h-8 text-blue-600" aria-hidden="true" />
        {t.title}
      </h1>
      <p className="text-sm text-gray-500 mb-8">{t.lastUpdated}</p>

      <section className="space-y-8">
        {/* Introduction */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">{t.intro.title}</h2>
          <p className="text-gray-600 leading-relaxed">{t.intro.content}</p>
        </div>

        {/* Data Collection */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">{t.dataCollection.title}</h2>
          <p className="text-gray-600 leading-relaxed">{t.dataCollection.content}</p>
        </div>

        {/* Data Usage */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">{t.dataUsage.title}</h2>
          <p className="text-gray-600 leading-relaxed">{t.dataUsage.content}</p>
        </div>

        {/* Data Sharing */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">{t.dataSharing.title}</h2>
          <p className="text-gray-600 leading-relaxed">{t.dataSharing.content}</p>
        </div>

        {/* User Rights */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">{t.userRights.title}</h2>
          <p className="text-gray-600 leading-relaxed">{t.userRights.content}</p>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">{t.contact.title}</h2>
          <p className="text-gray-600 leading-relaxed">{t.contact.content}</p>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <a
              href="mailto:contact@medplatform.ma"
              className="text-blue-600 hover:underline"
              aria-label={t.contact.email}
            >
              {t.contact.email}
            </a>
          </p>
          <p className="text-gray-600 mt-2 flex items-center gap-2">{t.contact.phone}</p>
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
          aria-label={language === 'fr' ? 'Retour à l’accueil' : 'العودة إلى الصفحة الرئيسية'}
        >
          {language === 'fr' ? 'Retour à l’accueil' : 'العودة إلى الصفحة الرئيسية'}
        </Link>
      </div>
    </main>
  );
};

export default PrivacyPolicy;