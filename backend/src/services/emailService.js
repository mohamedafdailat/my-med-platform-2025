const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, template, language = 'fr') => {
  try {
    const templates = {
      fr: {
        welcome: (name) => ({
          subject: 'Bienvenue sur MedPlatform Maroc !',
          html: `
            <h2>Bonjour ${name},</h2>
            <p>Merci de vous être inscrit sur MedPlatform Maroc ! Votre aventure éducative commence maintenant.</p>
            <p><a href="${process.env.FRONTEND_URL}/login">Connectez-vous ici</a> pour explorer nos cours, vidéos, quiz, et flashcards.</p>
            <p>L'équipe MedPlatform Maroc</p>
          `,
        }),
        resetPassword: (resetLink) => ({
          subject: 'Réinitialisation de votre mot de passe',
          html: `
            <h2>Réinitialisation de mot de passe</h2>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour procéder :</p>
            <p><a href="${resetLink}">Réinitialiser mon mot de passe</a></p>
            <p>Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
            <p>L'équipe MedPlatform Maroc</p>
          `,
        }),
      },
      ar: {
        welcome: (name) => ({
          subject: 'مرحبًا بك في منصة MedPlatform Maroc !',
          html: `
            <h2>مرحبًا ${name}،</h2>
            <p>شكرًا لتسجيلك في منصة MedPlatform Maroc ! مغامرتك التعليمية تبدأ الآن.</p>
            <p><a href="${process.env.FRONTEND_URL}/login">تسجيل الدخول هنا</a> لاستكشاف دوراتنا، فيديوهاتنا، اختباراتنا، وبطاقاتنا التعليمية.</p>
            <p>فريق MedPlatform Maroc</p>
          `,
        }),
        resetPassword: (resetLink) => ({
          subject: 'إعادة تعيين كلمة المرور الخاصة بك',
          html: `
            <h2>إعادة تعيين كلمة المرور</h2>
            <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر على الرابط أدناه للمتابعة:</p>
            <p><a href="${resetLink}">إعادة تعيين كلمة المرور</a></p>
            <p>هذا الرابط سينتهي خلال ساعة واحدة. إذا لم تطلب هذا، تجاهل هذا البريد الإلكتروني.</p>
            <p>فريق MedPlatform Maroc</p>
          `,
        }),
      },
    };

    const emailContent = templates[language][template](...Object.values(to));
    await transporter.sendMail({
      from: `"MedPlatform Maroc" <${process.env.EMAIL_USER}>`,
      to: to.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return { success: true };
  } catch (error) {
    throw new Error(`Erreur envoi email : ${error.message}`);
  }
};

module.exports = { sendEmail };