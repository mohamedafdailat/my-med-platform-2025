import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Données d'exemple (à remplacer par une API)
  useEffect(() => {
    // Simuler un appel API
    const fetchUsers = async () => {
      const mockUsers = [
        { id: 1, name: 'Ahmed Benali', email: 'ahmed@exemple.ma', role: 'student' },
        { id: 2, name: 'Fatima Zahra', email: 'fatima@exemple.ma', role: 'teacher' },
        { id: 3, name: 'Youssef Amrani', email: 'youssef@exemple.ma', role: 'student' },
      ];
      setUsers(mockUsers);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleRoleChange = (userId, newRole) => {
    // À implémenter avec une API
    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">
          {language === 'fr' ? 'Accès non autorisé.' : 'غير مصرح بالوصول.'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Gestion des Utilisateurs' : 'إدارة المستخدمين'}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <p className="text-center">
            {language === 'fr' ? 'Chargement...' : 'جار التحميل...'}
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-3">{language === 'fr' ? 'Nom' : 'الاسم'}</th>
                <th className="p-3">{language === 'fr' ? 'Email' : 'البريد الإلكتروني'}</th>
                <th className="p-3">{language === 'fr' ? 'Rôle' : 'الدور'}</th>
                <th className="p-3">{language === 'fr' ? 'Actions' : 'الإجراءات'}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="border rounded-md p-1"
                    >
                      <option value="student">{language === 'fr' ? 'Étudiant' : 'طالب'}</option>
                      <option value="teacher">{language === 'fr' ? 'Professeur' : 'أستاذ'}</option>
                      <option value="admin">{language === 'fr' ? 'Admin' : 'مدير'}</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <button className="text-red-500 hover:underline">
                      {language === 'fr' ? 'Supprimer' : 'حذف'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;