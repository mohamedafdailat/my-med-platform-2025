// contexts/PaymentContext.js
// Context pour gérer l'état des paiements globalement dans l'application

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Actions pour le reducer
const PAYMENT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  RESET_STATE: 'RESET_STATE',
  SET_SUBSCRIPTION_STATUS: 'SET_SUBSCRIPTION_STATUS'
};

// État initial
const initialState = {
  isLoading: false,
  error: null,
  success: null,
  subscriptionStatus: null,
  lastTransaction: null
};

// Reducer pour gérer l'état des paiements
const paymentReducer = (state, action) => {
  switch (action.type) {
    case PAYMENT_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error // Clear error when starting new payment
      };

    case PAYMENT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        success: null
      };

    case PAYMENT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case PAYMENT_ACTIONS.SET_SUCCESS:
      return {
        ...state,
        success: action.payload,
        isLoading: false,
        error: null,
        lastTransaction: action.payload.transaction || null
      };

    case PAYMENT_ACTIONS.SET_SUBSCRIPTION_STATUS:
      return {
        ...state,
        subscriptionStatus: action.payload
      };

    case PAYMENT_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

// Context
const PaymentContext = createContext();

// Provider component
export const PaymentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(paymentReducer, initialState);
  const navigate = useNavigate();

  // Types d'erreurs avec traductions
  const ERROR_TYPES = {
    CARD_DECLINED: {
      fr: {
        title: 'Carte refusée',
        message: 'Votre carte a été refusée. Vérifiez vos informations ou contactez votre banque.',
        suggestions: [
          'Vérifiez le numéro de carte',
          'Vérifiez la date d\'expiration',
          'Contactez votre banque',
          'Essayez une autre carte'
        ]
      },
      ar: {
        title: 'تم رفض البطاقة',
        message: 'تم رفض بطاقتك. تحقق من معلوماتك أو اتصل بالبنك.',
        suggestions: [
          'تحقق من رقم البطاقة',
          'تحقق من تاريخ انتهاء الصلاحية',
          'اتصل بالبنك',
          'جرب بطاقة أخرى'
        ]
      }
    },
    INSUFFICIENT_FUNDS: {
      fr: {
        title: 'Fonds insuffisants',
        message: 'Votre compte ne dispose pas de fonds suffisants.',
        suggestions: [
          'Vérifiez le solde de votre compte',
          'Utilisez une autre carte',
          'Contactez votre banque'
        ]
      },
      ar: {
        title: 'أموال غير كافية',
        message: 'حسابك لا يحتوي على أموال كافية.',
        suggestions: [
          'تحقق من رصيد حسابك',
          'استخدم بطاقة أخرى',
          'اتصل بالبنك'
        ]
      }
    },
    SUBSCRIPTION_REQUIRED: {
      fr: {
        title: 'Abonnement requis',
        message: 'Un abonnement payant est nécessaire pour accéder à ce contenu.',
        suggestions: [
          'Choisissez un plan d\'abonnement',
          'Profitez de nos offres spéciales',
          'Contactez-nous pour plus d\'informations'
        ]
      },
      ar: {
        title: 'اشتراك مطلوب',
        message: 'يلزم اشتراك مدفوع للوصول إلى هذا المحتوى.',
        suggestions: [
          'اختر خطة اشتراك',
          'استفد من عروضنا الخاصة',
          'اتصل بنا لمزيد من المعلومات'
        ]
      }
    },
    NETWORK_ERROR: {
      fr: {
        title: 'Erreur de connexion',
        message: 'Problème de connexion réseau. Vérifiez votre connexion internet.',
        suggestions: [
          'Vérifiez votre connexion internet',
          'Réessayez dans quelques minutes',
          'Redémarrez votre navigateur'
        ]
      },
      ar: {
        title: 'خطأ في الاتصال',
        message: 'مشكلة في الاتصال بالشبكة. تحقق من اتصالك بالإنترنت.',
        suggestions: [
          'تحقق من اتصالك بالإنترنت',
          'حاول مرة أخرى بعد دقائق قليلة',
          'أعد تشغيل متصفحك'
        ]
      }
    },
    TIMEOUT_ERROR: {
      fr: {
        title: 'Délai d\'attente dépassé',
        message: 'La transaction a pris trop de temps. Veuillez réessayer.',
        suggestions: [
          'Réessayez la transaction',
          'Vérifiez votre connexion internet',
          'Contactez le support si le problème persiste'
        ]
      },
      ar: {
        title: 'انتهت مهلة الانتظار',
        message: 'استغرقت المعاملة وقتًا طويلاً جدًا. يرجى المحاولة مرة أخرى.',
        suggestions: [
          'أعد المحاولة',
          'تحقق من اتصالك بالإنترنت',
          'اتصل بالدعم إذا استمرت المشكلة'
        ]
      }
    }
  };

  // Fonctions utilitaires
  const setLoading = useCallback((loading) => {
    dispatch({ type: PAYMENT_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((errorCode, customMessage = null, language = 'fr') => {
    const errorType = ERROR_TYPES[errorCode];
    if (!errorType) {
      console.warn(`Unknown error code: ${errorCode}`);
      return;
    }

    const localizedError = errorType[language] || errorType.fr;
    const error = {
      code: errorCode,
      title: localizedError.title,
      message: customMessage || localizedError.message,
      suggestions: localizedError.suggestions,
      timestamp: new Date().toISOString()
    };

    dispatch({ type: PAYMENT_ACTIONS.SET_ERROR, payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: PAYMENT_ACTIONS.CLEAR_ERROR });
  }, []);

  const setSuccess = useCallback((message, transaction = null) => {
    dispatch({ 
      type: PAYMENT_ACTIONS.SET_SUCCESS, 
      payload: { message, transaction } 
    });
  }, []);

  const setSubscriptionStatus = useCallback((status) => {
    dispatch({ type: PAYMENT_ACTIONS.SET_SUBSCRIPTION_STATUS, payload: status });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: PAYMENT_ACTIONS.RESET_STATE });
  }, []);

  // Fonction pour traiter un paiement
  const processPayment = useCallback(async (paymentData) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${paymentData.token}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!response.ok) {
        // Mapper les codes d'erreur de l'API
        const errorCode = mapApiErrorCode(result.error_code || 'UNKNOWN_ERROR');
        setError(errorCode, result.message, paymentData.language || 'fr');
        throw new Error(result.message || 'Payment failed');
      }

      // Succès
      setSuccess('Paiement effectué avec succès !', result.transaction);
      
      // Mettre à jour le statut d'abonnement si nécessaire
      if (result.subscription_status) {
        setSubscriptionStatus(result.subscription_status);
      }

      return result;

    } catch (error) {
      if (!state.error) { // Éviter de dupliquer les erreurs
        setError('NETWORK_ERROR', error.message, paymentData.language || 'fr');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSuccess, setSubscriptionStatus, state.error]);

  // Fonction pour vérifier l'accès à une fonctionnalité
  const checkFeatureAccess = useCallback((featureName, userSubscriptionStatus) => {
    const paidFeatures = ['videos', 'courses', 'quizzes', 'flashcards', 'quiz-generator'];
    
    if (paidFeatures.includes(featureName) && userSubscriptionStatus !== 'paid') {
      setError('SUBSCRIPTION_REQUIRED');
      return false;
    }
    
    return true;
  }, [setError]);

  // Fonction pour naviguer vers la page d'erreur détaillée
  const navigateToErrorPage = useCallback(() => {
    if (!state.error) return;
    
    const params = new URLSearchParams({
      error: state.error.code,
      error_description: state.error.message
    });
    
    navigate(`/payment-error?${params.toString()}`);
  }, [state.error, navigate]);

  // Mapper les codes d'erreur de l'API vers nos codes internes
  const mapApiErrorCode = (apiCode) => {
    const mapping = {
      'card_declined': 'CARD_DECLINED',
      'insufficient_funds': 'INSUFFICIENT_FUNDS',
      'expired_card': 'CARD_DECLINED',
      'network_error': 'NETWORK_ERROR',
      'timeout': 'TIMEOUT_ERROR',
      'subscription_required': 'SUBSCRIPTION_REQUIRED'
    };
    
    return mapping[apiCode] || 'NETWORK_ERROR';
  };

  // Valeur du contexte
  const contextValue = {
    // État
    ...state,
    
    // Actions
    setLoading,
    setError,
    clearError,
    setSuccess,
    setSubscriptionStatus,
    resetState,
    
    // Fonctions utilitaires
    processPayment,
    checkFeatureAccess,
    navigateToErrorPage,
    
    // Configuration
    ERROR_TYPES
  };

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

// Composant pour afficher les erreurs de paiement
export const PaymentErrorDisplay = ({ language = 'fr', onRetry, onNavigateToHelp }) => {
  const { error, clearError } = usePayment();

  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {error.title}
          </h3>
          <div className="mt-1 text-sm text-red-700">
            <p>{error.message}</p>
          </div>
          
          {error.suggestions && (
            <div className="mt-2">
              <p className="text-xs font-medium text-red-800 mb-1">
                {language === 'fr' ? 'Suggestions :' : 'اقتراحات:'}
              </p>
              <ul className="text-xs text-red-700 space-y-1">
                {error.suggestions.slice(0, 2).map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-3 flex space-x-2">
            {onRetry && (
              <button
                onClick={() => {
                  clearError();
                  onRetry();
                }}
                className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
              >
                {language === 'fr' ? 'Réessayer' : 'إعادة المحاولة'}
              </button>
            )}
            {onNavigateToHelp && (
              <button
                onClick={onNavigateToHelp}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
              >
                {language === 'fr' ? 'Plus d\'aide' : 'مزيد من المساعدة'}
              </button>
            )}
          </div>
        </div>
        <div className="ml-3 flex-shrink-0">
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant pour afficher le succès
export const PaymentSuccessDisplay = ({ language = 'fr', onClose }) => {
  const { success, resetState } = usePayment();

  if (!success) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-green-800">
            {language === 'fr' ? 'Succès !' : 'نجح!'}
          </h3>
          <div className="mt-1 text-sm text-green-700">
            <p>{success.message}</p>
          </div>
          {success.transaction && (
            <div className="mt-2 text-xs text-green-600">
              <p>Transaction ID: {success.transaction.id}</p>
            </div>
          )}
        </div>
        <div className="ml-3 flex-shrink-0">
          <button
            onClick={() => {
              resetState();
              onClose?.();
            }}
            className="text-green-400 hover:text-green-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};