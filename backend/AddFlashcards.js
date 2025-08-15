const { db } = require('./src/config/firebase'); // Ajuste le chemin si nécessaire

async function populateFlashcards() {
  try {
    const flashcardDecks = [
      {
        id: "1",
        title: { fr: "Deck : Termes d'anatomie", ar: "مجموعة: مصطلحات التشريح" },
        description: { 
          fr: "Apprenez les principaux termes d'anatomie.", 
          ar: "تعلم المصطلحات الرئيسية للتشريح." 
        },
        thumbnail: "https://www.docdeclic.fr/uploads/1587477264_3ea943e53a43e6383b3e.png",
        category: "anatomy",
        cards: [
          {
            id: 1,
            front: { fr: "Qu'est-ce que l'épiderme ?", ar: "ما هو البشرة؟" },
            back: { 
              fr: "La couche externe de la peau qui protège le corps contre les infections et les blessures.",
              ar: "الطبقة الخارجية من الجلد التي تحمي الجسم من العدوى والإصابات."
            }
          },
          {
            id: 2,
            front: { fr: "Où se trouve le fémur ?", ar: "أين يقع عظم الفخذ؟" },
            back: { 
              fr: "L'os le plus long du corps humain, situé dans la cuisse.",
              ar: "أطول عظم في جسم الإنسان، يقع في الفخذ."
            }
          },
          {
            id: 3,
            front: { fr: "Qu'est-ce que le diaphragme ?", ar: "ما هو الحجاب الحاجز؟" },
            back: { 
              fr: "Muscle principal de la respiration qui sépare la cavité thoracique de la cavité abdominale.",
              ar: "العضلة الرئيسية للتنفس التي تفصل التجويف الصدري عن التجويف البطني."
            }
          },
          {
            id: 4,
            front: { fr: "Combien de chambres a le cœur humain ?", ar: "كم عدد حجرات القلب البشري؟" },
            back: { 
              fr: "Quatre chambres : deux oreillettes et deux ventricules.",
              ar: "أربع حجرات: أذينان وبطينان."
            }
          },
          {
            id: 5,
            front: { fr: "Qu'est-ce que la moelle épinière ?", ar: "ما هو النخاع الشوكي؟" },
            back: { 
              fr: "Faisceau de nerfs qui transmet les signaux entre le cerveau et le reste du corps.",
              ar: "حزمة من الأعصاب تنقل الإشارات بين الدماغ وباقي الجسم."
            }
          },
          {
            id: 6,
            front: { fr: "Où sont situés les reins ?", ar: "أين تقع الكلى؟" },
            back: { 
              fr: "De chaque côté de la colonne vertébrale, dans la partie postérieure de l'abdomen.",
              ar: "على جانبي العمود الفقري، في الجزء الخلفي من البطن."
            }
          },
          {
            id: 7,
            front: { fr: "Qu'est-ce que le pancréas ?", ar: "ما هو البنكرياس؟" },
            back: { 
              fr: "Glande qui produit l'insuline et les enzymes digestives.",
              ar: "غدة تنتج الأنسولين والإنزيمات الهضمية."
            }
          },
          {
            id: 8,
            front: { fr: "Combien d'os compte le squelette humain adulte ?", ar: "كم عدد العظام في الهيكل العظمي البشري البالغ؟" },
            back: { 
              fr: "206 os chez l'adulte (270 à la naissance qui se fusionnent).",
              ar: "206 عظمة عند البالغ (270 عند الولادة تندمج مع الوقت)."
            }
          },
          {
            id: 9,
            front: { fr: "Qu'est-ce que l'aorte ?", ar: "ما هو الشريان الأورطي؟" },
            back: { 
              fr: "La plus grande artère du corps qui transporte le sang oxygéné du cœur.",
              ar: "أكبر شريان في الجسم ينقل الدم المؤكسد من القلب."
            }
          },
          {
            id: 10,
            front: { fr: "Où se trouve l'hypothalamus ?", ar: "أين يقع الوطاء؟" },
            back: { 
              fr: "Dans le cerveau, il régule la température corporelle et les hormones.",
              ar: "في الدماغ، ينظم درجة حرارة الجسم والهرمونات."
            }
          },
          {
            id: 11,
            front: { fr: "Qu'est-ce que la trachée ?", ar: "ما هي القصبة الهوائية؟" },
            back: { 
              fr: "Conduit qui transporte l'air des voies nasales aux poumons.",
              ar: "أنبوب ينقل الهواء من الممرات الأنفية إلى الرئتين."
            }
          },
          {
            id: 12,
            front: { fr: "Combien de côtes a l'être humain ?", ar: "كم عدد الضلوع عند الإنسان؟" },
            back: { 
              fr: "24 côtes au total : 12 paires qui protègent les organes thoraciques.",
              ar: "24 ضلع في المجموع: 12 زوجاً تحمي الأعضاء الصدرية."
            }
          },
          {
            id: 13,
            front: { fr: "Qu'est-ce que le foie ?", ar: "ما هو الكبد؟" },
            back: { 
              fr: "Le plus grand organe interne qui détoxifie le sang et produit la bile.",
              ar: "أكبر عضو داخلي يزيل السموم من الدم وينتج الصفراء."
            }
          },
          {
            id: 14,
            front: { fr: "Où se situent les amygdales ?", ar: "أين تقع اللوزتان؟" },
            back: { 
              fr: "Dans la gorge, elles font partie du système immunitaire.",
              ar: "في الحلق، وهما جزء من الجهاز المناعي."
            }
          },
          {
            id: 15,
            front: { fr: "Qu'est-ce que l'iris ?", ar: "ما هي القزحية؟" },
            back: { 
              fr: "Partie colorée de l'œil qui contrôle la quantité de lumière entrant.",
              ar: "الجزء الملون من العين الذي يتحكم في كمية الضوء الداخل."
            }
          }
        ]
      },
      {
        id: "2",
        title: { fr: "Deck : Processus physiologiques", ar: "مجموعة: العمليات الفسيولوجية" },
        description: { 
          fr: "Mémorisez les fonctions physiologiques clés.", 
          ar: "احفظ الوظائف الفسيولوجية الرئيسية." 
        },
        thumbnail: "https://s1.studylibfr.com/store/data/003860148_1-191dfeecf95f96625f28d673088726f2.png",
        category: "physiology",
        cards: [
          {
            id: 1,
            front: { fr: "Qu'est-ce que l'homéostasie ?", ar: "ما هو التوازن الداخلي؟" },
            back: { 
              fr: "Capacité du corps à maintenir un environnement interne stable malgré les changements externes.",
              ar: "قدرة الجسم على الحفاظ على بيئة داخلية مستقرة رغم التغيرات الخارجية."
            }
          },
          {
            id: 2,
            front: { fr: "Comment fonctionne la respiration cellulaire ?", ar: "كيف تعمل التنفس الخلوي؟" },
            back: { 
              fr: "Processus où les cellules utilisent l'oxygène pour décomposer le glucose et produire de l'ATP.",
              ar: "عملية تستخدم فيها الخلايا الأكسجين لتفكيك الجلوكوز وإنتاج ATP."
            }
          },
          {
            id: 3,
            front: { fr: "Qu'est-ce que la digestion ?", ar: "ما هو الهضم؟" },
            back: { 
              fr: "Décomposition des aliments en nutriments absorbables par l'organisme.",
              ar: "تفكيك الطعام إلى مواد غذائية يمكن للجسم امتصاصها."
            }
          },
          {
            id: 4,
            front: { fr: "Comment le cœur pompe-t-il le sang ?", ar: "كيف يضخ القلب الدم؟" },
            back: { 
              fr: "Contraction rythmique des ventricules qui propulse le sang dans les artères.",
              ar: "انقباض إيقاعي للبطينين يدفع الدم في الشرايين."
            }
          },
          {
            id: 5,
            front: { fr: "Qu'est-ce que la filtration rénale ?", ar: "ما هو الترشيح الكلوي؟" },
            back: { 
              fr: "Processus par lequel les reins éliminent les déchets du sang pour former l'urine.",
              ar: "العملية التي تزيل فيها الكلى الفضلات من الدم لتكوين البول."
            }
          },
          {
            id: 6,
            front: { fr: "Comment fonctionne la thermorégulation ?", ar: "كيف يعمل تنظيم الحرارة؟" },
            back: { 
              fr: "Mécanisme qui maintient la température corporelle constante par la transpiration ou les frissons.",
              ar: "آلية تحافظ على درجة حرارة الجسم ثابتة عبر التعرق أو الرعشة."
            }
          },
          {
            id: 7,
            front: { fr: "Qu'est-ce que la glycémie ?", ar: "ما هو سكر الدم؟" },
            back: { 
              fr: "Concentration de glucose dans le sang, régulée par l'insuline et le glucagon.",
              ar: "تركيز الجلوكوز في الدم، ينظمه الأنسولين والجلوكاجون."
            }
          },
          {
            id: 8,
            front: { fr: "Comment fonctionne la transmission nerveuse ?", ar: "كيف يعمل النقل العصبي؟" },
            back: { 
              fr: "Signaux électriques transmis le long des neurones via des neurotransmetteurs.",
              ar: "إشارات كهربائية تنتقل عبر العصبونات بواسطة الناقلات العصبية."
            }
          },
          {
            id: 9,
            front: { fr: "Qu'est-ce que la coagulation sanguine ?", ar: "ما هو تخثر الدم؟" },
            back: { 
              fr: "Processus qui arrête les saignements en formant un caillot au site de la blessure.",
              ar: "عملية توقف النزيف بتكوين جلطة في موقع الإصابة."
            }
          },
          {
            id: 10,
            front: { fr: "Comment fonctionne l'immunité ?", ar: "كيف تعمل المناعة؟" },
            back: { 
              fr: "Système de défense qui identifie et élimine les agents pathogènes.",
              ar: "نظام دفاعي يحدد ويقضي على العوامل المسببة للأمراض."
            }
          },
          {
            id: 11,
            front: { fr: "Qu'est-ce que la peristalsis ?", ar: "ما هي الحركة التمعجية؟" },
            back: { 
              fr: "Contractions musculaires qui poussent les aliments dans le tube digestif.",
              ar: "انقباضات عضلية تدفع الطعام عبر الجهاز الهضمي."
            }
          },
          {
            id: 12,
            front: { fr: "Comment fonctionnent les échanges gazeux ?", ar: "كيف تعمل تبادل الغازات؟" },
            back: { 
              fr: "Oxygène et CO2 s'échangent entre les alvéoles pulmonaires et le sang.",
              ar: "الأكسجين وثاني أكسيد الكربون يتبادلان بين الحويصلات الهوائية والدم."
            }
          }
        ]
      },
      {
        id: "3",
        title: { fr: "Deck : Médicaments courants", ar: "مجموعة: الأدوية الشائعة" },
        description: { 
          fr: "Revisez les noms et usages des médicaments.", 
          ar: "راجع أسماء واستخدامات الأدوية." 
        },
        thumbnail: "https://cdn.slidesharecdn.com/ss_thumbnails/lesantibiotiquesi-171209223412-thumbnail.jpg?width=640&height=640&fit=bounds",
        category: "pharmacology",
        cards: [
          {
            id: 1,
            front: { fr: "À quoi sert le paracétamol ?", ar: "لماذا يستخدم الباراسيتامول؟" },
            back: { 
              fr: "Analgésique et antipyrétique pour soulager la douleur et réduire la fièvre.",
              ar: "مسكن للألم وخافض للحرارة لتخفيف الألم وتقليل الحمى."
            }
          },
          {
            id: 2,
            front: { fr: "Qu'est-ce que l'aspirine ?", ar: "ما هو الأسبرين؟" },
            back: { 
              fr: "Anti-inflammatoire non stéroïdien (AINS) qui réduit l'inflammation et prévient les caillots.",
              ar: "مضاد التهاب غير ستيرويدي يقلل الالتهاب ويمنع التجلط."
            }
          },
          {
            id: 3,
            front: { fr: "Comment agissent les antibiotiques ?", ar: "كيف تعمل المضادات الحيوية؟" },
            back: { 
              fr: "Détruisent ou inhibent la croissance des bactéries pathogènes.",
              ar: "تدمر أو تثبط نمو البكتيريا المسببة للأمراض."
            }
          },
          {
            id: 4,
            front: { fr: "Qu'est-ce que l'insuline ?", ar: "ما هو الأنسولين؟" },
            back: { 
              fr: "Hormone qui régule le taux de glucose sanguin chez les diabétiques.",
              ar: "هرمون ينظم مستوى الجلوكوز في الدم عند مرضى السكري."
            }
          },
          {
            id: 5,
            front: { fr: "À quoi servent les antihistaminiques ?", ar: "لماذا تستخدم مضادات الهيستامين؟" },
            back: { 
              fr: "Traitent les allergies en bloquant l'action de l'histamine.",
              ar: "تعالج الحساسية بمنع عمل الهيستامين."
            }
          },
          {
            id: 6,
            front: { fr: "Qu'est-ce que la morphine ?", ar: "ما هو المورفين؟" },
            back: { 
              fr: "Analgésique opioïde puissant utilisé pour les douleurs sévères.",
              ar: "مسكن أفيوني قوي يستخدم للآلام الشديدة."
            }
          },
          {
            id: 7,
            front: { fr: "Comment agissent les bêta-bloquants ?", ar: "كيف تعمل حاصرات بيتا؟" },
            back: { 
              fr: "Réduisent la pression artérielle en bloquant les récepteurs bêta-adrénergiques.",
              ar: "تقلل ضغط الدم بحجب مستقبلات بيتا الأدرينالية."
            }
          },
          {
            id: 8,
            front: { fr: "Qu'est-ce que la warfarine ?", ar: "ما هو الوارفارين؟" },
            back: { 
              fr: "Anticoagulant qui prévient la formation de caillots sanguins.",
              ar: "مضاد تخثر يمنع تكوين الجلطات الدموية."
            }
          },
          {
            id: 9,
            front: { fr: "À quoi servent les diurétiques ?", ar: "لماذا تستخدم مدرات البول؟" },
            back: { 
              fr: "Augmentent l'élimination d'eau et de sodium pour réduire la pression artérielle.",
              ar: "تزيد إفراز الماء والصوديوم لتقليل ضغط الدم."
            }
          },
          {
            id: 10,
            front: { fr: "Qu'est-ce que la digitaline ?", ar: "ما هو الديجيتالين؟" },
            back: { 
              fr: "Médicament cardiaque qui augmente la force de contraction du cœur.",
              ar: "دواء قلبي يزيد قوة انقباض القلب."
            }
          },
          {
            id: 11,
            front: { fr: "Comment agissent les antidépresseurs ISRS ?", ar: "كيف تعمل مضادات الاكتئاب SSRI؟" },
            back: { 
              fr: "Inhibent la recapture de la sérotonine pour améliorer l'humeur.",
              ar: "تثبط إعادة امتصاص السيروتونين لتحسين المزاج."
            }
          },
          {
            id: 12,
            front: { fr: "Qu'est-ce que l'adrénaline ?", ar: "ما هو الأدرينالين؟" },
            back: { 
              fr: "Hormone d'urgence utilisée dans les chocs anaphylactiques sévères.",
              ar: "هرمون طوارئ يستخدم في الصدمات التحسسية الشديدة."
            }
          },
          {
            id: 13,
            front: { fr: "À quoi sert le métformine ?", ar: "لماذا يستخدم الميتفورمين؟" },
            back: { 
              fr: "Antidiabétique qui diminue la production de glucose par le foie.",
              ar: "مضاد سكري يقلل إنتاج الجلوكوز من الكبد."
            }
          },
          {
            id: 14,
            front: { fr: "Qu'est-ce que l'héparine ?", ar: "ما هو الهيبارين؟" },
            back: { 
              fr: "Anticoagulant à action rapide utilisé en milieu hospitalier.",
              ar: "مضاد تخثر سريع المفعول يستخدم في المستشفيات."
            }
          },
          {
            id: 15,
            front: { fr: "Comment agit l'oméprazole ?", ar: "كيف يعمل الأوميبرازول؟" },
            back: { 
              fr: "Inhibiteur de la pompe à protons qui réduit l'acidité gastrique.",
              ar: "مثبط مضخة البروتون يقلل حموضة المعدة."
            }
          },
          {
            id: 16,
            front: { fr: "Qu'est-ce que la pénicilline ?", ar: "ما هو البنسلين؟" },
            back: { 
              fr: "Premier antibiotique découvert, efficace contre de nombreuses bactéries.",
              ar: "أول مضاد حيوي اكتُشف، فعال ضد العديد من البكتيريا."
            }
          },
          {
            id: 17,
            front: { fr: "À quoi sert l'ibuprofène ?", ar: "لماذا يستخدم الإيبوبروفين؟" },
            back: { 
              fr: "Anti-inflammatoire non stéroïdien qui soulage douleur et inflammation.",
              ar: "مضاد التهاب غير ستيرويدي يخفف الألم والالتهاب."
            }
          },
          {
            id: 18,
            front: { fr: "Qu'est-ce que l'atropine ?", ar: "ما هو الأتروبين؟" },
            back: { 
              fr: "Antagoniste muscarinique utilisé pour dilater les pupilles et traiter certains empoisonnements.",
              ar: "مضاد مسكاريني يستخدم لتوسيع الحدقة وعلاج بعض التسممات."
            }
          },
          {
            id: 19,
            front: { fr: "Comment agit la nitroglycérine ?", ar: "كيف يعمل النيتروجليسرين؟" },
            back: { 
              fr: "Vasodilatateur qui soulage l'angine de poitrine en dilatant les artères coronaires.",
              ar: "موسع أوعية يخفف الذبحة الصدرية بتوسيع الشرايين التاجية."
            }
          },
          {
            id: 20,
            front: { fr: "Qu'est-ce que le furosémide ?", ar: "ما هو الفوروسيميد؟" },
            back: { 
              fr: "Diurétique de l'anse puissant utilisé dans l'insuffisance cardiaque.",
              ar: "مدر بول قوي يستخدم في قصور القلب."
            }
          }
        ]
      }
    ];

    // Insérer tous les decks de flashcards
    for (const deck of flashcardDecks) {
      await db.collection('flashcards').doc(deck.id).set(deck);
      console.log(`Deck de flashcards ${deck.id} ajouté avec succès ! (${deck.cards.length} cartes)`);
    }

    console.log('Tous les decks de flashcards ont été ajoutés avec succès !');

  } catch (error) {
    console.error('Erreur lors de l\'ajout des données de flashcards:', error);
  }
}

populateFlashcards();