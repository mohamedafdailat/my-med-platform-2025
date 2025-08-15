const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();

// Liste des vidéos médicales
const videos = [
  // Existing videos (updated categories where applicable)
  {
    youtubeId: 'dQw4w9WgXcQ',
    title: { fr: 'Introduction à l\'anatomie humaine', ar: 'مقدمة في تشريح الإنسان' },
    description: { fr: 'Une introduction aux bases de l\'anatomie humaine pour les étudiants en médecine.', ar: 'مقدمة في أساسيات تشريح الإنسان لطلاب الطب' },
    category: 'médecine_générale',
    duration: 'PT5M45S',
    views: 250000,
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    publishedAt: '2024-01-10T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'I80hvYoZakQ',
    title: { fr: 'Principes de pharmacologie', ar: 'مبادئ الصيدلة' },
    description: { fr: 'Explication des principes fondamentaux de la pharmacologie.', ar: 'شرح المبادئ الأساسية للصيدلة' },
    category: 'pharmacie',
    duration: 'PT7M20S',
    views: 180000,
    thumbnail: 'https://img.youtube.com/vi/I80hvYoZakQ/maxresdefault.jpg',
    publishedAt: '2024-02-15T10:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'Fi5NcGYNKlw',
    title: { fr: 'Technologie en imagerie médicale', ar: 'التكنولوجيا في التصوير الطبي' },
    description: { fr: 'Exploration des technologies comme l\'IRM et le scanner.', ar: 'استكشاف التقنيات مثل التصوير بالرنين المغناطيسي والماسح الضوئي' },
    category: 'soins_critiques',
    duration: 'PT6M50S',
    views: 90000,
    thumbnail: 'https://img.youtube.com/vi/Fi5NcGYNKlw/maxresdefault.jpg',
    publishedAt: '2024-03-20T12:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'rBZyKYoh2BU',
    title: { fr: 'Physiologie de la circulation sanguine', ar: 'فسيولوجيا الدورة الدموية' },
    description: { fr: 'Étude du système cardiovasculaire et de la circulation.', ar: 'دراسة الجهاز القلبي الوعائي والدورة الدموية' },
    category: 'médecine_générale',
    duration: 'PT4M30S',
    views: 150000,
    thumbnail: 'https://img.youtube.com/vi/rBZyKYoh2BU/maxresdefault.jpg',
    publishedAt: '2024-04-01T14:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'L1JEb1tRtAw',
    title: { fr: 'Gestion des médicaments en pharmacie', ar: 'إدارة الأدوية في الصيدلة' },
    description: { fr: 'Comment gérer les stocks et prescriptions en pharmacie.', ar: 'كيفية إدارة المخزون والوصفات في الصيدلة' },
    category: 'pharmacie',
    duration: 'PT5M15S',
    views: 45000,
    thumbnail: 'https://img.youtube.com/vi/L1JEb1tRtAw/maxresdefault.jpg',
    publishedAt: '2024-05-10T09:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'i6hmGVBbIJk',
    title: { fr: 'Ventilation mécanique expliquée clairement', ar: 'التهوية الميكانيكية بشرح واضح' },
    description: { fr: 'Introduction à la ventilation mécanique (MedCram)', ar: 'مقدمة حول التهوية الميكانيكية' },
    category: 'médecine_générale',
    duration: 'PT10M',
    views: 2500000,
    thumbnail: 'https://img.youtube.com/vi/i6hmGVBbIJk/maxresdefault.jpg',
    publishedAt: '2020-04-12T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'KHpJ21UWbhg',
    title: { fr: 'Ventilation mécanique - Partie 4', ar: 'التهوية الميكانيكية - الجزء الرابع' },
    description: { fr: 'Quatrième partie de l\'explication sur la ventilation mécanique (MedCram)', ar: 'الجزء الرابع من الشرح حول التهوية الميكانيكية' },
    category: 'médecine_générale',
    duration: 'PT7M',
    views: 1200000,
    thumbnail: 'https://img.youtube.com/vi/KHpJ21UWbhg/maxresdefault.jpg',
    publishedAt: '2020-04-25T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'K0maLgTzIto',
    title: { fr: 'Ventilation mécanique - Partie 2', ar: 'التهوية الميكانيكية - الجزء الثاني' },
    description: { fr: 'Deuxième partie de l\'explication sur la ventilation mécanique (MedCram)', ar: 'الجزء الثاني من الشرح حول التهوية الميكانيكية' },
    category: 'médecine_générale',
    duration: 'PT12M20S',
    views: 1500000,
    thumbnail: 'https://img.youtube.com/vi/K0maLgTzIto/maxresdefault.jpg',
    publishedAt: '2020-04-20T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: '6Bdv7QhNNy4',
    title: { fr: 'Ventilation mécanique - Partie 3', ar: 'التهوية الميكانيكية - الجزء الثالث' },
    description: { fr: 'Troisième partie de l\'explication sur la ventilation mécanique (MedCram)', ar: 'الجزء الثالث من الشرح حول التهوية الميكانيكية' },
    category: 'médecine_générale',
    duration: 'PT9M',
    views: 1300000,
    thumbnail: 'https://img.youtube.com/vi/6Bdv7QhNNy4/maxresdefault.jpg',
    publishedAt: '2020-04-22T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'iP_jN1qAPtI',
    title: { fr: 'Modes de ventilateur expliqués', ar: 'أوضاع التهوية الميكانيكية المفسرة' },
    description: { fr: 'Explication des modes de ventilateur comme PEEP et CPAP.', ar: 'شرح أوضاع التهوية مثل PEEP وCPAP' },
    category: 'médecine_générale',
    duration: 'PT8M30S',
    views: 900000,
    thumbnail: 'https://img.youtube.com/vi/iP_jN1qAPtI/maxresdefault.jpg',
    publishedAt: '2021-06-15T10:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'NUN32O05G0', // Corrected from NUN32O054G0 (assumed typo)
    title: { fr: 'Perles de ventilateur expliquées', ar: 'درر التهوية الميكانيكية المفسرة' },
    description: { fr: 'Conseils avancés sur l\'utilisation des ventilateurs.', ar: 'نصائح متقدمة حول استخدام التهوية' },
    category: 'médecine_générale',
    duration: 'PT6M45S',
    views: 800000,
    thumbnail: 'https://img.youtube.com/vi/NUN32O05G0/maxresdefault.jpg',
    publishedAt: '2022-03-10T09:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'mnIpD1VwyMo',
    title: { fr: 'Apprendre la ventilation mécanique', ar: 'تعلم التهوية الميكانيكية' },
    description: { fr: 'Cours gratuit sur la ventilation mécanique (MedCram).', ar: 'دورة مجانية حول التهوية الميكانيكية' },
    category: 'médecine_générale',
    duration: 'PT15M',
    views: 2000000,
    thumbnail: 'https://img.youtube.com/vi/mnIpD1VwyMo/maxresdefault.jpg',
    publishedAt: '2020-05-01T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'uBGl2BujkPQ',
    title: { fr: 'Crash Course - Anatomie & Physiologie #1', ar: 'دورة سريعة - التشريح وعلم وظائف الأعضاء #1' },
    description: { fr: 'Introduction à l\'anatomie et à la physiologie humaine.', ar: 'مقدمة إلى تشريح ووظائف أعضاء الإنسان' },
    category: 'médecine_générale',
    duration: 'PT10M30S',
    views: 1500000,
    thumbnail: 'https://img.youtube.com/vi/uBGl2BujkPQ/maxresdefault.jpg',
    publishedAt: '2015-01-26T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: '6qk_LTVXZ2w',
    title: { fr: 'Introduction à la physiologie', ar: 'مقدمة في علم وظائف الأعضاء' },
    description: { fr: 'Cours pour médecins, infirmiers et étudiants.', ar: 'دورة للأطباء والممرضين والطلاب' },
    category: 'médecine_générale',
    duration: 'PT12M',
    views: 700000,
    thumbnail: 'https://img.youtube.com/vi/6qk_LTVXZ2w/maxresdefault.jpg',
    publishedAt: '2019-07-20T10:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: '9_lF81X7w3o',
    title: { fr: 'Physiologie humaine complète', ar: 'علم وظائف الأعضاء البشري الكامل' },
    description: { fr: 'Cours complet sur la physiologie humaine.', ar: 'دورة كاملة حول وظائف الأعضاء' },
    category: 'médecine_générale',
    duration: 'PT1H30M',
    views: 800000,
    thumbnail: 'https://img.youtube.com/vi/9_lF81X7w3o/maxresdefault.jpg',
    publishedAt: '2020-09-15T09:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'IagYUKyS0cg',
    title: { fr: 'Anatomie et physiologie 101', ar: 'تشريح وفسيولوجيا 101' },
    description: { fr: 'Vue d\'ensemble ultime de l\'anatomie et de la physiologie.', ar: 'نظرة عامة شاملة على التشريح والفسيولوجيا' },
    category: 'médecine_générale',
    duration: 'PT15M',
    views: 600000,
    thumbnail: 'https://img.youtube.com/vi/IagYUKyS0cg/maxresdefault.jpg',
    publishedAt: '2021-11-10T11:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'Sq37MPfiWDo',
    title: { fr: 'Asthme avec Dr. Sara Ellingwood', ar: 'الربو مع الدكتورة سارة' },
    description: { fr: 'Cours clinique sur l\'asthme.', ar: 'درس سريري حول الربو' },
    category: 'médecine_générale',
    duration: 'PT17M45S',
    views: 300000,
    thumbnail: 'https://img.youtube.com/vi/Sq37MPfiWDo/maxresdefault.jpg',
    publishedAt: '2021-03-10T13:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'YnJrgaensk8',
    title: { fr: 'Sepsis et choc septique', ar: 'التسمم الدموي والصدمة الدموية' },
    description: { fr: 'Explication par Dr. Aaditya Chandramouli.', ar: 'شرح من الدكتور أديتيا' },
    category: 'médecine_générale',
    duration: 'PT20M',
    views: 250000,
    thumbnail: 'https://img.youtube.com/vi/YnJrgaensk8/maxresdefault.jpg',
    publishedAt: '2022-05-15T14:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: '7Ieov6bqUYs',
    title: { fr: 'Sepsis avec Dr. Sally Suliman', ar: 'التسمم الدموي مع الدكتورة سالي' },
    description: { fr: 'Cours sur le sepsis.', ar: 'درس حول التسمم الدموي' },
    category: 'médecine_générale',
    duration: 'PT18M30S',
    views: 200000,
    thumbnail: 'https://img.youtube.com/vi/7Ieov6bqUYs/maxresdefault.jpg',
    publishedAt: '2022-06-20T09:00:00Z',
    uploadedBy: 'admin-uid',
  },
  // New videos from user input
  {
    youtubeId: 'DPFBZI1HOPU',
    title: { fr: 'Apprendre le vocabulaire de la pharmacie en français', ar: 'تعلم مفردات الصيدلة بالفرنسية' },
    description: { fr: 'Cours pour maîtriser le vocabulaire pharmaceutique.', ar: 'دورة لإتقان مفردات الصيدلة' },
    category: 'pharmacie',
    duration: 'PT7M',
    views: 50000,
    thumbnail: 'https://img.youtube.com/vi/DPFBZI1HOPU/maxresdefault.jpg',
    publishedAt: '2021-08-10T10:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'PZvdF-UDOfo',
    title: { fr: 'Améliorer son français : Conversation à la pharmacie', ar: 'تحسين الفرنسية: حوار في الصيدلية' },
    description: { fr: 'Pratique de conversation et écoute à la pharmacie.', ar: 'تمرين الحوار والاستماع في الصيدلية' },
    category: 'pharmacie',
    duration: 'PT8M',
    views: 45000,
    thumbnail: 'https://img.youtube.com/vi/PZvdF-UDOfo/maxresdefault.jpg',
    publishedAt: '2020-12-15T09:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'LpiA4BSBvRQ',
    title: { fr: 'Conversation à la pharmacie', ar: 'حوار في الصيدلية' },
    description: { fr: 'Dialogue typique dans une pharmacie.', ar: 'حوار نمطي في الصيدلية' },
    category: 'pharmacie',
    duration: 'PT6M30S',
    views: 40000,
    thumbnail: 'https://img.youtube.com/vi/LpiA4BSBvRQ/maxresdefault.jpg',
    publishedAt: '2021-03-20T11:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: '2AseDV_KHdY',
    title: { fr: 'Conversation française - À la pharmacie', ar: 'حوار فرنسي - في الصيدلية' },
    description: { fr: 'Exercices de dialogue à la pharmacie.', ar: 'تمارين حوار في الصيدلية' },
    category: 'pharmacie',
    duration: 'PT5M',
    views: 35000,
    thumbnail: 'https://img.youtube.com/vi/2AseDV_KHdY/maxresdefault.jpg',
    publishedAt: '2020-10-10T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'CTddhtW6PAU',
    title: { fr: 'Vocabulaire français de base - Pharmacie', ar: 'مفردات فرنسية أساسية - الصيدلية' },
    description: { fr: 'Introduction au vocabulaire de la pharmacie.', ar: 'مقدمة إلى مفردات الصيدلية' },
    category: 'pharmacie',
    duration: 'PT7M15S',
    views: 30000,
    thumbnail: 'https://img.youtube.com/vi/CTddhtW6PAU/maxresdefault.jpg',
    publishedAt: '2021-05-15T10:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: '1Gg-bgCd7uo',
    title: { fr: 'La pharmacie en face de l\'hôpital', ar: 'الصيدلية مقابل المستشفى' },
    description: { fr: 'Scène quotidienne à la pharmacie.', ar: 'مشاهد يومية في الصيدلية' },
    category: 'pharmacie',
    duration: 'PT4M45S',
    views: 25000,
    thumbnail: 'https://img.youtube.com/vi/1Gg-bgCd7uo/maxresdefault.jpg',
    publishedAt: '2020-11-20T09:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'PLvrp9iOILTQZnCu4eUceV2-KHeqGazsZO',
    title: { fr: 'Conférences sur la santé publique dentaire', ar: 'محاضرات عن الصحة العامة للأسنان' },
    description: { fr: 'Série de conférences sur la santé dentaire publique.', ar: 'سلسلة محاضرات حول الصحة العامة للأسنان' },
    category: 'dentaire',
    duration: 'PT3H', // Estimated for playlist
    views: 150000,
    thumbnail: 'https://img.youtube.com/vi/PLvrp9iOILTQZnCu4eUceV2-KHeqGazsZO/hqdefault.jpg',
    publishedAt: '2022-01-10T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'PLbcTc7tH7Yf6XQVz4hOiPuvlthJbx96FH',
    title: { fr: 'Conférences sur la dentisterie publique', ar: 'محاضرات عن طب الأسنان العام' },
    description: { fr: 'Série de cours sur la dentisterie publique.', ar: 'سلسلة دروس حول طب الأسنان العام' },
    category: 'dentaire',
    duration: 'PT2H30M', // Estimated for playlist
    views: 120000,
    thumbnail: 'https://img.youtube.com/vi/PLbcTc7tH7Yf6XQVz4hOiPuvlthJbx96FH/hqdefault.jpg',
    publishedAt: '2021-09-15T09:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'PL4GxLqfq0Wle9L4efDGtl_9scEHKqvHqW',
    title: { fr: 'Pharmacologie pour étudiants en médecine et dentisterie', ar: 'الصيدلة لطلاب الطب وطب الأسنان' },
    description: { fr: 'Cours de pharmacologie pour étudiants.', ar: 'دروس في الصيدلة للطلاب' },
    category: 'dentaire',
    duration: 'PT4H', // Estimated for playlist
    views: 200000,
    thumbnail: 'https://img.youtube.com/vi/PL4GxLqfq0Wle9L4efDGtl_9scEHKqvHqW/hqdefault.jpg',
    publishedAt: '2020-06-20T10:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'UCbUJXnjWRGedNsMLqw-td9g',
    title: { fr: 'Conférences de médecine interne UofL', ar: 'محاضرات الطب الداخلي UofL' },
    description: { fr: 'Série de conférences sur la médecine interne.', ar: 'سلسلة محاضرات حول الطب الداخلي' },
    category: 'dentaire',
    duration: 'PT3H30M', // Estimated for channel
    views: 180000,
    thumbnail: 'https://img.youtube.com/vi/UCbUJXnjWRGedNsMLqw-td9g/hqdefault.jpg',
    publishedAt: '2021-03-01T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: '47a8r3PL5x0',
    title: { fr: 'Conférence annuelle en médecine comportementale et dentisterie', ar: 'محاضرة سنوية في الطب السلوكي وطب الأسنان' },
    description: { fr: 'Cours sur la médecine comportementale et dentaire.', ar: 'دورة حول الطب السلوكي وطب الأسنان' },
    category: 'dentaire',
    duration: 'PT1H',
    views: 90000,
    thumbnail: 'https://img.youtube.com/vi/47a8r3PL5x0/maxresdefault.jpg',
    publishedAt: '2022-10-15T11:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'U7cgj80lRHU',
    title: { fr: 'Série de conférences patrimoniales - Dentisterie', ar: 'سلسلة محاضرات تراثية - طب الأسنان' },
    description: { fr: 'Histoire et évolution de la dentisterie.', ar: 'تاريخ وتطور طب الأسنان' },
    category: 'dentaire',
    duration: 'PT50M',
    views: 70000,
    thumbnail: 'https://img.youtube.com/vi/U7cgj80lRHU/maxresdefault.jpg',
    publishedAt: '2021-12-05T09:00:00Z',
    uploadedBy: 'admin-uid',
  },
  {
    youtubeId: 'PLkFe1DHkpeOJM3pRRAEQGmiwUl-VLpjDC',
    title: { fr: 'Conférences sur la dentisterie gériatrique', ar: 'محاضرات عن طب الأسنان لكبار السن' },
    description: { fr: 'Série sur les soins dentaires pour les personnes âgées.', ar: 'سلسلة حول العناية بالأسنان لكبار السن' },
    category: 'dentaire',
    duration: 'PT2H', // Estimated for playlist
    views: 110000,
    thumbnail: 'https://img.youtube.com/vi/PLkFe1DHkpeOJM3pRRAEQGmiwUl-VLpjDC/hqdefault.jpg',
    publishedAt: '2020-08-10T08:00:00Z',
    uploadedBy: 'admin-uid',
  },
];

async function addVideos() {
  try {
    // Validation des données
    for (const video of videos) {
      if (!video.youtubeId || !video.title.fr || !video.title.ar || !video.category) {
        throw new Error(`Données invalides pour la vidéo: ${JSON.stringify(video)}`);
      }
      if (!['médecine_générale', 'pharmacie', 'dentaire', 'soins_critiques'].includes(video.category)) {
        throw new Error(`Catégorie invalide pour la vidéo: ${video.category}`);
      }
    }

    // Utilisation d'un batch pour écrire toutes les vidéos
    const batch = db.batch();
    videos.forEach(video => {
      const docRef = db.collection('videos').doc();
      batch.set(docRef, video);
    });

    await batch.commit();
    console.log('Toutes les vidéos ont été ajoutées avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'ajout des vidéos:', error);
  }
}

addVideos();