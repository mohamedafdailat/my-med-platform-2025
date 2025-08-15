// components/ConnectionStatus.js
import React from 'react';
import { useFirebaseConnection } from '../hooks/useFirebaseConnection';
import { useLanguage } from '../contexts/LanguageContext';

const ConnectionStatus = ({ showWhenOnline = false, position = 'top-right' }) => {
  const { language } = useLanguage();
  const { 
    overall, 
    browserOnline, 
    firestoreConnected, 
    lastError, 
    retryCount,
    retryConnection 
  } = useFirebaseConnection();

  // Don't show anything if online and showWhenOnline is false
  if (overall && !showWhenOnline) {
    return null;
  }

  const getStatusMessage = () => {
    if (overall) {
      return language === 'fr' ? 'Connecté' : 'متصل';
    }
    
    if (!browserOnline) {
      return language === 'fr' ? 'Hors ligne' : 'غير متصل';
    }
    
    if (!firestoreConnected) {
      return language === 'fr' ? 'Connexion au serveur interrompue' : 'انقطاع الاتصال بالخادم';
    }
    
    return language === 'fr' ? 'Connexion instable' : 'اتصال غير مستقر';
  };

  const getStatusColor = () => {
    if (overall) return 'bg-green-500';
    if (!browserOnline) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  return (
    <div className={`${getPositionClasses()} max-w-sm`}>
      <div className={`${getStatusColor()} text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2`}>
        <div className={`w-2 h-2 rounded-full ${overall ? 'bg-white' : 'bg-white animate-pulse'}`} />
        <span className="font-medium text-sm">{getStatusMessage()}</span>
        
        {!overall && (
          <div className="flex items-center space-x-2 ml-2">
            {retryCount > 0 && (
              <span className="text-xs opacity-75">
                ({retryCount}/5)
              </span>
            )}
            <button
              onClick={retryConnection}
              className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30 transition-colors"
            >
              {language === 'fr' ? 'Réessayer' : 'إعادة المحاولة'}
            </button>
          </div>
        )}
      </div>
      
      {lastError && !overall && (
        <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs">
          {lastError}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;