import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const UserProfile = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${id}`);
        if (!response.ok) throw new Error(`Utilisateur non trouvé (${response.status})`);
        const data = await response.json();
        setUser(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  if (loading) return <p>{language === 'fr' ? 'Chargement...' : 'جارٍ التحميل...'}</p>;
  if (error) return <p>{language === 'fr' ? `Erreur: ${error}` : `خطأ: ${error}`}</p>;
  if (!user) return <p>{language === 'fr' ? 'Utilisateur non disponible' : 'المستخدم غير متاح'}</p>;

  return (
    <div className="page-container">
      <h1>{user.displayName}</h1>
      <p>Nom complet: {user.displayName}</p> {/* Use displayName instead of email */}
      <p>Email: {user.email}</p> {/* Keep email as secondary info if needed */}
      <p>Rôle: {language === 'fr' ? user.role : user.role === 'student' ? 'طالب' : user.role === 'teacher' ? 'معلم' : 'مسؤول'}</p>
      <h3>{language === 'fr' ? 'Statistiques' : 'إحصائيات'}</h3>
      <ul>
        {Object.entries(user.stats || {}).map(([key, value]) => (
          <li key={key}>{language === 'fr' ? key : key === 'coursesCompleted' ? 'دورات مكتملة' : key}: {value}</li>
        ))}
      </ul>
      <NavLink to="/users" className="btn-primary mt-4">
        {language === 'fr' ? 'Retour aux utilisateurs' : 'العودة إلى المستخدمين'}
      </NavLink>
    </div>
  );
};

export default UserProfile;