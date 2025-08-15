// C:\my-med-platform\frontend\src\pages/AdminUsers.js
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase'; // Ajusté à partir de src/firebase.js
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const AdminUsers = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Filtrer les doublons basés sur email
        const uniqueUsers = Array.from(
          new Map(usersList.map(user => [user.email, user])).values()
        );
        setUsers(uniqueUsers);
      } catch (err) {
        setError(language === 'fr' ? `Erreur lors du chargement des utilisateurs : ${err.message}` : `خطأ أثناء تحميل المستخدمين : ${err.message}`);
        console.error('Erreur fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [language]);

  const handleDelete = async (userId) => {
    if (window.confirm(language === 'fr' ? 'Confirmer la suppression ?' : 'تأكيد الحذف؟')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        setError(language === 'fr' ? `Erreur lors de la suppression : ${err.message}` : `خطأ أثناء الحذف : ${err.message}`);
        console.error('Erreur delete user:', err);
      }
    }
  };

  const t = {
    fr: {
      name: 'Nom',
      email: 'Email',
      role: 'Rôle',
      semester: 'Semestre',
      subscription: 'Abonnement',
      status: 'Statut',
      delete: 'Supprimer',
    },
    ar: {
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      role: 'الدور',
      semester: 'الفصل الدراسي',
      subscription: 'الاشتراك',
      status: 'الحالة',
      delete: 'حذف',
    },
  }[language];

  return (
    <div className="page-container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Gestion des utilisateurs' : 'إدارة المستخدمين'}
      </h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p>{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</p>
      ) : (
        <div className="space-y-4">
          {users.length === 0 ? (
            <p>{language === 'fr' ? 'Aucun utilisateur trouvé.' : 'لا يوجد مستخدمون.'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b">{t.name}</th>
                    <th className="py-2 px-4 border-b">{t.email}</th>
                    <th className="py-2 px-4 border-b">{t.role}</th>
                    <th className="py-2 px-4 border-b">{t.semester}</th>
                    <th className="py-2 px-4 border-b">{t.subscription}</th>
                    <th className="py-2 px-4 border-b">{t.status}</th>
                    <th className="py-2 px-4 border-b">{t.delete}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{user.displayName || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{user.email || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{user.role || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{user.semester || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">
                        {user.subscription?.type || 'N/A'} ({user.subscription?.status || 'N/A'})
                      </td>
                      <td className="py-2 px-4 border-b">{user.subscriptionStatus || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                        >
                          {t.delete}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;