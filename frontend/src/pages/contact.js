import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { NavLink } from 'react-router-dom';

const Contact = () => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState('');

  const t = {
    fr: {
      title: 'Nous Contacter',
      description: 'Nous sommes ici pour vous aider. Contactez-nous pour toute question ou assistance.',
      name: 'Nom',
      email: 'Email',
      message: 'Message',
      send: 'Envoyer',
      success: 'Votre message a été envoyé avec succès !',
      error: 'Une erreur s\'est produite. Veuillez réessayer.',
      contact: 'Informations de contact',
      emailLabel: 'Email :',
      phone: 'Téléphone :',
      address: 'Adresse :',
      back: 'Retour à l\'accueil',
      terms: 'Termes et Conditions',
    },
    ar: {
      title: 'تواصل معنا',
      description: 'نحن هنا لمساعدتك. تواصلوا معنا لأي استفسار أو مساعدة.',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      message: 'الرسالة',
      send: 'إرسال',
      success: 'تم إرسال رسالتك بنجاح!',
      error: 'حدث خطأ. حاول مجددًا.',
      contact: 'معلومات التواصل',
      emailLabel: 'البريد الإلكتروني:',
      phone: 'الهاتف:',
      address: 'العنوان:',
      back: 'العودة إلى الرئيسية',
      terms: 'الشروط والأحكام',
    },
  }[language];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError(t.error);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t.error);
      return;
    }
    // Simulate form submission (replace with API call if needed)
    console.log('Form submitted:', formData);
    setMessageSent(true);
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setMessageSent(false), 5000); // Hide success message after 5s
  };

  return (
    <div className="page-container min-h-[calc(100vh-12rem)] bg-gradient-to-r from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">{t.title}</h1>
        <p className="text-center text-gray-600 mb-6">{t.description}</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">{t.contact}</h2>
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <p><strong>{t.emailLabel}</strong> support@medplatform.ma</p>
            <p><strong>{t.phone}</strong> +212 646-569788</p>
            <p><strong>{t.address}</strong> Casablanca, Maroc</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Formulaire de contact</h2>
          {messageSent && (
            <div className="text-center p-2 mb-4 bg-green-50 text-green-600 rounded-md transition-opacity duration-300" style={{ opacity: messageSent ? 1 : 0 }}>
              {t.success}
            </div>
          )}
          {error && (
            <div className="text-center p-2 mb-4 bg-red-50 text-red-600 rounded-md transition-opacity duration-300" style={{ opacity: error ? 1 : 0 }}>
              {t.error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t.name}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t.email}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">{t.message}</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-24"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t.send}
            </button>
          </form>
        </section>

        <div className="mt-6 text-center">
          <NavLink to="/" className="text-blue-600 hover:text-blue-800 underline mr-4">{t.back}</NavLink>
          <NavLink to="/terms" className="text-blue-600 hover:text-blue-800 underline">{t.terms}</NavLink>
        </div>
      </div>
    </div>
  );
};

export default Contact;