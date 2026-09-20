// C:\my-med-platform\frontend\src\pages\AdminUsers.js

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toDate } from '../utils/dates';
import {
  Users,
  Search,
  Power,
  ShieldCheck,
  GraduationCap,
  Mail,
  RefreshCcw,
  Save,
  XCircle,
  CheckCircle,
  CreditCard,
} from 'lucide-react';

const AdminUsers = () => {
  const { language } = useLanguage();
  const { user: currentUser } = useAuth();
  const isRTL = language === 'ar';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');

  const t = {
    fr: {
      pageTitle: 'Gestion des utilisateurs',
      subtitle: 'Consultez, filtrez et gérez les comptes utilisateurs de la plateforme.',
      loading: 'Chargement...',
      noUsers: 'Aucun utilisateur trouvé.',
      searchPlaceholder: 'Rechercher par nom, email ou téléphone...',
      allRoles: 'Tous les rôles',
      allSubscriptions: 'Tous les abonnements',
      name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      role: 'Rôle',
      semester: 'Semestre',
      subscription: 'Abonnement',
      status: 'Statut',
      createdAt: 'Créé le',
      actions: 'Actions',
      delete: 'Désactiver',
      enable: 'Réactiver',
      missingAccount: 'Profil sans compte de connexion',
      save: 'Enregistrer',
      refresh: 'Actualiser',
      admin: 'Admin',
      student: 'Étudiant',
      teacher: 'Enseignant',
      user: 'Utilisateur',
      paid: 'Payé',
      unpaid: 'Non payé',
      free: 'Gratuit',
      active: 'Actif',
      inactive: 'Inactif',
      unknown: 'N/A',
      confirmDelete: 'Désactiver la connexion de cet utilisateur ? Ses données seront conservées.',
      totalUsers: 'Utilisateurs',
      paidUsers: 'Abonnés payants',
      students: 'Étudiants',
      admins: 'Admins',
      loadError: 'Erreur lors du chargement des utilisateurs',
      deleteError: 'Erreur lors de la modification de l’accès',
      updateError: 'Erreur lors de la mise à jour',
      deleteSuccess: 'Accès au compte mis à jour. Les données sont conservées.',
      updateSuccess: 'Utilisateur mis à jour.',
    },
    ar: {
      pageTitle: 'إدارة المستخدمين',
      subtitle: 'عرض وتصفية وإدارة حسابات مستخدمي المنصة.',
      loading: 'جاري التحميل...',
      noUsers: 'لا يوجد مستخدمون.',
      searchPlaceholder: 'البحث بالاسم أو البريد أو الهاتف...',
      allRoles: 'كل الأدوار',
      allSubscriptions: 'كل الاشتراكات',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      role: 'الدور',
      semester: 'الفصل',
      subscription: 'الاشتراك',
      status: 'الحالة',
      createdAt: 'تاريخ الإنشاء',
      actions: 'الإجراءات',
      delete: 'تعطيل',
      enable: 'إعادة التفعيل',
      missingAccount: 'ملف شخصي بدون حساب دخول',
      save: 'حفظ',
      refresh: 'تحديث',
      admin: 'مشرف',
      student: 'طالب',
      teacher: 'أستاذ',
      user: 'مستخدم',
      paid: 'مدفوع',
      unpaid: 'غير مدفوع',
      free: 'مجاني',
      active: 'نشط',
      inactive: 'غير نشط',
      unknown: 'غير متوفر',
      confirmDelete: 'هل تريد تعطيل الدخول لهذا المستخدم مع الاحتفاظ ببياناته؟',
      totalUsers: 'المستخدمون',
      paidUsers: 'المشتركون المدفوعون',
      students: 'الطلاب',
      admins: 'المشرفون',
      loadError: 'خطأ أثناء تحميل المستخدمين',
      deleteError: 'خطأ أثناء تعديل الوصول',
      updateError: 'خطأ أثناء التحديث',
      deleteSuccess: 'تم تحديث الوصول إلى الحساب مع الاحتفاظ بالبيانات.',
      updateSuccess: 'تم تحديث المستخدم.',
    },
  }[language];

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const showMessage = (type, message) => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }

    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 4500);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const usersList = [];
      let cursor;
      do {
        const { data } = await api.get('/users', { params: cursor ? { cursor } : {} });
        usersList.push(...data.users);
        cursor = data.nextCursor;
      } while (cursor);
      usersList.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
      setUsers(usersList);
    } catch (err) {
      console.error('Erreur fetch users:', err);
      showMessage('error', `${t.loadError} : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (user) => {
    return (
      user.fullName ||
      user.displayName ||
      user.name ||
      user.email?.split('@')?.[0] ||
      t.unknown
    );
  };

  const getSubscriptionStatus = (user) => {
    return (
      user.subscriptionStatus ||
      user.subscription?.status ||
      user.status ||
      'unpaid'
    );
  };

  const getSubscriptionType = (user) => {
    return user.subscription?.type || user.plan || user.subscriptionType || 'free';
  };

  const getLocalizedSubscription = (status) => {
    const normalizedStatus = status || 'unpaid';
    const labels = {
      paid: t.paid,
      unpaid: t.unpaid,
      free: t.free,
      active: t.active,
      inactive: t.inactive,
    };

    return labels[normalizedStatus] || normalizedStatus;
  };

  const formatDate = (value) => {
    if (!value) return t.unknown;

    let date;

    if (value?.toDate) {
      date = value.toDate();
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) return t.unknown;

    return language === 'fr'
      ? date.toLocaleDateString('fr-FR')
      : date.toLocaleDateString('ar-MA');
  };

  const handleDelete = async (userId) => {
    const target = users.find((user) => user.id === userId);
    if (!target || (!target.disabled && !window.confirm(t.confirmDelete))) return;

    try {
      setSavingUserId(userId);
      const { data } = await api.patch(`/users/${encodeURIComponent(userId)}`, { disabled: !target.disabled });
      setUsers((prev) => prev.map((user) => user.id === userId ? data : user));
      showMessage('success', t.deleteSuccess);
    } catch (err) {
      console.error('Erreur delete user:', err);
      showMessage('error', `${t.deleteError} : ${err.message}`);
    } finally {
      setSavingUserId(null);
    }
  };

  const handleLocalChange = (userId, field, value) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;

        if (field === 'subscriptionType') {
          return {
            ...user,
            subscription: {
              ...(user.subscription || {}),
              type: value,
            },
          };
        }

        return {
          ...user,
          [field]: value,
        };
      })
    );
  };

  const handleSaveUser = async (user) => {
    try {
      setSavingUserId(user.id);

      const payload = {
        role: user.role || 'user',
        subscriptionStatus: getSubscriptionStatus(user),
        subscription: {
          type: getSubscriptionType(user),
        },
      };

      const { data } = await api.patch(`/users/${encodeURIComponent(user.id)}`, payload);

      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? {
                ...item,
                ...data,
              }
            : item
        )
      );

      showMessage('success', t.updateSuccess);
    } catch (err) {
      console.error('Erreur update user:', err);
      showMessage('error', `${t.updateError} : ${err.message}`);
    } finally {
      setSavingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = searchTerm.toLowerCase().trim();

      const name = getUserName(user).toLowerCase();
      const email = String(user.email || '').toLowerCase();
      const phone = String(user.phoneNumber || user.phone || '').toLowerCase();

      const matchesSearch =
        !search ||
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      const subscriptionStatus = getSubscriptionStatus(user);
      const matchesSubscription =
        subscriptionFilter === 'all' ||
        subscriptionStatus === subscriptionFilter ||
        getSubscriptionType(user) === subscriptionFilter;

      return matchesSearch && matchesRole && matchesSubscription;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchTerm, roleFilter, subscriptionFilter, language]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      paid: users.filter((user) => getSubscriptionStatus(user) === 'paid').length,
      students: users.filter((user) => user.role === 'student').length,
      admins: users.filter((user) => user.role === 'admin').length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const statusBadgeClass = (status) => {
    if (status === 'paid' || status === 'active') {
      return 'bg-green-100 text-green-700 border-green-200';
    }

    if (status === 'unpaid' || status === 'inactive') {
      return 'bg-red-100 text-red-700 border-red-200';
    }

    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <main
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                <Users className="h-4 w-4" />
                Admin Users
              </div>

              <h1 className="text-3xl font-bold md:text-5xl">
                {t.pageTitle}
              </h1>

              <p className="mt-4 max-w-3xl text-blue-100">
                {t.subtitle}
              </p>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </button>
          </div>
        </header>

        {(error || success) && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {error ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{error || success}</span>
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t.totalUsers}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t.paidUsers}</p>
                <p className="mt-2 text-3xl font-bold text-green-700">{stats.paid}</p>
              </div>
              <CreditCard className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t.students}</p>
                <p className="mt-2 text-3xl font-bold text-indigo-700">{stats.students}</p>
              </div>
              <GraduationCap className="h-10 w-10 text-indigo-600" />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t.admins}</p>
                <p className="mt-2 text-3xl font-bold text-purple-700">{stats.admins}</p>
              </div>
              <ShieldCheck className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">{t.allRoles}</option>
              <option value="admin">{t.admin}</option>
              <option value="student">{t.student}</option>
              <option value="teacher">{t.teacher}</option>
              <option value="user">{t.user}</option>
            </select>

            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="rounded-xl border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">{t.allSubscriptions}</option>
              <option value="paid">{t.paid}</option>
              <option value="unpaid">{t.unpaid}</option>
              <option value="free">{t.free}</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl bg-gray-50 p-10 text-gray-500">
              <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
              {t.loading}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-10 text-center text-gray-500">
              {t.noUsers}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <thead>
                  <tr className="bg-gray-50 text-left text-sm font-semibold text-gray-700">
                    <th className="whitespace-nowrap px-4 py-4">{t.name}</th>
                    <th className="whitespace-nowrap px-4 py-4">{t.email}</th>
                    <th className="whitespace-nowrap px-4 py-4">{t.phone}</th>
                    <th className="whitespace-nowrap px-4 py-4">{t.role}</th>
                    <th className="whitespace-nowrap px-4 py-4">{t.semester}</th>
                    <th className="whitespace-nowrap px-4 py-4">{t.subscription}</th>
                    <th className="whitespace-nowrap px-4 py-4">{t.status}</th>
                    <th className="whitespace-nowrap px-4 py-4">{t.createdAt}</th>
                    <th className="whitespace-nowrap px-4 py-4 text-center">{t.actions}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const subscriptionStatus = getSubscriptionStatus(user);
                    const subscriptionType = getSubscriptionType(user);

                    return (
                      <tr key={user.id} className="hover:bg-blue-50/50">
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                              {getUserName(user).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {getUserName(user)}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {user.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {user.email || t.unknown}
                            {!user.accountExists && <span className="text-xs text-amber-700">{t.missingAccount}</span>}
                            {user.disabled && <span className="text-xs text-red-700">{t.inactive}</span>}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                          {user.phoneNumber || user.phone || t.unknown}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <select
                            value={user.role || 'user'}
                            disabled={!user.accountExists || user.id === currentUser?.uid}
                            onChange={(e) =>
                              handleLocalChange(user.id, 'role', e.target.value)
                            }
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option value="user">{t.user}</option>
                            <option value="student">{t.student}</option>
                            <option value="teacher">{t.teacher}</option>
                            <option value="admin">{t.admin}</option>
                          </select>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                          {user.semester || t.unknown}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <select
                            value={subscriptionType}
                            onChange={(e) =>
                              handleLocalChange(
                                user.id,
                                'subscriptionType',
                                e.target.value
                              )
                            }
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option value="free">{t.free}</option>
                            <option value="student">{t.student}</option>
                            <option value="monthly">Mensuel</option>
                            <option value="annual">Annuel</option>
                          </select>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <select
                              value={subscriptionStatus}
                              onChange={(e) =>
                                handleLocalChange(
                                  user.id,
                                  'subscriptionStatus',
                                  e.target.value
                                )
                              }
                              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            >
                              <option value="unpaid">{t.unpaid}</option>
                              <option value="paid">{t.paid}</option>
                              <option value="free">{t.free}</option>
                              <option value="active">{t.active}</option>
                              <option value="inactive">{t.inactive}</option>
                            </select>

                            <span
                              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                                subscriptionStatus
                              )}`}
                            >
                              {getLocalizedSubscription(subscriptionStatus)}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                          {formatDate(user.createdAt)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleSaveUser(user)}
                              disabled={savingUserId === user.id || !user.accountExists}
                              className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                            >
                              {savingUserId === user.id ? (
                                <RefreshCcw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                              {t.save}
                            </button>

                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={savingUserId === user.id || !user.accountExists || user.id === currentUser?.uid}
                              className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                              <Power className="h-4 w-4" />
                              {user.disabled ? t.enable : t.delete}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminUsers;
