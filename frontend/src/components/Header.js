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
  Book
} from 'lucide-react';

const Header = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);
  const isRTL = language === 'ar';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const isAdmin = useCallback((user) => {
    return user?.role === 'admin' || 
           user?.customClaims?.role === 'admin' || 
           user?.email === 'admin_1@medplatform.com';
  }, []);

  const isAuthenticatedAndPaid = useCallback(() => {
    if (authLoading || !user) return false;
    const isStudent = user?.role === 'student' || 
                     user?.customClaims?.role === 'student' || 
                     (!user?.role && !user?.customClaims?.role);
    return isStudent && user.subscriptionStatus === 'paid';
  }, [authLoading, user]);

  const navigationItems = useMemo(() => [
    { path: '/', icon: Home, labelFr: 'Accueil', labelAr: 'الرئيسية', requiresPaid: false },
    { path: '/videos', icon: Play, labelFr: 'Vidéos', labelAr: 'الفيديوهات', requiresPaid: true },
    { path: '/quizzes', icon: BookOpen, labelFr: 'Quiz', labelAr: 'الاختبارات', requiresPaid: true },
    { path: '/courses', icon: BookOpen, labelFr: 'Cours', labelAr: 'الدورات', requiresPaid: true },
    { path: '/flashcards', icon: CreditCard, labelFr: 'Flashcards', labelAr: 'البطاقات التعليمية', requiresPaid: true },
    { path: '/dashboard', icon: BarChart3, labelFr: 'Tableau de bord', labelAr: 'لوحة القيادة', requiresPaid: true }
  ], []);

  const userMenuItems = useMemo(() => user ? [
    { path: '/profile', icon: UserCircle, labelFr: 'Profil', labelAr: 'الملف الشخصي', requiresPaid: false },
    { path: '/settings', icon: Settings, labelFr: 'Paramètres', labelAr: 'الإعدادات', requiresPaid: false },
    ...(isAdmin(user) ? [{ path: '/admin', icon: Shield, labelFr: 'Admin', labelAr: 'الإدارة', requiresPaid: false }] : [])
  ] : [
    { path: '/login', icon: LogIn, labelFr: 'Connexion', labelAr: 'تسجيل الدخول', requiresPaid: false },
    { path: '/register', icon: UserPlus, labelFr: 'Inscription', labelAr: 'التسجيل', requiresPaid: false },
    { path: '/forgot-password', icon: Key, labelFr: 'Mot de passe oublié', labelAr: 'نسيت كلمة المرور', requiresPaid: false }
  ], [user, isAdmin]);

  // Fixed semesterLabel to handle number or undefined semester
  const semesterLabel = useMemo(() => {
    if (!user?.semester) return null;
    // Convert semester to string and extract the number safely
    const semesterStr = typeof user.semester === 'number' 
      ? user.semester.toString() 
      : user.semester.toString(); // Ensure it's a string
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
      navigate('/login');
      alert(language === 'fr' ? 'Déconnexion réussie !' : 'تم تسجيل الخروج بنجاح !');
    } catch (error) {
      alert(language === 'fr' ? `Erreur lors de la déconnexion : ${error.message}` : `حدث خطأ أثناء تسجيل الخروج: ${error.message}`);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, navigate, language]);

  const handleNavClick = useCallback((e, isAccessible, isAdminUser, path) => {
    if (!isAccessible) {
      e.preventDefault();
      if (!isAdminUser) {
        alert(language === 'fr' ? 'Un abonnement payant est requis.' : 'مطلوب اشتراك مدفوع.');
        navigate('/subscription');
      }
    }
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [navigate, language]);

  const handleKeyDown = useCallback((e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  if (authLoading) {
    return (
      <div className="h-16 bg-gradient-to-r from-blue-50 to-indigo-50 animate-pulse flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <nav className={`bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md border-b border-gray-200 sticky top-0 z-50 transition-all duration-300 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <NavLink to="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity duration-200">
              <img 
                src="/footer.png" 
                alt="MedPlatform Maroc Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => { e.target.src = 'https://placehold.co/100x40?text=MedPlatform'; }}
              />
            </NavLink>
          </div>
          <div className="hidden lg:flex items-center space-x-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isAdminUser = isAdmin(user);
              const requiresPaid = item.requiresPaid && !isAdminUser;
              const isAccessible = !requiresPaid || (isAuthenticatedAndPaid() && !isAdminUser);

              return (
                <NavLink
                  key={item.path}
                  to={isAccessible ? item.path : '/subscription'}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-100 transition-all duration-200 ${
                      isActive && isAccessible ? 'bg-blue-100 text-blue-700 shadow-sm' : ''
                    } ${!isAccessible ? 'opacity-60 cursor-not-allowed' : ''}`
                  }
                  onClick={(e) => handleNavClick(e, isAccessible, isAdminUser, item.path)}
                  aria-label={language === 'fr' ? item.labelFr : item.labelAr}
                >
                  <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
                  {language === 'fr' ? item.labelFr : item.labelAr}
                </NavLink>
              );
            })}
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <div>
                  <button
                    onClick={toggleUserMenu}
                    onKeyDown={(e) => handleKeyDown(e, toggleUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-100 transition-all duration-200"
                    aria-expanded={isUserMenuOpen}
                    aria-controls="user-menu"
                    aria-label={language === 'fr' ? 'Menu utilisateur' : 'قائمة المستخدم'}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                    <span className="max-w-28 truncate font-medium">{user.displayName || user.email}</span>
                    {isAdmin(user) && (
                      <span className="ml-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Admin
                      </span>
                    )}
                    {(user.role || user.semester) && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {user.role === 'student' ? (language === 'fr' ? 'Étudiant' : 'طالب') : user.role || ''}
                        {user.semester && user.role ? ` - ${semesterLabel}` : user.semester ? semesterLabel : ''}
                      </span>
                    )}
                  </button>
                  {isUserMenuOpen && (
                    <div id="user-menu" className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                        {language === 'fr' ? 'Connecté en tant que' : 'متصل كـ'} 
                        <span className="font-medium text-gray-700">{user.displayName || user.email}</span>
                        {(user.role || user.semester) && (
                          <div className="mt-1 flex items-center gap-2">
                            {user.role && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {user.role === 'student' ? (language === 'fr' ? 'Étudiant' : 'طالب') : user.role}
                              </span>
                            )}
                            {user.semester && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                                <Book className="w-3 h-3 mr-1" /> {semesterLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        const requiresPaid = item.requiresPaid && !isAdmin(user);
                        const isAccessible = !requiresPaid || (isAuthenticatedAndPaid() && !isAdmin(user));

                        return (
                          <NavLink
                            key={item.path}
                            to={isAccessible ? item.path : '/subscription'}
                            className={({ isActive }) =>
                              `flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 transition-all duration-150 ${
                                isActive && isAccessible ? 'bg-blue-50' : ''
                              } ${!isAccessible ? 'opacity-60 cursor-not-allowed' : ''}`
                            }
                            onClick={(e) => handleNavClick(e, isAccessible, isAdmin(user), item.path)}
                            onKeyDown={(e) => handleKeyDown(e, () => {
                              if (isAccessible) {
                                setIsUserMenuOpen(false);
                                navigate(item.path);
                              } else if (!isAdmin(user)) {
                                alert(language === 'fr' ? 'Un abonnement payant est requis.' : 'مطلوب اشتراك مدفوع.');
                                navigate('/subscription');
                              }
                            })}
                            aria-label={language === 'fr' ? item.labelFr : item.labelAr}
                          >
                            <Icon className="w-4 h-4 mr-3" aria-hidden="true" />
                            {language === 'fr' ? item.labelFr : item.labelAr}
                          </NavLink>
                        );
                      })}
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        onKeyDown={(e) => handleKeyDown(e, handleLogout)}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:scale-105 transition-all duration-150 disabled:opacity-50"
                        disabled={isLoggingOut}
                        aria-label={language === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}
                      >
                        {isLoggingOut ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500 mr-3"></div>
                        ) : (
                          <LogOut className="w-4 h-4 mr-3" aria-hidden="true" />
                        )}
                        {language === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <NavLink
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    aria-label={language === 'fr' ? 'Connexion' : 'تسجيل الدخول'}
                  >
                    {language === 'fr' ? 'Connexion' : 'تسجيل الدخول'}
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                    aria-label={language === 'fr' ? 'Inscription' : 'التسجيل'}
                  >
                    {language === 'fr' ? 'Inscription' : 'التسجيل'}
                  </NavLink>
                </div>
              )}
            </div>
            <button
              onClick={toggleMenu}
              onKeyDown={(e) => handleKeyDown(e, toggleMenu)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-100 transition-all duration-200"
              aria-label={isMenuOpen ? (language === 'fr' ? 'Fermer le menu' : 'إغلاق القائمة') : (language === 'fr' ? 'Ouvrir le menu' : 'فتح القائمة')}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div id="mobile-menu" ref={menuRef} className="lg:hidden fixed inset-0 bg-white z-50 pt-16 px-4 transform transition-transform duration-300 ease-in-out">
            <div className="space-y-3 py-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isAdminUser = isAdmin(user);
                const requiresPaid = item.requiresPaid && !isAdminUser;
                const isAccessible = !requiresPaid || (isAuthenticatedAndPaid() && !isAdminUser);

                return (
                  <NavLink
                    key={item.path}
                    to={isAccessible ? item.path : '/subscription'}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-lg text-base font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-100 hover:scale-105 transition-all duration-200 ${
                        isActive && isAccessible ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-700' : ''
                      } ${!isAccessible ? 'opacity-60 cursor-not-allowed' : ''}`
                    }
                    onClick={(e) => handleNavClick(e, isAccessible, isAdminUser, item.path)}
                    onKeyDown={(e) => handleKeyDown(e, () => {
                      if (isAccessible) {
                        setIsMenuOpen(false);
                        navigate(item.path);
                      } else if (!isAdminUser) {
                        alert(language === 'fr' ? 'Un abonnement payant est requis.' : 'مطلوب اشتراك مدفوع.');
                        navigate('/subscription');
                      }
                    })}
                    aria-label={language === 'fr' ? item.labelFr : item.labelAr}
                  >
                    <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
                    {language === 'fr' ? item.labelFr : item.labelAr}
                  </NavLink>
                );
              })}
              <hr className="my-4 border-gray-200" />
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-500">
                    {language === 'fr' ? 'Connecté en tant que' : 'متصل كـ'} 
                    <span className="font-medium text-gray-700">{user.displayName || user.email}</span>
                    {(user.role || user.semester) && (
                      <div className="mt-1 flex items-center gap-2">
                        {isAdmin(user) && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Admin
                          </span>
                        )}
                        {user.role && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {user.role === 'student' ? (language === 'fr' ? 'Étudiant' : 'طالب') : user.role}
                          </span>
                        )}
                        {user.semester && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                            <Book className="w-3 h-3 mr-1" /> {semesterLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    const requiresPaid = item.requiresPaid && !isAdmin(user);
                    const isAccessible = !requiresPaid || (isAuthenticatedAndPaid() && !isAdmin(user));

                    return (
                      <NavLink
                        key={item.path}
                        to={isAccessible ? item.path : '/subscription'}
                        className={({ isActive }) =>
                          `flex items-center px-4 py-3 rounded-lg text-base font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200 ${
                            isActive && isAccessible ? 'bg-blue-50' : ''
                          } ${!isAccessible ? 'opacity-60 cursor-not-allowed' : ''}`
                        }
                        onClick={(e) => handleNavClick(e, isAccessible, isAdmin(user), item.path)}
                        onKeyDown={(e) => handleKeyDown(e, () => {
                          if (isAccessible) {
                            setIsMenuOpen(false);
                            navigate(item.path);
                          } else if (!isAdmin(user)) {
                            alert(language === 'fr' ? 'Un abonnement payant est requis.' : 'مطلوب اشتراك مدفوع.');
                            navigate('/subscription');
                          }
                        })}
                        aria-label={language === 'fr' ? item.labelFr: item.labelAr}
                      >
                        <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
                        {language === 'fr' ? item.labelFr : item.labelAr}
                      </NavLink>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    onKeyDown={(e) => handleKeyDown(e, handleLogout)}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50 hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    disabled={isLoggingOut}
                    aria-label={language === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}
                  >
                    {isLoggingOut ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500 mr-3"></div>
                    ) : (
                      <LogOut className="w-5 h-5 mr-3" aria-hidden="true" />
                    )}
                    {language === 'fr' ? 'Déconnexion' : 'تسجيل الخروج'}
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-4 py-3 rounded-lg text-base font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200"
                        aria-label={language === 'fr' ? item.labelFr : item.labelAr}
                      >
                        <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
                        {language === 'fr' ? item.labelFr : item.labelAr}
                      </NavLink>
                    );
                  })}
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