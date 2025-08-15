API Documentation - MedPlatform Maroc
Overview
The MedPlatform Maroc API is a RESTful API built with Node.js, Express, and Firebase, providing endpoints for authentication, user management, educational content (videos, quizzes, flashcards), and AI-driven features (chatbot, tutor, recommendations). All endpoints are prefixed with /api.
Authentication
All endpoints except /api/auth/register and /api/auth/login require a Firebase ID token in the Authorization header as Bearer <token>.
Endpoints
Authentication

POST /auth/register
Description: Register a new user.
Body: { "name": string, "email": string, "password": string, "role": "student|teacher|admin" }
Response: 201 { "message": string, "user": { "name": string, "email": string, "role": string } }


POST /auth/login
Description: Log in a user.
Body: { "email": string, "password": string }
Response: 200 { "user": { "uid": string, "name": string, "email": string, "role": string } }



Users

GET /users
Description: Get all users (admin only).
Response: 200 [{ "id": string, "name": string, "email": string, "role": string, "createdAt": timestamp }]


GET /users/:userId
Description: Get a user by ID.
Response: 200 { "id": string, "name": string, "email": string, "role": string, "createdAt": timestamp }


PUT /users/:userId
Description: Update a user (admin or self).
Body: { "name": string, "role": string }
Response: 200 { "message": string, "user": { "userId": string, "name": string, "role": string } }


DELETE /users/:userId
Description: Delete a user (admin only).
Response: 200 { "message": string }



Videos

GET /videos
Description: Get all videos.
Response: 200 [{ "id": string, "title": string, "url": string, "thumbnail": string, "createdAt": timestamp }]


POST /videos
Description: Upload a video (teacher/admin).
Body: Form-data with file (video file) and title (string).
Response: 201 { "message": string, "video": { "id": string, "title": string, "url": string } }



Quizzes

GET /quizzes
Description: Get all quizzes.
Response: 200 [{ "id": string, "title": string, "questions": [{ "text": string, "options": [string], "correctAnswer": string }], "createdAt": timestamp }]


POST /quizzes
Description: Upload a quiz (teacher/admin).
Body: { "title": string, "questions": [{ "text": string, "options": [string], "correctAnswer": string }] }
Response: 201 { "message": string, "quiz": { "id": string, "title": string, "questions": array } }


POST /quizzes/:quizId/submit
Description: Submit quiz answers.
Body: { "answers": [string] }
Response: 200 { "score": number, "total": number }



Flashcards

GET /flashcards
Description: Get all flashcards.
Response: 200 [{ "id": string, "question": string, "answer": string, "createdAt": timestamp }]


POST /flashcards
Description: Create a flashcard (teacher/admin).
Body: { "question": string, "answer": string }
Response: 201 { "message": string, "flashcard": { "id": string, "question": string, "answer": string } }


PUT /flashcards/:flashcardId
Description: Update a flashcard (teacher/admin).
Body: { "question": string, "answer": string }
Response: 200 { "message": string, "flashcard": { "flashcardId": string, "question": string, "answer": string } }


DELETE /flashcards/:flashcardId
Description: Delete a flashcard (teacher/admin).
Response: 200 { "message": string }



AI Features

POST /ai/chatbot
Description: Get a chatbot response.
Body: { "message": string }
Response: 200 { "response": string }


POST /ai/tutor
Description: Get an explanation for a medical topic.
Body: { "topic": string }
Response: 200 { "explanation": string }


GET /ai/recommendations/:userId
Description: Get content recommendations for a user.
Response: 200 [{ "id": string, "type": "video|quiz", "title": string, "url": string }]



Error Handling

400: Bad request (validation errors).
401: Unauthorized (invalid/no token).
403: Forbidden (insufficient permissions).
404: Not found (resource does not exist).
500: Server error.

Headers

Authorization: Bearer <Firebase-ID-Token>
Accept-Language: fr or ar for localized error messages.

Example Request
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@medplatform.ma","password":"password123","role":"student"}'

Notes

All timestamps are in ISO format.
Ensure Firebase rules are configured to match endpoint permissions.
API is designed to support multilingual responses (French/Arabic).

