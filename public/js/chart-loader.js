/**
 * CRACK TOTAL - Cargador dinámico de Chart.js
 * Este script carga Chart.js cuando se necesita para visualizaciones de datos
 */

(function() {
    // Función para cargar Chart.js si aún no está disponible
    window.loadChartJS = function() {
        return new Promise((resolve, reject) => {
            // Verificar si Chart.js ya está cargado
            if (typeof Chart !== 'undefined') {
                console.log('Chart.js ya está cargado');
                resolve(Chart);
                return;
            }
            
            console.log('Cargando Chart.js...');
            
            // Crear elemento script para cargar Chart.js
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.3.0/dist/chart.umd.min.js';
            script.integrity = 'sha384-dNQQmBaGM+II7tRQj6StViBDqLXkOA9bmBTlULlXZLMnMXTLZKt8IHMVXUQdXeFf';
            script.crossOrigin = 'anonymous';
            script.onload = function() {
                console.log('Chart.js cargado correctamente');
                
                // Configurar Chart.js con tema oscuro por defecto
                if (typeof Chart !== 'undefined' && Chart.defaults) {
                    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
                    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
                    Chart.defaults.font.family = "'Montserrat', sans-serif";
                }
                
                resolve(Chart);
            };
            script.onerror = function(error) {
                console.error('Error al cargar Chart.js:', error);
                reject(error);
            };
            
            document.head.appendChild(script);
        });
    };
    
    // Cargar Chart.js cuando estamos en las pestañas de estadísticas o logros
    document.addEventListener('DOMContentLoaded', function() {
        // Escuchar clics en las pestañas
        const tabs = document.querySelectorAll('.tab');
        if (tabs) {
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-tab');
                    
                    // Si es la pestaña de estadísticas, cargar Chart.js
                    if (tabId === 'stats' || tabId === 'achievements') {
                        window.loadChartJS()
                            .then(() => {
                                console.log('Chart.js listo para usar en la pestaña', tabId);
                            })
                            .catch(error => {
                                console.error('No se pudo cargar Chart.js:', error);
                            });
                    }
                });
            });
            
            // Si la pestaña activa es stats o achievements, cargar Chart.js inmediatamente
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) {
                const tabId = activeTab.getAttribute('data-tab');
                if (tabId === 'stats' || tabId === 'achievements') {
                    window.loadChartJS();
                }
            }
        }
    });
})(); 