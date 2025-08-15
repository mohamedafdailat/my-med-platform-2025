import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Card from '../components/Card';
import { NavLink } from 'react-router-dom';

const VideoLibrary = () => {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const videos = [
    {
      id: 1,
      title: language === 'fr' ? 'Anatomie - Système Cardiovasculaire' : 'تشريح - الجهاز القلبي الوعائي',
      description: language === 'fr' ? 'Découvrez la structure du cœur et des vaisseaux sanguins.' : 'اكتشف بنية القلب والأوعية الدموية.',
      thumbnail: 'https://www.docdeclic.fr/uploads/1587477264_3ea943e53a43e6383b3e.png',
      duration: '15:30',
      url: '/videos/1',
      category: 'anatomy',
    },
    {
      id: 2,
      title: language === 'fr' ? 'Physiologie - Respiration' : 'فسيولوجيا - التنفس',
      description: language === 'fr' ? 'Comprenez le mécanisme de la respiration humaine.' : 'افهم آلية التنفس البشري.',
      thumbnail: 'https://s1.studylibfr.com/store/data/003860148_1-191dfeecf95f96625f28d673088726f2.png',
      duration: '12:45',
      url: '/videos/2',
      category: 'physiology',
    },
    {
      id: 3,
      title: language === 'fr' ? 'Pharmacologie - Antibiotiques' : 'علم الصيدلة - المضادات الحيوية',
      description: language === 'fr' ? 'Introduction aux antibiotiques et leurs usages.' : 'مقدمة عن المضادات الحيوية واستخداماتها.',
      thumbnail: 'https://cdn.slidesharecdn.com/ss_thumbnails/lesantibiotiquesi-171209223412-thumbnail.jpg?width=640&height=640&fit=bounds',
      duration: '18:20',
      url: '/videos/3',
      category: 'pharmacology',
    },
  ];

  const categories = [
    { id: 'all', label: language === 'fr' ? 'Tous' : 'الكل' },
    { id: 'anatomy', label: language === 'fr' ? 'Anatomie' : 'تشريح' },
    { id: 'physiology', label: language === 'fr' ? 'Physiologie' : 'فسيولوجيا' },
    { id: 'pharmacology', label: language === 'fr' ? 'Pharmacologie' : 'علم الصيدلة' },
  ];

  const filteredVideos = videos
    .filter(video => selectedCategory === 'all' || video.category === selectedCategory)
    .filter(video => 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="page-container">
      <h2 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Bibliothèque de vidéos' : 'مكتبة الفيديوهات'}
      </h2>
      <div className="video-controls mb-6">
        <input
          type="text"
          placeholder={language === 'fr' ? 'Rechercher une vidéo...' : 'ابحث عن فيديو...'}
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
        {filteredVideos.length > 0 ? (
          filteredVideos.map(video => (
            <Card
              key={video.id}
              title={video.title}
              description={video.description}
              image={video.thumbnail}
              action={
                <div className="video-card-footer">
                  <span className="video-duration">{video.duration}</span>
                  <NavLink to={video.url} className="btn-primary">
                    {language === 'fr' ? 'Regarder' : 'مشاهدة'}
                  </NavLink>
                </div>
              }
            />
          ))
        ) : (
          <p className="text-center text-gray-500">
            {language === 'fr' ? 'Aucune vidéo trouvée.' : 'لم يتم العثور على فيديوهات.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoLibrary;