import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  FileText,
  BookOpen,
  CreditCard,
  ShieldCheck,
  UserCheck,
  Scale,
  AlertTriangle,
  RefreshCcw,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  CheckCircle,
  Lock,
} from 'lucide-react';

const Terms = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const content = {
    fr: {
      title: 'Termes et Conditions',
      subtitle:
        'Ces conditions encadrent l’utilisation de MedPlatform Maroc, de ses cours, quiz, vidéos, flashcards et services numériques.',
      lastUpdated: 'Dernière mise à jour : 25 juin 2025',
      backHome: 'Retour à l’accueil',
      backSubscription: 'Retour à l’abonnement',
      contactUs: 'Nous contacter',
      summaryTitle: 'Points essentiels',
      summaryItems: [
        'La plateforme est destinée à l’apprentissage médical et à la révision.',
        'Le contenu proposé est éducatif et ne remplace pas un avis médical professionnel.',
        'Votre compte est personnel et ne doit pas être partagé.',
        'Les contenus ne peuvent pas être copiés, revendus ou redistribués sans autorisation.',
      ],
      sections: [
        {
          id: 'intro',
          icon: FileText,
          title: '1. Introduction',
          paragraphs: [
            <>
              Bienvenue sur <strong>MedPlatform Maroc</strong>. Ces termes et conditions régissent votre utilisation de notre plateforme d’apprentissage médical. En accédant à nos services, vous acceptez ces conditions dans leur intégralité.
            </>,
          ],
        },
        {
          id: 'definitions',
          icon: BookOpen,
          title: '2. Définitions',
          list: [
            <><strong>Plateforme :</strong> le site web, l’application et les services MedPlatform Maroc.</>,
            <><strong>Services :</strong> les cours, vidéos, quiz, flashcards, tableaux de bord, outils IA et fonctionnalités associées.</>,
            <><strong>Utilisateur :</strong> toute personne qui accède à la plateforme ou crée un compte.</>,
            <><strong>Contenu Premium :</strong> contenu réservé aux utilisateurs disposant d’un abonnement actif ou d’un accès autorisé.</>,
          ],
        },
        {
          id: 'access',
          icon: UserCheck,
          title: '3. Utilisation des services',
          paragraphs: [
            'La plateforme est destinée aux étudiants en médecine, professionnels de santé, enseignants ou personnes ayant un intérêt légitime pour l’apprentissage médical.',
            'Vous vous engagez à utiliser la plateforme de manière légale, respectueuse et conforme à sa finalité éducative.',
          ],
          list: [
            'Vous êtes responsable de la confidentialité de vos identifiants.',
            'Un seul compte par personne est autorisé, sauf accord spécifique.',
            'Les informations fournies lors de l’inscription doivent être exactes et à jour.',
            'Toute tentative d’accès non autorisé, de fraude ou de contournement technique est interdite.',
          ],
        },
        {
          id: 'subscription',
          icon: CreditCard,
          title: '4. Abonnements et paiements',
          paragraphs: [
            'Certains services peuvent nécessiter un abonnement payant ou un accès premium. Les prix, durées et fonctionnalités incluses sont affichés sur la page d’abonnement.',
            'Les abonnements peuvent être mensuels, annuels ou proposés sous d’autres formules selon les offres disponibles.',
          ],
          list: [
            'Les paiements doivent être effectués via les moyens proposés sur la plateforme.',
            'Le renouvellement automatique peut s’appliquer si cela est indiqué au moment de l’achat.',
            'Vous pouvez demander l’annulation selon les modalités indiquées dans votre espace utilisateur ou auprès du support.',
            'Les demandes de remboursement sont étudiées selon la politique affichée au moment de l’achat et l’usage effectif du service.',
          ],
        },
        {
          id: 'intellectualProperty',
          icon: Lock,
          title: '5. Propriété intellectuelle',
          paragraphs: [
            'Les cours, vidéos, quiz, documents, textes, interfaces, logos et autres éléments de la plateforme sont protégés par les droits de propriété intellectuelle.',
          ],
          list: [
            'Il est interdit de copier, vendre, redistribuer ou publier le contenu sans autorisation.',
            'Le partage de compte entre plusieurs utilisateurs est interdit.',
            'L’utilisation du contenu est limitée à un usage personnel, pédagogique et non commercial.',
            'Toute reproduction massive, extraction automatisée ou diffusion externe est interdite.',
          ],
        },
        {
          id: 'educationalContent',
          icon: AlertTriangle,
          title: '6. Contenu médical et responsabilité',
          paragraphs: [
            'Les informations disponibles sur MedPlatform Maroc sont fournies à des fins éducatives uniquement. Elles ne constituent pas un diagnostic, une prescription ou un avis médical personnalisé.',
            'En cas de situation médicale réelle, vous devez consulter un professionnel de santé qualifié. La plateforme ne remplace pas l’enseignement officiel, la supervision clinique ou la décision médicale professionnelle.',
          ],
        },
        {
          id: 'ai',
          icon: ShieldCheck,
          title: '7. Fonctionnalités IA',
          paragraphs: [
            'Certaines fonctionnalités peuvent utiliser l’intelligence artificielle pour générer des quiz, flashcards, explications ou réponses pédagogiques.',
            'Les contenus générés par IA peuvent contenir des erreurs ou imprécisions. Vous devez toujours vérifier les informations importantes avec des sources fiables, vos enseignants ou des références médicales reconnues.',
          ],
        },
        {
          id: 'termination',
          icon: Scale,
          title: '8. Suspension ou résiliation',
          paragraphs: [
            'Nous nous réservons le droit de suspendre ou de résilier un compte en cas de non-respect de ces conditions, d’usage abusif, de fraude, de partage non autorisé de compte ou d’atteinte à la sécurité de la plateforme.',
          ],
        },
        {
          id: 'changes',
          icon: RefreshCcw,
          title: '9. Modification des conditions',
          paragraphs: [
            'Nous pouvons modifier ces termes à tout moment afin de tenir compte de l’évolution de nos services, de nos obligations légales ou de nos pratiques internes.',
            'En cas de changement important, les utilisateurs peuvent être informés par email, notification ou message affiché sur la plateforme.',
          ],
        },
      ],
      acceptance:
        'En continuant à utiliser nos services, vous confirmez avoir lu, compris et accepté ces termes et conditions.',
      contact: {
        title: 'Contact',
        intro: 'Pour toute question concernant ces termes et conditions, vous pouvez nous contacter :',
        emailLabel: 'Email',
        email: 'support@medplatform.ma',
        phoneLabel: 'Téléphone',
        phone: '+212 6 46 56 97 88',
        addressLabel: 'Adresse',
        address: 'Casablanca, Maroc',
      },
    },
    ar: {
      title: 'الشروط والأحكام',
      subtitle:
        'تنظم هذه الشروط استخدام MedPlatform Maroc وخدماتها التعليمية، بما في ذلك الدروس والاختبارات والفيديوهات والبطاقات التعليمية.',
      lastUpdated: 'آخر تحديث: 25 يونيو 2025',
      backHome: 'العودة إلى الصفحة الرئيسية',
      backSubscription: 'العودة إلى الاشتراك',
      contactUs: 'تواصل معنا',
      summaryTitle: 'النقاط الأساسية',
      summaryItems: [
        'المنصة مخصصة للتعلم الطبي والمراجعة.',
        'المحتوى تعليمي ولا يعوض الاستشارة الطبية المهنية.',
        'حسابك شخصي ولا يجب مشاركته مع الآخرين.',
        'لا يجوز نسخ أو بيع أو إعادة نشر المحتوى دون ترخيص.',
      ],
      sections: [
        {
          id: 'intro',
          icon: FileText,
          title: '1. مقدمة',
          paragraphs: [
            <>
              مرحبًا بكم في <strong>MedPlatform Maroc</strong>. تنظم هذه الشروط والأحكام استخدامكم لمنصتنا التعليمية الطبية. باستخدامكم لخدماتنا، فإنكم توافقون على الالتزام بهذه الشروط كاملة.
            </>,
          ],
        },
        {
          id: 'definitions',
          icon: BookOpen,
          title: '2. التعاريف',
          list: [
            <><strong>المنصة:</strong> الموقع الإلكتروني والتطبيق وخدمات MedPlatform Maroc.</>,
            <><strong>الخدمات:</strong> الدروس، الفيديوهات، الاختبارات، البطاقات التعليمية، لوحة التحكم، أدوات الذكاء الاصطناعي والوظائف المرتبطة بها.</>,
            <><strong>المستخدم:</strong> أي شخص يصل إلى المنصة أو ينشئ حسابًا.</>,
            <><strong>المحتوى المميز:</strong> محتوى مخصص للمستخدمين الذين لديهم اشتراك نشط أو وصول مصرح به.</>,
          ],
        },
        {
          id: 'access',
          icon: UserCheck,
          title: '3. استخدام الخدمات',
          paragraphs: [
            'المنصة موجهة لطلاب الطب، مهنيي الصحة، الأساتذة أو الأشخاص الذين لديهم اهتمام مشروع بالتعلم الطبي.',
            'تتعهدون باستخدام المنصة بطريقة قانونية ومحترمة ومتوافقة مع هدفها التعليمي.',
          ],
          list: [
            'أنتم مسؤولون عن سرية بيانات تسجيل الدخول الخاصة بكم.',
            'يسمح بحساب واحد فقط لكل شخص، ما لم يتم الاتفاق على خلاف ذلك.',
            'يجب أن تكون المعلومات المقدمة أثناء التسجيل صحيحة ومحدثة.',
            'يُمنع أي وصول غير مصرح به أو احتيال أو محاولة تجاوز تقني.',
          ],
        },
        {
          id: 'subscription',
          icon: CreditCard,
          title: '4. الاشتراكات والمدفوعات',
          paragraphs: [
            'قد تتطلب بعض الخدمات اشتراكًا مدفوعًا أو وصولًا مميزًا. يتم عرض الأسعار والمدة والميزات المتاحة في صفحة الاشتراك.',
            'قد تكون الاشتراكات شهرية أو سنوية أو وفق عروض أخرى حسب الخدمات المتوفرة.',
          ],
          list: [
            'يجب أن تتم المدفوعات عبر الوسائل المتاحة على المنصة.',
            'قد يتم تطبيق التجديد التلقائي إذا تم توضيح ذلك عند الشراء.',
            'يمكنكم طلب الإلغاء حسب الشروط الموضحة في حسابكم أو عبر الدعم.',
            'تتم دراسة طلبات الاسترداد حسب السياسة المعروضة وقت الشراء ومدى استخدام الخدمة.',
          ],
        },
        {
          id: 'intellectualProperty',
          icon: Lock,
          title: '5. الملكية الفكرية',
          paragraphs: [
            'الدروس والفيديوهات والاختبارات والوثائق والنصوص والواجهات والشعارات وجميع عناصر المنصة محمية بموجب حقوق الملكية الفكرية.',
          ],
          list: [
            'يُمنع نسخ أو بيع أو إعادة توزيع أو نشر المحتوى دون ترخيص.',
            'يُمنع مشاركة الحساب بين عدة مستخدمين.',
            'يقتصر استخدام المحتوى على الاستعمال الشخصي والتعليمي وغير التجاري.',
            'يُمنع الاستخراج الآلي أو النسخ الجماعي أو النشر الخارجي للمحتوى.',
          ],
        },
        {
          id: 'educationalContent',
          icon: AlertTriangle,
          title: '6. المحتوى الطبي والمسؤولية',
          paragraphs: [
            'المعلومات المتاحة على MedPlatform Maroc تقدم لأغراض تعليمية فقط. ولا تعتبر تشخيصًا أو وصفة علاجية أو رأيًا طبيًا شخصيًا.',
            'في حالة وجود حالة طبية حقيقية، يجب استشارة مهني صحي مؤهل. المنصة لا تعوض التعليم الرسمي أو الإشراف السريري أو القرار الطبي المهني.',
          ],
        },
        {
          id: 'ai',
          icon: ShieldCheck,
          title: '7. وظائف الذكاء الاصطناعي',
          paragraphs: [
            'قد تستخدم بعض الميزات الذكاء الاصطناعي لإنشاء اختبارات أو بطاقات تعليمية أو شروحات أو إجابات تعليمية.',
            'قد تحتوي المحتويات المولدة بالذكاء الاصطناعي على أخطاء أو نقص في الدقة. يجب دائمًا التحقق من المعلومات المهمة من مصادر موثوقة أو من الأساتذة أو المراجع الطبية المعتمدة.',
          ],
        },
        {
          id: 'termination',
          icon: Scale,
          title: '8. التعليق أو الإنهاء',
          paragraphs: [
            'نحتفظ بالحق في تعليق أو إنهاء الحساب في حالة مخالفة هذه الشروط، أو الاستخدام المسيء، أو الاحتيال، أو مشاركة الحساب بشكل غير مصرح به، أو الإضرار بأمن المنصة.',
          ],
        },
        {
          id: 'changes',
          icon: RefreshCcw,
          title: '9. تعديل الشروط',
          paragraphs: [
            'يمكننا تعديل هذه الشروط في أي وقت لمواكبة تطور خدماتنا أو التزاماتنا القانونية أو ممارساتنا الداخلية.',
            'في حالة وجود تغيير مهم، يمكن إشعار المستخدمين عبر البريد الإلكتروني أو إشعار داخل المنصة.',
          ],
        },
      ],
      acceptance:
        'بمواصلة استخدام خدماتنا، تؤكدون أنكم قرأتم وفهمتم ووافقتم على هذه الشروط والأحكام.',
      contact: {
        title: 'التواصل',
        intro: 'لأي سؤال حول هذه الشروط والأحكام، يمكنكم التواصل معنا عبر:',
        emailLabel: 'البريد الإلكتروني',
        email: 'support@medplatform.ma',
        phoneLabel: 'الهاتف',
        phone: '+212 6 46 56 97 88',
        addressLabel: 'العنوان',
        address: 'الدار البيضاء، المغرب',
      },
    },
  };

  const t = content[language] || content.fr;

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
                <Scale className="w-8 h-8" aria-hidden="true" />
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
              <CheckCircle className="w-6 h-6" aria-hidden="true" />
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

          <section className="space-y-6">
            {t.sections.map((section) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.id}
                  className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-7 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pt-2">
                      {section.title}
                    </h2>
                  </div>

                  {section.paragraphs?.map((paragraph, index) => (
                    <p
                      key={`${section.id}-paragraph-${index}`}
                      className="text-gray-600 leading-relaxed mb-3"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.list && (
                    <ul className="mt-4 space-y-3">
                      {section.list.map((item, index) => (
                        <li
                          key={`${section.id}-item-${index}`}
                          className="flex items-start gap-3 text-gray-600 leading-relaxed"
                        >
                          <CheckCircle
                            className="w-5 h-5 text-blue-600 mt-1 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
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
                  {t.contact.intro}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
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

              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
                <MapPin className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="block">{t.contact.addressLabel}</strong>
                  {t.contact.address}
                </span>
              </div>
            </div>
          </section>

          <section className="mt-8 bg-gray-950 text-white rounded-3xl shadow-lg p-7 sm:p-8 text-center">
            <p className="text-lg leading-relaxed max-w-3xl mx-auto">
              {t.acceptance}
            </p>

            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/subscription"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                {t.backSubscription}
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-950 rounded-2xl hover:bg-gray-100 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                {t.contactUs}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default Terms;
