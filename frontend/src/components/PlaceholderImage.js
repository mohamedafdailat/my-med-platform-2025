import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const PlaceholderImage = ({ 
  width = 300, 
  height = 200, 
  text = null, 
  className = "",
  type = "course" 
}) => {
  const { language } = useLanguage();
  
  const getPlaceholderText = () => {
    if (text) return text;
    
    const texts = {
      course: language === 'fr' ? 'Cours Médical' : 'دورة طبية',
      video: language === 'fr' ? 'Vidéo Médicale' : 'فيديو طبي',
      document: language === 'fr' ? 'Document' : 'وثيقة',
      anatomy: language === 'fr' ? 'Anatomie' : 'علم التشريح',
      physiology: language === 'fr' ? 'Physiologie' : 'علم وظائف الأعضاء',
      pharmacology: language === 'fr' ? 'Pharmacologie' : 'علم الأدوية',
      pathology: language === 'fr' ? 'Pathologie' : 'علم الأمراض',
      surgery: language === 'fr' ? 'Chirurgie' : 'الجراحة',
      default: language === 'fr' ? 'Formation Médicale' : 'تدريب طبي'
    };
    
    return texts[type] || texts.default;
  };

  const getModernIcon = () => {
    const icons = {
      course: `
        <g>
          <!-- Book with medical cross -->
          <rect x="4" y="4" width="16" height="16" rx="2" fill="url(#iconGrad1)" stroke="url(#iconGrad2)" stroke-width="0.5"/>
          <rect x="6" y="6" width="12" height="12" rx="1" fill="#ffffff" opacity="0.9"/>
          
          <!-- Medical cross -->
          <rect x="11" y="8" width="2" height="8" fill="#3B82F6" rx="0.5"/>
          <rect x="8" y="11" width="8" height="2" fill="#3B82F6" rx="0.5"/>
          
          <!-- Decorative elements -->
          <circle cx="7" cy="8" r="0.5" fill="#10B981" opacity="0.7"/>
          <circle cx="17" cy="15" r="0.5" fill="#F59E0B" opacity="0.7"/>
          <rect x="6" y="17" width="4" height="0.5" fill="#6366F1" opacity="0.5" rx="0.25"/>
        </g>
      `,
      anatomy: `
        <g>
          <!-- Human figure silhouette -->
          <ellipse cx="12" cy="7" rx="2.5" ry="3" fill="url(#iconGrad1)"/>
          <rect x="10" y="9" width="4" height="8" rx="1" fill="url(#iconGrad1)"/>
          <rect x="8" y="11" width="2" height="6" rx="1" fill="url(#iconGrad2)"/>
          <rect x="14" y="11" width="2" height="6" rx="1" fill="url(#iconGrad2)"/>
          <rect x="10" y="17" width="1.5" height="4" rx="0.75" fill="url(#iconGrad2)"/>
          <rect x="12.5" y="17" width="1.5" height="4" rx="0.75" fill="url(#iconGrad2)"/>
          
          <!-- Heart symbol -->
          <path d="M16 6c0-1.1.9-2 2-2s2 .9 2 2c0 1.1-.9 2-2 2s-2-.9-2-2z" fill="#EF4444"/>
          <path d="M18 6c0-1.1.9-2 2-2s2 .9 2 2c0 1.1-.9 2-2 2s-2-.9-2-2z" fill="#EF4444"/>
          <path d="M16 8l4 4-4-4z" fill="#EF4444"/>
        </g>
      `,
      physiology: `
        <g>
          <!-- DNA Helix -->
          <path d="M8 4 Q12 6 16 4 Q12 10 8 8 Q12 14 16 12 Q12 20 8 18" 
                stroke="#3B82F6" stroke-width="2" fill="none" opacity="0.8"/>
          <path d="M16 4 Q12 6 8 4 Q12 10 16 8 Q12 14 8 12 Q12 20 16 18" 
                stroke="#10B981" stroke-width="2" fill="none" opacity="0.8"/>
          
          <!-- Connection points -->
          <circle cx="8" cy="6" r="1" fill="#3B82F6"/>
          <circle cx="16" cy="6" r="1" fill="#10B981"/>
          <circle cx="8" cy="10" r="1" fill="#10B981"/>
          <circle cx="16" cy="10" r="1" fill="#3B82F6"/>
          <circle cx="8" cy="14" r="1" fill="#3B82F6"/>
          <circle cx="16" cy="14" r="1" fill="#10B981"/>
          <circle cx="8" cy="18" r="1" fill="#10B981"/>
          <circle cx="16" cy="18" r="1" fill="#3B82F6"/>
        </g>
      `,
      pharmacology: `
        <g>
          <!-- Pill/Capsule -->
          <ellipse cx="12" cy="12" rx="6" ry="3" fill="url(#iconGrad1)" transform="rotate(45 12 12)"/>
          <ellipse cx="12" cy="12" rx="6" ry="3" fill="url(#iconGrad2)" transform="rotate(45 12 12)" 
                   clip-path="polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)"/>
          
          <!-- Molecular structure -->
          <circle cx="8" cy="8" r="1.5" fill="#F59E0B" opacity="0.8"/>
          <circle cx="16" cy="8" r="1.5" fill="#EF4444" opacity="0.8"/>
          <circle cx="8" cy="16" r="1.5" fill="#10B981" opacity="0.8"/>
          <circle cx="16" cy="16" r="1.5" fill="#8B5CF6" opacity="0.8"/>
          
          <!-- Connecting lines -->
          <line x1="8" y1="8" x2="16" y2="8" stroke="#6B7280" stroke-width="1" opacity="0.5"/>
          <line x1="8" y1="8" x2="8" y2="16" stroke="#6B7280" stroke-width="1" opacity="0.5"/>
          <line x1="16" y1="8" x2="16" y2="16" stroke="#6B7280" stroke-width="1" opacity="0.5"/>
          <line x1="8" y1="16" x2="16" y2="16" stroke="#6B7280" stroke-width="1" opacity="0.5"/>
        </g>
      `,
      pathology: `
        <g>
          <!-- Microscope -->
          <rect x="6" y="18" width="12" height="2" fill="url(#iconGrad1)" rx="1"/>
          <rect x="10" y="14" width="4" height="4" fill="url(#iconGrad1)" rx="0.5"/>
          <circle cx="12" cy="10" r="3" fill="none" stroke="url(#iconGrad2)" stroke-width="2"/>
          <circle cx="12" cy="10" r="1.5" fill="#3B82F6"/>
          <rect x="11" y="4" width="2" height="6" fill="url(#iconGrad2)" rx="1"/>
          
          <!-- Virus/cells -->
          <circle cx="7" cy="7" r="1" fill="#EF4444" opacity="0.7"/>
          <circle cx="17" cy="7" r="1" fill="#F59E0B" opacity="0.7"/>
          <circle cx="18" cy="15" r="0.8" fill="#10B981" opacity="0.7"/>
          
          <!-- Spikes on virus -->
          <path d="M6.3 6.3 L5.5 5.5" stroke="#EF4444" stroke-width="1"/>
          <path d="M7.7 6.3 L8.5 5.5" stroke="#EF4444" stroke-width="1"/>
          <path d="M6.3 7.7 L5.5 8.5" stroke="#EF4444" stroke-width="1"/>
          <path d="M7.7 7.7 L8.5 8.5" stroke="#EF4444" stroke-width="1"/>
        </g>
      `,
      surgery: `
        <g>
          <!-- Scalpel -->
          <rect x="6" y="10" width="12" height="1.5" fill="url(#iconGrad1)" rx="0.75"/>
          <polygon points="18,10 20,11.5 20,12.5 18,12.5" fill="url(#iconGrad2)"/>
          <rect x="4" y="9.5" width="3" height="2.5" fill="#8B4513" rx="0.5"/>
          
          <!-- Surgical cross -->
          <circle cx="12" cy="16" r="3" fill="none" stroke="#EF4444" stroke-width="2"/>
          <line x1="12" y1="14" x2="12" y2="18" stroke="#EF4444" stroke-width="2"/>
          <line x1="10" y1="16" x2="14" y2="16" stroke="#EF4444" stroke-width="2"/>
          
          <!-- Surgical tools -->
          <circle cx="8" cy="6" r="0.5" fill="#6B7280"/>
          <rect x="7.5" y="4" width="1" height="2" fill="#6B7280"/>
          <circle cx="16" cy="6" r="0.5" fill="#6B7280"/>
          <rect x="15.5" y="4" width="1" height="2" fill="#6B7280"/>
        </g>
      `,
      video: `
        <g>
          <!-- Play button with modern design -->
          <circle cx="12" cy="12" r="8" fill="url(#iconGrad1)" stroke="url(#iconGrad2)" stroke-width="1"/>
          <circle cx="12" cy="12" r="6" fill="#ffffff" opacity="0.9"/>
          <polygon points="10,8 10,16 16,12" fill="#3B82F6"/>
          
          <!-- Decorative elements -->
          <circle cx="6" cy="6" r="1" fill="#F59E0B" opacity="0.7"/>
          <circle cx="18" cy="18" r="1" fill="#10B981" opacity="0.7"/>
          <rect x="18" y="5" width="2" height="0.5" fill="#EF4444" opacity="0.6" rx="0.25"/>
          <rect x="4" y="18" width="3" height="0.5" fill="#8B5CF6" opacity="0.6" rx="0.25"/>
        </g>
      `,
      document: `
        <g>
          <!-- Modern document -->
          <rect x="6" y="4" width="12" height="16" fill="url(#iconGrad1)" rx="1" stroke="#ffffff" stroke-width="0.5"/>
          <rect x="7" y="5" width="10" height="14" fill="#ffffff" opacity="0.95" rx="0.5"/>
          
          <!-- Content lines -->
          <rect x="8" y="7" width="8" height="0.5" fill="#3B82F6" opacity="0.7" rx="0.25"/>
          <rect x="8" y="9" width="6" height="0.5" fill="#6B7280" opacity="0.5" rx="0.25"/>
          <rect x="8" y="11" width="7" height="0.5" fill="#6B7280" opacity="0.5" rx="0.25"/>
          <rect x="8" y="13" width="5" height="0.5" fill="#6B7280" opacity="0.5" rx="0.25"/>
          
          <!-- Medical symbol -->
          <circle cx="13" cy="16" r="1.5" fill="#EF4444" opacity="0.8"/>
          <rect x="12.5" y="15" width="1" height="2" fill="#ffffff"/>
          <rect x="12" y="15.5" width="2" height="1" fill="#ffffff"/>
          
          <!-- Corner fold -->
          <polygon points="15,4 18,7 15,7" fill="url(#iconGrad2)" opacity="0.7"/>
        </g>
      `,
      default: `
        <g>
          <!-- Stethoscope -->
          <circle cx="8" cy="8" r="2" fill="none" stroke="url(#iconGrad1)" stroke-width="2"/>
          <circle cx="16" cy="8" r="2" fill="none" stroke="url(#iconGrad1)" stroke-width="2"/>
          <path d="M8 10 Q12 14 16 10" stroke="url(#iconGrad1)" stroke-width="2" fill="none"/>
          <circle cx="12" cy="16" r="2" fill="url(#iconGrad2)"/>
          <circle cx="12" cy="16" r="1" fill="#ffffff"/>
          
          <!-- Medical plus -->
          <rect x="11" y="4" width="2" height="4" fill="#EF4444" rx="0.5"/>
          <rect x="9" y="5" width="6" height="2" fill="#EF4444" rx="0.5"/>
        </g>
      `
    };
    
    return icons[type] || icons.default;
  };

  const getBackgroundPattern = () => {
    const patterns = {
      course: { primary: '#3B82F6', secondary: '#1D4ED8', accent: '#60A5FA' },
      anatomy: { primary: '#EF4444', secondary: '#DC2626', accent: '#F87171' },
      physiology: { primary: '#10B981', secondary: '#059669', accent: '#34D399' },
      pharmacology: { primary: '#F59E0B', secondary: '#D97706', accent: '#FCD34D' },
      pathology: { primary: '#8B5CF6', secondary: '#7C3AED', accent: '#A78BFA' },
      surgery: { primary: '#EF4444', secondary: '#DC2626', accent: '#F87171' },
      video: { primary: '#3B82F6', secondary: '#1D4ED8', accent: '#60A5FA' },
      document: { primary: '#6B7280', secondary: '#4B5563', accent: '#9CA3AF' },
      default: { primary: '#3B82F6', secondary: '#1D4ED8', accent: '#60A5FA' }
    };
    
    return patterns[type] || patterns.default;
  };

  const colors = getBackgroundPattern();

  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${getPlaceholderText()} placeholder">
      <defs>
        <!-- Background gradients -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#F8FAFC;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#F1F5F9;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E2E8F0;stop-opacity:1" />
        </linearGradient>
        
        <!-- Icon gradients -->
        <linearGradient id="iconGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:0.7" />
        </linearGradient>
        
        <linearGradient id="iconGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.secondary};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:0.6" />
        </linearGradient>
        
        <!-- Subtle pattern -->
        <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="2" cy="2" r="1" fill="${colors.primary}" opacity="0.05"/>
          <circle cx="18" cy="18" r="1" fill="${colors.accent}" opacity="0.05"/>
        </pattern>
        
        <!-- Shadow filter -->
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="2" dy="4" result="offsetblur"/>
          <feFlood flood-color="rgba(0,0,0,0.1)"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background with subtle pattern -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" rx="${Math.min(width, height) / 15}"/>
      <rect width="${width}" height="${height}" fill="url(#dots)" rx="${Math.min(width, height) / 15}"/>
      
      <!-- Main icon container -->
      <g transform="translate(${width/2 - 24}, ${height/2 - 40})" filter="url(#shadow)">
        <circle cx="24" cy="24" r="26" fill="#ffffff" opacity="0.9" stroke="${colors.primary}" stroke-width="0.5"/>
        <g transform="translate(12, 12)">
          ${getModernIcon()}
        </g>
      </g>
      
      <!-- Text with better typography -->
      <text 
        x="${width/2}" 
        y="${height/2 + 35}" 
        text-anchor="middle" 
        fill="${colors.secondary}" 
        font-family="Inter, -apple-system, system-ui, sans-serif" 
        font-size="${Math.min(14, width / 22)}" 
        font-weight="600"
        dy=".3em"
        opacity="0.9"
      >
        ${getPlaceholderText()}
      </text>
      
      <!-- Decorative elements -->
      <circle cx="${width * 0.15}" cy="${height * 0.15}" r="2" fill="${colors.accent}" opacity="0.3"/>
      <circle cx="${width * 0.85}" cy="${height * 0.85}" r="1.5" fill="${colors.primary}" opacity="0.4"/>
      <rect x="${width * 0.1}" y="${height * 0.9}" width="${width * 0.2}" height="2" fill="${colors.secondary}" opacity="0.2" rx="1"/>
      
      <!-- Elegant border -->
      <rect 
        width="${width-2}" 
        height="${height-2}" 
        x="1" 
        y="1" 
        fill="none" 
        stroke="url(#iconGrad1)" 
        stroke-width="1" 
        rx="${Math.min(width, height) / 15 - 1}"
        opacity="0.3"
      />
    </svg>
  `;

  return (
    <img
      src={`data:image/svg+xml,${encodeURIComponent(svgContent)}`}
      alt={`${getPlaceholderText()} placeholder`}
      className={`object-cover rounded-lg transition-all duration-300 hover:opacity-95 hover:scale-[1.02] ${className}`}
      width={width}
      height={height}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};

export default PlaceholderImage;