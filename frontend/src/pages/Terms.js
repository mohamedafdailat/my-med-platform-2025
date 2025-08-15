import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Terms = () => {
  const { language } = useLanguage();
  
  return (
    <div className="page-container">
      <div className="terms-header">
        <h1 className="page-title">
          {language === 'fr' ? 'Termes et Conditions' : 'الشروط والأحكام'}
        </h1>
        <p className="last-updated">
          {language === 'fr' 
            ? 'Dernière mise à jour : 25 juin 2025' 
            : 'آخر تحديث: 25 يونيو 2025'
          }
        </p>
      </div>

      <div className="terms-content">
        {language === 'fr' ? (
          <>
            <section className="terms-section">
              <h2>1. Introduction</h2>
              <p>
                Bienvenue sur <strong>MedPlatform Maroc</strong> ! Ces termes et conditions régissent votre utilisation 
                de notre plateforme d'apprentissage médical. En accédant à nos services, vous acceptez d'être lié par 
                ces conditions dans leur intégralité.
              </p>
            </section>

            <section className="terms-section">
              <h2>2. Définitions</h2>
              <ul className="terms-list">
                <li><strong>Plateforme :</strong> Le site web et l'application MedPlatform Maroc</li>
                <li><strong>Services :</strong> Tous les contenus, cours, quiz et fonctionnalités proposés</li>
                <li><strong>Utilisateur :</strong> Toute personne accédant à la plateforme</li>
                <li><strong>Contenu Premium :</strong> Matériel accessible uniquement aux abonnés</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>3. Utilisation des Services</h2>
              <h3>3.1 Conditions d'accès</h3>
              <p>
                Pour utiliser nos services, vous devez être étudiant en médecine, professionnel de santé 
                ou avoir un intérêt légitime dans le domaine médical au Maroc.
              </p>
              
              <h3>3.2 Compte utilisateur</h3>
              <ul className="terms-list">
                <li>Vous êtes responsable de la confidentialité de vos identifiants</li>
                <li>Un seul compte par personne est autorisé</li>
                <li>Les informations fournies doivent être exactes et à jour</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>4. Abonnements et Paiements</h2>
              <h3>4.1 Types d'abonnements</h3>
              <ul className="terms-list">
                <li><strong>Plan Mensuel :</strong> Accès complet pour 1 mois - 9.99$</li>
                <li><strong>Plan Annuel :</strong> Accès complet pour 12 mois - 99.99$ (économie de 20%)</li>
              </ul>
              
              <h3>4.2 Renouvellement automatique</h3>
              <p>
                Les abonnements se renouvellent automatiquement à moins que vous ne les annuliez 
                au moins 24 heures avant la date de renouvellement.
              </p>
              
              <h3>4.3 Politique de remboursement</h3>
              <p>
                Les remboursements sont possibles dans les 7 jours suivant l'achat, sous réserve 
                que moins de 20% du contenu ait été consulté.
              </p>
            </section>

            <section className="terms-section">
              <h2>5. Propriété Intellectuelle</h2>
              <p>
                Tous les contenus de la plateforme (cours, vidéos, quiz, documents) sont protégés 
                par le droit d'auteur et appartiennent à MedPlatform Maroc ou à ses partenaires.
              </p>
              
              <h3>5.1 Restrictions d'utilisation</h3>
              <ul className="terms-list">
                <li>Interdiction de copier, distribuer ou vendre le contenu</li>
                <li>Pas de partage de comptes entre plusieurs utilisateurs</li>
                <li>Utilisation uniquement à des fins personnelles et éducatives</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>6. Responsabilités et Limitations</h2>
              <h3>6.1 Contenu éducatif</h3>
              <p>
                Les informations fournies sont à des fins éducatives uniquement et ne remplacent 
                pas les conseils médicaux professionnels.
              </p>
              
              <h3>6.2 Limitation de responsabilité</h3>
              <p>
                MedPlatform Maroc ne peut être tenu responsable des dommages directs ou indirects 
                résultant de l'utilisation de la plateforme.
              </p>
            </section>

            <section className="terms-section">
              <h2>7. Résiliation</h2>
              <p>
                Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de 
                violation de ces conditions d'utilisation.
              </p>
            </section>

            <section className="terms-section">
              <h2>8. Modifications des Termes</h2>
              <p>
                Nous pouvons modifier ces termes à tout moment. Les utilisateurs seront notifiés 
                des changements importants par email ou via la plateforme.
              </p>
            </section>

            <section className="terms-section">
              <h2>9. Contact</h2>
              <p>
                Pour toute question concernant ces termes et conditions, contactez-nous :
              </p>
              <div className="contact-info">
                <p><strong>Email :</strong> support@medplatform.ma</p>
                <p><strong>Téléphone :</strong> +212 646-569788</p>
                <p><strong>Adresse :</strong> Casablanca, Maroc</p>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="terms-section">
              <h2>1. مقدمة</h2>
              <p>
                مرحبا بكم في <strong>منصة MedPlatform المغرب</strong>! تحكم هذه الشروط والأحكام استخدامكم 
                لمنصة التعلم الطبي الخاصة بنا. بالوصول إلى خدماتنا، فإنكم توافقون على الالتزام بهذه الشروط كاملة.
              </p>
            </section>

            <section className="terms-section">
              <h2>2. التعاريف</h2>
              <ul className="terms-list">
                <li><strong>المنصة:</strong> موقع الويب وتطبيق MedPlatform المغرب</li>
                <li><strong>الخدمات:</strong> جميع المحتويات والدورات والاختبارات والميزات المقدمة</li>
                <li><strong>المستخدم:</strong> أي شخص يصل إلى المنصة</li>
                <li><strong>المحتوى المميز:</strong> المواد المتاحة للمشتركين فقط</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>3. استخدام الخدمات</h2>
              <h3>3.1 شروط الوصول</h3>
              <p>
                لاستخدام خدماتنا، يجب أن تكونوا طلاب طب أو مهنيين في الصحة أو لديكم اهتمام مشروع 
                في المجال الطبي في المغرب.
              </p>
              
              <h3>3.2 حساب المستخدم</h3>
              <ul className="terms-list">
                <li>أنتم مسؤولون عن سرية بيانات تسجيل الدخول الخاصة بكم</li>
                <li>حساب واحد فقط لكل شخص مسموح</li>
                <li>يجب أن تكون المعلومات المقدمة دقيقة ومحدثة</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>4. الاشتراكات والمدفوعات</h2>
              <h3>4.1 أنواع الاشتراكات</h3>
              <ul className="terms-list">
                <li><strong>خطة شهرية:</strong> وصول كامل لمدة شهر واحد - 9.99$</li>
                <li><strong>خطة سنوية:</strong> وصول كامل لمدة 12 شهرًا - 99.99$ (توفير 20%)</li>
              </ul>
              
              <h3>4.2 التجديد التلقائي</h3>
              <p>
                تتجدد الاشتراكات تلقائيًا ما لم تلغوها قبل 24 ساعة على الأقل من تاريخ التجديد.
              </p>
              
              <h3>4.3 سياسة الاسترداد</h3>
              <p>
                الاستردادات ممكنة خلال 7 أيام من الشراء، بشرط أن يكون أقل من 20% من المحتوى قد تم الاطلاع عليه.
              </p>
            </section>

            <section className="terms-section">
              <h2>5. الملكية الفكرية</h2>
              <p>
                جميع محتويات المنصة (الدورات، الفيديوهات، الاختبارات، الوثائق) محمية بحقوق الطبع والنشر 
                وتنتمي إلى MedPlatform المغرب أو شركائها.
              </p>
              
              <h3>5.1 قيود الاستخدام</h3>
              <ul className="terms-list">
                <li>منع نسخ أو توزيع أو بيع المحتوى</li>
                <li>عدم مشاركة الحسابات بين عدة مستخدمين</li>
                <li>الاستخدام للأغراض الشخصية والتعليمية فقط</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>6. المسؤوليات والقيود</h2>
              <h3>6.1 المحتوى التعليمي</h3>
              <p>
                المعلومات المقدمة هي لأغراض تعليمية فقط ولا تحل محل المشورة الطبية المهنية.
              </p>
              
              <h3>6.2 حدود المسؤولية</h3>
              <p>
                لا يمكن تحميل MedPlatform المغرب المسؤولية عن الأضرار المباشرة أو غير المباشرة 
                الناتجة عن استخدام المنصة.
              </p>
            </section>

            <section className="terms-section">
              <h2>7. الإنهاء</h2>
              <p>
                نحتفظ بالحق في تعليق أو إنهاء حسابكم في حالة انتهاك شروط الاستخدام هذه.
              </p>
            </section>

            <section className="terms-section">
              <h2>8. تعديل الشروط</h2>
              <p>
                يمكننا تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بالتغييرات المهمة 
                عبر البريد الإلكتروني أو عبر المنصة.
              </p>
            </section>

            <section className="terms-section">
              <h2>9. التواصل</h2>
              <p>
                لأي أسئلة حول هذه الشروط والأحكام، تواصلوا معنا:
              </p>
              <div className="contact-info">
                <p><strong>البريد الإلكتروني:</strong> support@medplatform.ma</p>
                <p><strong>الهاتف:</strong> +212 646-569788</p>
                <p><strong>العنوان:</strong> الدار البيضاء، المغرب</p>
              </div>
            </section>
          </>
        )}
      </div>

      <div className="terms-footer">
        <div className="acceptance-notice">
          <p>
            {language === 'fr' 
              ? 'En continuant à utiliser nos services, vous confirmez avoir lu et accepté ces termes et conditions.'
              : 'بمواصلة استخدام خدماتنا، تؤكدون أنكم قرأتم ووافقتم على هذه الشروط والأحكام.'
            }
          </p>
        </div>
        
        <div className="navigation-buttons">
          <a href="/subscription" className="btn-primary">
            {language === 'fr' ? 'Retour à l\'abonnement' : 'العودة إلى الاشتراك'}
          </a>
          <a href="/contact" className="btn-secondary">
            {language === 'fr' ? 'Nous contacter' : 'تواصل معنا'}
          </a>
        </div>
      </div>

      <style jsx>{`
        .page-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          line-height: 1.8;
          font-family: 'Arial', sans-serif;
        }

        .terms-header {
          text-align: center;
          margin-bottom: 50px;
          padding-bottom: 30px;
          border-bottom: 2px solid #e0e0e0;
        }

        .page-title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 15px;
          font-weight: 700;
        }

        .last-updated {
          color: #7f8c8d;
          font-style: italic;
          font-size: 1rem;
        }

        .terms-content {
          margin-bottom: 50px;
        }

        .terms-section {
          margin-bottom: 40px;
          padding: 30px;
          background: #f8f9fa;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .terms-section h2 {
          color: #2980b9;
          font-size: 1.8rem;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #3498db;
        }

        .terms-section h3 {
          color: #34495e;
          font-size: 1.3rem;
          margin: 25px 0 15px 0;
        }

        .terms-section p {
          margin-bottom: 15px;
          text-align: justify;
          font-size: 1.1rem;
        }

        .terms-list {
          margin: 20px 0;
          padding-left: 30px;
        }

        .terms-list li {
          margin-bottom: 10px;
          font-size: 1.1rem;
        }

        .contact-info {
          background: #ecf0f1;
          padding: 20px;
          border-radius: 8px;
          margin-top: 15px;
        }

        .contact-info p {
          margin-bottom: 8px;
          font-size: 1.1rem;
        }

        .terms-footer {
          background: #34495e;
          color: white;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
        }

        .acceptance-notice {
          margin-bottom: 25px;
        }

        .acceptance-notice p {
          font-size: 1.1rem;
          font-weight: 500;
        }

        .navigation-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary, .btn-secondary {
          padding: 12px 25px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .btn-primary {
          background: #3498db;
          color: white;
        }

        .btn-primary:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-secondary:hover {
          background: #7f8c8d;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 20px 15px;
          }
          
          .page-title {
            font-size: 2rem;
          }
          
          .terms-section {
            padding: 20px;
          }
          
          .navigation-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .btn-primary, .btn-secondary {
            width: 80%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Terms;