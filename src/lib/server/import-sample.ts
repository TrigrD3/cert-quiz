import { importQuestionSet } from './import';
import { createShuffledQuestionSet } from './quiz';
import sampleData from './sample-questions.json';
import awsQuestionsPart1 from './aws-saa-questions-part1.json';
import awsQuestionsPart2 from './aws-saa-questions-part2.json';
import prisma from './database';

async function importSampleData() {
  console.log('Starting import of sample questions...');
  try {
    // Check if already imported to avoid duplicates
    const existingSet = await prisma.questionSet.findFirst({
      where: {
        title: sampleData.title
      }
    });

    if (existingSet) {
      console.log('Sample data already imported. Skipping...');
      return existingSet;
    }

    const result = await importQuestionSet(sampleData);
    console.log(`Imported ${result.questions.length} questions for "${result.title}"`);
    return result;
  } catch (error) {
    console.error('Error importing sample questions:', error);
    return null;
  }
}

async function importAwsQuestionsPart1() {
  console.log('Starting import of AWS SAA questions (Part 1)...');
  try {
    // Check if already imported
    const existingSet = await prisma.questionSet.findFirst({
      where: {
        title: awsQuestionsPart1.title
      }
    });

    if (existingSet) {
      console.log('AWS questions Part 1 already imported. Skipping...');
      return existingSet;
    }

    const result = await importQuestionSet(awsQuestionsPart1);
    console.log(`Imported ${result.questions.length} questions for "${result.title}"`);
    return result;
  } catch (error) {
    console.error('Error importing AWS questions Part 1:', error);
    return null;
  }
}

async function importAwsQuestionsPart2() {
  console.log('Starting import of AWS SAA questions (Part 2)...');
  try {
    // Check if already imported
    const existingSet = await prisma.questionSet.findFirst({
      where: {
        title: awsQuestionsPart2.title
      }
    });

    if (existingSet) {
      console.log('AWS questions Part 2 already imported. Skipping...');
      return existingSet;
    }

    const result = await importQuestionSet(awsQuestionsPart2);
    console.log(`Imported ${result.questions.length} questions for "${result.title}"`);
    return result;
  } catch (error) {
    console.error('Error importing AWS questions Part 2:', error);
    return null;
  }
}

async function createShuffledSampleSets() {
  try {
    // Find all question sets without "(Shuffled)" in the title
    const regularSets = await prisma.questionSet.findMany({
      where: {
        title: {
          not: {
            contains: '(Shuffled)'
          }
        }
      }
    });

    // Create shuffled versions for each regular set
    for (const set of regularSets) {
      // Check if a shuffled version already exists
      const existingShuffled = await prisma.questionSet.findFirst({
        where: {
          title: {
            contains: `${set.title} (Shuffled)`
          }
        }
      });

      if (!existingShuffled) {
        console.log(`Creating shuffled version of "${set.title}"...`);
        await createShuffledQuestionSet(set.id);
      } else {
        console.log(`Shuffled version of "${set.title}" already exists. Skipping...`);
      }
    }
  } catch (error) {
    console.error('Error creating shuffled sample sets:', error);
  }
}

// Import samples and create shuffled versions
async function initializeSampleData() {
  // First import regular sample sets
  await importSampleData();
  await importAwsQuestionsPart1();
  await importAwsQuestionsPart2();
  
  // Then create shuffled versions
  await createShuffledSampleSets();
}

export default initializeSampleData;