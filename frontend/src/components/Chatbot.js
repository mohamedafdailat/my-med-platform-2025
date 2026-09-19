import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const welcomeMessage = useMemo(() => ({
    id: 'welcome',
    sender: 'bot',
    text: 'Salut ! Je suis DocBuddy, ton assistant medical. Pose-moi tes questions sur la medecine.',
    timestamp: Date.now(),
  }), []);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([welcomeMessage]);
    }
  }, [welcomeMessage, messages.length]);

  const updateLoadingMessage = useCallback((replacement) => {
    setMessages((prev) => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;

      if (updated[lastIndex]?.isLoading) {
        updated[lastIndex] = replacement;
      }

      return updated;
    });
  }, []);

  const sendMessage = useCallback(async (event) => {
    event?.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();
    setInput('');
    setError('');

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: currentInput,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Je reflechis...',
        isLoading: true,
        timestamp: Date.now(),
      },
    ]);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const conversationHistory = messages
        .filter((message) => !message.isLoading && message.id !== 'welcome')
        .slice(-10)
        .map((message) => ({
          role: message.sender === 'user' ? 'user' : 'assistant',
          content: message.text,
        }));

      const response = await api.post(
        '/ai/chat',
        {
          message: currentInput,
          conversationHistory,
        },
        {
          signal: abortControllerRef.current.signal,
        }
      );

      const botResponseText = response.data?.response;

      if (!botResponseText) {
        throw new Error('Reponse vide du serveur');
      }

      updateLoadingMessage({
        id: Date.now() + 2,
        sender: 'bot',
        text: botResponseText,
        timestamp: Date.now(),
      });
    } catch (requestError) {
      if (requestError.name === 'CanceledError' || requestError.code === 'ERR_CANCELED') {
        return;
      }

      const message =
        requestError.response?.data?.error ||
        requestError.message ||
        'Erreur lors de la generation de la reponse';

      console.error('Erreur chatbot:', requestError);
      setError(message);
      updateLoadingMessage({
        id: Date.now() + 3,
        sender: 'bot',
        text: `Erreur: ${message}`,
        isError: true,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, updateLoadingMessage]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(event);
    }
  }, [sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const clearChat = useCallback(() => {
    setMessages([welcomeMessage]);
    setError('');
  }, [welcomeMessage]);

  const stats = useMemo(() => {
    const validMessages = messages.filter((message) => !message.isLoading && message.id !== 'welcome');
    return {
      total: validMessages.length,
      user: validMessages.filter((message) => message.sender === 'user').length,
      bot: validMessages.filter((message) => message.sender === 'bot').length,
    };
  }, [messages]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${
          isLoading
            ? 'bg-yellow-500 hover:bg-yellow-600'
            : error
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
        } ${isOpen ? 'scale-110' : 'scale-100'}`}
        title={`DocBuddy ${isLoading ? '(En cours...)' : error ? '(Erreur)' : '(Pret)'}`}
        type="button"
      >
        {isLoading ? '...' : error ? '!' : 'AI'}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col border-2 border-gray-200 z-50">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span>DocBuddy</span>
              {isLoading && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
            </div>
            <div className="flex gap-1">
              <button
                onClick={clearChat}
                className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-700 transition-colors"
                title="Nouveau chat"
                type="button"
              >
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-700 transition-colors"
                title="Fermer"
                type="button"
              >
                X
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg text-sm max-w-xs break-words transition-all duration-200 ${
                  message.sender === 'user'
                    ? 'bg-green-100 border border-green-200 ml-auto text-right'
                    : message.isError
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {message.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500" />
                    <span className="text-gray-600">DocBuddy reflechit...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.text}</div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t bg-white">
            <form className="flex space-x-2" onSubmit={sendMessage}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: Qu'est-ce que l'anatomie ?"
                className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isLoading}
                maxLength={500}
              />
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                disabled={isLoading || !input.trim()}
                type="submit"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </form>

            {error && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}
          </div>

          <div className="px-3 pb-2 text-xs text-gray-500 text-center bg-gray-50 rounded-b-lg">
            {isLoading ? (
              'DocBuddy traite votre demande...'
            ) : (
              <div className="flex justify-between items-center">
                <span>Backend AI proxy</span>
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
