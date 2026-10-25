#!/bin/sh
set -e
# Render assigns a random $PORT at runtime; bake it into nginx.conf before boot.
sed -i "s/listen 80;/listen ${PORT:-10000};/" /etc/nginx/http.d/default.conf
if [ -n "$DB_SSL_CA" ] && [ -f "$DB_SSL_CA" ]; then
    cp "$DB_SSL_CA" /var/www/html/runtime/db-ca.pem
    chown www-data:www-data /var/www/html/runtime/db-ca.pem
    export DB_SSL_CA=/var/www/html/runtime/db-ca.pem
fi
php /var/www/html/public/index.php migrate || echo "Migration failed, see the output above"
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
