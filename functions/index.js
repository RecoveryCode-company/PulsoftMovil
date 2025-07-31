const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendHealthNotification = functions.database.ref('/patients/{uid}')
  .onUpdate(async (change, context) => {
    const after = change.after.val();
    const { cardiovascular, sudor, temperatura } = after;
    const uid = context.params.uid;

    const alertaAlta = cardiovascular > 120;
    const alertaCombinada = sudor > 70 && temperatura > 38 && cardiovascular > 100;

    if (alertaAlta || alertaCombinada) {
      const tokenDoc = await admin.firestore()
        .doc(`users/${uid}/fcmTokens/${uid}`)
        .get();

      if (!tokenDoc.exists) {
        console.log(`No hay token FCM para el usuario ${uid}`);
        return null;
      }

      const token = tokenDoc.data().token;

      const payload = {
        notification: {
          title: alertaAlta ? '¡Alerta Cardiovascular!' : '¡Síntomas de ansiedad!',
          body: alertaAlta
            ? 'El ritmo cardiaco ha superado el límite.'
            : 'Sudor, temperatura y ritmo cardíaco elevados detectados.',
        },
        token,
      };

      try {
        await admin.messaging().send(payload);
        console.log(`Notificación enviada a ${uid}`);
      } catch (error) {
        console.error("Error enviando notificación:", error);
      }
    }

    return null;
  });
