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
        // Cerrar la ventana emergente
        window.close();
      });
    }
  });
  
  // Manejar el botón de cancelar
  cancelButton.addEventListener('click', () => {
    window.close();
  });
});