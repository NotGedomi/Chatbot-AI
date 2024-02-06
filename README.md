# Chatbot-AI
Asistente personalizado hecho con Node.js y Langchain utilizando la API de OpenAI y su modelo GTP 3.5 Turbo. Esta potenciado para trabajar con archivos ".txt",".pdf",".docx",".json",".jsonl",".csv" y links de fuentes web, además incluye un modo lectura y reconocimiento de voz.

## Prerrequisitos:
- [Node.js](https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi)
- [Una API Key de OpenAI](https://platform.openai.com/account/api-keys)

### Notas:
Recuerda añadir dentro del archivo .env tu **key** de **OpenAI** en 'OPENAI_API_KEY'.

### Instalación del Backend: 
Para instalar las librerías necesarias del chatbot, sigue estos pasos:

- 1- Navega a la carpeta de tu proyecto (Donde esté alojada la carpeta Backend) en la línea de comandos o terminal.
- 2- Ejecuta el siguiente comando en la línea de comandos o terminal para instalar las librerías especificadas en el archivo package.json:

```
npm install
```
- 3- Una vez culminado el paso anterior, en la linea de comandos o terminal ejecuta el servidor:

```
node index
```

### Instalación del Frontend: 
El chatbot cuenta con un client que permite interactuar con el Backend instalado previamente, es altamente modificable ya que esta creado en HTML, CSS y JS.
Tambien se añadió un panel gráfico en el endpoint "/upload" el cual les permite modificar, eliminar y descargar los archivos o fuentes cargadas previamente, también puedes incluir enlaces.
