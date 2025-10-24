FROM httpd:2.4-alpine

# Copier la page d'accueil dans le répertoire de contenu d'Apache
COPY index.html /usr/local/apache2/htdocs/

# Copier la configuration Apache personnalisée (reverse proxy)
COPY httpd.conf /usr/local/apache2/conf/httpd.conf

# Exposer le port 80
EXPOSE 80
