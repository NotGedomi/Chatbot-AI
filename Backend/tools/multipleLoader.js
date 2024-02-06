import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { FaissStore } from "langchain/vectorstores/faiss";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import {
  JSONLoader,
  JSONLinesLoader,
} from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import * as dotenv from "dotenv";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import * as fs from "fs";
dotenv.config();

const directory = "./documents/"; // Carpeta de archivos a cargar
const dataset = "./dataset/"; // Carpeta donde se guarda el Dataset generado

const loader = new DirectoryLoader(directory, {
  ".pdf": (path) => new PDFLoader(path),
  ".json": (path) => new JSONLoader(path),
  ".jsonl": (path) => new JSONLinesLoader(path),
  ".txt": (path) => new TextLoader(path),
  ".csv": (path) => new CSVLoader(path),
  ".docx": (path) => new DocxLoader(path),
});

// Funcion para cargar enlaces web
const readLinksFromFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const links = data.trim().split("\n");
    return links;
  } catch (error) {
    console.error("Hubo un error al tratar de obtener información de la siguiente web:", error);
    return [];
  }
};

export const injest_docs = async () => {
  // Carga de documentos desde el directorio
  const fileDocs = await loader.load();
  console.log("Archivos locales cargados");

  // Carga de enlaces
  const links = readLinksFromFile("./links/links.txt");

  // Load each document from the web page and collect the objects
  const webDocs = [];
  for (const link of links) {
    const webLoader = new PuppeteerWebBaseLoader(link);
    const webDoc = await webLoader.load();
    webDocs.push(...webDoc); // Push each web document object into the array
    console.log("Información web extraída desde:", link);
  }

  // Combina la informacion (Información de los archivos y enlaces cargados)
  const docs = [...fileDocs, ...webDocs];

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docOutput = await textSplitter.splitDocuments(docs);
  const vectorStore = await FaissStore.fromDocuments(
    docOutput,
    new OpenAIEmbeddings()
  );
  console.log("Guardando...");

  await vectorStore.save(dataset);
  console.log("Información guardada!");
};

// Ejecuta la funcion 'injest_docs()' inicialmente, para realizar la ingesta de Documentos y generar el Dataset.
injest_docs();
