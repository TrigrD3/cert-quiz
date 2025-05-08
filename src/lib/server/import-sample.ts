import { importQuestionSet } from './import';
import { createShuffledQuestionSet } from './quiz';
import prisma from './database';
import fs from 'fs';
import path from 'path';

// This will automatically import all JSON files in this directory
// Note: In development, these files will be in src/lib/server
//       In production, they'll be in build/server/chunks or similar
const serverDir = __dirname;

// Function to load all JSON files that contain question data
function loadQuestionSets() {
  const questionSets = [];
  try {
    // Get all JSON files in the directory
    const files = fs.readdirSync(serverDir).filter(file => 
      file.endsWith('.json') && file !== 'package.json' && !file.includes('tsconfig')
    );
    
    for (const file of files) {
      try {
        const filePath = path.join(serverDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Check if it has the structure of a question set
        if (data.title && data.certificationType && Array.isArray(data.questions)) {
          questionSets.push({ 
            data, 
            source: file
          });
          console.log(`Found question set: ${data.title} (${file})`);
        }
      } catch (err) {
        console.error(`Error reading question set file ${file}:`, err);
      }
    }
  } catch (err) {
    console.error('Error loading question sets:', err);
  }
  
  return questionSets;
}

const questionSets = loadQuestionSets();

async function importSingleQuestionSet(questionSetData, source) {
  console.log(`Starting import of "${questionSetData.title}" from ${source}...`);
  try {
    // Check if already imported to avoid duplicates
    const existingSet = await prisma.questionSet.findFirst({
      where: {
        title: questionSetData.title
      }
    });

    if (existingSet) {
      console.log(`"${questionSetData.title}" already imported. Skipping...`);
      return existingSet;
    }

    // Set the source filename in the jsonSource field
    const importData = {
      ...questionSetData,
      jsonSource: source
    };

    const result = await importQuestionSet(importData);
    console.log(`Imported ${result.questions.length} questions for "${result.title}"`);
    return result;
  } catch (error) {
    console.error(`Error importing "${questionSetData.title}":`, error);
    return null;
  }
}

// Function to import all discovered question sets
async function importAllQuestionSets() {
  const importedSets = [];
  
  for (const set of questionSets) {
    const result = await importSingleQuestionSet(set.data, set.source);
    if (result) {
      importedSets.push(result);
    }
  }
  
  return importedSets;
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
  // Import all question sets found in the server directory
  await importAllQuestionSets();
  
  // Then create shuffled versions
  await createShuffledSampleSets();
}

export default initializeSampleData;