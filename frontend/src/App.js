import React, { lazy, Suspense, useEffect, Component, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { PaymentProvider, PaymentErrorDisplay, PaymentSuccessDisplay } from './contexts/PaymentContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/Header';
import Footer from './common/Footer';
import Contact from './pages/contact';
import PrivacyPolicy from './components/PrivacyPolicy';
import Chatbot from './components/Chatbot';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Lazy load components avec gestion d'erreurs améliorée
const Home = lazy(() => import('./pages/Home').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la page d'accueil" /> })));
const Videos = lazy(() => import('./pages/Videos').catch(() => ({ default: () => <ErrorPage message="Impossible de charger les vidéos" /> })));
const VideoPlayer = lazy(() => import('./pages/VideoPlayer').catch(() => ({ default: () => <ErrorPage message="Impossible de charger le lecteur vidéo" /> })));
const Quizzes = lazy(() => import('./pages/Quizzes').catch(() => ({ default: () => <ErrorPage message="Impossible de charger les quiz" /> })));
const QuizPlayer = lazy(() => import('./pages/QuizPlayer').catch(() => ({ default: () => <ErrorPage message="Impossible de charger le quiz" /> })));
const QuizGenerator = lazy(() => import('./pages/QuizzGenerator').catch(() => ({ default: () => <ErrorPage message="Impossible de charger le générateur de quiz" /> })));
const Courses = lazy(() => import('./pages/Courses').catch(() => ({ default: () => <ErrorPage message="Impossible de charger les cours" /> })));
const CoursePlayer = lazy(() => import('./pages/CoursePlayer').catch(() => ({ default: () => <ErrorPage message="Impossible de charger le cours" /> })));
const Flashcards = lazy(() => import('./pages/Flashcards').catch(() => ({ default: () => <ErrorPage message="Impossible de charger les flashcards" /> })));
const Profile = lazy(() => import('./pages/Profile').catch(() => ({ default: () => <ErrorPage message="Impossible de charger le profil" /> })));
const Settings = lazy(() => import('./pages/Settings').catch(() => ({ default: () => <ErrorPage message="Impossible de charger les paramètres" /> })));
const AdminDashboard = lazy(() => import('./pages/Admin').catch(() => ({ default: () => <ErrorPage message="Impossible de charger le tableau de bord admin" /> })));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard').catch(() => ({ default: () => <ErrorPage message="Impossible de charger le tableau de bord étudiant" /> })));
const Subscription = lazy(() => import('./pages/Subscription').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la page d'abonnement" /> })));
const Login = lazy(() => import('./auth/Login').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la page de connexion" /> })));
const Register = lazy(() => import('./auth/Register').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la page d'inscription" /> })));
const ForgotPassword = lazy(() => import('./auth/ForgotPassword').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la récupération de mot de passe" /> })));
const UserProfile = lazy(() => import('./pages/UserProfile').catch(() => ({ default: () => <ErrorPage message="Impossible de charger le profil utilisateur" /> })));
const Terms = lazy(() => import('./pages/Terms').catch(() => ({ default: () => <ErrorPage message="Impossible de charger les conditions" /> })));
const Payment = lazy(() => import('./pages/Payment').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la page de paiement" /> })));
const PaymentError = lazy(() => import('./pages/PaymentError').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la page d'erreur de paiement" /> })));
const AddVideoPage = lazy(() => import('./pages/AddVideoPage').catch(() => ({ default: () => <ErrorPage message="Impossible de charger l'ajout de vidéo" /> })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la gestion des utilisateurs" /> })));
const AdminVideos = lazy(() => import('./pages/AdminVideos').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la gestion des vidéos" /> })));
const AdminCourses = lazy(() => import('./pages/AdminCourses').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la gestion des cours" /> })));
const AddFlashcards = lazy(() => import('./pages/AddFlashcards').catch(() => ({ default: () => <ErrorPage message="Impossible de charger l'ajout de flashcards" /> })));
const AdminQCM = lazy(() => import('./pages/AdminQCM').catch(() => ({ default: () => <ErrorPage message="Impossible de charger la gestion des QCMs" /> })));

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl text-red-600 mb-2 font-bold">Une erreur est survenue</h1>
            <p className="text-gray-600 mb-4">{this.state.error.message}</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left mb-4 p-2 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer">Détails techniques</summary>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Actualiser la page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ErrorPage = ({ message = 'Une erreur est survenue.', language = 'fr' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
      <div className="text-red-500 text-4xl mb-4">😕</div>
      <h1 className="text-2xl text-red-500 mb-4">
        {language === 'fr' ? message : 'حدث خطأ.'}
      </h1>
      <div className="space-y-2">
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {language === 'fr' ? 'Actualiser' : 'تحديث'}
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          {language === 'fr' ? 'Retour à l\'accueil' : 'العودة إلى الصفحة الرئيسية'}
        </button>
      </div>
    </div>
  </div>
);

const LoadingSpinner = ({ language = 'fr' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg">
        {language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}
      </p>
    </div>
  </div>
);

const PaymentNotifications = () => {
  const { language } = useLanguage();
  
  return (
    <>
      <PaymentErrorDisplay 
        language={language}
        onRetry={() => window.location.reload()}
        onNavigateToHelp={() => window.location.href = '/payment-error'}
      />
      <PaymentSuccessDisplay 
        language={language}
      />
    </>
  );
};

// Composant HealthCheck pour Railway
function HealthCheck() {
  return <div>{JSON.stringify({status: "ok", timestamp: new Date().toISOString()})}</div>;
}

const AppRoutes = () => {
  const { language } = useLanguage();

  const routes = useMemo(() => ({
    public: [
      { path: '/', element: <Home /> },
      { path: '/health', element: <HealthCheck /> }, // Ajouté pour Railway
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/subscription', element: <Subscription /> },
      { path: '/payment-error', element: <PaymentError /> },
      { path: '/terms', element: <Terms /> },
      { path: '/privacy', element: <PrivacyPolicy /> },
      { path: '/payment/:plan', element: <Payment /> },
      { path: '/contact', element: <Contact /> },
    ],
    studentPaid: [
      { 
        path: '/quizzes', 
        element: (
          <ProtectedRoute requiredRole="student" isPaidRequired={true} featureName="quizzes">
            <Quizzes />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/quizzes/:id', 
        element: (
          <ProtectedRoute requiredRole="student" isPaidRequired={true} featureName="quizzes">
            <QuizPlayer />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/quiz-generator', 
        element: (
          <ProtectedRoute requiredRole="student" isPaidRequired={true} featureName="quiz-generator">
            <QuizGenerator />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/courses', 
        element: (
          <ProtectedRoute requiredRole="student" isPaidRequired={true} featureName="courses">
            <Courses />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/courses/:id', 
        element: (
          <ProtectedRoute requiredRole="student" isPaidRequired={true} featureName="courses">
            <CoursePlayer />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/flashcards', 
        element: (
          <ProtectedRoute requiredRole="student" isPaidRequired={true} featureName="flashcards">
            <Flashcards />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/videos', 
        element: (
          <ProtectedRoute requiredRole="student" isPaidRequired={true} featureName="videos">
            <Videos />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/videos/:id', 
        element: (
          <ProtectedRoute requiredRole="student" isPaidRequired={true} featureName="videos">
            <VideoPlayer />
          </ProtectedRoute>
        ) 
      },
    ],
    student: [
      { 
        path: '/profile', 
        element: (
          <ProtectedRoute requiredRole="student">
            <Profile />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/settings', 
        element: (
          <ProtectedRoute requiredRole="student">
            <Settings />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/users/:id', 
        element: (
          <ProtectedRoute requiredRole="student">
            <UserProfile />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/dashboard', 
        element: (
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        ) 
      },
    ],
    admin: [
      { 
        path: '/admin', 
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/admin/add-video', 
        element: (
          <ProtectedRoute requiredRole="admin">
            <AddVideoPage />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/admin/users', 
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminUsers />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/admin/videos', 
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminVideos />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/admin/courses', 
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminCourses />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/admin/flashcards', 
        element: (
          <ProtectedRoute requiredRole="admin">
            <AddFlashcards />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/admin/qcms', 
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminQCM />
          </ProtectedRoute>
        ) 
      },
    ],
  }), []);

  const allRoutes = [...routes.public, ...routes.studentPaid, ...routes.student, ...routes.admin];

  return (
    <Routes>
      {allRoutes.map(({ path, element }, index) => (
        <Route key={`${path}-${index}`} path={path} element={element} />
      ))}
      <Route path="*" element={<ErrorPage language={language} />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    try {
      const storedDeck = sessionStorage.getItem('currentDeck');
      console.log('App - currentDeck in sessionStorage:', storedDeck ? 'Found' : 'Not found');
      console.log('App - LanguageContext initialized');

      if ('performance' in window && 'measure' in performance) {
        performance.mark('app-start');
      }
    } catch (error) {
      console.warn('Error accessing sessionStorage:', error);
    }

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);

      if (event.reason?.message?.includes('payment') || event.reason?.code?.includes('PAYMENT')) {
        const errorParams = new URLSearchParams({
          error: event.reason.code || 'PAYMENT_ERROR',
          error_description: event.reason.message || 'Une erreur de paiement est survenue'
        });
        window.location.href = `/payment-error?${errorParams.toString()}`;
      }
    };

    const handleError = (event) => {
      console.error('Global JavaScript error:', event.error);

      if (event.error?.name === 'ChunkLoadError') {
        console.log('Chunk load error detected, reloading page...');
        window.location.reload();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <LanguageProvider>
            <PaymentProvider>
              <ToastProvider>
                <div className="App min-h-screen flex flex-col bg-gray-100">
                  <Header />
                  <Suspense fallback={<LoadingSpinner />}>
                    <main className="flex-1 container mx-auto px-4 py-8">
                      <AppRoutes />
                    </main>
                  </Suspense>
                  <Footer />
                  <Chatbot />
                  <PaymentNotifications />
                </div>
              </ToastProvider>
            </PaymentProvider>
          </LanguageProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;