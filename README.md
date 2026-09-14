# **MediTrack**
MediTrack es una aplicación móvil interactiva diseñada para el seguimiento automatizado de atenciones médicas y medicamentos en pacientes crónicos. Su objetivo principal es centralizar citas médicas, controles periódicos y recordatorios de medicación.

## **👥 Equipo de Desarrollo**
- Jorge Garrido 
- Eduardo González
- Matías Riveros
  
## ✨ Características Principales
* **Gestión Manual de Citas y Tratamientos:** Interfaz intuitiva que permite a los usuarios registrar sus horas médicas y esquemas de medicación directamente en el calendario de la aplicación.
* **Dashboard Centralizador:** Interfaz móvil interactiva para visualizar rápidamente las próximas atenciones y rutinas médicas diarias.
* **Sistema de Notificaciones Push y Alarmas Locales:** Programación automatizada de recordatorios pasivos a partir del registro manual, diseñados para aumentar la asistencia a controles y reducir el olvido de tratamientos.

## 🛠️ Stack Tecnológico
* **Frontend Móvil:** React Native y Expo (incluyendo `expo-notifications` para las alarmas).
* **Backend y Base de Datos:** Node.js, Express y PostgreSQL.
* **Herramientas de Trabajo:** Figma, Visual Studio Code y GitHub.
    
---

## **🚀 Instrucciones de Ejecución (Entorno de Desarrollo)**
Sigue estos pasos para levantar el entorno local del frontend móvil correspondiente a la Actividad A6 del plan de trabajo.  
1. **Requisitos Previos**
    - Instalar Node.js en el equipo de cómputo para desarrollo.  
    - Instalar la aplicación Expo Go en un dispositivo móvil físico para pruebas. 
    - Posicionarse en la terminal dentro de la carpeta raíz del proyecto móvil.
        `cd meditrack-mobile`

2. **Instalación de Dependencias**

    - Instala los paquetes base ejecutando el siguiente comando en la terminal:

      `npm install`

    - Instala la librería de áreas seguras requerida por Expo Router para evitar advertencias de depreciación:

      `npx expo install react-native-safe-area-context`

3. **Levantar el Servidor (Modo Túnel)**

    Para evitar errores de conexión por red local (como Cannot connect to Expo CLI), inicia el servidor utilizando un túnel Ngrok:

    `npx expo start --tunnel`

    *(Si la terminal solicita instalar @expo/ngrok, confirma con la tecla "y". Si ocurre un error, vuelve a ejecutar el comando).*

4. **Despliegue en el Dispositivo**
    - Abre la cámara de tu teléfono (iOS) o la aplicación Expo Go (Android).
    - Escanea el código QR generado en la terminal.
    - Espera a que finalice la carga del bundle de JavaScript para visualizar la interfaz del dashboard en el dispositivo físico.
