// actualizar-cheques.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBMPR8Q0i6xCrJUzA0Eh6IR0i19-qoluhQ",
  authDomain: "sample-firebase-ai-app-b7634.firebaseapp.com",
  projectId: "sample-firebase-ai-app-b7634",
  storageBucket: "sample-firebase-ai-app-b7634.appspot.com",
  messagingSenderId: "70826301427",
  appId: "1:70826301427:web:5fd7bfa7d6522fe827e486"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function agregarEmpresaACheques() {
  const chequesRef = collection(db, "cheques");
  const snapshot = await getDocs(chequesRef);

  const promesas = [];

  snapshot.forEach((docSnap) => {
    const chequeRef = doc(db, "cheques", docSnap.id);
    promesas.push(updateDoc(chequeRef, {
      empresa: "Angulo Transportation"
    }));
  });

  await Promise.all(promesas);
  console.log("✅ Campo 'empresa' agregado a todos los cheques.");
}

agregarEmpresaACheques();
