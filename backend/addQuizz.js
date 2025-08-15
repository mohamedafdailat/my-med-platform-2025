// C:\my-med-platform\backend\addQuizz.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialisez Firebase Admin SDK
// Vous devez avoir un fichier de clé de service
try {
  const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Remplacez par votre project ID
    projectId: 'medplatform-maroc'
  });
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Firebase Admin:', error);
  process.exit(1);
}

const db = admin.firestore();

async function populateQuizzes() {
  try {
    const quizzes = [
      {
        id: "1",
        title: { fr: "Quiz sur l'anatomie", ar: "اختبار في التشريح" },
        description: { fr: "Testez vos connaissances en anatomie humaine", ar: "اختبر معرفتك في التشريح البشري" },
        questions: [
          {
            question: { fr: "Combien de chambres a le cœur humain ?", ar: "كم عدد حجرات القلب البشري؟" },
            options: [
              { fr: "2", ar: "2" },
              { fr: "3", ar: "3" },
              { fr: "4", ar: "4" },
              { fr: "5", ar: "5" }
            ],
            correctAnswer: 2,
            explanation: { fr: "Le cœur humain a 4 chambres : 2 oreillettes et 2 ventricules.", ar: "القلب البشري له 4 حجرات: أذينان وبطينان." }
          },
          {
            question: { fr: "Combien d'os compte le corps humain adulte ?", ar: "كم عدد العظام في جسم الإنسان البالغ؟" },
            options: [
              { fr: "186", ar: "186" },
              { fr: "206", ar: "206" },
              { fr: "226", ar: "226" },
              { fr: "246", ar: "246" }
            ],
            correctAnswer: 1,
            explanation: { fr: "Le squelette humain adulte compte 206 os.", ar: "الهيكل العظمي للإنسان البالغ يحتوي على 206 عظمة." }
          },
          {
            question: { fr: "Quel est le plus gros organe du corps humain ?", ar: "ما هو أكبر عضو في جسم الإنسان؟" },
            options: [
              { fr: "Le foie", ar: "الكبد" },
              { fr: "Les poumons", ar: "الرئتان" },
              { fr: "La peau", ar: "الجلد" },
              { fr: "Le cerveau", ar: "المخ" }
            ],
            correctAnswer: 2,
            explanation: { fr: "La peau est le plus gros organe du corps humain.", ar: "الجلد هو أكبر عضو في جسم الإنسان." }
          }
        ]
      },
      {
        id: "2",
        title: { fr: "Quiz sur la physiologie", ar: "اختبار في علم وظائف الأعضاء" },
        description: { fr: "Testez vos connaissances en physiologie", ar: "اختبر معرفتك في علم وظائف الأعضاء" },
        questions: [
          {
            question: { fr: "Quelle est la fréquence cardiaque normale au repos ?", ar: "ما هو معدل ضربات القلب الطبيعي في الراحة؟" },
            options: [
              { fr: "40-60 bpm", ar: "40-60 نبضة/دقيقة" },
              { fr: "60-100 bpm", ar: "60-100 نبضة/دقيقة" },
              { fr: "100-120 bpm", ar: "100-120 نبضة/دقيقة" },
              { fr: "120-140 bpm", ar: "120-140 نبضة/دقيقة" }
            ],
            correctAnswer: 1,
            explanation: { fr: "La fréquence cardiaque normale au repos est de 60-100 battements par minute.", ar: "معدل ضربات القلب الطبيعي في الراحة هو 60-100 نبضة في الدقيقة." }
          },
          {
            question: { fr: "Quelle hormone régule la glycémie ?", ar: "ما الهرمون الذي ينظم مستوى السكر في الدم؟" },
            options: [
              { fr: "Adrénaline", ar: "الأدرينالين" },
              { fr: "Insuline", ar: "الأنسولين" },
              { fr: "Cortisol", ar: "الكورتيزول" },
              { fr: "Thyroxine", ar: "الثيروكسين" }
            ],
            correctAnswer: 1,
            explanation: { fr: "L'insuline est produite par le pancréas et régule la glycémie.", ar: "الأنسولين يُنتج من البنكرياس وينظم مستوى السكر في الدم." }
          }
        ]
      },
      {
        id: "3",
        title: { fr: "Quiz sur la pharmacologie", ar: "اختبار في الصيدلة" },
        description: { fr: "Testez vos connaissances en pharmacologie", ar: "اختبر معرفتك في الصيدلة" },
        questions: [
          {
            question: { fr: "Quel médicament est un anticoagulant ?", ar: "ما الدواء الذي يعتبر مضاد للتخثر؟" },
            options: [
              { fr: "Paracétamol", ar: "باراسيتامول" },
              { fr: "Warfarine", ar: "وارفارين" },
              { fr: "Métformine", ar: "ميتفورمين" },
              { fr: "Lisinopril", ar: "ليسينوبريل" }
            ],
            correctAnswer: 1,
            explanation: { fr: "La warfarine est un anticoagulant oral.", ar: "الوارفارين هو مضاد تخثر فموي." }
          },
          {
            question: { fr: "Quelle classe de médicaments traite l'hypertension ?", ar: "ما فئة الأدوية التي تعالج ارتفاع ضغط الدم؟" },
            options: [
              { fr: "Antibiotiques", ar: "المضادات الحيوية" },
              { fr: "Inhibiteurs de l'ECA", ar: "مثبطات الإنزيم المحول للأنجيوتنسين" },
              { fr: "Antifongiques", ar: "مضادات الفطريات" },
              { fr: "Bronchodilatateurs", ar: "موسعات القصبات" }
            ],
            correctAnswer: 1,
            explanation: { fr: "Les inhibiteurs de l'ECA sont utilisés pour traiter l'hypertension.", ar: "مثبطات الإنزيم المحول للأنجيوتنسين تستخدم لعلاج ارتفاع ضغط الدم." }
          }
        ]
      },
      {
        id: "4",
        title: { fr: "Quiz sur la neurologie", ar: "اختبار في علم الأعصاب" },
        description: { fr: "Testez vos connaissances en neurologie", ar: "اختبر معرفتك في علم الأعصاب" },
        questions: [
          {
            question: { fr: "Quelle partie du cerveau contrôle l'équilibre ?", ar: "ما الجزء من الدماغ الذي يتحكم في التوازن؟" },
            options: [
              { fr: "Cervelet", ar: "المخيخ" },
              { fr: "Cortex frontal", ar: "القشرة الجبهية" },
              { fr: "Hypothalamus", ar: "تحت المهاد" },
              { fr: "Medulla oblongata", ar: "النخاع المستطيل" }
            ],
            correctAnswer: 0,
            explanation: { fr: "Le cervelet régule l'équilibre et la coordination.", ar: "المخيخ ينظم التوازن والتنسيق." }
          },
          {
            question: { fr: "Quelle maladie affecte la production de dopamine ?", ar: "ما المرض الذي يؤثر على إنتاج الدوبامين؟" },
            options: [
              { fr: "Alzheimer", ar: "الزهايمر" },
              { fr: "Parkinson", ar: "الشلل الرعاش" },
              { fr: "Sclérose en plaques", ar: "التصلب المتعدد" },
              { fr: "Épilepsie", ar: "الصرع" }
            ],
            correctAnswer: 1,
            explanation: { fr: "La maladie de Parkinson est causée par une déficience en dopamine.", ar: "مرض الشلل الرعاش ناتج عن نقص في الدوبامين." }
          }
        ]
      },
      {
        id: "5",
        title: { fr: "Quiz sur la cardiologie", ar: "اختبار في علم القلب" },
        description: { fr: "Testez vos connaissances en cardiologie", ar: "اختبر معرفتك في علم القلب" },
        questions: [
          {
            question: { fr: "Quelle valve sépare l'oreillette gauche du ventricule gauche ?", ar: "ما الصمام الذي يفصل الأذين الأيسر عن البطين الأيسر؟" },
            options: [
              { fr: "Valve tricuspide", ar: "الصمام ثلاثي الشرف" },
              { fr: "Valve mitrale", ar: "الصمام التاجي" },
              { fr: "Valve aortique", ar: "الصمام الأبهري" },
              { fr: "Valve pulmonaire", ar: "الصمام الرئوي" }
            ],
            correctAnswer: 1,
            explanation: { fr: "La valve mitrale (bicuspide) sépare l'oreillette gauche du ventricule gauche.", ar: "الصمام التاجي (ثنائي الشرف) يفصل الأذين الأيسر عن البطين الأيسر." }
          },
          {
            question: { fr: "Quel examen permet de visualiser les artères coronaires ?", ar: "ما الفحص الذي يسمح بتصوير الشرايين التاجية؟" },
            options: [
              { fr: "ECG", ar: "تخطيط القلب" },
              { fr: "Échocardiographie", ar: "أشعة القلب بالموجات فوق الصوتية" },
              { fr: "Coronarographie", ar: "قسطرة القلب" },
              { fr: "IRM cardiaque", ar: "الرنين المغناطيسي للقلب" }
            ],
            correctAnswer: 2,
            explanation: { fr: "La coronarographie permet de visualiser les artères coronaires.", ar: "قسطرة القلب تسمح بتصوير الشرايين التاجية." }
          }
        ]
      },
      {
        id: "6",
        title: { fr: "Quiz sur la pédiatrie", ar: "اختبار في طب الأطفال" },
        description: { fr: "Testez vos connaissances en pédiatrie", ar: "اختبر معرفتك في طب الأطفال" },
        questions: [
          {
            question: { fr: "À quel âge ferme généralement la fontanelle antérieure ?", ar: "في أي عمر تنغلق عادة اليافوخ الأمامي؟" },
            options: [
              { fr: "6 mois", ar: "6 أشهر" },
              { fr: "12-18 mois", ar: "12-18 شهراً" },
              { fr: "2-3 ans", ar: "2-3 سنوات" },
              { fr: "4-5 ans", ar: "4-5 سنوات" }
            ],
            correctAnswer: 1,
            explanation: { fr: "La fontanelle antérieure se ferme généralement entre 12-18 mois.", ar: "اليافوخ الأمامي ينغلق عادة بين 12-18 شهراً." }
          },
          {
            question: { fr: "Quel est le premier vaccin administré à la naissance ?", ar: "ما هو أول لقاح يُعطى عند الولادة؟" },
            options: [
              { fr: "BCG", ar: "لقاح السل" },
              { fr: "Hépatite B", ar: "التهاب الكبد ب" },
              { fr: "Polio", ar: "شلل الأطفال" },
              { fr: "DTC", ar: "الثلاثي" }
            ],
            correctAnswer: 1,
            explanation: { fr: "Le vaccin contre l'hépatite B est généralement le premier administré.", ar: "لقاح التهاب الكبد ب عادة ما يكون الأول." }
          }
        ]
      },
      {
        id: "7",
        title: { fr: "Quiz sur la microbiologie", ar: "اختبار في علم الأحياء الدقيقة" },
        description: { fr: "Testez vos connaissances en microbiologie", ar: "اختبر معرفتك في علم الأحياء الدقيقة" },
        questions: [
          {
            question: { fr: "Quel agent pathogène cause le paludisme ?", ar: "ما العامل المرضي الذي يسبب الملاريا؟" },
            options: [
              { fr: "Plasmodium", ar: "البلازموديوم" },
              { fr: "Mycobacterium", ar: "الميكوباكتيريوم" },
              { fr: "Streptococcus", ar: "المكورات العقدية" },
              { fr: "Candida", ar: "الكانديدا" }
            ],
            correctAnswer: 0,
            explanation: { fr: "Le paludisme est causé par des parasites du genre Plasmodium.", ar: "الملاريا تُسبب بواسطة طفيليات من جنس البلازموديوم." }
          },
          {
            question: { fr: "Quelle bactérie est responsable de la pneumonie communautaire ?", ar: "ما البكتيريا المسؤولة عن الالتهاب الرئوي المجتمعي؟" },
            options: [
              { fr: "E. coli", ar: "بكتيريا القولون" },
              { fr: "Streptococcus pneumoniae", ar: "المكورات الرئوية" },
              { fr: "Staphylococcus aureus", ar: "المكورات الذهبية" },
              { fr: "Pseudomonas", ar: "الزوائف" }
            ],
            correctAnswer: 1,
            explanation: { fr: "Streptococcus pneumoniae est la cause principale de pneumonie communautaire.", ar: "المكورات الرئوية هي السبب الرئيسي للالتهاب الرئوي المجتمعي." }
          }
        ]
      },
      {
        id: "8",
        title: { fr: "Quiz sur la gynécologie-obstétrique", ar: "اختبار في أمراض النساء والتوليد" },
        description: { fr: "Testez vos connaissances en gynécologie-obstétrique", ar: "اختبر معرفتك في أمراض النساء والتوليد" },
        questions: [
          {
            question: { fr: "Quelle est la durée normale d'une grossesse ?", ar: "ما المدة الطبيعية للحمل؟" },
            options: [
              { fr: "36 semaines", ar: "36 أسبوعاً" },
              { fr: "40 semaines", ar: "40 أسبوعاً" },
              { fr: "42 semaines", ar: "42 أسبوعاً" },
              { fr: "44 semaines", ar: "44 أسبوعاً" }
            ],
            correctAnswer: 1,
            explanation: { fr: "Une grossesse normale dure 40 semaines d'aménorrhée.", ar: "الحمل الطبيعي يدوم 40 أسبوعاً من انقطاع الطمث." }
          },
          {
            question: { fr: "Quel hormone confirme la grossesse ?", ar: "ما الهرمون الذي يؤكد الحمل؟" },
            options: [
              { fr: "Œstrogène", ar: "الإستروجين" },
              { fr: "Progestérone", ar: "البروجستيرون" },
              { fr: "hCG", ar: "هرمون الحمل" },
              { fr: "LH", ar: "الهرمون المنشط للجسم الأصفر" }
            ],
            correctAnswer: 2,
            explanation: { fr: "L'hCG (hormone chorionique gonadotrope) confirme la grossesse.", ar: "هرمون الحمل يؤكد وجود الحمل." }
          }
        ]
      },
      {
        id: "9",
        title: { fr: "Quiz sur l'orthopédie", ar: "اختبار في جراحة العظام" },
        description: { fr: "Testez vos connaissances en orthopédie", ar: "اختبر معرفتك في جراحة العظام" },
        questions: [
          {
            question: { fr: "Quel os est le plus long du corps humain ?", ar: "ما العظم الأطول في جسم الإنسان؟" },
            options: [
              { fr: "Tibia", ar: "عظم الساق" },
              { fr: "Fémur", ar: "عظم الفخذ" },
              { fr: "Humérus", ar: "عظم العضد" },
              { fr: "Radius", ar: "عظم الكعبرة" }
            ],
            correctAnswer: 1,
            explanation: { fr: "Le fémur est l'os le plus long du corps humain.", ar: "عظم الفخذ هو أطول عظم في جسم الإنسان." }
          },
          {
            question: { fr: "Quelle articulation est la plus mobile ?", ar: "ما المفصل الأكثر حركة؟" },
            options: [
              { fr: "Genou", ar: "الركبة" },
              { fr: "Épaule", ar: "الكتف" },
              { fr: "Coude", ar: "المرفق" },
              { fr: "Cheville", ar: "الكاحل" }
            ],
            correctAnswer: 1,
            explanation: { fr: "L'articulation de l'épaule est la plus mobile du corps.", ar: "مفصل الكتف هو الأكثر حركة في الجسم." }
          }
        ]
      },
      {
        id: "10",
        title: { fr: "Quiz sur la dermatologie", ar: "اختبار في أمراض الجلد" },
        description: { fr: "Testez vos connaissances en dermatologie", ar: "اختبر معرفتك في أمراض الجلد" },
        questions: [
          {
            question: { fr: "Combien de couches principales a la peau ?", ar: "كم عدد الطبقات الرئيسية للجلد؟" },
            options: [
              { fr: "2", ar: "2" },
              { fr: "3", ar: "3" },
              { fr: "4", ar: "4" },
              { fr: "5", ar: "5" }
            ],
            correctAnswer: 1,
            explanation: { fr: "La peau a 3 couches principales : épiderme, derme et hypoderme.", ar: "الجلد له 3 طبقات رئيسية: البشرة والأدمة وتحت الأدمة." }
          },
          {
            question: { fr: "Quel type de cancer de la peau est le plus dangereux ?", ar: "ما نوع سرطان الجلد الأكثر خطورة؟" },
            options: [
              { fr: "Carcinome basocellulaire", ar: "سرطان الخلايا القاعدية" },
              { fr: "Carcinome spinocellulaire", ar: "سرطان الخلايا الحرشفية" },
              { fr: "Mélanome", ar: "الميلانوما" },
              { fr: "Kératose actinique", ar: "القرن الشمسي" }
            ],
            correctAnswer: 2,
            explanation: { fr: "Le mélanome est le type de cancer de la peau le plus dangereux.", ar: "الميلانوما هو أخطر أنواع سرطان الجلد." }
          }
        ]
      },
      {
        id: "11",
        title: { fr: "Quiz sur l'endocrinologie", ar: "اختبار في علم الغدد الصماء" },
        description: { fr: "Testez vos connaissances en endocrinologie", ar: "اختبر معرفتك في علم الغدد الصماء" },
        questions: [
          {
            question: { fr: "Quelle glande produit l'insuline ?", ar: "ما الغدة التي تنتج الأنسولين؟" },
            options: [
              { fr: "Thyroïde", ar: "الغدة الدرقية" },
              { fr: "Pancréas", ar: "البنكرياس" },
              { fr: "Surrénales", ar: "الغدد الكظرية" },
              { fr: "Hypophyse", ar: "الغدة النخامية" }
            ],
            correctAnswer: 1,
            explanation: { fr: "Le pancréas produit l'insuline dans les îlots de Langerhans.", ar: "البنكرياس ينتج الأنسولين في جزر لانغرهانز." }
          },
          {
            question: { fr: "Quel hormone régule le métabolisme ?", ar: "ما الهرمون الذي ينظم عملية الأيض؟" },
            options: [
              { fr: "Cortisol", ar: "الكورتيزول" },
              { fr: "Thyroxine (T4)", ar: "الثيروكسين" },
              { fr: "Adrénaline", ar: "الأدرينالين" },
              { fr: "Mélatonine", ar: "الميلاتونين" }
            ],
            correctAnswer: 1,
            explanation: { fr: "La thyroxine (T4) régule le métabolisme basal.", ar: "الثيروكسين ينظم عملية الأيض الأساسية." }
          }
        ]
      },
      {
        id: "12",
        title: { fr: "Quiz sur la pneumologie", ar: "اختبار في أمراض الرئة" },
        description: { fr: "Testez vos connaissances en pneumologie", ar: "اختبر معرفتك في أمراض الرئة" },
        questions: [
          {
            question: { fr: "Quelle maladie cause une obstruction des voies respiratoires ?", ar: "ما المرض الذي يسبب انسداد المجاري التنفسية؟" },
            options: [
              { fr: "Pneumonie", ar: "الالتهاب الرئوي" },
              { fr: "Asthme", ar: "الربو" },
              { fr: "Tuberculose", ar: "السل" },
              { fr: "Embolie pulmonaire", ar: "الانصمام الرئوي" }
            ],
            correctAnswer: 1,
            explanation: { fr: "L'asthme cause une obstruction réversible des voies respiratoires.", ar: "الربو يسبب انسداداً قابلاً للعكس في المجاري التنفسية." }
          },
          {
            question: { fr: "Quel gaz est échangé dans les alvéoles ?", ar: "ما الغاز الذي يتم تبادله في الحويصلات الهوائية؟" },
            options: [
              { fr: "Oxygène et CO2", ar: "الأكسجين وثاني أكسيد الكربون" },
              { fr: "Azote et O2", ar: "النيتروجين والأكسجين" },
              { fr: "CO2 et azote", ar: "ثاني أكسيد الكربون والنيتروجين" },
              { fr: "Vapeur d'eau et O2", ar: "بخار الماء والأكسجين" }
            ],
            correctAnswer: 0,
            explanation: { fr: "Les alvéoles échangent l'oxygène et le dioxyde de carbone.", ar: "الحويصلات الهوائية تتبادل الأكسجين وثاني أكسيد الكربون." }
          }
        ]
      },
      {
        id: "13",
        title: { fr: "Quiz sur la gastro-entérologie", ar: "اختبار في أمراض الجهاز الهضمي" },
        description: { fr: "Testez vos connaissances en gastro-entérologie", ar: "اختبر معرفتك في أمراض الجهاز الهضمي" },
        questions: [
          {
            question: { fr: "Où se produit principalement l'absorption des nutriments ?", ar: "أين يحدث امتصاص المواد الغذائية بشكل رئيسي؟" },
            options: [
              { fr: "Estomac", ar: "المعدة" },
              { fr: "Intestin grêle", ar: "الأمعاء الدقيقة" },
              { fr: "Côlon", ar: "القولون" },
              { fr: "Duodénum", ar: "الاثني عشر" }
            ],
            correctAnswer: 1,
            explanation: { fr: "L'intestin grêle est le principal site d'absorption des nutriments.", ar: "الأمعاء الدقيقة هي الموقع الرئيسي لامتصاص المواد الغذائية." }
          },
          {
            question: { fr: "Quelle bactérie cause les ulcères gastriques ?", ar: "ما البكتيريا التي تسبب قرح المعدة؟" },
            options: [
              { fr: "E. coli", ar: "بكتيريا القولون" },
              { fr: "Helicobacter pylori", ar: "هيليكوباكتر بيلوري" },
              { fr: "Salmonella", ar: "السالمونيلا" },
              { fr: "Shigella", ar: "الشيجيلا" }
            ],
            correctAnswer: 1,
            explanation: { fr: "Helicobacter pylori est la principale cause d'ulcères gastriques.", ar: "هيليكوباكتر بيلوري هو السبب الرئيسي لقرح المعدة." }
          }
        ]
      },
      {
        id: "14",
        title: { fr: "Quiz sur l'urologie", ar: "اختبار في أمراض المسالك البولية" },
        description: { fr: "Testez vos connaissances en urologie", ar: "اختبر معرفتك في أمراض المسالك البولية" },
        questions: [
          {
            question: { fr: "Combien de reins a une personne normale ?", ar: "كم عدد الكلى عند الشخص الطبيعي؟" },
            options: [
              { fr: "1", ar: "1" },
              { fr: "2", ar: "2" },
              { fr: "3", ar: "3" },
              { fr: "4", ar: "4" }
            ],
            correctAnswer: 1,
            explanation: { fr: "Une personne normale a deux reins.", ar: "الشخص الطبيعي لديه كليتان." }
          },
          {
            question: { fr: "Quelle infection affecte souvent les voies urinaires ?", ar: "ما الالتهاب الذي يصيب الجهاز البولي غالباً؟" },
            options: [
              { fr: "Infection urinaire", ar: "التهاب المسالك البولية" },
              { fr: "Pneumonie", ar: "الالتهاب الرئوي" },
              { fr: "Appendicite", ar: "التهاب الزائدة الدودية" },
              { fr: "Gastrite", ar: "التهاب المعدة" }
            ],
            correctAnswer: 0,
            explanation: { fr: "L'infection urinaire est courante dans les voies urinaires.", ar: "التهاب المسالك البولية شائع في الجهاز البولي." }
          }
        ]
      },
      {
        id: "15",
        title: { fr: "Quiz sur la microbiologie", ar: "اختبار في علم الأحياء الدقيقة" },
        description: { fr: "Testez vos connaissances en microbiologie", ar: "اختبر معرفتك في علم الأحياء الدقيقة" },
        questions: [
          {
            question: { fr: "Quel microbe cause la tuberculose ?", ar: "ما الجرثوم الذي يسبب السل؟" },
            options: [
              { fr: "Streptocoque", ar: "المكورات العقدية" },
              { fr: "Mycobacterium tuberculosis", ar: "ميكوباكتيريوم التوبيركولوزيس" },
              { fr: "E. coli", ar: "بكتيريا القولون" }
            ],
            correctAnswer: 1,
            explanation: { fr: "C'est une bactérie spécifique.", ar: "هي بكتيريا خاصة." }
          }
        ]
      }
    ];

// Insérer tous les quizzes
    for (const quiz of quizzes) {
      await db.collection('quizzes').doc(quiz.id).set(quiz);
      console.log(`Quiz ${quiz.id} ajouté avec succès !`);
    }

    console.log('Tous les quizzes ont été ajoutés avec succès !');
    process.exit(0);

  } catch (error) {
    console.error('Erreur lors de l\'ajout des données:', error);
    process.exit(1);
  }
}

populateQuizzes();