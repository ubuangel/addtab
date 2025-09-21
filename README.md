# Añadir a Grupo de Pestañas - Extensión para Firefox

Esta extensión permite añadir pestañas a grupos existentes directamente desde el menú contextual de Firefox, facilitando la organización de tus pestañas abiertas.

## Características

- Añadir pestañas a grupos existentes desde el menú contextual
- Crear nuevos grupos de pestañas
- Gestionar fácilmente tus grupos de pestañas
- Interfaz intuitiva y fácil de usar

## Requisitos

- Firefox 89 o superior

## Instalación

### Instalación desde Firefox Add-ons

1. Visita la página de la extensión en Firefox Add-ons (enlace pendiente)
2. Haz clic en "Añadir a Firefox"
3. Confirma la instalación

### Instalación manual (desarrollo)

1. Descarga o clona este repositorio
2. Abre Firefox y navega a `about:debugging`
3. Haz clic en "Este Firefox" (This Firefox)
4. Haz clic en "Cargar complemento temporal..." (Load Temporary Add-on...)
5. Selecciona el archivo `manifest.json` de la carpeta de la extensión

## Uso

### Añadir una pestaña a un grupo existente

1. Haz clic derecho en la pestaña que deseas añadir a un grupo
2. Selecciona "Añadir a grupo de pestañas" en el menú contextual
3. Elige el grupo al que deseas añadir la pestaña

### Crear un nuevo grupo de pestañas

1. Haz clic derecho en una pestaña
2. Selecciona "Añadir a grupo de pestañas" > "Crear nuevo grupo..."
3. Introduce un nombre para el nuevo grupo
4. Haz clic en "Aceptar"

## Permisos

Esta extensión requiere los siguientes permisos:

- `tabs`: Para acceder y manipular las pestañas del navegador
- `tabHide`: Para gestionar la visibilidad de las pestañas en grupos
- `contextMenus`: Para añadir opciones al menú contextual
- `storage`: Para guardar la información de los grupos de pestañas

## Contribuir

Las contribuciones son bienvenidas. Si deseas contribuir a este proyecto:

1. Haz un fork del repositorio
2. Crea una rama para tu función (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Añadir una función increíble'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.

## Contacto

Creador: [Tu Nombre] - [tu.email@ejemplo.com]

Enlace del proyecto: [https://github.com/tuusuario/add-to-tab-group](https://github.com/tuusuario/add-to-tab-group)