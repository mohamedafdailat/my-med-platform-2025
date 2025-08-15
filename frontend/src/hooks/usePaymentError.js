// hooks/usePaymentError.js
// Hook personnalisé pour gérer les erreurs de paiement dans toute l'application

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const usePaymentError = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Types d'erreurs de paiement
  const ERROR_TYPES = {
    CARD_DECLINED: {
      code: 'CARD_DECLINED',
      title: 'Carte refusée',
      message: 'Votre carte de crédit a été refusée. Vérifiez vos informations ou contactez votre banque.',
      severity: 'error'
    },
    INSUFFICIENT_FUNDS: {
      code: 'INSUFFICIENT_FUNDS',
      title: 'Fonds insuffisants',
      message: 'Votre compte ne dispose pas de fonds suffisants pour effectuer cette transaction.',
      severity: 'error'
    },
    EXPIRED_CARD: {
      code: 'EXPIRED_CARD',
      title: 'Carte expirée',
      message: 'Votre carte de crédit est expirée. Veuillez utiliser une carte valide.',
      severity: 'error'
    },
    NETWORK_ERROR: {
      code: 'NETWORK_ERROR',
      title: 'Erreur de connexion',
      message: 'Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.',
      severity: 'warning'
    },
    SUBSCRIPTION_REQUIRED: {
      code: 'SUBSCRIPTION_REQUIRED',
      title: 'Abonnement requis',
      message: 'Un abonnement payant est nécessaire pour accéder à ce contenu premium.',
      severity: 'info'
    },
    TIMEOUT_ERROR: {
      code: 'TIMEOUT_ERROR',
      title: 'Délai d\'attente dépassé',
      message: 'La transaction a pris trop de temps. Veuillez réessayer.',
      severity: 'warning'
    },
    UNKNOWN_ERROR: {
      code: 'UNKNOWN_ERROR',
      title: 'Erreur inconnue',
      message: 'Une erreur inattendue s\'est produite. Veuillez réessayer ou contacter le support.',
      severity: 'error'
    }
  };

  // Fonction pour traiter les erreurs de paiement
  const handlePaymentError = useCallback((errorCode, customMessage = null, additionalData = {}) => {
    const errorType = ERROR_TYPES[errorCode] || ERROR_TYPES.UNKNOWN_ERROR;
    
    const errorObject = {
      ...errorType,
      message: customMessage || errorType.message,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    setError(errorObject);
    
    // Log pour le debugging
    console.error('Payment Error:', errorObject);
    
    // Optionnel : envoyer à un service de monitoring d'erreurs
    // sendErrorToMonitoring(errorObject);
    
    return errorObject;
  }, []);

  // Fonction pour naviguer vers la page d'erreur détaillée
  const navigateToErrorPage = useCallback((errorData = null) => {
    const errorToUse = errorData || error;
    if (!errorToUse) return;

    const params = new URLSearchParams({
      error: errorToUse.code,
      error_description: errorToUse.message,
      severity: errorToUse.severity || 'error'
    });

    navigate(`/payment-error?${params.toString()}`);
  }, [error, navigate]);

  // Fonction pour effectuer un paiement avec gestion d'erreurs
  const processPayment = useCallback(async (paymentData, apiEndpoint = '/api/process-payment') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Ajoutez vos headers d'authentification ici
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Mapper les codes d'erreur de l'API vers nos types d'erreurs
        const errorCode = mapApiErrorToErrorType(result.error_code || result.error);
        const error = handlePaymentError(errorCode, result.message, {
          apiResponse: result,
          httpStatus: response.status
        });
        
        throw error;
      }

      return result;

    } catch (error) {
      if (error.code) {
        // C'est une erreur que nous avons déjà traitée
        throw error;
      }

      // Erreur réseau ou autre
      const networkError = handlePaymentError('NETWORK_ERROR', null, {
        originalError: error.message
      });
      
      throw networkError;

    } finally {
      setIsLoading(false);
    }
  }, [handlePaymentError]);

  // Fonction pour mapper les codes d'erreur de l'API
  const mapApiErrorToErrorType = (apiErrorCode) => {
    const errorMapping = {
      'card_declined': 'CARD_DECLINED',
      'insufficient_funds': 'INSUFFICIENT_FUNDS',
      'expired_card': 'EXPIRED_CARD',
      'payment_failed': 'CARD_DECLINED',
      'network_error': 'NETWORK_ERROR',
      'timeout': 'TIMEOUT_ERROR',
      'subscription_required': 'SUBSCRIPTION_REQUIRED'
    };

    return errorMapping[apiErrorCode] || 'UNKNOWN_ERROR';
  };

  // Fonction pour effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fonction pour vérifier si une action peut être retentée
  const canRetry = useCallback((errorCode = null) => {
    const codeToCheck = errorCode || error?.code;
    const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'UNKNOWN_ERROR'];
    return retryableErrors.includes(codeToCheck);
  }, [error]);

  // Fonction pour obtenir des suggestions d'actions
  const getSuggestions = useCallback((errorCode = null) => {
    const codeToCheck = errorCode || error?.code;
    
    const suggestions = {
      CARD_DECLINED: [
        'Vérifiez que votre carte n\'est pas expirée',
        'Contactez votre banque pour vérifier les restrictions',
        'Essayez avec une autre carte de crédit',
        'Vérifiez que vous avez saisi les bonnes informations'
      ],
      INSUFFICIENT_FUNDS: [
        'Vérifiez le solde de votre compte',
        'Utilisez une autre carte ou méthode de paiement',
        'Contactez votre banque'
      ],
      EXPIRED_CARD: [
        'Utilisez une carte de crédit valide',
        'Mettez à jour vos informations de paiement',
        'Contactez votre banque pour une nouvelle carte'
      ],
      NETWORK_ERROR: [
        'Vérifiez votre connexion internet',
        'Réessayez dans quelques minutes',
        'Redémarrez votre navigateur'
      ],
      SUBSCRIPTION_REQUIRED: [
        'Choisissez un plan d\'abonnement',
        'Consultez nos offres spéciales',
        'Contactez-nous pour des tarifs étudiants'
      ]
    };

    return suggestions[codeToCheck] || [
      'Réessayez dans quelques minutes',
      'Contactez notre support client',
      'Vérifiez votre connexion internet'
    ];
  }, [error]);

  return {
    error,
    isLoading,
    handlePaymentError,
    processPayment,
    navigateToErrorPage,
    clearError,
    canRetry,
    getSuggestions,
    ERROR_TYPES
  };
};

