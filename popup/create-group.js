// Script para manejar la creación de un nuevo grupo
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('groupForm');
  const cancelButton = document.getElementById('cancelButton');
  
  // Manejar el envío del formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const groupName = document.getElementById('groupName').value.trim();
    
    if (groupName) {
      // Enviar mensaje al background script con el nombre del grupo
      browser.runtime.sendMessage({
        action: 'createGroup',
        groupName: groupName
      }).then(() => {
        // El background script se encargará de cerrar la ventana
        // No necesitamos llamar a window.close() aquí
      }).catch(error => {
        console.error("Error al enviar mensaje:", error);
      });
    }
  });
  
  // Manejar el botón de cancelar
  cancelButton.addEventListener('click', () => {
    // Notificar al background script que se canceló la creación del grupo
    // El background script se encargará de cerrar la pestaña y limpiar la información temporal
    browser.runtime.sendMessage({
      action: 'cancelGroupCreation'
    }).then(() => {
      console.log("Mensaje de cancelación enviado correctamente");
      // No necesitamos cerrar la pestaña aquí, el background script lo hará
    }).catch(error => {
      console.error("Error al enviar mensaje de cancelación:", error);
    });
  });
});