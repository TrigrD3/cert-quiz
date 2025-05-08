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