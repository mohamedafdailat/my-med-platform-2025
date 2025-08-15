const formatError = (error, language = 'fr') => {
  const messages = {
    fr: {
      notFound: 'Ressource non trouvée.',
      unauthorized: 'Non autorisé.',
      serverError: 'Erreur serveur interne.',
    },
    ar: {
      notFound: 'المورد غير موجود.',
      unauthorized: 'غير مصرح.',
      serverError: 'خطأ داخلي في الخادم.',
    },
  };

  const defaultMessage = messages[language].serverError;
  return {
    message: messages[language][error.code] || defaultMessage,
    details: error.message,
  };
};

const generateRandomId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>&'"]/g, (char) => {
    const escape = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return escape[char];
  });
};

module.exports = {
  formatError,
  generateRandomId,
  sanitizeInput,
};