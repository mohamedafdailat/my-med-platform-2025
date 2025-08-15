import React, { useContext, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const chartRef = useRef(null);

  // Données d'exemple (à remplacer par une API)
  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [
          {
            label: language === 'fr' ? 'Utilisateurs Actifs' : 'المستخدمين النشطين',
            data: [120, 150, 180, 200, 230, 250],
            borderColor: 'rgba(59, 130, 246, 1)',
            fill: false,
          },
          {
            label: language === 'fr' ? 'Contenus Consultés' : 'المحتويات المستعرضة',
            data: [300, 320, 350, 400, 420, 450],
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: language === 'fr' ? 'Nombre' : 'العدد',
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

    return () => chart.destroy();
  }, [language]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">
          {language === 'fr' ? 'Accès non autorisé.' : 'غير مصرح بالوصول.'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'fr' ? 'Analytique' : 'التحليلات'}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'fr' ? 'Statistiques de la Plateforme' : 'إحصائيات المنصة'}
        </h2>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Analytics;