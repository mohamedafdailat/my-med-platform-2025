import React, { useState, useContext, useEffect, useRef } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { language } = useContext(LanguageContext);
  const messagesEndRef = useRef(null);

  // Exemple de réponse statique (à remplacer par une API)
  const getBotResponse = (userMessage) => {
    return language === 'fr'
      ? `Je suis le chatbot de MedPlatform. Vous avez demandé : "${userMessage}". Comment puis-je vous aider avec vos études médicales ?`
      : `أنا روبوت الدردشة لمنصة MedPlatform. لقد سألت: "${userMessage}". كيف يمكنني مساعدتك في دراستك الطبية؟`;
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages([...messages, userMessage]);

    const botResponse = { text: getBotResponse(input), sender: 'bot' };
    setMessages((prev) => [...prev, botResponse]);

    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Chatbot Assistant' : 'مساعد الدردشة الآلي'}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={
              language === 'fr' ? 'Posez votre question...' : 'اطرح سؤالك...'
            }
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-200"
          >
            {language === 'fr' ? 'Envoyer' : 'إرسال'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;