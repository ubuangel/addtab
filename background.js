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
      console.log("Grupos de pestañas cargados:", tabGroups);
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
  // Crear menú contextual principal
  browser.contextMenus.create({
    id: "add-to-tab-group",
    title: "Añadir a grupo de pestañas",
    contexts: ["tab", "page"]
  });
  
  // Actualizar los elementos del menú contextual
  updateContextMenu();
}

// Escuchar mensajes del popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'createGroup') {
    // Obtener la información de la pestaña guardada temporalmente
    browser.storage.local.get('tempTabInfo').then((result) => {
      if (result.tempTabInfo) {
        // Obtener la pestaña por su ID
        browser.tabs.get(result.tempTabInfo.tabId).then((tab) => {
          // Crear el grupo con el nombre recibido
          createNewGroup(message.groupName, tab);
          
          // Cerrar la ventana emergente si aún está abierta
          if (result.tempTabInfo.windowId) {
            browser.windows.remove(result.tempTabInfo.windowId);
          }
          
          // Limpiar la información temporal
          browser.storage.local.remove('tempTabInfo');
        });
      }
    });
    
    // Enviar respuesta para que el popup sepa que el mensaje fue recibido
    return Promise.resolve();
  }
});

// Función para actualizar el menú contextual con los grupos existentes
function updateContextMenu() {
  console.log("Actualizando menú contextual", tabGroups);
  // Primero eliminar todos los elementos del menú excepto el principal
  browser.contextMenus.removeAll().then(() => {
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
    // Crear una página emergente para solicitar el nombre del grupo
    browser.windows.create({
      url: "/popup/create-group.html",
      type: "popup",
      width: 300,
      height: 200
    }).then(popupWindow => {
      // Guardar la información de la pestaña para usarla cuando se cree el grupo
      browser.storage.local.set({ tempTabInfo: { tabId: tab.id, windowId: popupWindow.id } });
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
  tabGroups[groupId] = {
    name: groupName,
    tabs: [tab.id]
  };
  
  // Guardar en almacenamiento local
  browser.storage.local.set({ tabGroups }).then(() => {
    console.log("Grupo guardado correctamente:", tabGroups);
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
  
  // El código de actualización del menú y notificación ya está en el bloque then() anterior
}

// Función para añadir una pestaña a un grupo existente
function addTabToGroup(tab, groupId) {
  console.log("Añadiendo pestaña", tab.id, "al grupo", groupId);
  if (tabGroups[groupId]) {
    // Verificar si la pestaña ya está en el grupo
    if (!tabGroups[groupId].tabs.includes(tab.id)) {
      tabGroups[groupId].tabs.push(tab.id);
      
      // Guardar en almacenamiento local
      browser.storage.local.set({ tabGroups }).then(() => {
        console.log("Pestaña añadida al grupo. Grupos actualizados:", tabGroups);
        
        // Actualizar menú contextual
        updateContextMenu();
        
        // Notificar al usuario
        browser.notifications.create({
          type: "basic",
          iconUrl: browser.runtime.getURL("icons/icon-48.svg"),
          title: "Pestaña añadida",
          message: `Se ha añadido la pestaña al grupo "${tabGroups[groupId].name}"`
        });
      });
    } else {
      // Notificar que la pestaña ya está en el grupo
      browser.notifications.create({
        type: "basic",
        iconUrl: browser.runtime.getURL("icons/icon-48.svg"),
        title: "Información",
        message: `La pestaña ya está en el grupo "${tabGroups[groupId].name}"`
      });
    }
  } else {
    console.error("Error: Grupo no encontrado", groupId);
  }
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