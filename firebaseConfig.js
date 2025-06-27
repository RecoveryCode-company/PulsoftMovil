import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore'; 
import { getReactNativePersistence, initializeAuth } from 'firebase/auth/react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyBnqdXDuWsMrdiKJpsUsElAskLIsEYUCjI",
    authDomain: "pulsoft-fc676.firebaseapp.com",
    databaseURL: "https://pulsoft-fc676-default-rtdb.firebaseio.com",
    projectId: "pulsoft-fc676",
    storageBucket: "pulsoft-fc676.appspot.com",
    messagingSenderId: "758196176997",
    appId: "1:758196176997:android:020d2d6da6a7f29c489e8c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app); 

initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth, database, firestore };