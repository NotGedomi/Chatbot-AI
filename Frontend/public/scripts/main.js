const userInput = document.getElementById("user-input");
const micButton = document.getElementById("mic-btn");
const chatHistory = document.getElementById("chat-history");
const charCounter = document.getElementById('char-counter');
const voiceSwitch = document.getElementById('voice-switch');
const voiceStatus = document.getElementById('voice-status');

let isRecording = false;
let recognition;
let timer;
let linkPreviewDisplayed = false;
let voiceEnabled = false;

/*POPUP de bienvenida*/
document.addEventListener("DOMContentLoaded", function () {
  const popupContainer = document.createElement("div");
  popupContainer.id = "popup-container";

  const popupContent = document.createElement("div");
  popupContent.classList.add("popup-content");

  const popupTitle = document.createElement("div");
  popupTitle.classList.add("popup-title");
  popupTitle.textContent = "Chatbot Beta";

  const popupText = document.createElement("div");
  popupText.classList.add("popup-text");
  popupText.textContent = "¡Hola, holaaa! 👋 ¡Bienvenidx a Software Solution! 🤖💬 Soy tu asistente virtual con poderes de Inteligencia Artificial, diseñado para ofrecerte una experiencia increíble. Estoy aquí para resolver todas tus dudas y brindarte la información que necesitas sobre nuestra empresa. ¿Tienes curiosidad? ¡Adelante! Anímate a hacer tu primera consulta y descubre todo lo que podemos ofrecerte. 🌟 No te preocupes, estoy aquí para guiarte y hacer que tu experiencia sea genial y sin complicaciones. Así que, sin más espera, ¡hagamos que cada interacción sea divertida, atractiva y sin límites! ¡Estoy emocionado por ayudarte! 💪😊";

  popupContent.appendChild(popupTitle);
  popupContent.appendChild(popupText);
  popupContainer.appendChild(popupContent);
  document.body.appendChild(popupContainer);

  // Mostrar el popup
  setTimeout(() => {
    popupContainer.style.opacity = "1";
    popupContainer.style.pointerEvents = "auto";
  }, 0);

// Ocultar el popup al hacer clic en cualquier lugar fuera de él
popupContainer.addEventListener("click", function (event) {
  if (event.target === popupContainer) {
    popupContainer.style.opacity = "0";
    popupContainer.style.pointerEvents = "none";

    // Asegurarnos de que el question-options esté visible después de 1 segundo
    setTimeout(() => {
      const questionOptions = document.querySelector("#chat-history .question-options");
      if (questionOptions) {
        questionOptions.classList.add("show");
      }
    }, 100);

    // Agregar nuevamente la clase "visible" a todas las default-question después de 1 segundo
    setTimeout(() => {
      const defaultQuestions = document.querySelectorAll(".default-question");
      defaultQuestions.forEach((question) => {
        question.classList.add("visible");
      });
    }, 100);
  }
});

// Opciones de preguntas por defecto
const defaultQuestions = [
  "¿Cuál es el horario de atención?😀",
  "¿Dónde se encuentra ubicada la empresa?👀",
  "¿Qué servicios ofrecen?🌐",
];

// Agregar las opciones de preguntas por defecto al historial de chat
defaultQuestions.forEach((question) => {
  addDefaultQuestionToChat(question);
});
});
  
  function addDefaultQuestionToChat(question) {
    const questionOptions = document.querySelector("#chat-history .question-options");
    if (!questionOptions) {
      // Si no existe el div "question-options" dentro del chat-history, lo creamos.
      const questionOptionsDiv = document.createElement("div");
      questionOptionsDiv.classList.add("question-options");
      document.querySelector("#chat-history").appendChild(questionOptionsDiv);
    }
  
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container", "default-question");
  
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", "default-question");
    messageElement.textContent = question;
  
    messageContainer.appendChild(messageElement);
  
    // Añadimos el div con la clase "message-container default-question" dentro del div "question-options"
    document.querySelector("#chat-history .question-options").appendChild(messageContainer);
  
    // Esto asegura que el div "question-options" esté visible si estaba oculto previamente.
    document.querySelector("#chat-history .question-options").style.display = "block";
  
    // Desplazamos el chat hacia abajo para que el usuario pueda ver la nueva pregunta.
    document.querySelector("#chat-history").scrollTop = document.querySelector("#chat-history").scrollHeight;
  
    messageElement.addEventListener("click", () => {
      sendMessage(question); // Enviar la pregunta automáticamente al hacer clic
      clearAllDefaultQuestions(); // Eliminar todas las preguntas del historial de chat
    });
  }
  
  function clearAllDefaultQuestions() {
    const defaultQuestionElements = document.querySelectorAll(".default-question");
    defaultQuestionElements.forEach((element) => element.remove());
  }

/**/

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'es-ES';

  recognition.onresult = async (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        let message = event.results[i][0].transcript;
        if (message.length > 200) {
          message = message.substring(0, 200);
        }
        clearAllDefaultQuestions();
        await sendMessage(message);
      }
    }
  };
} else {
  console.error('La Web Speech API no es soportada en este navegador.'); 
}

userInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const message = userInput.value.trim();
    userInput.value = ''; // Limpia el campo de entrada inmediatamente después de enviar el mensaje
    clearAllDefaultQuestions()
    await sendMessage(message);
  }
});

userInput.addEventListener('input', function (event) {
  var remaining = 200 - userInput.value.length;
  charCounter.textContent = remaining;

  if (remaining <= 0) {
    charCounter.style.color = '#f1b0bb';
    userInput.classList.add('shake');

    setTimeout(function() {
      userInput.classList.remove('shake');
    }, 500);
  } else {
    charCounter.style.color = '#2c2c54';
  }
});

