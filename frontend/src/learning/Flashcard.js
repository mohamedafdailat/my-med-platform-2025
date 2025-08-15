import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Card from '../components/Card';
import { NavLink } from 'react-router-dom';

const Flashcards = () => {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const flashcardDecks = [
    {
      id: 1,
      title: language === 'fr' ? 'Deck : Termes d’anatomie' : 'مجموعة: مصطلحات التشريح',
      description: language === 'fr' ? 'Apprenez les principaux termes d’anatomie.' : 'تعلم المصطلحات الرئيسية للتشريح.',
      thumbnail: 'https://images.unsplash.com/photo-1573575155242-b8e7d7d91e48?w=300&h=150&fit=crop',
      cards: 15,
      category: 'anatomy',
    },
    {
      id: 2,
      title: language === 'fr' ? 'Deck : Processus physiologiques' : 'مجموعة: العمليات الفسيولوجية',
      description: language === 'fr' ? 'Mémorisez les fonctions physiologiques clés.' : 'احفظ الوظائف الفسيولوجية الرئيسية.',
      thumbnail: 'https://images.unsplash.com/photo-1598554747436-dba2ac9f905f?w=300&h=150&fit=crop',
      cards: 12,
      category: 'physiology',
    },
    {
      id: 3,
      title: language === 'fr' ? 'Deck : Médicaments courants' : 'مجموعة: الأدوية الشائعة',
      description: language === 'fr' ? 'Revisez les noms et usages des médicaments.' : 'راجع أسماء واستخدامات الأدوية.',
      thumbnail: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=300&h=150&fit=crop',
      cards: 20,
      category: 'pharmacology',
    },
  ];

  const categories = [
    { id: 'all', label: language === 'fr' ? 'Tous' : 'الكل' },
    { id: 'anatomy', label: language === 'fr' ? 'Anatomie' : 'تشريح' },
    { id: 'physiology', label: language === 'fr' ? 'Physiologie' : 'فسيولوجيا' },
    { id: 'pharmacology', label: language === 'fr' ? 'Pharmacologie' : 'علم الصيدلة' },
  ];

  const filteredDecks = flashcardDecks
    .filter(deck => selectedCategory === 'all' || deck.category === selectedCategory)
    .filter(deck =>
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="page-container">
      <h2 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Jeu de Flashcards' : 'مجموعة البطاقات التعليمية'}
      </h2>
      <p className="text-lg text-gray-600 mb-6">
        {language === 'fr' ? 'Réviser avec des flashcards.' : 'مراجعة باستخدام البطاقات التعليمية.'}
      </p>
      <div className="video-controls mb-6">
        <input
          type="text"
          placeholder={language === 'fr' ? 'Rechercher un deck...' : 'ابحث عن مجموعة...'}
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      <div className="features-grid">
        {filteredDecks.length > 0 ? (
          filteredDecks.map(deck => (
            <Card
              key={deck.id}
              title={deck.title}
              description={deck.description}
              image={deck.thumbnail}
              action={
                <div className="flashcard-card-footer">
                  <span className="flashcard-count">
                    {language === 'fr' ? `${deck.cards} cartes` : `${deck.cards} بطاقات`}
                  </span>
                  <NavLink to={`/flashcards/${deck.id}`} className="btn-primary">
                    {language === 'fr' ? 'Étudier' : 'دراسة'}
                  </NavLink>
                </div>
              }
            />
          ))
        ) : (
          <p className="text-center text-gray-500">
            {language === 'fr' ? 'Aucun deck trouvé.' : 'لم يتم العثور على مجموعات.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default Flashcards;