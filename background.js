// Almacenamiento para los grupos de pestañas
let tabGroups = {};

// Función para inicializar la extensión
function initializeExtension() {
  console.log("Inicializando extensión");
  // Cargar grupos existentes desde el almacenamiento
  return browser.storage.local.get('tabGroups').then((result) => {
    console.log("Datos cargados desde almacenamiento:", result);
    if (result.tabGroups) {
      tabGroups = result.tabGroups;
      console.log("Grupos de pestañas cargados:", JSON.stringify(tabGroups));
    } else {
      console.log("No se encontraron grupos guardados");
      // Inicializar con un grupo de ejemplo para pruebas
      const groupId = Date.now().toString();
      tabGroups[groupId] = {
        name: "Grupo de ejemplo",
        tabs: []
      };
      // Guardar en almacenamiento local
      return browser.storage.local.set({ tabGroups }).then(() => {
        console.log("Grupo de ejemplo creado y guardado");
      });
    }
  }).then(() => {
    // Actualizar el menú contextual después de asegurarnos de que los grupos están cargados
    return updateContextMenu();
  }).catch(error => {
    console.error("Error al inicializar la extensión:", error);
  });
}

// Inicializar la extensión cuando se instala o actualiza
browser.runtime.onInstalled.addListener(() => {
  console.log("Extensión instalada/actualizada");
  initializeExtension().then(() => {
    // Crear menú contextual después de inicializar
    createContextMenu();
  });
});

// También inicializar cuando Firefox se inicia con la extensión ya instalada
browser.runtime.onStartup.addListener(() => {
  console.log("Firefox iniciado con la extensión ya instalada");
  initializeExtension().then(() => {
    // Crear menú contextual después de inicializar
    createContextMenu();
  });
});

// Función para crear el menú contextual inicial
function createContextMenu() {
  console.log("Creando menú contextual inicial");
  // Simplemente llamar a updateContextMenu, que ahora se encarga de crear todo el menú
  return updateContextMenu();
}

// Escuchar mensajes del popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'createGroup') {
    console.log("Recibido mensaje para crear grupo:", message);
    // Obtener la información de la pestaña guardada temporalmente
    return browser.storage.local.get('tempTabInfo').then((result) => {
      if (result.tempTabInfo) {
        console.log("Información temporal encontrada:", result.tempTabInfo);
        // Obtener la pestaña por su ID
        return browser.tabs.get(result.tempTabInfo.tabId).then((tab) => {
          // Crear el grupo con el nombre recibido
          createNewGroup(message.groupName, tab);
          
          // Cerrar la pestaña del popup si existe
          if (result.tempTabInfo.popupTabId) {
            console.log("Intentando cerrar pestaña con ID:", result.tempTabInfo.popupTabId);
            return browser.tabs.remove(result.tempTabInfo.popupTabId).catch(error => {
              console.log("Error al cerrar la pestaña:", error);
              // La pestaña probablemente ya fue cerrada por el usuario
            }).finally(() => {
              // Limpiar la información temporal
              console.log("Limpiando información temporal");
              return browser.storage.local.remove('tempTabInfo');
            });
          } else {
            // Limpiar la información temporal
            console.log("No hay ID de pestaña, limpiando información temporal");
            return browser.storage.local.remove('tempTabInfo');
          }
        }).catch(error => {
          console.error("Error al obtener la pestaña:", error);
          // Limpiar la información temporal en caso de error
          return browser.storage.local.remove('tempTabInfo');
        });
      } else {
        console.log("No se encontró información temporal");
        return Promise.resolve();
      }
    });
  } else if (message.action === 'cancelGroupCreation') {
    console.log("Cancelando creación de grupo");
    // Obtener la información temporal para cerrar la pestaña
    return browser.storage.local.get('tempTabInfo').then((result) => {
      if (result.tempTabInfo) {
        // Cerrar la pestaña del popup si existe
        if (result.tempTabInfo.popupTabId) {
          console.log("Cerrando pestaña del popup después de cancelar:", result.tempTabInfo.popupTabId);
          browser.tabs.remove(result.tempTabInfo.popupTabId).catch(error => {
            console.log("Error al cerrar la pestaña:", error);
          });
        }
        // Limpiar la información temporal
        console.log("Limpiando información temporal después de cancelar");
        return browser.storage.local.remove('tempTabInfo');
      }
      return Promise.resolve();
    });
});

