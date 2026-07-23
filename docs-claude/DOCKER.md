# 🐳 Docker - Guía Completa de Softensor

Configuración profesional de Docker para desarrollo y producción con Next.js, Nginx y variables de entorno.

---

## 📋 Tabla de Contenidos

- [Prerrequisitos](#prerrequisitos)
- [Estructura de Docker](#estructura-de-docker)
- [Inicio Rápido](#inicio-rápido)
- [Configuración de Entorno](#configuración-de-entorno)
- [Comandos Disponibles](#comandos-disponibles)
- [Arquitectura](#arquitectura)
- [Desarrollo](#desarrollo)
- [Producción](#producción)
- [Optimizaciones](#optimizaciones)
- [Monitoreo y Logs](#monitoreo-y-logs)
- [Troubleshooting](#troubleshooting)
- [Despliegue en Cloud](#despliegue-en-cloud)

---

## 📦 Prerrequisitos

### Software Requerido

- **Docker**: >= 20.10
- **Docker Compose**: >= 2.0
- **Make** (opcional, para usar Makefile)

### Instalación de Docker

#### Ubuntu/Debian
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### macOS
```bash
brew install docker docker-compose
```

#### Windows
Descargar [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## 🏗️ Estructura de Docker

```
softensor/
├── Dockerfile              # Producción (multi-stage)
├── Dockerfile.dev          # Desarrollo (hot reload)
├── docker-compose.yml      # Producción (Next.js + Nginx)
├── docker-compose.dev.yml  # Desarrollo (solo Next.js)
├── .dockerignore           # Archivos a ignorar
├── Makefile                # Comandos rápidos
├── nginx/
│   ├── Dockerfile          # Nginx customizado
│   └── nginx.conf          # Configuración Nginx
├── scripts/
│   ├── dev.sh              # Script desarrollo
│   ├── prod.sh             # Script producción
│   ├── stop.sh             # Detener servicios
│   ├── clean.sh            # Limpiar recursos
│   └── logs.sh             # Ver logs
├── .env.development        # Variables dev
├── .env.production         # Variables prod
└── .env.example            # Template
```

---

## 🚀 Inicio Rápido

### Opción 1: Usando Makefile (Recomendado)

```bash
# Desarrollo
make dev

# Producción
make prod

# Ver comandos disponibles
make help
```

### Opción 2: Usando Scripts

```bash
# Desarrollo
./scripts/dev.sh

# Producción
./scripts/prod.sh

# Detener
./scripts/stop.sh
```

### Opción 3: Usando Docker Compose

```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml up --build

# Producción
docker-compose -f docker-compose.yml up --build -d
```

---

## ⚙️ Configuración de Entorno

### 1. Copiar archivos de ejemplo

```bash
# Ya están creados:
# .env.development
# .env.production
```

### 2. Variables de Entorno Importantes

#### Desarrollo (.env.development)
```bash
NODE_ENV=development
APP_URL=http://localhost:3000
DEV_PORT=3000
NEXT_TELEMETRY_DISABLED=1
```

#### Producción (.env.production)
```bash
NODE_ENV=production
APP_URL=https://softensor.com
NGINX_PORT=80

# Configurar según necesidad
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
# El correo de contacto público se configura en config/contactChannels.tsx, no por entorno.
```

---

## 🎯 Comandos Disponibles

### Makefile Commands

| Comando | Descripción |
|---------|-------------|
| `make help` | Mostrar ayuda |
| `make dev` | Iniciar desarrollo |
| `make dev-d` | Desarrollo en background |
| `make prod` | Iniciar producción |
| `make build` | Build imágenes producción |
| `make build-dev` | Build imagen desarrollo |
| `make down` | Detener todos los servicios |
| `make restart` | Reiniciar producción |
| `make restart-dev` | Reiniciar desarrollo |
| `make logs` | Ver logs producción |
| `make logs-dev` | Ver logs desarrollo |
| `make logs-nginx` | Ver logs Nginx |
| `make logs-nextjs` | Ver logs Next.js |
| `make clean` | Limpiar recursos Docker |
| `make status` | Estado de contenedores |
| `make health` | Check de salud |
| `make shell-nextjs` | Shell en Next.js |
| `make shell-nginx` | Shell en Nginx |
| `make backup-volumes` | Backup de volúmenes |

### Scripts

```bash
./scripts/dev.sh          # Iniciar desarrollo
./scripts/prod.sh         # Iniciar producción
./scripts/stop.sh         # Detener todo
./scripts/clean.sh        # Limpieza interactiva
./scripts/logs.sh [dev|prod]  # Ver logs
```

---

## 🏛️ Arquitectura

### Modo Desarrollo

```
┌─────────────────────┐
│   Browser           │
│   localhost:3000    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Next.js Dev       │
│   Hot Reload        │
│   Port: 3000        │
└─────────────────────┘
```

### Modo Producción

```
┌─────────────────────┐
│   Browser           │
│   localhost:80      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Nginx             │
│   Reverse Proxy     │
│   Cache + Gzip      │
│   Port: 80          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Next.js Prod      │
│   Standalone        │
│   Port: 3000        │
└─────────────────────┘
```

---

## 💻 Desarrollo

### Iniciar Entorno de Desarrollo

```bash
# Método 1: Makefile
make dev

# Método 2: Docker Compose
docker-compose -f docker-compose.dev.yml up --build

# En background
make dev-d
```

### Características de Desarrollo

✅ **Hot Reload**: Cambios en código se reflejan automáticamente
✅ **Source Maps**: Debug completo
✅ **Variables de entorno**: `.env.development`
✅ **Puerto**: `3000`

### Acceso

- **Aplicación**: http://localhost:3000
- **Español**: http://localhost:3000/es
- **Inglés**: http://localhost:3000/en

### Modificar Código

Los cambios se sincronizan en tiempo real gracias a los volúmenes:

```yaml
volumes:
  - ./:/app
  - /app/node_modules
  - /app/.next
```

---

## 🏭 Producción

### Iniciar Entorno de Producción

```bash
# Método 1: Makefile
make prod

# Método 2: Docker Compose
docker-compose -f docker-compose.yml up --build -d
```

### Características de Producción

✅ **Multi-stage build**: Imagen optimizada
✅ **Nginx**: Reverse proxy con cache
✅ **Gzip**: Compresión automática
✅ **SSL Ready**: Preparado para HTTPS
✅ **Health Checks**: Monitoreo automático
✅ **Resource Limits**: CPU y memoria limitados
✅ **Security Headers**: Headers de seguridad
✅ **Rate Limiting**: Protección DDoS

### Acceso

- **Aplicación**: http://localhost
- **Health Check Nginx**: http://localhost/health
- **Health Check Next.js**: http://localhost:3000

### Servicios

1. **Next.js Container**
   - Nombre: `softensor-nextjs`
   - Puerto interno: 3000
   - Recursos: 1 CPU, 1GB RAM

2. **Nginx Container**
   - Nombre: `softensor-nginx`
   - Puerto externo: 80
   - Recursos: 0.5 CPU, 256MB RAM

---

## ⚡ Optimizaciones

### 1. Multi-stage Build

Reduce el tamaño de la imagen final:

```dockerfile
FROM node:20-alpine AS deps    # Solo dependencies
FROM node:20-alpine AS builder # Build app
FROM node:20-alpine AS runner  # Run app
```

### 2. Cache de Nginx

```nginx
# Static files cache
location /_next/static {
    proxy_cache nextjs_cache;
    proxy_cache_valid 200 60m;
}
```

### 3. Compresión Gzip

```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json...
```

### 4. Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
```

---

## 📊 Monitoreo y Logs

### Ver Logs

```bash
# Todos los servicios (producción)
make logs

# Desarrollo
make logs-dev

# Solo Nginx
make logs-nginx

# Solo Next.js
make logs-nextjs

# Últimas 100 líneas
docker-compose -f docker-compose.yml logs --tail=100
```

### Health Checks

```bash
# Estado de contenedores
make status

# Health check detallado
make health

# Manual
docker ps
docker-compose -f docker-compose.yml ps
```

### Acceder a Contenedores

```bash
# Next.js (producción)
make shell-nextjs
docker exec -it softensor-nextjs sh

# Nginx
make shell-nginx
docker exec -it softensor-nginx sh

# Desarrollo
make shell-dev
docker exec -it softensor-nextjs-dev sh
```

---

## 🐛 Troubleshooting

### Problema: Puerto ya en uso

```bash
# Encontrar proceso usando puerto 3000
sudo lsof -i :3000

# Matar proceso
sudo kill -9 <PID>

# O cambiar puerto en .env
DEV_PORT=3001
```

### Problema: Caché corrupto

```bash
# Limpiar todo
make clean

# Solo volúmenes
make clean-volumes

# Rebuild desde cero
docker-compose -f docker-compose.yml build --no-cache
```

### Problema: Cambios no se reflejan

**Desarrollo:**
```bash
# Reiniciar servicio
make restart-dev
```

**Producción:**
```bash
# Rebuild necesario
make down
make prod
```

### Problema: Error de memoria

```bash
# Aumentar límites en docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G  # Aumentar de 1G a 2G
```

### Problema: Nginx 502 Bad Gateway

```bash
# Verificar que Next.js esté corriendo
docker-compose -f docker-compose.yml ps

# Ver logs
make logs-nextjs
make logs-nginx

# Reiniciar
make restart
```

---

## ☁️ Despliegue en Cloud

### AWS EC2

```bash
# 1. Instalar Docker en EC2
sudo yum update -y
sudo yum install docker -y
sudo service docker start

# 2. Clonar repositorio
git clone <repo-url>
cd softensor

# 3. Configurar producción
cp .env.example .env.production
# Editar .env.production

# 4. Iniciar
make prod
```

### AWS ECS/Fargate

```bash
# 1. Push imagen a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag softensor:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/softensor:latest

docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/softensor:latest

# 2. Crear task definition y servicio en ECS
```

### DigitalOcean Droplet

```bash
# 1. Crear droplet con Docker
# 2. SSH al droplet
# 3. Mismo proceso que EC2
```

### Docker Swarm (Cluster)

```bash
# 1. Inicializar swarm
docker swarm init

# 2. Deploy stack
docker stack deploy -c docker-compose.yml softensor

# 3. Escalar
docker service scale softensor_nextjs=3
```

---

## 📈 Escalabilidad

### Horizontal Scaling

```bash
# Escalar Next.js
docker-compose -f docker-compose.yml up --scale nextjs=3 -d
```

### Load Balancer

Agregar a `nginx.conf`:

```nginx
upstream nextjs {
    server nextjs1:3000;
    server nextjs2:3000;
    server nextjs3:3000;
}
```

---

## 🔒 Seguridad

### Variables Secretas

```bash
# NO commitear .env.production
# Usar Docker secrets en producción

echo "supersecretkey" | docker secret create session_secret -
```

### SSL/HTTPS

Modificar `nginx/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
}
```

---

## 💾 Backup

### Backup de Volúmenes

```bash
# Automático
make backup-volumes

# Manual
docker run --rm -v softensor_nextjs_cache:/data -v $(PWD)/backups:/backup alpine tar czf /backup/backup.tar.gz -C /data .
```

### Restaurar Backup

```bash
docker run --rm -v softensor_nextjs_cache:/data -v $(PWD)/backups:/backup alpine tar xzf /backup/backup.tar.gz -C /data
```

---

## 📚 Recursos Adicionales

- [Docker Docs](https://docs.docker.com/)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
- [Nginx Docker](https://hub.docker.com/_/nginx)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

## ✅ Checklist de Producción

- [ ] Configurar `.env.production` con valores reales
- [ ] Configurar SSL/HTTPS en Nginx
- [ ] Configurar dominio personalizado
- [ ] Habilitar monitoreo (CloudWatch, Datadog, etc)
- [ ] Configurar backups automáticos
- [ ] Configurar CI/CD (GitHub Actions, GitLab CI)
- [ ] Probar health checks
- [ ] Configurar logging centralizado
- [ ] Probar escalabilidad
- [ ] Documentar procedimientos de rollback

---

**✨ Proyecto Dockerizado Profesionalmente**

Para soporte: [GitHub Issues](https://github.com/softensor/issues)
