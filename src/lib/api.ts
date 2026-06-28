import { db } from './firebase';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './firestore-errors';
import { ChatSession } from '../types';

export function subscribeToSessions(userId: string, onUpdate: (sessions: ChatSession[]) => void) {
  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const q = query(sessionsRef, orderBy('updatedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as ChatSession[];
    onUpdate(sessions);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/sessions`);
  });
}

export async function saveSession(userId: string, session: ChatSession) {
  const { id, ...data } = session;
  const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
  
  try {
    // Include userId to match validation rules
    await setDoc(sessionRef, { ...data, userId });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/sessions/${session.id}`);
  }
}

export async function deleteSession(userId: string, sessionId: string) {
  const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
  try {
    await deleteDoc(sessionRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/sessions/${sessionId}`);
  }
}