// Función para actualizar el menú contextual con los grupos existentes
function updateContextMenu() {
  // Obtener los grupos actualizados del almacenamiento local
  return browser.storage.local.get('tabGroups').then(result => {
    // Actualizar la variable global con los datos más recientes
    tabGroups = result.tabGroups || {};
    console.log("Actualizando menú contextual con grupos:", JSON.stringify(tabGroups));
    
    // Primero eliminar todos los elementos del menú excepto el principal
    return browser.contextMenus.removeAll().then(() => {
      // Recrear el menú principal
      browser.contextMenus.create({
        id: "add-to-tab-group",
        title: "Añadir a grupo de pestañas",
        contexts: ["tab", "page"]
      });
      
      // Añadir opción para crear un nuevo grupo
      browser.contextMenus.create({
        id: "create-new-group",
        title: "Crear nuevo grupo...",
        contexts: ["tab", "page"],
        parentId: "add-to-tab-group"
      });
      
      // Añadir separador si hay grupos existentes
      if (Object.keys(tabGroups).length > 0) {
        browser.contextMenus.create({
          id: "separator-1",
          type: "separator",
          contexts: ["tab", "page"],
          parentId: "add-to-tab-group"
        });
      }
      
      // Añadir cada grupo existente al menú
      for (const groupId in tabGroups) {
        browser.contextMenus.create({
          id: `group-${groupId}`,
          title: tabGroups[groupId].name,
          contexts: ["tab", "page"],
          parentId: "add-to-tab-group"
        });
      }
    });
  }).catch(error => {
    console.error("Error al actualizar el menú contextual:", error);
  });
}

// Manejar clics en el menú contextual
browser.contextMenus.onClicked.addListener((info, tab) => {
  // Si el clic fue en una página y no en una pestaña, necesitamos obtener la pestaña activa
  if (info.pageUrl && !tab.id) {
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
      if (tabs.length > 0) {
        handleContextMenuAction(info, tabs[0]);
      }
    });
  } else {
    // Si ya tenemos la información de la pestaña, procesamos directamente
    handleContextMenuAction(info, tab);
  }
});

// Función para manejar la acción del menú contextual
function handleContextMenuAction(info, tab) {
  if (info.menuItemId === "create-new-group") {
    // Guardar la información de la pestaña para usarla cuando se cree el grupo
    browser.storage.local.set({ tempTabInfo: { tabId: tab.id } }).then(() => {
      // Abrir el formulario en una nueva pestaña
      browser.tabs.create({
        url: "/popup/create-group.html",
        active: true
      }).then(newTab => {
        // Guardar también el ID de la nueva pestaña para cerrarla después
        browser.storage.local.get('tempTabInfo').then(result => {
          if (result.tempTabInfo) {
            result.tempTabInfo.popupTabId = newTab.id;
            browser.storage.local.set({ tempTabInfo: result.tempTabInfo });
          }
        });
      });
    });
  } else if (info.menuItemId.startsWith("group-")) {
    // Extraer el ID del grupo del ID del menú
    const groupId = info.menuItemId.replace("group-", "");
    addTabToGroup(tab, groupId);
  }
}

