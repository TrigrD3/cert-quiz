import prisma from './database';
import type { CertificationType, QuestionSet } from '@prisma/client';

interface ImportedQuestion {
  questionText: string;
  explanation?: string;
  externalId?: string;
  answers: {
    answerText: string;
    isCorrect: boolean;
    externalId?: string;
  }[];
}

interface ImportedQuestionSet {
  title: string;
  description?: string;
  certificationType: string;
  questions: ImportedQuestion[];
}

/**
 * Import a question set from a JSON object
 */
export async function importQuestionSet(data: ImportedQuestionSet): Promise<QuestionSet> {
  // Get or create certification type
  let certType: CertificationType = await prisma.certificationType.findUnique({
    where: { name: data.certificationType }
  }) as CertificationType;

  if (!certType) {
    certType = await prisma.certificationType.create({
      data: {
        name: data.certificationType,
        description: `AWS ${data.certificationType}`
      }
    });
  }

  // Create question set with nested questions and answers
  const questionSet = await prisma.questionSet.create({
    data: {
      title: data.title,
      description: data.description,
      certificationType: {
        connect: { id: certType.id }
      },
      jsonSource: `Imported on ${new Date().toISOString()}`,
      questions: {
        create: data.questions.map(q => ({
          questionText: q.questionText,
          explanation: q.explanation,
          externalId: q.externalId,
          answers: {
            create: q.answers.map(a => ({
              answerText: a.answerText,
              isCorrect: a.isCorrect,
              externalId: a.externalId
            }))
          }
        }))
      }
    },
    include: {
      questions: {
        include: {
          answers: true
        }
      }
    }
  });

  return questionSet;
}