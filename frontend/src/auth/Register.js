import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase'; // Ensure firebase.js is configured
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '../contexts/ToastContext'; // Import useToast hook

const Register = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { success, error } = useToast(); // Destructure success and error functions

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    semester: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    subscriptionStatus: 'unpaid',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = language === 'fr' ? 'Nom complet requis' : 'الاسم الكامل مطلوب';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = language === 'fr' ? 'Nom trop court' : 'الاسم قصير جداً';
    }
    if (!formData.email) {
      newErrors.email = language === 'fr' ? 'Email requis' : 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = language === 'fr' ? 'Email invalide' : 'بريد إلكتروني غير صالح';
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = language === 'fr' ? 'Numéro de téléphone requis' : 'رقم الهاتف مطلوب';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = language === 'fr' ? 'Numéro invalide' : 'رقم غير صالح';
    }
    if (!formData.semester) {
      newErrors.semester = language === 'fr' ? 'Semestre requis' : 'الفصل الدراسي مطلوب';
    } else if (!/^\d{1,2}$/.test(formData.semester) || parseInt(formData.semester) > 12) {
      newErrors.semester = language === 'fr' ? 'Semestre invalide (1-12)' : 'فصل دراسي غير صالح (1-12)';
    }
    if (!formData.password) {
      newErrors.password = language === 'fr' ? 'Mot de passe requis' : 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = language === 'fr' ? 'Minimum 6 caractères' : 'أقل 6 أحرف';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = language === 'fr' ? 'Les mots de passe ne correspondent pas' : 'كلمتا المرور غير متطابقتان';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Real-time validation
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'fullName':
        return !value.trim() ? (language === 'fr' ? 'Nom complet requis' : 'الاسم الكامل مطلوب') :
               value.trim().length < 3 ? (language === 'fr' ? 'Nom trop court' : 'الاسم قصير جداً') : '';
      case 'email':
        return !value ? (language === 'fr' ? 'Email requis' : 'البريد الإلكتروني مطلوب') :
               !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? (language === 'fr' ? 'Email invalide' : 'بريد إلكتروني غير صالح') : '';
      case 'phoneNumber':
        return !value ? (language === 'fr' ? 'Numéro de téléphone requis' : 'رقم الهاتف مطلوب') :
               !/^\+?[\d\s-]{10,}$/.test(value) ? (language === 'fr' ? 'Numéro invalide' : 'رقم غير صالح') : '';
      case 'semester':
        return !value ? (language === 'fr' ? 'Semestre requis' : 'الفصل الدراسي مطلوب') :
               !/^\d{1,2}$/.test(value) || parseInt(value) > 12 ? (language === 'fr' ? 'Semestre invalide (1-12)' : 'فصل دراسي غير صالح (1-12)') : '';
      case 'password':
        return !value ? (language === 'fr' ? 'Mot de passe requis' : 'كلمة المرور مطلوبة') :
               value.length < 6 ? (language === 'fr' ? 'Minimum 6 caractères' : 'أقل 6 أحرف') : '';
      case 'confirmPassword':
        return formData.password !== value ? (language === 'fr' ? 'Les mots de passe ne correspondent pas' : 'كلمتا المرور غير متطابقتان') : '';
      default:
        return '';
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Store semester as a string to match Header component expectations
      await setDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        semester: formData.semester, // Stored as string
        role: formData.role,
        subscriptionStatus: formData.subscriptionStatus,
        createdAt: new Date().toISOString(),
        lastLogin: null,
      });

      success(language === 'fr' ? 'Inscription réussie !' : 'تم التسجيل بنجاح !');
      navigate('/login');
    } catch (err) {
      error(language === 'fr' ? 'Échec de l\'inscription' : 'فشل التسجيل');
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleRegister} className="auth-form">
        <h2 className="auth-title">{language === 'fr' ? 'Inscription' : 'تسجيل'}</h2>
        <div className="form-group">
          <label>{language === 'fr' ? 'Nom complet' : 'الاسم الكامل'}</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder={language === 'fr' ? 'Ex: Jean Dupont' : 'مثال: محمد أحمد'}
            className={`form-input ${errors.fullName ? 'error' : ''}`}
            required
          />
          {errors.fullName && <span className="error-message">{errors.fullName}</span>}
        </div>
        <div className="form-group">
          <label>{language === 'fr' ? 'Email' : 'البريد الإلكتروني'}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="exemple@email.com"
            className={`form-input ${errors.email ? 'error' : ''}`}
            required
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label>{language === 'fr' ? 'Numéro de téléphone' : 'رقم الهاتف'}</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder={language === 'fr' ? '+212 6 12 34 56 78' : '+212 6 12 34 56 78'}
            className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
            required
          />
          {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
        </div>
        <div className="form-group">
          <label>{language === 'fr' ? 'Semestre' : 'الفصل الدراسي'}</label>
          <input
            type="number"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            placeholder={language === 'fr' ? 'Ex: 1' : 'مثال: 1'}
            min="1"
            max="12"
            className={`form-input ${errors.semester ? 'error' : ''}`}
            required
          />
          {errors.semester && <span className="error-message">{errors.semester}</span>}
        </div>
        <div className="form-group">
          <label>{language === 'fr' ? 'Mot de passe' : 'كلمة المرور'}</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={language === 'fr' ? 'Minimum 6 caractères' : 'أقل 6 أحرف'}
            className={`form-input ${errors.password ? 'error' : ''}`}
            required
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>
        <div className="form-group">
          <label>{language === 'fr' ? 'Confirmer le mot de passe' : 'تأكيد كلمة المرور'}</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder={language === 'fr' ? 'Confirmez votre mot de passe' : 'تأكيد كلمة المرور'}
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            required
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>
        {errors.general && <p className="error-message">{errors.general}</p>}
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (language === 'fr' ? 'Inscription...' : 'جاري التسجيل...') : (language === 'fr' ? 'S\'inscrire' : 'تسجيل')}
        </button>
      </form>
      <p className="auth-link">
        {language === 'fr' ? 'Déjà inscrit ? ' : 'مسجل بالفعل؟ '}
        <a href="/login" className="text-blue-500">Se connecter</a>
      </p>
    </div>
  );
};

export default Register;