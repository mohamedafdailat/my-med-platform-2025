import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Shield,
  Home,
  Play,
  BookOpen,
  CreditCard,
  BarChart3,
  UserCircle,
  LogIn,
  UserPlus,
  Key,
  Book,
} from 'lucide-react';

const Header = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { language } = useLanguage();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigate = useNavigate();
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);
  const isRTL = language === 'ar';

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleUserMenu = () => setIsUserMenuOpen((prev) => !prev);

  const isAdmin = useCallback((currentUser) => {
    return (
      currentUser?.customClaims?.role === 'admin'
    );
  }, []);

  const isAuthenticatedAndPaid = useCallback(() => {
    if (authLoading || !user) return false;

    const isStudent =
      user?.role === 'student' ||
      user?.customClaims?.role === 'student' ||
      (!user?.role && !user?.customClaims?.role);

    return user.customClaims?.unlimitedAccess === true || (isStudent && user.subscriptionStatus === 'paid');
  }, [authLoading, user]);

  const navigationItems = useMemo(
    () => [
      { path: '/', icon: Home, labelFr: 'Accueil', labelAr: 'الرئيسية', requiresPaid: false },
      { path: '/videos', icon: Play, labelFr: 'Vidéos', labelAr: 'الفيديوهات', requiresPaid: true },
      { path: '/quizzes', icon: BookOpen, labelFr: 'Quiz', labelAr: 'الاختبارات', requiresPaid: true },
      { path: '/courses', icon: BookOpen, labelFr: 'Cours', labelAr: 'الدورات', requiresPaid: true },
      { path: '/flashcards', icon: CreditCard, labelFr: 'Flashcards', labelAr: 'البطاقات التعليمية', requiresPaid: true },
      { path: '/dashboard', icon: BarChart3, labelFr: 'Tableau de bord', labelAr: 'لوحة التحكم', requiresPaid: false },
    ],
    []
  );

  const userMenuItems = useMemo(
    () =>
      user
        ? [
            { path: '/profile', icon: UserCircle, labelFr: 'Profil', labelAr: 'الملف الشخصي', requiresPaid: false },
            { path: '/settings', icon: Settings, labelFr: 'Paramètres', labelAr: 'الإعدادات', requiresPaid: false },
            ...(isAdmin(user)
              ? [{ path: '/admin', icon: Shield, labelFr: 'Admin', labelAr: 'الإدارة', requiresPaid: false }]
              : []),
          ]
        : [
            { path: '/login', icon: LogIn, labelFr: 'Connexion', labelAr: 'تسجيل الدخول', requiresPaid: false },
            { path: '/register', icon: UserPlus, labelFr: 'Inscription', labelAr: 'التسجيل', requiresPaid: false },
            { path: '/forgot-password', icon: Key, labelFr: 'Mot de passe oublié', labelAr: 'نسيت كلمة المرور', requiresPaid: false },
          ],
    [user, isAdmin]
  );

  const semesterLabel = useMemo(() => {
    if (!user?.semester) return null;

    const semesterStr = String(user.semester);

    return language === 'fr'
      ? `Semestre ${semesterStr}`
      : `الفصل الدراسي ${semesterStr}`;
  }, [user, language]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
      setIsUserMenuOpen(false);
      setIsMenuOpen(false);
      navigate('/login');
      alert(language === 'fr' ? 'Déconnexion réussie !' : 'تم تسجيل الخروج بنجاح !');
    } catch (error) {
      alert(
        language === 'fr'
          ? `Erreur lors de la déconnexion : ${error.message}`
          : `حدث خطأ أثناء تسجيل الخروج: ${error.message}`
      );
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, navigate, language]);

  const handleNavClick = useCallback(
    () => {
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
    },
    []
  );

  const handleKeyDown = useCallback((event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }, []);

  const renderNavItem = (item, mobile = false) => {
    const Icon = item.icon;
    const isAdminUser = isAdmin(user);
    const requiresPaid = item.requiresPaid && !isAdminUser;
    const isAccessible = !requiresPaid || (isAuthenticatedAndPaid() && !isAdminUser);
    const label = language === 'fr' ? item.labelFr : item.labelAr;

    const baseClass = mobile
      ? 'flex items-center px-4 py-3 rounded-lg text-base font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-100 transition-all duration-200'
      : 'flex items-center px-4 py-2 rounded-full text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-100 transition-all duration-200';

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `${baseClass} ${
            isActive && isAccessible ? 'bg-blue-100 text-blue-700 shadow-sm' : ''
          }`
        }
        onClick={(event) => handleNavClick(event, isAccessible, isAdminUser)}
        aria-label={label}
      >
        <Icon className={mobile ? 'w-5 h-5 mr-3' : 'w-4 h-4 mr-2'} aria-hidden="true" />
        {label}
      </NavLink>
    );
  };

  const renderUserMenuItem = (item, mobile = false) => {
    const Icon = item.icon;
    const isAdminUser = isAdmin(user);
    const requiresPaid = item.requiresPaid && !isAdminUser;
    const isAccessible = !requiresPaid || (isAuthenticatedAndPaid() && !isAdminUser);
    const label = language === 'fr' ? item.labelFr : item.labelAr;

    const baseClass = mobile
      ? 'flex items-center px-4 py-3 rounded-lg text-base font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200'
      : 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-150';

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `${baseClass} ${
            isActive && isAccessible ? 'bg-blue-50 text-blue-700' : ''
          }`
        }
        onClick={(event) => handleNavClick(event, isAccessible, isAdminUser)}
        aria-label={label}
      >
        <Icon className={mobile ? 'w-5 h-5 mr-3' : 'w-4 h-4 mr-3'} aria-hidden="true" />
        {label}
      </NavLink>
    );
  };

  if (authLoading) {
    return (
      <div className="h-16 bg-gradient-to-r from-blue-50 to-indigo-50 animate-pulse flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <nav
      className={`site-header bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md border-b border-gray-200 sticky top-0 z-50 transition-all duration-300 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="site-header-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <NavLink
              to="/"
              className="header-brand flex items-center space-x-2 hover:opacity-90 transition-opacity duration-200"
              aria-label="MedPlatform Maroc"
              onClick={() => setIsMenuOpen(false)}
            >
              <img
                src="/logo-horizontal.png"
                alt="MedPlatform Maroc Logo"
                className="header-logo h-10 w-auto object-contain"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/footer.png';
                }}
              />
            </NavLink>
          </div>

          <div className="hidden lg:flex items-center space-x-2">
            {navigationItems.map((item) => renderNavItem(item))}
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <div>
                  <button
                    onClick={toggleUserMenu}
                    onKeyDown={(event) => handleKeyDown(event, toggleUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-100 transition-all duration-200"
                    aria-expanded={isUserMenuOpen}
                    aria-controls="user-menu"
                    aria-label={language === 'fr' ? 'Menu utilisateur' : 'قائمة المستخدم'}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>

                    <span className="hidden sm:inline max-w-28 truncate font-medium">
                      {user.displayName || user.email}
                    </span>

                    {isAdmin(user) && (
                      <span className="hidden lg:inline ml-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Admin
                      </span>
                    )}

                    {(user.role || user.semester) && (
                      <span className="hidden lg:inline ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {user.role === 'student'
                          ? language === 'fr'
                            ? 'Étudiant'
                            : 'طالب'
                          : user.role || ''}
                        {user.semester && user.role
                          ? ` - ${semesterLabel}`
                          : user.semester
                            ? semesterLabel
                            : ''}
                      </span>
                    )}
                  </button>

                  {isUserMenuOpen && (
                    <div
                      id="user-menu"
                      className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-fade-in"
                    >
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                        <span>
                          {language === 'fr' ? 'Connecté en tant que' : 'متصل كـ'}{' '}
                        </span>
                        <span className="font-medium text-gray-700">
                          {user.displayName || user.email}
                        </span>

                        {(user.role || user.semester) && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {isAdmin(user) && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Admin
                              </span>
                            )}

                            {user.role && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {user.role === 'student'
                                  ? language === 'fr'
                                    ? 'Étudiant'
                                    : 'طالب'
                                  : user.role}
                              </span>
                            )}

                            {user.semester && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                                <Book className="w-3 h-3 mr-1" />
                                {semesterLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {userMenuItems.map((item) => renderUserMenuItem(item))}

                      <hr className="my-2 border-gray-200" />

                      <button
                        onClick={handleLogout}
                        onKeyDown={(event) => handleKeyDown(event, handleLogout)}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-150 disabled:opacity-50"
                        disabled={isLoggingOut}
                        aria-label={language === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}
                      >
                        {isLoggingOut ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500 mr-3" />
                        ) : (
                          <LogOut className="w-4 h-4 mr-3" aria-hidden="true" />
                        )}
                        {language === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-3">
                  <NavLink
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all duration-200"
                    aria-label={language === 'fr' ? 'Connexion' : 'تسجيل الدخول'}
                  >
                    {language === 'fr' ? 'Connexion' : 'تسجيل الدخول'}
                  </NavLink>

                  <NavLink
                    to="/register"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                    aria-label={language === 'fr' ? 'Inscription' : 'التسجيل'}
                  >
                    {language === 'fr' ? 'Inscription' : 'التسجيل'}
                  </NavLink>
                </div>
              )}
            </div>

            <button
              onClick={toggleMenu}
              onKeyDown={(event) => handleKeyDown(event, toggleMenu)}
              className="lg:hidden p-2 rounded-full text-gray-700 hover:text-blue-600 hover:bg-blue-100 transition-all duration-200"
              aria-label={
                isMenuOpen
                  ? language === 'fr'
                    ? 'Fermer le menu'
                    : 'إغلاق القائمة'
                  : language === 'fr'
                    ? 'Ouvrir le menu'
                    : 'فتح القائمة'
              }
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div
            id="mobile-menu"
            ref={menuRef}
            className="lg:hidden fixed inset-0 bg-white z-50 pt-6 px-4 transform transition-transform duration-300 ease-in-out"
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <NavLink
                to="/"
                className="header-brand flex items-center"
                onClick={() => setIsMenuOpen(false)}
                aria-label="MedPlatform Maroc"
              >
                <img
                  src="/logo-horizontal.png"
                  alt="MedPlatform Maroc Logo"
                  className="header-logo h-10 w-auto object-contain"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = '/footer.png';
                  }}
                />
              </NavLink>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full text-gray-700 hover:text-blue-600 hover:bg-blue-100"
                aria-label={language === 'fr' ? 'Fermer le menu' : 'إغلاق القائمة'}
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 py-6">
              {navigationItems.map((item) => renderNavItem(item, true))}

              <hr className="my-4 border-gray-200" />

              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-500">
                    <span>{language === 'fr' ? 'Connecté en tant que' : 'متصل كـ'} </span>
                    <span className="font-medium text-gray-700">
                      {user.displayName || user.email}
                    </span>

                    {(user.role || user.semester) && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {isAdmin(user) && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Admin
                          </span>
                        )}

                        {user.role && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {user.role === 'student'
                              ? language === 'fr'
                                ? 'Étudiant'
                                : 'طالب'
                              : user.role}
                          </span>
                        )}

                        {user.semester && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                            <Book className="w-3 h-3 mr-1" />
                            {semesterLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {userMenuItems.map((item) => renderUserMenuItem(item, true))}

                  <button
                    onClick={handleLogout}
                    onKeyDown={(event) => handleKeyDown(event, handleLogout)}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                    disabled={isLoggingOut}
                    aria-label={language === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}
                  >
                    {isLoggingOut ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500 mr-3" />
                    ) : (
                      <LogOut className="w-5 h-5 mr-3" aria-hidden="true" />
                    )}
                    {language === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  {userMenuItems.map((item) => renderUserMenuItem(item, true))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
