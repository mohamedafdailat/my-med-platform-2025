// components/ProtectedRoute.js
// Version améliorée du composant ProtectedRoute avec gestion d'erreurs

import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePayment } from '../contexts/PaymentContext';

const LoadingSpinner = ({ language = 'fr' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg">
        {language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}
      </p>
    </div>
  </div>
);

// Composant pour afficher l'erreur d'abonnement requis
const SubscriptionRequiredError = ({ language, onSubscribe }) => {
  const t = {
    fr: {
      title: 'Abonnement Premium Requis',
      subtitle: 'Accédez à ce contenu avec un abonnement payant',
      description: 'Ce contenu fait partie de nos ressources premium. Abonnez-vous pour débloquer toutes les fonctionnalités.',
      features: [
        '✓ Accès à tous les cours et vidéos',
        '✓ Quiz interactifs illimités',
        '✓ Flashcards personnalisées',
        '✓ Certificats de formation',
        '✓ Support prioritaire'
      ],
      cta: 'Voir nos plans',
      back: 'Retour à l\'accueil',
      trial: 'Essai gratuit disponible'
    },
    ar: {
      title: 'اشتراك مميز مطلوب',
      subtitle: 'احصل على هذا المحتوى مع اشتراك مدفوع',
      description: 'هذا المحتوى جزء من مواردنا المتميزة. اشترك لإلغاء قفل جميع الميزات.',
      features: [
        '✓ الوصول إلى جميع الدورات والفيديوهات',
        '✓ اختبارات تفاعلية غير محدودة',
        '✓ بطاقات تعليمية مخصصة',
        '✓ شهادات تدريب',
        '✓ دعم أولوي'
      ],
      cta: 'اطلع على خططنا',
      back: 'العودة للصفحة الرئيسية',
      trial: 'تجربة مجانية متاحة'
    }
  }[language];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Content */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t.title}</h1>
          <p className="text-xl text-blue-600 mb-6">{t.subtitle}</p>
          <p className="text-gray-600 mb-8">{t.description}</p>

          {/* Features */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Avec votre abonnement :</h3>
            <div className="space-y-2">
              {t.features.map((feature, index) => (
                <p key={index} className="text-gray-700 text-left">{feature}</p>
              ))}
            </div>
          </div>

          {/* Trial notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
            <p className="text-green-700 font-medium">🎉 {t.trial}</p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={onSubscribe}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
            >
              {t.cta}
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              {t.back}
            </button>
          </div>

          {/* Contact */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Besoin d'aide ?</p>
            <div className="flex justify-center space-x-4 text-sm">
              <a href="mailto:support@medplatform.com" className="text-blue-600 hover:text-blue-800">
                📧 support@medplatform.com
              </a>
              <a href="tel:+33123456789" className="text-blue-600 hover:text-blue-800">
                📞 +33 1 23 45 67 89
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant ProtectedRoute amélioré
const ProtectedRoute = ({ children, requiredRole, isPaidRequired, featureName }) => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const { checkFeatureAccess } = usePayment();
  const location = useLocation();

  const userRoleCheck = useMemo(() => {
    if (!user) return { isAdmin: false, isStudent: false };

    const isAdmin = user?.customClaims?.role === 'admin';

    const isStudent = user?.role === 'student' ||
      user?.customClaims?.role === 'student' ||
      (!user?.role && !user?.customClaims?.role);

    return { isAdmin, isStudent };
  }, [user]);

  // Loading state
  if (loading) {
    return <LoadingSpinner language={language} />;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }

  const { isAdmin, isStudent } = userRoleCheck;
  const hasUnlimitedAccess = isAdmin || user.customClaims?.unlimitedAccess === true;

  // Check role requirements
  if (requiredRole) {
    const hasRequiredRole = isAdmin || 
      (requiredRole === 'student' ? isStudent : user.role === requiredRole || user.customClaims?.role === requiredRole) ||
      (requiredRole === 'admin' && isAdmin);

    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  // Check subscription requirements with enhanced error handling
  if (isPaidRequired && !hasUnlimitedAccess && user.subscriptionStatus !== 'paid') {
    // Afficher l'interface d'erreur d'abonnement
    return (
      <SubscriptionRequiredError 
        language={language}
        onSubscribe={() => window.location.href = '/subscription'}
      />
    );
  }

  // Check specific feature access (pour un contrôle plus granulaire)
  if (featureName && !hasUnlimitedAccess) {
    const hasAccess = checkFeatureAccess(featureName, user.subscriptionStatus);
    if (!hasAccess) {
      return (
        <SubscriptionRequiredError 
          language={language}
          onSubscribe={() => window.location.href = '/subscription'}
        />
      );
    }
  }

  return children;
};

// Wrapper pour les pages qui nécessitent un paiement
export const PaidFeatureWrapper = ({ children, featureName, fallbackComponent = null }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { checkFeatureAccess } = usePayment();

  // Admin bypass
  if (user?.customClaims?.role === 'admin' || user?.customClaims?.unlimitedAccess === true) {
    return children;
  }

  // Check access
  const hasAccess = checkFeatureAccess(featureName, user?.subscriptionStatus);
  
  if (!hasAccess) {
    return fallbackComponent || (
      <SubscriptionRequiredError 
        language={language}
        onSubscribe={() => window.location.href = '/subscription'}
      />
    );
  }

  return children;
};

// HOC pour protéger les composants facilement
export const withSubscriptionCheck = (WrappedComponent, featureName) => {
  return function SubscriptionCheckedComponent(props) {
    return (
      <PaidFeatureWrapper featureName={featureName}>
        <WrappedComponent {...props} />
      </PaidFeatureWrapper>
    );
  };
};

export default ProtectedRoute;
