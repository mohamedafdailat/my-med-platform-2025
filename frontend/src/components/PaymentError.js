import React, { useState, useEffect } from 'react';

const PaymentError = ({ language = 'fr', errorCode, errorMessage }) => {
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    // Récupérer les détails de l'erreur depuis les props ou l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlErrorCode = urlParams.get('error') || errorCode;
    const urlErrorMessage = urlParams.get('error_description') || errorMessage;
    
    if (urlErrorCode || urlErrorMessage) {
      setErrorDetails({
        code: urlErrorCode,
        message: urlErrorMessage
      });
    }
  }, [errorCode, errorMessage]);

  const t = {
    fr: {
      title: 'Erreur de Paiement',
      subtitle: 'Une erreur est survenue lors du traitement de votre paiement',
      commonReasons: 'Raisons courantes :',
      reason1: '• Carte de crédit expirée ou invalide',
      reason2: '• Fonds insuffisants sur le compte',
      reason3: '• Transaction refusée par la banque',
      reason4: '• Problème de connexion réseau',
      reason5: '• Informations de facturation incorrectes',
      whatToDo: 'Que faire maintenant ?',
      action1: 'Vérifiez les informations de votre carte',
      action2: 'Contactez votre banque si nécessaire',
      action3: 'Réessayez avec une autre méthode de paiement',
      tryAgain: 'Réessayer le paiement',
      chooseOtherPlan: 'Choisir un autre plan',
      contactSupport: 'Contacter le support',
      backToHome: 'Retour à l\'accueil',
      errorCode: 'Code d\'erreur',
      supportEmail: 'support@medplatform.com',
      supportPhone: '+33 1 23 45 67 89',
      guarantee: 'Aucun montant n\'a été débité de votre compte'
    },
    ar: {
      title: 'خطأ في الدفع',
      subtitle: 'حدث خطأ أثناء معالجة دفعتك',
      commonReasons: 'الأسباب الشائعة:',
      reason1: '• بطاقة ائتمان منتهية الصلاحية أو غير صالحة',
      reason2: '• أموال غير كافية في الحساب',
      reason3: '• المعاملة مرفوضة من البنك',
      reason4: '• مشكلة في اتصال الشبكة',
      reason5: '• معلومات الفواتير غير صحيحة',
      whatToDo: 'ماذا تفعل الآن؟',
      action1: 'تحقق من معلومات بطاقتك',
      action2: 'اتصل بالبنك إذا لزم الأمر',
      action3: 'حاول مرة أخرى بطريقة دفع أخرى',
      tryAgain: 'إعادة المحاولة',
      chooseOtherPlan: 'اختر خطة أخرى',
      contactSupport: 'اتصل بالدعم',
      backToHome: 'العودة للصفحة الرئيسية',
      errorCode: 'رمز الخطأ',
      supportEmail: 'support@medplatform.com',
      supportPhone: '+33 1 23 45 67 89',
      guarantee: 'لم يتم خصم أي مبلغ من حسابك'
    }
  }[language];

  const handleRetryPayment = () => {
    window.location.href = '/subscription';
  };

  const handleContactSupport = () => {
    window.location.href = `mailto:${t.supportEmail}?subject=Erreur de paiement&body=Code d'erreur: ${errorDetails?.code || 'N/A'}`;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto">
          
          {/* Error Icon & Title */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-red-600 mb-4">{t.title}</h1>
            <p className="text-xl text-gray-600 mb-6">{t.subtitle}</p>
            
            {errorDetails && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">
                  <strong>{t.errorCode}:</strong> {errorDetails.code || 'PAYMENT_FAILED'}
                </p>
                {errorDetails.message && (
                  <p className="text-sm text-red-600 mt-2">{errorDetails.message}</p>
                )}
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-semibold">✅ {t.guarantee}</p>
            </div>
          </div>

          {/* Error Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            
            {/* Common Reasons */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.commonReasons}
              </h3>
              <div className="space-y-2 text-gray-600">
                <p>{t.reason1}</p>
                <p>{t.reason2}</p>
                <p>{t.reason3}</p>
                <p>{t.reason4}</p>
                <p>{t.reason5}</p>
              </div>
            </div>

            {/* What to Do */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.whatToDo}
              </h3>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">1.</span>
                  <span>{t.action1}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">2.</span>
                  <span>{t.action2}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">3.</span>
                  <span>{t.action3}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleRetryPayment}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t.tryAgain}
              </button>

              <button
                onClick={() => window.location.href = '/subscription'}
                className="w-full bg-gray-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {t.chooseOtherPlan}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleContactSupport}
                className="w-full bg-orange-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {t.contactSupport}
              </button>

              <a
                href="/"
                className="w-full bg-gray-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t.backToHome}
              </a>
            </div>
          </div>

          {/* Support Contact Info */}
          <div className="mt-12 bg-gray-50 rounded-xl p-6 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Besoin d'aide supplémentaire ?</h3>
            <div className="space-y-2 text-gray-600">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${t.supportEmail}`} className="text-blue-600 hover:text-blue-800">
                  {t.supportEmail}
                </a>
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${t.supportPhone}`} className="text-blue-600 hover:text-blue-800">
                  {t.supportPhone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentError;