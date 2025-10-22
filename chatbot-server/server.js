require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration - Support pour Railway
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  /\.railway\.app$/, // Permet tous les domaines Railway
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'DocBuddy Chatbot Server',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'GET /session',
      'POST /chat'  // ← AJOUTE CETTE LIGNE
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    openai_configured: hasApiKey
  });
});

// Session endpoint
app.get('/session', async (req, res) => {
  try {
    console.log('Creating new realtime session...');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2025-06-03',
        voice: 'verse',
        modalities: ['text', 'audio'],
        instructions: 'Tu es un assistant médical sympa, comme un ami médecin qui aide les étudiants. Parle de façon décontractée mais précise, avec des réponses courtes et pratiques. Adapte ta réponse selon la langue de l\'utilisateur (français ou arabe).',
        temperature: 0.7,
        max_response_output_tokens: 300,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Session created successfully');

    if (!data.client_secret) {
      throw new Error('Invalid response from OpenAI: missing client_secret');
    }

    res.json(data);
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({
      error: 'Failed to generate ephemeral key',
      details: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});
// Add this endpoint after the /session endpoint in chatbot-server/server.js

// Text chat endpoint for frontend
app.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: 'Tu es DocBuddy, un assistant médical sympa, comme un ami médecin qui aide les étudiants. Parle de façon décontractée mais précise, avec des réponses courtes et pratiques. Adapte ta réponse selon la langue de l\'utilisateur (français ou arabe).'
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    res.json({ response: botResponse });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({
      error: 'Failed to process chat message',
      details: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Erreur serveur', 
    message: process.env.NODE_ENV === 'production' ? 'Une erreur est survenue' : err.message 
  });
});

const PORT = process.env.PORT || 8080; // Changed from 3001 to 8080
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Chatbot server running on port ${PORT}`);
  console.log(`📝 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Session endpoint: http://localhost:${PORT}/session`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables');
  } else {
    console.log('✅ OpenAI API key found');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt gracieux du serveur...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});