// C:\my-med-platform\frontend\src\App.js

import React, { lazy, Suspense, useEffect, Component, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import {
  PaymentProvider,
  PaymentErrorDisplay,
  PaymentSuccessDisplay,
} from './contexts/PaymentContext';
import { ToastProvider } from './contexts/ToastContext';

import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import ProtectedRoute from './components/ProtectedRoute';

import PrivacyPolicy from './components/PrivacyPolicy';
import Contact from './pages/contact';

import './App.css';

const ErrorPage = ({ message = 'Une erreur est survenue.', language = 'fr' }) => (
  <div className="app-error-screen">
    <div className="app-error-card">
      <div className="app-error-icon">😕</div>

      <h1>{language === 'fr' ? message : 'حدث خطأ.'}</h1>

      <div className="app-error-actions">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          {language === 'fr' ? 'Actualiser' : 'تحديث'}
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.href = '/';
          }}
          className="btn-secondary"
        >
          {language === 'fr' ? "Retour à l'accueil" : 'العودة إلى الصفحة الرئيسية'}
        </button>
      </div>
    </div>
  </div>
);

const lazyPage = (importer, fallbackMessage) =>
  lazy(() =>
    importer().catch((error) => {
      console.error(`Lazy loading failed: ${fallbackMessage}`, error);

      return {
        default: () => <ErrorPage message={fallbackMessage} />,
      };
    })
  );

const Home = lazyPage(
  () => import('./pages/Home'),
  "Impossible de charger la page d'accueil"
);

const Videos = lazyPage(
  () => import('./pages/Videos'),
  'Impossible de charger les vidéos'
);

const VideoPlayer = lazyPage(
  () => import('./pages/VideoPlayer'),
  'Impossible de charger le lecteur vidéo'
);

const Quizzes = lazyPage(
  () => import('./pages/Quizzes'),
  'Impossible de charger les quiz'
);

const QuizPlayer = lazyPage(
  () => import('./pages/QuizPlayer'),
  'Impossible de charger le quiz'
);

const QuizGenerator = lazyPage(
  () => import('./pages/QuizzGenerator'),
  'Impossible de charger le générateur de quiz'
);

const Courses = lazyPage(
  () => import('./pages/Courses'),
  'Impossible de charger les cours'
);

const CoursePlayer = lazyPage(
  () => import('./pages/CoursePlayer'),
  'Impossible de charger le cours'
);

const Flashcards = lazyPage(
  () => import('./pages/Flashcards'),
  'Impossible de charger les flashcards'
);

const Profile = lazyPage(
  () => import('./pages/Profile'),
  'Impossible de charger le profil'
);

const Settings = lazyPage(
  () => import('./pages/Settings'),
  'Impossible de charger les paramètres'
);

const AdminDashboard = lazyPage(
  () => import('./pages/Admin'),
  'Impossible de charger le tableau de bord admin'
);

const StudentDashboard = lazyPage(
  () => import('./pages/StudentDashboard'),
  'Impossible de charger le tableau de bord étudiant'
);

const Subscription = lazyPage(
  () => import('./pages/Subscription'),
  "Impossible de charger la page d'abonnement"
);

const Login = lazyPage(
  () => import('./auth/Login'),
  'Impossible de charger la page de connexion'
);

const Register = lazyPage(
  () => import('./auth/Register'),
  "Impossible de charger la page d'inscription"
);

const ForgotPassword = lazyPage(
  () => import('./auth/ForgotPassword'),
  'Impossible de charger la récupération de mot de passe'
);

const UserProfile = lazyPage(
  () => import('./pages/UserProfile'),
  'Impossible de charger le profil utilisateur'
);

const Terms = lazyPage(
  () => import('./pages/Terms'),
  'Impossible de charger les conditions'
);

const Payment = lazyPage(
  () => import('./pages/Payment'),
  'Impossible de charger la page de paiement'
);

const PaymentError = lazyPage(
  () => import('./pages/PaymentError'),
  "Impossible de charger la page d'erreur de paiement"
);

const AddVideoPage = lazyPage(
  () => import('./pages/AddVideoPage'),
  "Impossible de charger l'ajout de vidéo"
);

const AdminUsers = lazyPage(
  () => import('./pages/AdminUsers'),
  'Impossible de charger la gestion des utilisateurs'
);

const AdminVideos = lazyPage(
  () => import('./pages/AdminVideos'),
  'Impossible de charger la gestion des vidéos'
);

const AdminCourses = lazyPage(
  () => import('./pages/AdminCourses'),
  'Impossible de charger la gestion des cours'
);

const AddFlashcards = lazyPage(
  () => import('./pages/AddFlashcards'),
  "Impossible de charger l'ajout de flashcards"
);

