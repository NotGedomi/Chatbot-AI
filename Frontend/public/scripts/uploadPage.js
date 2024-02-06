// Obtener la lista de archivos y mostrarlos en el div correspondiente
function fetchFileList() {
  fetch("/api/files")
    .then((response) => response.json())
    .then((data) => {
      const fileListDiv = document.getElementById("fileList");
      fileListDiv.innerHTML = ""; // Vaciar el contenido anterior del div
      const files = data.files;
      files.forEach((file) => {
        fileListDiv.innerHTML += `
          <div class="file">
            <p>${file}</p>
            <button onclick="downloadFile('${file}')">Descargar</button>
            <button onclick="deleteFile('${file}')">Eliminar</button>
            <button onclick="renameFile('${file}')">Renombrar</button>
          </div>
        `;
      });
    })
    .catch((error) => {
      console.error("Error al obtener la lista de archivos:", error);
    });
}

// Función para descargar un archivo
function downloadFile(fileName) {
  window.location.href = `/api/download?fileName=${fileName}`;
}

// Función para eliminar un archivo
function deleteFile(fileName) {
  fetch(`/api/delete?fileName=${fileName}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Mostrar el mensaje de archivo eliminado correctamente
        const popup = document.getElementById("popup");
        popup.style.display = "block";
        setTimeout(() => {
          popup.style.display = "none";
        }, 2000);
        // Actualizar la lista de archivos en el div
        fetchFileList();
      } else {
        console.error("Error al eliminar el archivo:", data.error);
      }
    })
    .catch((error) => {
      console.error("Error al eliminar el archivo:", error);
    });
}

// Función para renombrar un archivo
function renameFile(fileName) {
  const newFileName = prompt("Ingresa el nuevo nombre del archivo:");
  if (newFileName) {
    fetch(`/api/rename?fileName=${fileName}&newFileName=${newFileName}`, {
      method: "PUT",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Mostrar el mensaje de archivo renombrado correctamente
          const popup = document.getElementById("popup");
          popup.style.display = "block";
          setTimeout(() => {
            popup.style.display = "none";
          }, 2000);
          // Actualizar la lista de archivos en el div
          fetchFileList();
        } else {
          console.error("Error al renombrar el archivo:", data.error);
        }
      })
      .catch((error) => {
        console.error("Error al renombrar el archivo:", error);
      });
  }
}

// Función para enviar el enlace al servidor
function sendLink() {
  const linkInput = document.getElementById("linkInput");
  const link = linkInput.value;

  // Verificar si se ingresó un enlace
  if (link) {
    fetch("/api/uploadLink", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ link }), // Enviar el enlace como JSON
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Mostrar el mensaje de enlace enviado correctamente
          const popup = document.getElementById("popup");
          popup.style.display = "block";
          setTimeout(() => {
            popup.style.display = "none";
          }, 2000);
          // Limpiar el campo de entrada del enlace
          linkInput.value = "";
          // Actualizar la lista de archivos en el div
          fetchFileList();
        } else {
          console.error("Error al enviar el enlace:", data.error);
        }
      })
      .catch((error) => {
        console.error("Error al enviar el enlace:", error);
      });
  }
}

// Función para abrir un enlace en una nueva pestaña del navegador
function openLink(link) {
  window.open(link, "_blank");
}

// Función para mostrar la lista de enlaces desde el archivo "links.txt"
function fetchLinkList() {
  fetch("/api/getLinks")
    .then((response) => response.json())
    .then((data) => {
      const linksDiv = document.getElementById("links");
      linksDiv.innerHTML = ""; // Vaciar el contenido anterior del div
      const links = data.links;

      if (links.length === 0) {
        linksDiv.innerHTML = "<p>No hay enlaces disponibles.</p>";
      } else {
        links.forEach((link) => {
          linksDiv.innerHTML += `
            <div class="link-item">
              <a href="${link}" target="_blank">${link}</a>
              <button onclick="deleteLink('${link}')">Eliminar</button>
              <button onclick="editLink('${link}')">Editar</button>
            </div>
          `;
        });
      }
    })
    .catch((error) => {
      console.error("Error al obtener la lista de enlaces:", error);
    });
}

// Función para eliminar un enlace desde el archivo "links.txt"
function deleteLink(link) {
  fetch(`/api/deleteLink?link=${encodeURIComponent(link)}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Mostrar el mensaje de enlace eliminado correctamente
        const popup = document.getElementById("popup");
        popup.style.display = "block";
        setTimeout(() => {
          popup.style.display = "none";
        }, 2000);
        // Actualizar la lista de enlaces en el div
        fetchLinkList();
      } else {
        console.error("Error al eliminar el enlace:", data.error);
      }
    })
    .catch((error) => {
      console.error("Error al eliminar el enlace:", error);
    });
}

// Función para editar un enlace desde el archivo "links.txt"
function editLink(link) {
  const newLink = prompt("Ingresa el nuevo enlace:", link);
  if (newLink !== null && newLink !== link) {
    fetch(`/api/editLink?link=${encodeURIComponent(link)}&newLink=${encodeURIComponent(newLink)}`, {
      method: "PUT",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Mostrar el mensaje de enlace editado correctamente
          const popup = document.getElementById("popup");
          popup.style.display = "block";
          setTimeout(() => {
            popup.style.display = "none";
          }, 2000);
          // Actualizar la lista de enlaces en el div
          fetchLinkList();
        } else {
          console.error("Error al editar el enlace:", data.error);
        }
      })
      .catch((error) => {
        console.error("Error al editar el enlace:", error);
      });
  }
}

// Agregar evento de click al botón para enviar el enlace
document.getElementById("sendLinkButton").addEventListener("click", sendLink);

// Obtener la lista de enlaces y mostrarlos en el div correspondiente al cargar la página
fetchLinkList();

// Evento de click para subir un archivo
document.getElementById("uploadButton").addEventListener("change", () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  // Verificar si se seleccionó un archivo
  if (file) {
    const allowedExtensions = [
      ".txt",
      ".pdf",
      ".docx",
      ".json",
      ".jsonl",
      ".csv",
    ]; // Lista de extensiones permitidas
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase(); // Convert to lowercase

    // Verificar si la extensión del archivo está permitida
    if (allowedExtensions.includes(fileExtension)) {
      const formData = new FormData();
      formData.append("file", file);
      fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Mostrar el mensaje de archivo cargado correctamente
            const popup = document.getElementById("popup");
            popup.style.display = "block";
            setTimeout(() => {
              popup.style.display = "none";
            }, 2000);
            // Limpiar el campo de entrada de archivos
            fileInput.value = "";
            // Actualizar la lista de archivos en el div
            fetchFileList();
          } else {
            console.error("Error al cargar el archivo:", data.error);
          }
        })
        .catch((error) => {
          console.error("Error al cargar el archivo:", error);
        });
    } else {
      // Mostrar mensaje de error de extensión no permitida
      console.error("Extensión de archivo no permitida");
    }
  }
});

// Actualizar Dataset
document.getElementById("loadButton").addEventListener("click", () => {
  fetch("/api/injestDocs")
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response;
    })
    .then(() => {
      // Mostrar el mensaje de archivo cargado correctamente
      const popup = document.getElementById("popup");
      popup.style.display = "block";
      setTimeout(() => {
        popup.style.display = "none";
      }, 2000);
    })
    .catch((error) =>
      console.error("Hubo un error al actualizar tu Dataset!", error)
    );
});

// Obtener la lista de archivos y mostrarlos en el div correspondiente al cargar la página
fetchFileList();
