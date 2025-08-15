import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NavLink } from 'react-router-dom';

const Profile = () => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  if (loading) {
    return (
      <main className={`min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="loading-spinner mx-auto" aria-label={language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={`min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="text-center text-red-500 text-lg font-medium" role="alert" aria-live="assertive">
          {language === 'fr' ? 'Veuillez vous connecter' : 'يرجى تسجيل الدخول'}
        </div>
      </main>
    );
  }

  const isPaid = user.subscriptionStatus === 'paid';
  const subscriptionText = isPaid
    ? (language === 'fr' ? 'Payé' : 'مدفوع')
    : (language === 'fr' ? 'Non payé' : 'غير مدفوع');
  const subscriptionClass = isPaid ? 'text-green-600' : 'text-red-600';
  const planType = user.subscription?.planType || (language === 'fr' ? 'Aucun plan' : 'لا يوجد خطة');

  // Parse end date and calculate remaining time
  const endDate = user.subscription?.endDate ? new Date(user.subscription.endDate) : null;
  const currentDate = new Date(); // Current date: August 4, 2025, 08:50 PM +01
  let remainingDays = null;

  if (isPaid && endDate) {
    const timeDiff = endDate - currentDate;
    remainingDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
  }

  const subscriptionDurationText = isPaid && endDate && remainingDays >= 0
    ? language === 'fr'
      ? `Actif jusqu'au ${endDate.toLocaleDateString('fr-FR')} (${remainingDays} jours restants)`
      : `نشط حتى ${endDate.toLocaleDateString('ar-EG', { numberingSystem: 'arab' })} (${remainingDays} أيام متبقية)`
    : language === 'fr'
      ? 'Aucune durée d\'abonnement définie'
      : 'لا يوجد مدة اشتراك محددة';

  return (
    <main className={`min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <section className="auth-container" aria-labelledby="profile-title">
        <h2 id="profile-title" className="text-3xl font-bold text-gray-800 text-center mb-6">
          {language === 'fr' ? 'Profil' : 'الملف الشخصي'}
        </h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            {language === 'fr' ? 'Nom :' : 'الاسم:'} {user.displayName || (language === 'fr' ? 'Non défini' : 'غير معرف')}
          </p>
          <p className="text-gray-700">
            {language === 'fr' ? 'Email :' : 'البريد الإلكتروني:'} {user.email || (language === 'fr' ? 'Non défini' : 'غير معرف')}
          </p>
          <p className="text-gray-700">
            {language === 'fr' ? 'Rôle :' : 'الدور:'} {user.role || (language === 'fr' ? 'Étudiant' : 'طالب')}
          </p>
          <p className={`text-lg font-medium ${subscriptionClass}`}>
            {language === 'fr' ? 'Statut de l\'abonnement :' : 'حالة الاشتراك:'} {subscriptionText}
          </p>
          <p className="text-gray-700">
            {language === 'fr' ? 'Type de plan :' : 'نوع الخطة:'} {planType}
          </p>
          <p className={`text-md ${subscriptionClass}`}>
            {subscriptionDurationText}
          </p>
          {isPaid && remainingDays !== null && remainingDays <= 7 && (
            <NavLink
              to="/subscription"
              className="btn-primary block text-center mt-4"
              aria-label={language === 'fr' ? 'Renouveler votre abonnement' : 'تجديد اشتراكك'}
            >
              {language === 'fr' ? 'Renouveler l\'abonnement' : 'تجديد الاشتراك'}
            </NavLink>
          )}
          {!isPaid && (
            <NavLink
              to="/subscription"
              className="btn-primary block text-center mt-4"
              aria-label={language === 'fr' ? 'Souscrire à un abonnement' : 'الاشتراك الآن'}
            >
              {language === 'fr' ? 'Souscrire à un abonnement' : 'الاشتراك الآن'}
            </NavLink>
          )}
        </div>
      </section>
    </main>
  );
};

export default Profile;