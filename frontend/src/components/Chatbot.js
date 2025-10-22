import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Utilise la variable d'environnement pour la clé API Groq
  const API_KEY = process.env.REACT_APP_GROQ_API_KEY;
  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

  // Message d'accueil
  const welcomeMessage = useMemo(() => ({
    id: 'welcome',
    sender: 'bot',
    text: 'Salut ! Je suis DocBuddy, ton assistant médical. Pose-moi tes questions sur la médecine ! 🩺',
    timestamp: Date.now()
  }), []);

  // Initialiser avec le message d'accueil
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([welcomeMessage]);
    }
  }, [welcomeMessage, messages.length]);

  // Fonction pour envoyer un message
  const sendMessage = useCallback(async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();
    setInput('');
    setError('');

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: currentInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const loadingMessage = {
      id: Date.now() + 1,
      sender: 'bot',
      text: 'Je réfléchis...',
      isLoading: true,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      if (!API_KEY) {
        throw new Error('Clé API Groq manquante. Vérifie REACT_APP_GROQ_API_KEY dans .env');
      }

      // Préparer l'historique de conversation
      const conversationHistory = messages
        .filter(m => !m.isLoading && m.id !== 'welcome')
        .slice(-10)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // Modèle de remplacement pour mixtral-8x7b-32768
          messages: [
            {
              role: 'system',
              content: `Tu es DocBuddy, un assistant médical sympa pour étudiants en médecine. Réponds en français ou arabe selon la langue de l'utilisateur. Sois concis (2-3 phrases max), précis, et amical. Ne donne jamais de diagnostics définitifs. Termine par "Ça aide ?". Exemple : "Salut ! L'anatomie est l'étude de la structure du corps humain. C'est la base pour comprendre le fonctionnement du corps. Ça aide ?"`,
            },
            ...conversationHistory,
            { role: 'user', content: currentInput },
          ],
          max_tokens: 250,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur serveur: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const botResponseText = data.choices[0]?.message?.content;

      if (!botResponseText) {
        throw new Error('Réponse vide du serveur');
      }

      // Mettre à jour le message de chargement avec la réponse
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.isLoading) {
          updated[lastIndex] = {
            id: Date.now() + 2,
            sender: 'bot',
            text: botResponseText,
            timestamp: Date.now()
          };
        }
        return updated;
      });

    } catch (error) {
      console.error('Erreur:', error);
      
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.isLoading) {
          updated[lastIndex] = {
            id: Date.now() + 3,
            sender: 'bot',
            text: `❌ ${error.message}`,
            isError: true,
            timestamp: Date.now()
          };
        }
        return updated;
      });

      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  // Gestion des touches
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }, [sendMessage]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Nettoyer à la fermeture
  useEffect(() => {
    return () => {
      // Nettoyage si nécessaire
    };
  }, []);

  // Actions
  const clearChat = useCallback(() => {
    setMessages([welcomeMessage]);
    setError('');
  }, [welcomeMessage]);

  // Statistiques
  const stats = useMemo(() => {
    const validMessages = messages.filter(m => !m.isLoading && m.id !== 'welcome');
    return {
      total: validMessages.length,
      user: validMessages.filter(m => m.sender === 'user').length,
      bot: validMessages.filter(m => m.sender === 'bot').length,
    };
  }, [messages]);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${
          isLoading 
            ? 'bg-yellow-500 hover:bg-yellow-600' 
            : error 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-green-500 hover:bg-green-600'
        } ${isOpen ? 'scale-110' : 'scale-100'}`}
        title={`DocBuddy ${isLoading ? '(En cours...)' : error ? '(Erreur)' : '(Prêt)'}`}
      >
        {isLoading ? '⏳' : error ? '⚠️' : '🤖'}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col border-2 border-gray-200 z-50">
          {/* En-tête */}
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span>🤖 DocBuddy</span>
              {isLoading && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
            </div>
            <div className="flex gap-1">
              <button
                onClick={clearChat}
                className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-700 transition-colors"
                title="Nouveau chat"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-700 transition-colors"
                title="Fermer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Zone de messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg text-sm max-w-xs break-words transition-all duration-200 ${
                  msg.sender === 'user' 
                    ? 'bg-green-100 border border-green-200 ml-auto text-right' 
                    : msg.isError
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {msg.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>
                    <span className="text-gray-600">Groq réfléchit...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="p-3 border-t bg-white">
            <div className="flex space-x-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: Qu'est-ce que l'anatomie ?"
                className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-green-500"
                disabled={isLoading}
                maxLength={500}
              />
              <button
                onClick={sendMessage}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
            
            {error && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}
          </div>

          {/* Barre de statut */}
          <div className="px-3 pb-2 text-xs text-gray-500 text-center bg-gray-50 rounded-b-lg">
            {isLoading ? (
              'Groq traite votre demande...'
            ) : (
              <div className="flex justify-between items-center">
                <span>⚡ Powered by Groq</span>
                <span>{stats.total} messages</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;