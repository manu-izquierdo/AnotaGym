import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// El Service Account se pasa como JSON string desde las GitHub Secrets
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountKey) {
  console.error('ERROR: No se encontró la variable FIREBASE_SERVICE_ACCOUNT.');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountKey);
} catch (error) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT no es un JSON válido.');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();
const db = getFirestore();

// 1 minuto en milisegundos (SOLO PARA PRUEBAS)
const FIFTEEN_DAYS_MS = 1 * 60 * 1000;
const cutoffDate = new Date(Date.now() - FIFTEEN_DAYS_MS);

async function cleanup() {
  console.log(`🧹 Iniciando limpieza de invitados creados antes de: ${cutoffDate.toISOString()}`);
  
  try {
    let nextPageToken;
    let deletedCount = 0;

    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      
      const usersToDelete = listUsersResult.users.filter(user => {
        // Un usuario anónimo en Firebase no tiene 'providerData'
        const isAnonymous = user.providerData.length === 0;
        const creationTime = new Date(user.metadata.creationTime);
        return isAnonymous && creationTime < cutoffDate;
      });

      for (const user of usersToDelete) {
        console.log(`Borrando usuario invitado: ${user.uid} (Creado: ${user.metadata.creationTime})`);
        
        // 1. Borrar todos los documentos anidados del usuario en Firestore (opcional pero recomendado)
        // Por diseño, AnotaGym guarda todo bajo /users/{uid}
        try {
          await db.collection('users').doc(user.uid).collection('profile').doc('data').delete();
          // Nota: Firestore no borra subcolecciones automáticamente al borrar el doc padre, 
          // pero para limpiar cuota es suficiente con el usuario. Las subcolecciones huérfanas 
          // no consumen apenas. Podrías iterar sobre subcolecciones si quieres borrado total.
          await db.collection('users').doc(user.uid).delete();
        } catch (dbErr) {
          console.warn(`Aviso: error borrando datos Firestore de ${user.uid}:`, dbErr.message);
        }
        
        // 2. Borrar cuenta de Auth
        await auth.deleteUser(user.uid);
        
        deletedCount++;
      }

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`✅ Limpieza completada con éxito. Usuarios borrados: ${deletedCount}`);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

cleanup();
