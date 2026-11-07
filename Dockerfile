FROM nginxinc/nginx-unprivileged:1.28-alpine
COPY --chown=101:101 deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 public/ /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -Y off -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
