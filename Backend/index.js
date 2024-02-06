// Importaciones
import { OpenAI } from "langchain/llms/openai";
import { FaissStore } from "langchain/vectorstores/faiss";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { loadQAStuffChain } from "langchain/chains";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import * as dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import {
  injest_docs
} from './tools/multipleLoader.js'

// Configuración de dotenv
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __static = "./public/"

// Creación de la aplicación con Express
const app = express();
const port = process.env.PORT || 80;

app.use(express.static(__static, {
  extensions: ['html', 'htm'],
}));

// Configuración de middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
  destination: path.join(__dirname, "documents"),
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Ruta de estado de salud
app.get("/api/health", async (req, res) => {
  res.json({
    success: true,
    message: "El servidor está funcionando correctamente",
  });
});

// Ruta principal de consulta
app.get("/api/ask", async (req, res, next) => {
  try {
    const llmA = new OpenAI({
      temperature: 0.5,
      modelName: "gpt-3.5-turbo-0125",
    });
    const chainA = new loadQAStuffChain(llmA);

    const directory = path.join(__dirname, "dataset");
    const loadedVectorStore = await FaissStore.load(
      directory,
      new OpenAIEmbeddings()
    );

    const context =
      "Eres un asistente virtual en español. Solo puedes responder con la informacion que se te ha dado. Si no sabes la pregunta a algo que no esta en tu información, indicarás amablemente que no puedes responder preguntas que no tengan que ver con el tema, pero que puedes responder otras con mucho gusto.";
    const question = context + req.query.question;

    const result = await loadedVectorStore.similaritySearch(question, 2);

    if (result.length === 0) {
      const noAnswer =
        "Lo siento, no encontramos una respuesta a tu pregunta :(";
      res.json({ result: noAnswer });
    } else {
      const resA = await chainA.call({
        input_documents: result,
        question,
      });

      res.json({ result: resA });
    }
  } catch (error) {
    next(error);
  }
});

// Ruta de carga de archivos
app.post("/api/upload", upload.single("file"), (req, res) => {
  res.json({
    success: true,
    message: "Archivo subido exitosamente",
  });
});

// Ruta para obtener la lista de archivos con extensiones específicas
app.get("/api/files", (req, res) => {
  const directory = path.join(__dirname, "documents");
  const allowedExtensions = [".txt", ".pdf", ".docx", ".json", ".jsonl", ".csv"]; // Lista de extensiones permitidas

  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error("Error al leer la carpeta de documentos:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    } else {
      const filteredFiles = files.filter((file) => {
        const fileExtension = path.extname(file).toLowerCase();
        return allowedExtensions.includes(fileExtension);
      });

      res.json({ files: filteredFiles });
    }
  });
});


// Configurar middlewares para analizar el cuerpo de la solicitud
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para recibir y almacenar el enlace desde el frontend
app.post("/api/uploadLink", (req, res) => {
  const link = req.body.link;

  if (!link) {
    return res.status(400).json({ success: false, error: "El enlace no fue proporcionado" });
  }

  // Ruta del archivo para almacenar los enlaces
  const filePath = path.join(__dirname, "links", "links.txt");

  // Leer el archivo existente (si existe) o inicializar la lista de enlaces
  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      // Si hay un error al leer el archivo (puede que aún no exista), inicializar la lista de enlaces
      data = "";
    }

    // Agregar el nuevo enlace a la lista de enlaces
    data += link + "\n";

    // Escribir los enlaces actualizados en el archivo
    fs.writeFile(filePath, data, (err) => {
      if (err) {
        console.error("Error al almacenar el enlace:", err);
        res.status(500).json({ success: false, error: "Error al almacenar el enlace" });
      } else {
        res.json({ success: true, message: "Enlace almacenado exitosamente" });
      }
    });
  });
});

// Ruta para obtener la lista de enlaces desde el archivo "links.txt"
app.get("/api/getLinks", (req, res) => {
  const filePath = path.join(__dirname, "links", "links.txt");

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo de enlaces:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    } else {
      const links = data.split("\n").filter((link) => link.trim() !== "");
      res.json({ links });
    }
  });
});

// Ruta para eliminar un enlace desde el archivo "links.txt"
app.delete("/api/deleteLink", (req, res) => {
  const link = req.query.link;
  const filePath = path.join(__dirname, "links", "links.txt");

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo de enlaces:", err);
      res.status(500).json({ success: false, error: "Error interno del servidor" });
    } else {
      const links = data.split("\n").filter((item) => item.trim() !== link.trim());
      const updatedData = links.join("\n");
      fs.writeFile(filePath, updatedData, (err) => {
        if (err) {
          console.error("Error al actualizar el archivo de enlaces:", err);
          res.status(500).json({ success: false, error: "Error interno del servidor" });
        } else {
          res.json({ success: true, message: "Enlace eliminado exitosamente" });
        }
      });
    }
  });
});

// Ruta para editar un enlace en el archivo "links.txt"
app.put("/api/editLink", (req, res) => {
  const link = req.query.link;
  const newLink = req.query.newLink;
  const filePath = path.join(__dirname, "links", "links.txt");

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo de enlaces:", err);
      res.status(500).json({ success: false, error: "Error interno del servidor" });
    } else {
      const links = data.split("\n").map((item) => {
        if (item.trim() === link.trim()) {
          return newLink;
        }
        return item;
      });
      const updatedData = links.join("\n");
      fs.writeFile(filePath, updatedData, (err) => {
        if (err) {
          console.error("Error al actualizar el archivo de enlaces:", err);
          res.status(500).json({ success: false, error: "Error interno del servidor" });
        } else {
          res.json({ success: true, message: "Enlace editado exitosamente" });
        }
      });
    }
  });
});

// Ruta para descargar un archivo
app.get("/api/download", (req, res) => {
  const fileName = req.query.fileName;
  const filePath = path.join(__dirname, "documents", fileName);
  res.download(filePath, (err) => {
    if (err) {
      console.error("Error al descargar el archivo:", err);
      res.status(500).json({ error: "Error al descargar el archivo" });
    }
  });
});

// Ruta para eliminar un archivo
app.delete("/api/delete", (req, res) => {
  const fileName = req.query.fileName;
  const filePath = path.join(__dirname, "documents", fileName);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error al eliminar el archivo:", err);
      res.status(500).json({ success: false, error: "Error al eliminar el archivo" });
    } else {
      res.json({ success: true, message: "Archivo eliminado exitosamente" });
    }
  });
});

// Ruta para renombrar un archivo
app.put("/api/rename", (req, res) => {
  const fileName = req.query.fileName;
  const newFileName = req.query.newFileName;
  const filePath = path.join(__dirname, "documents", fileName);
  const newFilePath = path.join(__dirname, "documents", newFileName);

  // Obtener la información del archivo (nombre y extensión)
  const fileInfo = path.parse(fileName);
  const newFilePathWithExtension = path.join(__dirname, "documents", newFileName + fileInfo.ext);

  fs.rename(filePath, newFilePathWithExtension, (err) => {
    if (err) {
      console.error("Error al renombrar el archivo:", err);
      res.status(500).json({ success: false, error: "Error al renombrar el archivo" });
    } else {
      res.json({ success: true, message: "Archivo renombrado exitosamente" });
    }
  });
});

// Crear una ruta para injestDocs
app.get('/api/injestDocs', async (req, res, next) => {
  try {
      await injest_docs()  // Llama a la función injest_docs
      res.sendStatus(200)
  } catch(err) {
      console.error(err)
      res.sendStatus(500)
  }
})

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`El servidor se está ejecutando en el puerto ${port}`);
});
