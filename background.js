// Almacenamiento para los grupos de pestañas
let tabGroups = {};

// Inicializar la extensión
browser.runtime.onInstalled.addListener(() => {
  // Cargar grupos existentes desde el almacenamiento
  browser.storage.local.get('tabGroups').then((result) => {
    if (result.tabGroups) {
      tabGroups = result.tabGroups;
    }
    
    // Crear menú contextual principal
    browser.contextMenus.create({
      id: "add-to-tab-group",
      title: "Añadir a grupo de pestañas",
      contexts: ["tab", "page"]
    });
    
    // Actualizar los elementos del menú contextual
    updateContextMenu();
  });
});

// Función para actualizar el menú contextual con los grupos existentes
function updateContextMenu() {
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
    // Solicitar nombre para el nuevo grupo
    const groupName = prompt("Nombre del nuevo grupo:");
    if (groupName && groupName.trim() !== "") {
      createNewGroup(groupName, tab);
    }
  } else if (info.menuItemId.startsWith("group-")) {
    // Extraer el ID del grupo del ID del menú
    const groupId = info.menuItemId.replace("group-", "");
    addTabToGroup(tab, groupId);
  }
}

// Función para crear un nuevo grupo
function createNewGroup(groupName, tab) {
  const groupId = Date.now().toString();
  tabGroups[groupId] = {
    name: groupName,
    tabs: [tab.id]
  };
  
  // Guardar en almacenamiento local
  browser.storage.local.set({ tabGroups });
  
  // Actualizar menú contextual
  updateContextMenu();
  
  // Notificar al usuario
  browser.notifications.create({
    type: "basic",
    title: "Grupo creado",
    message: `Se ha creado el grupo "${groupName}" con la pestaña actual`
  });
}

// Función para añadir una pestaña a un grupo existente
function addTabToGroup(tab, groupId) {
  if (tabGroups[groupId]) {
    // Verificar si la pestaña ya está en el grupo
    if (!tabGroups[groupId].tabs.includes(tab.id)) {
      tabGroups[groupId].tabs.push(tab.id);
      
      // Guardar en almacenamiento local
      browser.storage.local.set({ tabGroups });
      
      // Notificar al usuario
      browser.notifications.create({
        type: "basic",
        title: "Pestaña añadida",
        message: `Se ha añadido la pestaña al grupo "${tabGroups[groupId].name}"`
      });
    } else {
      // Notificar que la pestaña ya está en el grupo
      browser.notifications.create({
        type: "basic",
        title: "Información",
        message: `La pestaña ya está en el grupo "${tabGroups[groupId].name}"`
      });
    }
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