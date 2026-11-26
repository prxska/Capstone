# MediTrack

MediTrack es una aplicación móvil interactiva diseñada para el seguimiento y control de tratamientos farmacológicos y atenciones médicas en pacientes crónicos. Su diseño prioriza la accesibilidad para adultos mayores y cuidadores mediante controles táctiles simplificados, apoyos visuales y un esquema de sincronización híbrido.

## 👥 Equipo de Desarrollo
- Jorge Garrido 
- Eduardo González
- Matías Riveros
  
## ✨ Características Principales
* **Control Farmacológico y Rutinas:** Registro de tratamientos con apoyo de código cromático visual para identificar fármacos y dosificaciones sin confusiones.
* **Agenda de Citas Médicas:** Centralización de controles periódicos, especialidades y ubicaciones de centros de salud.
* **Accesibilidad para Adultos Mayores:** Selectores táctiles por incrementos (+ / -) y atajos por momentos del día que prescinden del uso del teclado numérico.
* **Persistencia Híbrida:** Capacidad de operar en modo local fuera de línea (`AsyncStorage`) y sincronización en la nube (`Supabase`) para usuarios registrados.
* **Sistema de Alarmas y Recordatorios:** Modales en pantalla con retroalimentación háptica y vibración nativa para la confirmación de tomas.

## 🛠️ Stack Tecnológico
* **Frontend Móvil:** React Native, Expo, Expo Router y Context API.
* **Backend y Base de Datos:** Supabase (PostgreSQL con Row Level Security y autenticación integrada).
* **Almacenamiento Local:** AsyncStorage.
* **Compilación y Despliegue:** EAS Build (generación de APK standalone para Android).
* **Herramientas de Trabajo:** Figma, Visual Studio Code y GitHub.
    
---

## 🚀 Instrucciones de Ejecución (Entorno de Desarrollo)

Sigue estos pasos para levantar el entorno local del frontend móvil correspondiente a la Actividad A6 del plan de trabajo.

1. **Requisitos Previos**
   - Tener instalado Node.js (versión 18 o 20 LTS recomendada).
   - Instalar la aplicación Expo Go en un dispositivo móvil físico o disponer de un emulador Android/iOS configurado.
   - Posicionarse en la terminal dentro de la carpeta raíz del proyecto móvil:
     ```bash
     cd meditrack-mobile
     ```

2. **Instalación de Dependencias**
   - Instala la totalidad de las dependencias base del proyecto:
     ```bash
     npm install
     ```

3. **Configuración de Variables de Entorno**
   - Crea un archivo `.env` en la raíz de `meditrack-mobile` con las credenciales de conexión al backend de Supabase:
     ```env
     EXPO_PUBLIC_SUPABASE_URL=[https://akirezlsvgkperdwkxrd.supabase.co](https://akirezlsvgkperdwkxrd.supabase.co)
     EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
     ```
     *(Nota: La aplicación requiere estas claves para autenticar perfiles y sincronizar recetas).*

4. **Levantar el Servidor (Modo Túnel)**
   - Para evitar fallos de conectividad entre redes locales o cortafuegos, inicia el empaquetador Metro utilizando un túnel Ngrok:
     ```bash
     npx expo start --dev-client --tunnel
     ```
     *(Si la terminal solicita instalar `@expo/ngrok`, confirma presionando la tecla "y").*

5. **Despliegue en el Dispositivo**
   - **Android:** Abre la aplicación Expo Go y escanea el código QR proyectado en la terminal.
   - **iOS:** Abre la cámara nativa del teléfono y enfoca el código QR para abrir el enlace en Expo Go.
   - Espera a que finalice la compilación del bundle de JavaScript para interactuar con la interfaz en el dispositivo.

## 📲 Presentar la aplicación sin dejar el servidor corriendo

Para una presentación en Android, se puede generar un APK de instalación independiente con EAS Build. El APK incluye la aplicación y no necesita que Metro/Expo quede ejecutándose en el computador:

```bash
cd meditrack-mobile
npx eas-cli@latest build --profile preview --platform android
```

Inicia sesión o crea una cuenta de Expo cuando EAS lo solicite. Al terminar, descarga el APK desde el enlace que entrega EAS e instálalo en el teléfono antes de la presentación. El perfil `preview` ya está configurado para generar un APK de distribución interna.

La app puede demostrarse en modo local/invitado sin depender de un servidor propio; los datos de ese modo quedan en el teléfono. Para iniciar sesión, sincronizar datos o usar cuentas, el dispositivo sí necesita internet para conectarse a Supabase (servicio en la nube), pero no hay que mantener un servidor local activo.
