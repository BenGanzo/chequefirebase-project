// ✅ app.js completo con filtros, validaciones, edición, impresión (cheque + 2 stubs) y seguridad

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMPR8Q0i6xCrJUzA0Eh6IR0i19-qoluhQ",
  authDomain: "sample-firebase-ai-app-b7634.firebaseapp.com",
  projectId: "sample-firebase-ai-app-b7634",
  storageBucket: "sample-firebase-ai-app-b7634.appspot.com",
  messagingSenderId: "70826301427",
  appId: "1:70826301427:web:5fd7bfa7d6522fe827e486"
};

initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

let empresaActual = "";
let filteredData = [];
let sortByDateAsc = true;

// 1) Protección de sesión y carga inicial
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }
  const uSnap = await getDoc(doc(db, "usuarios", user.uid));
  if (!uSnap.exists()) {
    alert("No autorizado");
    location.href = "login.html";
    return;
  }
  empresaActual = uSnap.data().empresa || "";
  if (!empresaActual) {
    alert("Usuario sin empresa");
    return;
  }

  // Cargamos sin filtros al inicio para que veas la lista
  await cargarCheques();

  // Listener de ordenamiento (ahora sí existe el TH en el DOM)
  const th = document.getElementById("sortDateHeader");
  const icon = document.getElementById("dateSortIcon");
  if (th && icon) {
    th.addEventListener("click", () => {
      sortByDateAsc = !sortByDateAsc;
      icon.textContent = sortByDateAsc ? "⬆️" : "⬇️";
      filteredData.sort((a, b) =>
        sortByDateAsc ? a.dateObj - b.dateObj : b.dateObj - a.dateObj
      );
      mostrarCheques();
    });
  }
});

// Convierte números a palabras en inglés
function numeroALetras(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function convHund(n) {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return `${tens[Math.floor(n/10)]}${n%10?'-'+ones[n%10]:''}`;
    return `${ones[Math.floor(n/100)]} Hundred${n%100? ' '+convHund(n%100):''}`;
  }
  function convThou(n) {
    if (n < 1000) return convHund(n);
    if (n < 1e6) return `${convHund(Math.floor(n/1000))} Thousand${n%1000? ' '+convHund(n%1000):''}`;
    return 'Amount too large';
  }
  const [intPart, cents] = num.toFixed(2).split('.');
  return `${convThou(+intPart)} and ${cents}/100 DOLLARS`;
}

// Genera el HTML de impresión de cheques
function renderChequeStub(dataArray) {
  let html = "";
  for (const data of dataArray) {
    const amount = parseFloat(data.amount || 0);
    const words = numeroALetras(amount);
    const fill = "*".repeat(Math.max(0, 70 - words.length));
    const formAmt = amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
    html += `
      <div class="cheque-container" style="page-break-after:always;position:relative;width:8.5in;height:11in;font-family:Arial;">
        <!-- Parte superior -->
        <div style="position:absolute;top:0.625in;left:1in;">${data.payee||''}</div>
        <div style="position:absolute;top:0.325in;right:1in;">${data.dateStr||''}</div>
        <div style="position:absolute;top:0.725in;right:1in;width:2in;text-align:right;">${formAmt}</div>
        <div style="position:absolute;top:1.125in;left:0.5in;right:1in;">${words} ${fill}</div>
        <div style="position:absolute;top:2.285in;left:1in;font-weight:bold;">
  ST-${data.settlement || ''}
</div>

        <!-- Primer stub -->
        <div style="position:absolute;top:3.7in;left:0.5in;">${data.payee||''}</div>
        <div style="position:absolute;top:4in;left:0.5in;">${data.dateStr||''}</div>
        <div style="position:absolute;top:4in;left:2.5in;">ST-${data.settlement||''}</div>
        <div style="position:absolute;top:4in;left:4.5in;">CHK-${data.checknum||''}</div>
        <div style="position:absolute;top:4in;left:6.5in;width:1.5in;text-align:right;">${formAmt}</div>
        <div style="position:absolute;top:6.3in;left:0.5in;">IBC 9889</div>
        <div style="position:absolute;top:6.3in;right:1in;width:2in;text-align:right;">${formAmt}</div>
        <!-- Segundo stub -->
        <div style="position:absolute;top:7in;left:0.5in;">${data.payee||''}</div>
        <div style="position:absolute;top:7.2in;left:0.5in;">${data.dateStr||''}</div>
        <div style="position:absolute;top:7.2in;left:2.5in;">ST-${data.settlement||''}</div>
        <div style="position:absolute;top:7.2in;left:4.5in;">CHK-${data.checknum||''}</div>
        <div style="position:absolute;top:7.2in;left:6.5in;width:1.5in;text-align:right;">${formAmt}</div>
        <div style="position:absolute;top:9in;left:0.5in;">IBC 9889</div>
        <div style="position:absolute;top:9in;right:1in;width:2in;text-align:right;">${formAmt}</div>
      </div>`;
  }
  document.getElementById("reportPrintArea").innerHTML = html;
}

