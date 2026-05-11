import mongoose from 'mongoose';
import Project from '@/models/Project';
import { dbConnect } from '@/lib/mongodb';

export type DetailLookupResult = {
  doc: Record<string, any>;
  sourceCollection: string;
};

async function collectionExists(db: mongoose.mongo.Db, name: string) {
  return db.listCollections({ name }, { nameOnly: true }).hasNext();
}

export async function findProjectOrVacancyById(idParam: string): Promise<DetailLookupResult | null> {
  await dbConnect();

  const db = mongoose.connection.db;
  if (!db) return null;

  // 1) Backward compatibility with old links that use Mongo _id
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    const byObjectId = await Project.findById(idParam).lean();
    if (byObjectId) {
      return {
        doc: byObjectId as Record<string, any>,
        sourceCollection: 'projects',
      };
    }
  }

  // 2) New external id lookup across collections
  const candidateCollections = ['projects', 'vacancies', 'vacancyCards', 'vacancy_cards'];
  for (const collectionName of candidateCollections) {
    if (!(await collectionExists(db, collectionName))) continue;
    const found = await db.collection(collectionName).findOne({ id: idParam });
    if (found) {
      return {
        doc: found as Record<string, any>,
        sourceCollection: collectionName,
      };
    }
  }

  return null;
}