// Exemple d'utilisation dans un composant
export const PaymentFormExample = () => {
  const {
    error,
    isLoading,
    processPayment,
    navigateToErrorPage,
    clearError,
    canRetry,
    getSuggestions
  } = usePaymentError();

  const handleSubmit = async (formData) => {
    try {
      const result = await processPayment({
        amount: formData.amount,
        currency: 'EUR',
        paymentMethod: formData.paymentMethod,
        // ... autres données
      });

      // Paiement réussi
      console.log('Payment successful:', result);
      // Rediriger vers la page de succès

    } catch (paymentError) {
      // L'erreur est déjà gérée par le hook
      console.error('Payment failed:', paymentError);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-800">{error.title}</h3>
          <button onClick={clearError} className="text-red-600 hover:text-red-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-red-700 mb-4">{error.message}</p>
        
        <div className="mb-4">
          <h4 className="font-medium text-red-800 mb-2">Suggestions :</h4>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {getSuggestions().map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
        
        <div className="flex space-x-3">
          {canRetry() && (
            <button
              onClick={clearError}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          )}
          <button
            onClick={() => navigateToErrorPage()}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Plus d'aide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Votre formulaire de paiement ici */}
      <button
        onClick={() => handleSubmit({ amount: 29.99, paymentMethod: 'card' })}
        disabled={isLoading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
      >
        {isLoading ? 'Traitement...' : 'Payer maintenant'}
      </button>
    </div>
  );
};