// Función para crear un nuevo grupo
function createNewGroup(groupName, tab) {
  console.log("Creando nuevo grupo:", groupName, "para la pestaña:", tab.id);
  const groupId = Date.now().toString();
  
  // Asegurarse de que tabGroups esté inicializado
  if (!tabGroups) {
    tabGroups = {};
  }
  
  // Crear el nuevo grupo con la pestaña actual
  tabGroups[groupId] = {
    name: groupName,
    tabs: [tab.id]
  };
  
  console.log("Estructura del grupo antes de guardar:", JSON.stringify(tabGroups));
  
  // Guardar en almacenamiento local
  return browser.storage.local.set({ tabGroups }).then(() => {
    // Verificar que se guardó correctamente
    return browser.storage.local.get('tabGroups').then(result => {
      console.log("Grupo guardado y verificado:", JSON.stringify(result.tabGroups));
      // Actualizar el menú contextual para mostrar el nuevo grupo
      updateContextMenu();
      
      // Mostrar notificación
      browser.notifications.create({
        type: "basic",
        iconUrl: browser.runtime.getURL("icons/icon-48.svg"),
        title: "Grupo creado",
        message: `Pestaña añadida al nuevo grupo "${groupName}"`
      });
    });
  }).catch(error => {
    console.error("Error al guardar el grupo:", error);
  });
}

// Función para añadir una pestaña a un grupo existente
function addTabToGroup(tab, groupId) {
  console.log("Añadiendo pestaña", tab.id, "al grupo", groupId);
  
  // Primero obtener los grupos actualizados del almacenamiento
  return browser.storage.local.get('tabGroups').then(result => {
    // Asegurarse de que tabGroups esté actualizado con los datos del almacenamiento
    tabGroups = result.tabGroups || {};
    
    if (tabGroups[groupId]) {
      // Verificar si la pestaña ya está en el grupo
      if (!tabGroups[groupId].tabs.includes(tab.id)) {
        tabGroups[groupId].tabs.push(tab.id);
        
        console.log("Añadiendo pestaña al grupo. Estructura actualizada:", JSON.stringify(tabGroups));
        
        // Guardar en almacenamiento local
        return browser.storage.local.set({ tabGroups }).then(() => {
          console.log("Pestaña añadida al grupo. Grupos actualizados:", JSON.stringify(tabGroups));
          
          // Actualizar menú contextual
          updateContextMenu();
          
          // Notificar al usuario
          browser.notifications.create({
            type: "basic",
            iconUrl: browser.runtime.getURL("icons/icon-48.svg"),
            title: "Pestaña añadida",
            message: `Se ha añadido la pestaña al grupo "${tabGroups[groupId].name}"`
          });
        }).catch(error => {
          console.error("Error al guardar el grupo actualizado:", error);
        });
      } else {
        // Notificar que la pestaña ya está en el grupo
        browser.notifications.create({
          type: "basic",
          iconUrl: browser.runtime.getURL("icons/icon-48.svg"),
          title: "Información",
          message: `La pestaña ya está en el grupo "${tabGroups[groupId].name}"`
        });
        return Promise.resolve();
      }
    } else {
      console.error("Error: Grupo no encontrado", groupId);
      return Promise.resolve();
    }
  }).catch(error => {
    console.error("Error al obtener los grupos:", error);
    return Promise.reject(error);
  });
}

// Manejar cuando se cierra una pestaña para eliminarla de los grupos
browser.tabs.onRemoved.addListener((tabId) => {
  let updated = false;
  
  // Recorrer todos los grupos y eliminar la pestaña cerrada
  for (const groupId in tabGroups) {
    const index = tabGroups[groupId].tabs.indexOf(tabId);
    if (index !== -1) {
      tabGroups[groupId].tabs.splice(index, 1);
      updated = true;
      
      // Si el grupo queda vacío, considerar eliminarlo
      if (tabGroups[groupId].tabs.length === 0) {
        delete tabGroups[groupId];
      }
    }
  }
  
  // Si hubo cambios, guardar y actualizar menú
  if (updated) {
    browser.storage.local.set({ tabGroups });
    updateContextMenu();
  }
});

// Función para mostrar un panel con todos los grupos y sus pestañas
function showGroupTabsPanel() {
  browser.tabs.create({
    url: "/group-panel/panel.html"
  });
}