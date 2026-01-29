import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const saveAppState = async (uid: string, data: any) => {
  await setDoc(doc(db, "nutri_sessions", uid), {
    ...data,
    updatedAt: new Date(),
  });
};

export const loadAppState = async (uid: string) => {
  const ref = doc(db, "nutri_sessions", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};