function showTypingMessage() {
  addMessageToChat("typing", "");
}

function removeTypingMessage() {
  const typingMessage = document.querySelector(".message.typing");

  if (typingMessage) {
    typingMessage.remove();
  }
}

async function sendMessage(message) {
  if (message) {
    charCounter.textContent = 200;

    addMessageToChat("user", message);

    showTypingMessage();

    const response = await fetch(`/api/ask?question=${encodeURIComponent(message)}`);

    if (response.ok) {
      const data = await response.json();
      removeTypingMessage(); // Eliminar el mensaje de "typing" antes de mostrar la respuesta
      handleResponse(data.result);
    } else {
      console.error("Error en la comunicación con el chatbot");
    }
  }
}

function handleResponse(response) {
  const formattedResponse = formatResponse(response);
  const responseText = formattedResponse.text;
  const role = responseText.startsWith("Bot:") ? "bot" : "bot";

  addMessageToChat(role, responseText);

  if (voiceEnabled && role === 'bot') {
    speakMessage(responseText);
  }
}

function addMessageToChat(role, message) {
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message-container", role);

  const messageElement = document.createElement("div");
  messageElement.classList.add("message", role);

  messageElement.innerHTML = formatLinks(message);

  messageContainer.appendChild(messageElement);
  chatHistory.appendChild(messageContainer);
  chatHistory.scrollTop = chatHistory.scrollHeight;

  setTimeout(() => {
    messageElement.classList.add("visible");
  }, 50);

  const links = messageContainer.querySelectorAll("a");

  links.forEach((link) => {
    const linkWrapper = document.createElement("div");
    linkWrapper.classList.add("link-css");
    linkWrapper.appendChild(link.cloneNode(true));

    linkWrapper.addEventListener("click", (event) => {
      event.preventDefault();
      const url = link.getAttribute("href");
      window.open(url, "_blank");
    });

    link.parentNode.replaceChild(linkWrapper, link);
  });
}

function formatResponse(response) {
  if (typeof response === "string") {
    const formattedResponse = response.replace(/\n/g, "<br>");
    return formatLinks(formattedResponse);
  } else if (typeof response === "object") {
    for (let key in response) {
      if (typeof response[key] === "string") {
        response[key] = response[key].replace(/\n/g, "<br>");
      }
    }
    return response;
  } else {
    return response;
  }
}


function formatLinks(text) {
  const linkRegex = /((?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-zA-Z]{2,}(?:[^\s\)])*)/g;

  const formattedText = text.replace(linkRegex, (match) => {
    const friendlyLinkText = getFriendlyLinkText(match);
    const linkElement = document.createElement("a");
    linkElement.href = match.startsWith('http') ? match : 'https://' + match;
    linkElement.target = "_blank";
    linkElement.textContent = friendlyLinkText;
    return linkElement.outerHTML;
  });

  return formattedText;
}

function getFriendlyLinkText(link) {
  const url = new URL(link.startsWith('http') ? link : 'https://' + link);
  let friendlyText = url.hostname.replace('www.', '');

  friendlyText = escapeHtml(friendlyText);

  return friendlyText;
}

function escapeHtml(text) {
  const element = document.createElement('div');
  element.textContent = text;
  return element.innerHTML;
}

micButton.addEventListener('mousedown', () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

micButton.addEventListener('mouseup', () => {
  if (isRecording) {
    stopRecording();
  }
});

function startRecording() {
  isRecording = true;
  recognition.start();

  timer = setTimeout(() => {
    if (isRecording) {
      stopRecording();
    }
  }, 10000);
}

function stopRecording() {
  isRecording = false;
  recognition.stop();
  clearTimeout(timer);
  resetMicButton();
  disableMicButton();
  enableMicButton();
}

function resetMicButton() {
  micButton.style.transform = '';
  micButton.style.color = '';
  micButton.style.opacity = '';
}

function disableMicButton() {
  micButton.disabled = true;
  micButton.classList.add('inactive');
}

function enableMicButton() {
  micButton.disabled = false;
  micButton.classList.remove('inactive');
}

recognition.onerror = (event) => {
  console.error("Error en el reconocimiento de voz:", event.error);
}

chatHistory.addEventListener("click", (event) => {
  const target = event.target;
  if (target.tagName === "A") {
    event.preventDefault();
    const url = target.href;
    showLinkPreview(url);
  }
});

// Actualiza el estado del botón switch y el mensaje de estado
function updateVoiceStatus() {
  var voiceStatus = document.getElementById("voice-status");

  if (voiceEnabled) {
    voiceStatus.textContent = 'Modo Lectura Activada';
  } else {
    voiceStatus.textContent = 'Modo Lectura Desactivada';
  }

  // Mostrar el elemento aplicando una transición de opacidad
  voiceStatus.style.opacity = 1;

  // Ocultar el elemento después de 2 segundos (2000 ms) con una transición de opacidad
  setTimeout(function() {
    voiceStatus.style.opacity = 0;
  }, 1000);
}



// Evento que se activa cuando se cambia el estado del botón switch
voiceSwitch.addEventListener('change', () => {
  voiceEnabled = !voiceEnabled;
  updateVoiceStatus();
});

// Función para agregar el mensaje al chat y leerlo con voz si está activado
async function addMessageAndRead(role, message) {
  addMessageToChat(role, message);
  if (voiceEnabled && role === 'bot') {
    speakMessage(message);
  }
}

// Función para leer un mensaje con voz
function speakMessage(message) {
  const speechSynthesis = window.speechSynthesis;
  const speechMessage = new SpeechSynthesisUtterance(message);
  speechSynthesis.speak(speechMessage);
}