import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useLanguage } from '../contexts/LanguageContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProgressChart = () => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const { language } = useLanguage();

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels: [
          language === 'fr' ? 'Cours' : 'الدورات',
          language === 'fr' ? 'Vidéos' : 'الفيديوهات',
          language === 'fr' ? 'Quiz' : 'الاختبارات',
          language === 'fr' ? 'Flashcards' : 'بطاقات تعليمية',
        ],
        datasets: [
          {
            label: language === 'fr' ? 'Progrès (%)' : 'التقدم (%)',
            data: [75, 60, 85, 45],
            backgroundColor: 'rgba(78, 144, 251, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: language === 'fr' ? 'Pourcentage' : 'النسبة المئوية',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [language]);

  return (
    <div className="w-full">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default ProgressChart;