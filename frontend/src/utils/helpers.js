import { LANGUAGES } from './constants';

// Formater la date pour l'affichage
export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', options);
};

// Obtenir un message traduit
export const getTranslatedMessage = (messageKey, language, values = {}) => {
  const messages = {
    [LANGUAGES.FRENCH]: {
      required: 'Ce champ est requis.',
      invalidEmail: 'Adresse email invalide.',
      passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères.',
      uploadSuccess: 'Contenu chargé avec succès.',
      uploadError: 'Erreur lors du chargement du contenu.',
    },
    [LANGUAGES.ARABIC]: {
      required: 'هذا الحقل مطلوب.',
      invalidEmail: 'عنوان البريد الإلكتروني غير صالح.',
      passwordTooShort: 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.',
      uploadSuccess: 'تم رفع المحتوى بنجاح.',
      uploadError: 'خطأ أثناء رفع المحتوى.',
    },
  };

  let message = messages[language][messageKey] || messageKey;
  Object.keys(values).forEach((key) => {
    message = message.replace(`{${key}}`, values[key]);
  });
  return message;
};

// Générer un UUID simple
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Convertir un fichier en base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};