const AdminQCM = lazyPage(
  () => import('./pages/AdminQCM'),
  'Impossible de charger la gestion des QCM'
);

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      error: null,
      errorInfo: null,
    });

    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="app-error-screen">
        <div className="app-error-card">
          <div className="app-error-icon">⚠️</div>

          <h1>Une erreur est survenue</h1>

          <p>{this.state.error.message}</p>

          {process.env.NODE_ENV === 'development' && (
            <details className="app-error-details">
              <summary>Détails techniques</summary>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}

          <div className="app-error-actions">
            <button type="button" onClick={this.handleRetry} className="btn-primary">
              Actualiser la page
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="btn-secondary"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const LoadingSpinner = () => {
  const { language } = useLanguage();

  return (
    <div className="app-loading-screen">
      <div className="app-loading-content">
        <div
          className="loading-spinner"
          aria-label={language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}
        />
        <p>{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</p>
      </div>
    </div>
  );
};

const PaymentNotifications = () => {
  const { language } = useLanguage();

  return (
    <>
      <PaymentErrorDisplay
        language={language}
        onRetry={() => window.location.reload()}
        onNavigateToHelp={() => {
          window.location.href = '/payment-error';
        }}
      />

      <PaymentSuccessDisplay language={language} />
    </>
  );
};

const HealthCheck = () => (
  <pre className="app-health-check">
    {JSON.stringify(
      {
        status: 'ok',
        source: 'react',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )}
  </pre>
);

const publicRoutes = [
  { path: '/', element: <Home /> },
  { path: '/health', element: <HealthCheck /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/subscription', element: <Subscription /> },
  { path: '/payment-error', element: <PaymentError /> },
  { path: '/terms', element: <Terms /> },
  { path: '/privacy', element: <PrivacyPolicy /> },
  { path: '/payment/:plan', element: <Payment /> },
  { path: '/contact', element: <Contact /> },
];

const studentPaidRoutes = [
  {
    path: '/quizzes',
    featureName: 'quizzes',
    element: <Quizzes />,
  },
  {
    path: '/quizzes/:id',
    featureName: 'quizzes',
    element: <QuizPlayer />,
  },
  {
    path: '/quiz-generator',
    featureName: 'quiz-generator',
    element: <QuizGenerator />,
  },
  {
    path: '/courses',
    featureName: 'courses',
    element: <Courses />,
  },
  {
    path: '/courses/:id',
    featureName: 'courses',
    element: <CoursePlayer />,
  },
  {
    path: '/flashcards',
    featureName: 'flashcards',
    element: <Flashcards />,
  },
  {
    path: '/videos',
    featureName: 'videos',
    element: <Videos />,
  },
  {
    path: '/videos/:id',
    featureName: 'videos',
    element: <VideoPlayer />,
  },
];

const studentRoutes = [
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '/users/:id',
    element: <UserProfile />,
  },
  {
    path: '/dashboard',
    element: <StudentDashboard />,
  },
];

const adminRoutes = [
  {
    path: '/Admin',
    element: <AdminDashboard />,
  },
  {
    path: '/admin/add-video',
    element: <AddVideoPage />,
  },
  {
    path: '/admin/users',
    element: <AdminUsers />,
  },
  {
    path: '/admin/videos',
    element: <AdminVideos />,
  },
  {
    path: '/admin/courses',
    element: <AdminCourses />,
  },
  {
    path: '/admin/flashcards',
    element: <AddFlashcards />,
  },
  {
    path: '/admin/qcms',
    element: <AdminQCM />,
  },
];

const AppRoutes = () => {
  const { language } = useLanguage();

  const routeElements = useMemo(() => {
    return [
      ...publicRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      )),

      ...studentPaidRoutes.map(({ path, element, featureName }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute
              requiredRole="student"
              isPaidRequired
              featureName={featureName}
            >
              {element}
            </ProtectedRoute>
          }
        />
      )),

      ...studentRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute requiredRole="student">
              {element}
            </ProtectedRoute>
          }
        />
      )),

      ...adminRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute requiredRole="admin">
              {element}
            </ProtectedRoute>
          }
        />
      )),

      <Route
        key="not-found"
        path="*"
        element={
          <ErrorPage
            language={language}
            message={language === 'fr' ? 'Page introuvable.' : 'الصفحة غير موجودة.'}
          />
        }
      />,
    ];
  }, [language]);

  return <Routes>{routeElements}</Routes>;
};

const AppShell = () => {
  useEffect(() => {
    try {
      const storedDeck = sessionStorage.getItem('currentDeck');

      if (process.env.NODE_ENV === 'development') {
        console.log(
          'App - currentDeck in sessionStorage:',
          storedDeck ? 'Found' : 'Not found'
        );
        console.log('App - LanguageContext initialized');
      }

      if ('performance' in window && 'mark' in performance) {
        performance.mark('app-start');
      }
    } catch (error) {
      console.warn('Error accessing sessionStorage:', error);
    }

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);

      const message = event.reason?.message || '';
      const code = event.reason?.code || '';

      if (
        message.toLowerCase().includes('payment') ||
        code.toUpperCase().includes('PAYMENT')
      ) {
        const errorParams = new URLSearchParams({
          error: code || 'PAYMENT_ERROR',
          error_description: message || 'Une erreur de paiement est survenue',
        });

        window.location.href = `/payment-error?${errorParams.toString()}`;
      }
    };

    const handleError = (event) => {
      console.error('Global JavaScript error:', event.error);

      if (event.error?.name === 'ChunkLoadError') {
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
    <div className="App">
      <Header />

      <Suspense fallback={<LoadingSpinner />}>
        <main className="app-main">
          <AppRoutes />
        </main>
      </Suspense>

      <Footer />
      <Chatbot />
      <PaymentNotifications />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <LanguageProvider>
          <AuthProvider>
            <PaymentProvider>
              <ToastProvider>
                <AppShell />
              </ToastProvider>
            </PaymentProvider>
          </AuthProvider>
        </LanguageProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
