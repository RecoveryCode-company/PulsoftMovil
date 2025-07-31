import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { collection, doc, setDoc } from 'firebase/firestore';
import { firestore } from './firebaseConfig';
import { getAuth } from 'firebase/auth';

export async function registerForPushNotificationsAsync() {
    let token;

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        }

        if (finalStatus !== 'granted') {
        alert('No se obtuvieron permisos para notificaciones.');
        return;
        }

        // OBTENER TOKEN FCM REAL para Firebase (NO el de Expo Go)
        const pushToken = await Notifications.getDevicePushTokenAsync();
        token = pushToken.data;
        console.log('Firebase FCM Token:', token);

        const auth = getAuth();
        const user = auth.currentUser;

        if (user && token) {
        const tokenRef = doc(firestore, `users/${user.uid}/fcmTokens/${token}`);
        await setDoc(tokenRef, {
            token,
            timestamp: Date.now()
        }, { merge: true });
        }
    } else {
        alert('Debe usarse en un dispositivo físico');
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        });
    }

    return token;
}