// Imprimir seleccionados / lista completa
document.getElementById("printSelected")?.addEventListener("click", () => {
  const ids = [...document.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.dataset.id);
  const sel = filteredData.filter(d => ids.includes(d.id));
  if (!sel.length) return alert("Selecciona al menos un cheque");
  renderChequeStub(sel);
  window.print();
});
document.getElementById("printFilteredList")?.addEventListener("click", () => {
  if (!filteredData.length) return alert("No hay cheques para imprimir");
  renderChequeStub(filteredData);
  window.print();
});

// Aplicar filtros
document.getElementById("applyFilters")?.addEventListener("click", () => cargarCheques(false));

async function cargarCheques() {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  // 1) Obtenemos todos los cheques de la empresa
  const snap = await getDocs(
    query(collection(db, "cheques"), where("empresa", "==", empresaActual))
  );

  // 2) Leemos los inputs de fecha; si están vacíos, ponemos ayer y hoy
  let inicio = document.getElementById("filterStartDate").value;
  let fin    = document.getElementById("filterEndDate").value;
  if (!inicio && !fin) {
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    inicio = ayer.toISOString().split("T")[0];
    fin    = hoy.toISOString().split("T")[0];
    document.getElementById("filterStartDate").value = inicio;
    document.getElementById("filterEndDate").value   = fin;
  }

  const filtroPayee     = document.getElementById("filterPayee").value.toLowerCase();
  const filtroSettlement= document.getElementById("filterSettlement").value.toLowerCase();
  const filtroCheck     = document.getElementById("filterCheckNum").value.toLowerCase();

  // 3) Construimos filteredData con dateObj y dateStr
  filteredData = snap.docs
    .map(d => {
      const data = { id: d.id, ...d.data() };
      const raw = data.date;
      const dateObj = raw?.seconds
        ? new Date(raw.seconds * 1000)
        : new Date(raw);
      if (isNaN(dateObj)) {
        data.dateObj = null;
        data.dateStr = "";
      } else {
        data.dateObj = dateObj;
        data.dateStr = dateObj.toISOString().split("T")[0];
      }
      return data;
    })
    .filter(d => {
      // descartamos sin fecha válida
      if (!d.dateObj) return false;
      // filtro rango
      if (d.dateObj < new Date(inicio)) return false;
      if (d.dateObj > new Date(fin))    return false;
      // filtro payee/settlement/check
      if (filtroPayee && !d.payee.toLowerCase().includes(filtroPayee)) return false;
      if (filtroSettlement && !d.settlement.toLowerCase().includes(filtroSettlement)) return false;
      if (filtroCheck && !d.checknum.toLowerCase().includes(filtroCheck)) return false;
      return true;
    });

  // 4) Orden inicial según sortByDateAsc
  filteredData.sort((a, b) =>
    sortByDateAsc ? a.dateObj - b.dateObj : b.dateObj - a.dateObj
  );

  // 5) Renderizamos
  mostrarCheques();
}


function mostrarCheques() {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  let total = 0;

  filteredData.forEach(d => {
    const amt = parseFloat(d.amount) || 0;
    total += amt;

    const tr = document.createElement("tr");
    tr.className = "divide-x divide-gray-200"; // líneas verticales

    tr.innerHTML = `
      <td class="px-4 py-2 text-center">
        <input type="checkbox" data-id="${d.id}">
      </td>
      <td class="px-4 py-2 text-left">
        ${d.payee}
      </td>
      <td class="px-4 py-2 text-left">${d.company || ""}</td>
      <td class="px-4 py-2 text-center">
        ${d.settlement}
      </td>
      <td class="px-4 py-2 text-center">
        ${d.checknum || ""}
      </td>
      <td class="px-4 py-2 text-center">
        ${d.dateStr}
      </td>
      <td class="px-4 py-2 text-right">
        ${amt.toLocaleString("en-US",{style:"currency",currency:"USD"})}
      </td>
      <td class="px-4 py-2 text-center space-x-2">
        <button onclick="editarCheque('${d.id}')" class="text-blue-600 hover:underline">
          Editar
        </button>
        <button onclick="borrarCheque('${d.id}')" class="text-red-600 hover:underline">
          Borrar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("totalAmount").textContent =
    total.toLocaleString("en-US",{style:"currency",currency:"USD"});
}



window.editarCheque = id => {
  localStorage.setItem("editChequeId", id);
  location.href = "index.html";
};
window.borrarCheque = async id => {
  if (confirm("¿Borrar este cheque?")) {
    await deleteDoc(doc(db, "cheques", id));
    cargarCheques();
  }
};

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  location.href = "login.html";
});
