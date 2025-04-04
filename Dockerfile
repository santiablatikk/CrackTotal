# Usar la imagen oficial de PHP con Apache preinstalado
FROM php:8.2-apache

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /var/www/html

# Copiar el contenido de la carpeta 'public' de tu proyecto
# al directorio raíz del servidor web Apache dentro del contenedor.
# El '.' al final es importante, significa copiar al WORKDIR actual.
COPY public/ .

# (Opcional pero recomendado) Habilitar mod_rewrite para URLs amigables si las necesitas en el futuro
RUN a2enmod rewrite

# Asegurar que Apache tenga permisos para escribir si es necesario (ej. para el ranking.json)
# Esto puede necesitar ajustes dependiendo de cómo el proceso PHP escriba el archivo.
# Por ahora, le damos permiso al grupo www-data (el grupo con el que corre Apache).
# RUN chown -R www-data:www-data /var/www/html/api/data \
#  && chmod -R 775 /var/www/html/api/data

# El puerto 80 ya está expuesto por la imagen base de Apache.
# Render mapeará su $PORT interno a este puerto 80.

# El comando de inicio es manejado por la imagen base (inicia Apache).