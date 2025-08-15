import React, { createContext, useContext } from 'react';
import { toast, ToastContainer, Slide } from 'react-toastify';
import { CheckCircle, XCircle, AlertCircle, Info, Brain } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Custom Toast Icon Component
const ToastIcon = ({ type }) => {
  const iconProps = { size: 20, className: "flex-shrink-0" };
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} className="text-green-500" />;
    case 'error':
      return <XCircle {...iconProps} className="text-red-500" />;
    case 'warning':
      return <AlertCircle {...iconProps} className="text-yellow-500" />;
    case 'info':
      return <Info {...iconProps} className="text-blue-500" />;
    case 'ai':
      return <Brain {...iconProps} className="text-purple-500" />;
    default:
      return <Info {...iconProps} className="text-gray-500" />;
  }
};

// Custom Toast Component
const CustomToast = ({ type, title, message, icon }) => (
  <div className="flex items-start space-x-3 p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
    {icon || <ToastIcon type={type} />}
    <div className="flex-1 min-w-0">
      {title && (
        <div className="text-sm font-semibold text-gray-900 mb-1">
          {title}
        </div>
      )}
      <div className="text-sm text-gray-700 leading-tight">
        {message}
      </div>
    </div>
  </div>
);

export const ToastProvider = ({ children }) => {
  // Default toast options with modern styling
  const defaultOptions = {
    position: "bottom-right", // Moved to bottom-right for modern placement
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    transition: Slide,
    className: "!rounded-xl !shadow-md !border !border-gray-100 !bg-gradient-to-br !from-gray-50 !to-white",
    bodyClassName: "!p-0",
    progressClassName: "!bg-gradient-to-r !from-blue-500 !to-indigo-600 !h-1",
  };

  const showToast = {
    success: (message, options = {}) => {
      const config = {
        ...defaultOptions,
        ...options,
        className: `${defaultOptions.className} !border-l-4 !border-green-500`,
      };
      
      if (typeof message === 'string') {
        toast.success(<CustomToast type="success" message={message} />, config);
      } else {
        toast.success(<CustomToast type="success" title={message.title} message={message.message} />, config);
      }
    },

    error: (message, options = {}) => {
      const config = {
        ...defaultOptions,
        autoClose: 8000, // Longer for errors
        ...options,
        className: `${defaultOptions.className} !border-l-4 !border-red-500`,
      };
      
      if (typeof message === 'string') {
        toast.error(<CustomToast type="error" message={message} />, config);
      } else {
        toast.error(<CustomToast type="error" title={message.title} message={message.message} />, config);
      }
    },

    warning: (message, options = {}) => {
      const config = {
        ...defaultOptions,
        ...options,
        className: `${defaultOptions.className} !border-l-4 !border-yellow-500`,
      };
      
      if (typeof message === 'string') {
        toast.warning(<CustomToast type="warning" message={message} />, config);
      } else {
        toast.warning(<CustomToast type="warning" title={message.title} message={message.message} />, config);
      }
    },

    info: (message, options = {}) => {
      const config = {
        ...defaultOptions,
        ...options,
        className: `${defaultOptions.className} !border-l-4 !border-blue-500`,
      };
      
      if (typeof message === 'string') {
        toast.info(<CustomToast type="info" message={message} />, config);
      } else {
        toast.info(<CustomToast type="info" title={message.title} message={message.message} />, config);
      }
    },

    ai: (message, options = {}) => {
      const config = {
        ...defaultOptions,
        autoClose: 6000,
        ...options,
        className: `${defaultOptions.className} !border-l-4 !border-purple-500 !bg-gradient-to-r !from-purple-50 !to-indigo-50`,
      };
      
      if (typeof message === 'string') {
        toast.info(<CustomToast type="ai" message={message} />, config);
      } else {
        toast.info(<CustomToast type="ai" title={message.title || "IA"} message={message.message} />, config);
      }
    },

    quiz: {
      created: (quizTitle) => {
        showToast.success({
          title: "Quiz créé avec succès !",
          message: `"${quizTitle}" est maintenant disponible`,
        });
      },
      
      completed: (score, total) => {
        const percentage = Math.round((score / total) * 100);
        const isGoodScore = percentage >= 70;
        
        if (isGoodScore) {
          showToast.success({
            title: "Excellent travail !",
            message: `Vous avez obtenu ${score}/${total} (${percentage}%)`,
          });
        } else {
          showToast.warning({
            title: "Quiz terminé",
            message: `Score: ${score}/${total} (${percentage}%). Continuez à vous améliorer !`,
          });
        }
      },
      
      saved: () => {
        showToast.success("Progression sauvegardée");
      },
      
      error: (message) => {
        showToast.error({
          title: "Erreur Quiz",
          message: message || "Une erreur est survenue",
        });
      },
    },

    favorite: {
      added: (itemName) => {
        showToast.success(`"${itemName}" ajouté aux favoris`);
      },
      
      removed: (itemName) => {
        showToast.info(`"${itemName}" retiré des favoris`);
      },
    },

    auth: {
      loginSuccess: (userName) => {
        showToast.success({
          title: "Connexion réussie",
          message: `Bienvenue ${userName} !`,
        });
      },
      
      logoutSuccess: () => {
        showToast.info("Déconnexion réussie");
      },
      
      sessionExpired: () => {
        showToast.warning({
          title: "Session expirée",
          message: "Veuillez vous reconnecter",
        });
      },
    },

    promise: (promise, messages) => {
      return toast.promise(
        promise,
        {
          pending: {
            render: () => (
              <CustomToast type="info" message={messages.pending || "Traitement en cours..."} />
            ),
            ...defaultOptions,
          },
          success: {
            render: ({ data }) => (
              <CustomToast type="success" message={messages.success || "Opération réussie !"} />
            ),
            ...defaultOptions,
            className: `${defaultOptions.className} !border-l-4 !border-green-500`,
          },
          error: {
            render: ({ data }) => (
              <CustomToast type="error" message={messages.error || "Une erreur est survenue"} />
            ),
            ...defaultOptions,
            autoClose: 8000,
            className: `${defaultOptions.className} !border-l-4 !border-red-500`,
          },
        }
      );
    },
  };

  const contextValue = {
    toast: showToast,
    success: showToast.success,
    error: showToast.error,
    warning: showToast.warning,
    info: showToast.info,
    ai: showToast.ai,
    quiz: showToast.quiz,
    favorite: showToast.favorite,
    auth: showToast.auth,
    promise: showToast.promise,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        position="bottom-right" // Changed to bottom-right
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
        className="!rounded-xl !shadow-lg !border !border-gray-100 !bg-gradient-to-br !from-gray-50 !to-white"
        bodyClassName="!p-3 !text-sm !font-medium"
        progressClassName="!bg-gradient-to-r !from-blue-500 !to-indigo-600 !h-1"
        theme="light"
      />
    </ToastContext.Provider>
  );
};

// Custom Hooks
export const useQuizToast = () => {
  const { quiz } = useToast();
  return quiz;
};

export const useAuthToast = () => {
  const { auth } = useToast();
  return auth;
};

export default ToastProvider;