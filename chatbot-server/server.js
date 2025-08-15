require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for your React app
app.use(cors({
  origin: 'http://localhost:3000', // Your React app URL
  credentials: true
}));

app.use(express.json());

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
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Session endpoint: http://localhost:${PORT}/session`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables');
  } else {
    console.log('✅ OpenAI API key found');
  }
});