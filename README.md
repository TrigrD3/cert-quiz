# AWS Certification Quiz App

A web application for preparing for AWS Solution Architect Associate and Professional certifications.

## Features

- Practice with AWS certification exam-style questions
- Track quiz attempt history and performance statistics
- Optional user accounts for saving progress
- Mobile-friendly interface
- Supports importing questions from JSON format

## Technology Stack

- **Frontend**: SvelteKit, TailwindCSS
- **Backend**: Node.js with SvelteKit
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Deployment**: Docker and Docker Compose

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/TrigrD3/cert-quiz.git
   cd cert-quiz
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your database credentials and JWT secret.

4. Generate Prisma client:
   ```
   npx prisma generate
   ```

5. Create database schema:
   ```
   npx prisma migrate dev --name init
   ```

6. Start the development server:
   ```
   npm run dev
   ```

7. Open your browser and visit `http://localhost:5173`

## Importing Questions

Questions can be imported from JSON files. The JSON format should match the schema in `src/lib/server/sample-questions.json`.

### Managing Question Sets

To add a new question set:

1. Create a new JSON file in the `src/lib/server` directory with the following structure:

```json
{
  "title": "Your Question Set Title",
  "description": "Description of your question set",
  "certificationType": "Solutions Architect Associate", 
  "questions": [
    {
      "questionText": "Your question text (include '(Select TWO.)' for multiple answer questions)",
      "explanation": "Explanation of the correct answer",
      "answers": [
        {
          "answerText": "Answer option 1",
          "isCorrect": false
        },
        {
          "answerText": "Answer option 2",
          "isCorrect": true
        }
      ]
    }
  ]
}
```

2. Add the file import to `src/lib/server/import-sample.ts`:

```javascript
import yourQuestions from './your-questions.json';

// This array contains all question sets to import
const questionSets = [
  // ... existing question sets
  { data: yourQuestions, source: 'your-questions.json' }
];
```

3. Restart the application to import the new question set.

#### Deleting Question Sets

To delete a question set and its derivatives (shuffled and challenge mode versions):

1. Connect to the PostgreSQL database:
   ```bash
   # Using docker compose
   docker-compose exec postgres psql -U postgres -d certquiz
   
   # Using a local PostgreSQL installation
   psql -U postgres -d certquiz
   ```

2. Delete the question set by title (this will cascade to delete related attempts, questions, and answers):
   ```sql
   -- Delete a base question set and all its derivatives
   DELETE FROM "QuestionSet" 
   WHERE title = 'Question Set Title' 
   OR title LIKE 'Question Set Title (Shuffled)%'
   OR title LIKE 'Question Set Title (Challenge Mode%';

   -- Delete only a specific type of question set
   DELETE FROM "QuestionSet" WHERE title = 'Question Set Title';
   ```

3. Alternatively, delete by ID if you know it:
   ```sql
   DELETE FROM "QuestionSet" WHERE id = 'question-set-id';
   ```

4. Verify deletion:
   ```sql
   SELECT * FROM "QuestionSet" WHERE title LIKE 'Question Set Title%';
   ```

### Challenge Mode

The application supports challenge mode quizzes:
- Limit users to 5 mistakes
- Provide a realistic exam-like environment
- Automatically fail when the mistake limit is reached
- Available in both fixed-order and shuffled variants

## Production Deployment

### Using Docker Compose

1. Clone the repository:
   ```
   git clone https://github.com/TrigrD3/cert-quiz.git
   cd cert-quiz
   ```

2. Create a `.env` file:
   ```
   cp .env.example .env
   ```
   Edit the JWT_SECRET value.

3. Build and start the containers:
   ```
   docker-compose up -d
   ```

4. Access the application at `http://localhost:3000`

### Kubernetes Deployment

A Kubernetes deployment is planned for future releases.

## License

This project is open source and available under the MIT License.