import { getTranslatedMessage } from './helpers';
import { LANGUAGES } from './constants';

export const validateForm = (formData, language) => {
  const errors = {};

  // Validation du nom
  if (!formData.name?.trim()) {
    errors.name = getTranslatedMessage('required', language);
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email?.trim()) {
    errors.email = getTranslatedMessage('required', language);
  } else if (!emailRegex.test(formData.email)) {
    errors.email = getTranslatedMessage('invalidEmail', language);
  }

  // Validation du mot de passe
  if (!formData.password?.trim()) {
    errors.password = getTranslatedMessage('required', language);
  } else if (formData.password.length < 6) {
    errors.password = getTranslatedMessage('passwordTooShort', language);
  }

  // Validation du rôle
  if (!formData.role?.trim()) {
    errors.role = getTranslatedMessage('required', language);
  }

  // Validation du fichier (pour l'upload)
  if (formData.file && !formData.file.type) {
    errors.file = getTranslatedMessage('required', language);
  }

  return errors;
};

export const validateLogin = (formData, language) => {
  const errors = {};

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email?.trim()) {
    errors.email = getTranslatedMessage('required', language);
  } else if (!emailRegex.test(formData.email)) {
    errors.email = getTranslatedMessage('invalidEmail', language);
  }

  // Validation du mot de passe
  if (!formData.password?.trim()) {
    errors.password = getTranslatedMessage('required', language);
  }

  return errors;
};

export const validateResetPassword = (formData, language) => {
  const errors = {};

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email?.trim()) {
    errors.email = getTranslatedMessage('required', language);
  } else if (!emailRegex.test(formData.email)) {
    errors.email = getTranslatedMessage('invalidEmail', language);
  }

  return errors;
};