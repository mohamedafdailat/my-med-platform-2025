const { db } = require('./src/config/firebase'); // Ajuste le chemin si nécessaire

async function populateCourses() {
  try {
    const courses = [
      {
        id: "1",
        title: { fr: "Cours d'anatomie", ar: "دورة في التشريح" },
        description: { 
          fr: "Une introduction complète aux systèmes corporels humains.", 
          ar: "مقدمة شاملة للأنظمة البدنية البشرية." 
        },
        modules: [
          { fr: "Introduction à l'anatomie", ar: "مقدمة في التشريح" },
          { fr: "Système circulatoire", ar: "الجهاز الدوري" },
          { fr: "Système nerveux", ar: "الجهاز العصبي" }
        ]
      },
      {
        id: "2",
        title: { fr: "Cours de physiologie", ar: "دورة في علم وظائف الأعضاء" },
        description: { 
          fr: "Étude des fonctions des organes et systèmes du corps.", 
          ar: "دراسة وظائف الأعضاء والأنظمة في الجسم." 
        },
        modules: [
          { fr: "Fonctions respiratoires", ar: "وظائف التنفس" },
          { fr: "Régulation hormonale", ar: "التنظيم الهرموني" },
          { fr: "Métabolisme cellulaire", ar: "التمثيل الغذائي الخلوي" }
        ]
      },
      {
        id: "3",
        title: { fr: "Cours de pharmacologie", ar: "دورة في الصيدلة" },
        description: { 
          fr: "Apprenez les principes des médicaments et leurs effets.", 
          ar: "تعلم مبادئ الأدوية وتأثيراتها." 
        },
        modules: [
          { fr: "Classification des médicaments", ar: "تصنيف الأدوية" },
          { fr: "Effets secondaires", ar: "الآثار الجانبية" },
          { fr: "Interactions médicamenteuses", ar: "التفاعلات الدوائية" }
        ]
      },
      {
        id: "4",
        title: { fr: "Cours de cardiologie", ar: "دورة في علم القلب" },
        description: { 
          fr: "Exploration des maladies et fonctions du cœur.", 
          ar: "استكشاف أمراض القلب ووظائفه." 
        },
        modules: [
          { fr: "Anatomie du cœur", ar: "تشريح القلب" },
          { fr: "Hypertension artérielle", ar: "ارتفاع ضغط الدم" },
          { fr: "Techniques d'électrocardiogramme", ar: "تقنيات تخطيط القلب" }
        ]
      },
      {
        id: "5",
        title: { fr: "Cours de pédiatrie", ar: "دورة في طب الأطفال" },
        description: { 
          fr: "Soins et développement des enfants de 0 à 18 ans.", 
          ar: "الرعاية والتطور للأطفال من 0 إلى 18 عاماً." 
        },
        modules: [
          { fr: "Croissance et développement", ar: "النمو والتطور" },
          { fr: "Maladies infantiles courantes", ar: "الأمراض الشائعة عند الأطفال" },
          { fr: "Vaccinations", ar: "التطعيمات" }
        ]
      },
      {
        id: "6",
        title: { fr: "Cours de microbiologie", ar: "دورة في علم الأحياء الدقيقة" },
        description: { 
          fr: "Étude des micro-organismes et leurs impacts sur la santé.", 
          ar: "دراسة الكائنات الدقيقة وتأثيراتها على الصحة." 
        },
        modules: [
          { fr: "Bactéries pathogènes", ar: "البكتيريا المسببة للأمراض" },
          { fr: "Virus et infections", ar: "الفيروسات والعدوى" },
          { fr: "Antibiotiques", ar: "المضادات الحيوية" }
        ]
      }
    ];

    // Insérer tous les cours
    for (const course of courses) {
      await db.collection('courses').doc(course.id).set(course);
      console.log(`Cours ${course.id} ajouté avec succès !`);
    }

  } catch (error) {
    console.error('Erreur lors de l\'ajout des données:', error);
  }
}

populateCourses();