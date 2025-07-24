# Calculadora de Promedio Ponderado UNMSM

Una aplicación web que permite a los estudiantes de la Universidad Nacional Mayor de San Marcos calcular su promedio ponderado subiendo su historial académico en PDF y utilizando inteligencia artificial para el análisis automático.

## 🚀 Características

- **Análisis automático de PDF**: Extrae automáticamente cursos, notas y créditos del historial académico
- **Fórmula oficial UNMSM**: Implementa la fórmula exacta que utiliza la universidad
- **Selección de período**: Permite calcular el promedio hasta un período específico
- **Manejo de cursos repetidos**: Considera automáticamente la mejor nota en cursos repetidos
- **Interfaz intuitiva**: Diseño moderno y fácil de usar
- **Responsive**: Funciona en dispositivos móviles y desktop

## 📋 Prerrequisitos

- Node.js (versión 14 o superior)
- npm o yarn

## 🔧 Instalación

1. Clona el repositorio o descarga los archivos
2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno (opcional):
   - Copia `.env` y ajusta los valores según necesites

4. Ejecuta la aplicación:

```bash
npm start
```

Para desarrollo con auto-reload:
```bash
npm run dev
```

## 🎯 Uso

1. **Subir PDF**: Arrastra y suelta tu historial académico en formato PDF o haz clic para seleccionarlo
2. **Seleccionar período**: Elige hasta qué período quieres calcular tu promedio (opcional)
3. **Ver resultados**: El sistema calculará automáticamente tu promedio ponderado

## 📐 Fórmula Aplicada

La aplicación utiliza la fórmula oficial de la UNMSM:

```
Promedio Ponderado = Σ(nota × créditos) / Σ(créditos válidos)
```

### Consideraciones:
- Solo se incluyen cursos con acta válida (nota > 0)
- En cursos repetidos, se toma únicamente la mejor nota
- Los créditos se ponderan según su importancia
- Se excluyen cursos anulados o con problemas de registro

## 🛠️ Tecnologías Utilizadas

### Backend:
- **Node.js**: Servidor principal
- **Express.js**: Framework web
- **Multer**: Manejo de archivos
- **pdf-parse**: Extracción de texto de PDF
- **CORS**: Manejo de solicitudes cross-origin

### Frontend:
- **HTML5**: Estructura
- **CSS3**: Estilos y animaciones
- **JavaScript (ES6+)**: Lógica de la aplicación
- **Font Awesome**: Iconos

## 📁 Estructura del Proyecto

```
calculador-promedio-unmsm/
├── public/
│   ├── index.html          # Página principal
│   ├── styles.css          # Estilos CSS
│   └── script.js           # Lógica del frontend
├── server.js               # Servidor Node.js
├── package.json            # Dependencias y scripts
├── .env                    # Variables de entorno
└── README.md              # Este archivo
```

## 🔍 Funcionalidades Detalladas

### Análisis de PDF
- Detecta patrones de cursos con códigos UNMSM
- Extrae automáticamente: código, nombre, nota y créditos
- Identifica períodos académicos
- Valida rangos de notas (0-20) y créditos

### Cálculo de Promedio
- Implementa la lógica exacta de la UNMSM
- Maneja cursos repetidos correctamente
- Filtra por período seleccionado
- Excluye notas no válidas

### Interfaz de Usuario
- Drag & drop para archivos PDF
- Visualización de resultados en tiempo real
- Tabla detallada de cursos incluidos
- Mensajes informativos y de error
- Diseño responsive para móviles

## 🚨 Limitaciones

- Solo acepta archivos PDF con formato estándar de UNMSM
- Tamaño máximo de archivo: 10MB
- Requiere conexión a internet para funcionar
- El análisis depende del formato del PDF original

## 🔧 Configuración Avanzada

### Variables de Entorno (.env)
```
PORT=3000                    # Puerto del servidor
NODE_ENV=development         # Ambiente de desarrollo
MAX_FILE_SIZE=10485760      # Tamaño máximo de archivo (10MB)
```

### Personalización de Patrones
El archivo `server.js` contiene los patrones de expresión regular para detectar cursos. Puedes modificarlos si el formato de tu universidad difiere.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Haz fork del proyecto
2. Crea una rama para tu característica
3. Realiza commit de tus cambios
4. Envía un pull request

## 📞 Soporte

Si encuentras problemas o tienes sugerencias:
- Verifica que tu PDF tenga el formato estándar de UNMSM
- Asegúrate de que Node.js esté instalado correctamente
- Revisa la consola del navegador para errores de JavaScript

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🎓 Créditos

Desarrollado para estudiantes de la Universidad Nacional Mayor de San Marcos, basado en la fórmula oficial de cálculo de promedio ponderado.

---

**Nota**: Esta aplicación es una herramienta de ayuda para estudiantes. Para trámites oficiales, siempre consulta con la oficina de registros académicos de tu facultad.
