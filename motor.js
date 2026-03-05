// motor.js final y limpio

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyDsXkGXEycGXa93-PnDw5LflzQbMV93fZ0",
  authDomain: "preguntamultijugador.firebaseapp.com",
  projectId: "preguntamultijugador",
  storageBucket: "preguntamultijugador.firebasestorage.app",
  messagingSenderId: "423887546802",
  appId: "1:423887546802:web:789db2a2ce774518ce5cab"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* VARIABLES */
let preguntas = [];
let preguntaActual = 0;
let puntos = 0;
let tiempo = 5;
let intervalo;
let pausa = false;

/* ELEMENTOS HTML */
const preguntaHTML = document.getElementById("pregunta");
const opcionesHTML = document.getElementById("opciones");
const puntosHTML = document.getElementById("puntos");
const tiempoHTML = document.getElementById("tiempo");
const resultadoHTML = document.getElementById("resultado");
const botonPausa = document.getElementById("pausa");
const botonRegistrar = document.getElementById("registrar");

/* CARGAR PREGUNTAS DESDE FIRESTORE */
async function cargarPreguntas(){
  const querySnapshot = await getDocs(collection(db,"preguntas"));
  preguntas = [];
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if(data.categoria === "matematicas"){
      preguntas.push(data);
    }
  });
  mezclarPreguntas();
  mostrarPregunta();
}

/* MEZCLAR PREGUNTAS */
function mezclarPreguntas(){
  preguntas.sort(() => Math.random() - 0.5);
}

/* MOSTRAR PREGUNTA */
function mostrarPregunta(){
  resultadoHTML.querySelector("ol").innerHTML = ""; // limpia TOP 5 temporalmente
  tiempo = 5;
  tiempoHTML.textContent = tiempo;
  clearInterval(intervalo);

  const p = preguntas[preguntaActual];
  preguntaHTML.textContent = p.pregunta;

  opcionesHTML.innerHTML = "";
  const opciones = [p.opcion1, p.opcion2, p.opcion3, p.opcion4];
  opciones.forEach((texto,i)=>{
    const boton = document.createElement("button");
    boton.textContent = texto;
    boton.className = "opcion";
    boton.onclick = ()=>responder(i+1, boton);
    opcionesHTML.appendChild(boton);
  });

  intervalo = setInterval(contador, 1000);
  cargarTop(); // actualizar TOP 5 cada pregunta
}

/* CONTADOR */
function contador(){
  if(pausa) return;
  tiempo--;
  tiempoHTML.textContent = tiempo;
  if(tiempo <= 0){
    clearInterval(intervalo);
    puntos--;
    puntosHTML.textContent = puntos;
    siguientePregunta();
  }
}

/* RESPONDER PREGUNTA */
function responder(numero, boton){
  clearInterval(intervalo);
  const p = preguntas[preguntaActual];
  const botones = document.querySelectorAll(".opcion");

  if(numero === p.correcta){
    boton.style.background = "green";
    puntos++;
  } else {
    boton.style.background = "red";
    botones[p.correcta-1].style.background = "green";
    puntos--;
  }

  puntosHTML.textContent = puntos;
  setTimeout(siguientePregunta, 1000);
}

/* SIGUIENTE PREGUNTA */
function siguientePregunta(){
  preguntaActual++;
  if(preguntaActual >= preguntas.length){
    preguntaActual = 0; // reiniciar
    mezclarPreguntas();
    verificarTop(); // revisa botón registrar
  }
  mostrarPregunta();
}

/* PAUSA */
botonPausa.onclick = ()=>{
  pausa = !pausa;
  if(pausa){
    botonPausa.textContent = "Continuar";
    puntos -= 2;
  } else {
    botonPausa.textContent = "Pausa";
  }
  puntosHTML.textContent = puntos;
}

/* VERIFICAR SI SUPERAS TOP 5 */
async function verificarTop(){
  const querySnapshot = await getDocs(collection(db,"ranking"));
  let ranking = [];
  querySnapshot.forEach(doc => ranking.push(doc.data()));
  ranking.sort((a,b)=> b.puntos - a.puntos);

  if(ranking.length < 5 || puntos > ranking[ranking.length-1].puntos){
    botonRegistrar.style.display = "block";
  } else {
    botonRegistrar.style.display = "none";
  }
}

/* GUARDAR PUNTAJE */
botonRegistrar.onclick = async function(){
  let nombre = prompt("¡Felicidades! Ingresa tu nombre:");
  if(!nombre) nombre="Jugador";

  await addDoc(collection(db,"ranking"),{
    nombre: nombre,
    puntos: puntos
  });

  botonRegistrar.style.display = "none";
  cargarTop();
  alert("¡Puntaje registrado!");
}

/* CARGAR TOP 5 */
async function cargarTop(){
  const querySnapshot = await getDocs(collection(db,"ranking"));
  let ranking = [];
  querySnapshot.forEach(doc => ranking.push(doc.data()));
  ranking.sort((a,b)=> b.puntos - a.puntos);

  const lista = document.getElementById("listaTopInside");
  lista.innerHTML = "";
  ranking.slice(0,5).forEach(jugador => {
    const li = document.createElement("li");
    li.textContent = jugador.nombre + " - " + jugador.puntos;
    lista.appendChild(li);
  });
}

/* INICIAR JUEGO */
cargarPreguntas();
cargarTop();