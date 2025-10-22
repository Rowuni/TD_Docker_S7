# Backend API avec Base de Données PostgreSQL - Guide Complet

## Architecture Déployée

L'application est composée de deux conteneurs Docker connectés via un réseau Docker personnalisé :

```
┌─────────────────────────────────────────────────────────────┐
│                      Réseau Docker                          │
│                      (app-network)                          │
│                                                             │
│  ┌─────────────────────┐         ┌──────────────────────┐ │
│  │   Backend API       │         │   PostgreSQL DB      │ │
│  │   (backend-api)     │────────▶│   (postgres-db)      │ │
│  │   Port: 8080        │         │   Port: 5432         │ │
│  │   Java 21 + Spring  │         │   PostgreSQL 17.2    │ │
│  └─────────────────────┘         └──────────────────────┘ │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
    localhost:8080
    (Accessible depuis votre machine)
```

## Configuration Réalisée

### 1. Configuration de la Base de Données

**Fichier**: `TP1/Database/Dockerfile`
- Image: `postgres:17.2-alpine`
- Credentials:
  - Database: `db`
  - Username: `usr`
  - Password: `pwd`
- Scripts d'initialisation:
  - `CreateScheme.sql` - Crée les tables
  - `InsertData.sql` - Insère les données de test

### 2. Configuration de l'API Backend

**Fichier**: `TP1/BackendAPI/simple-api-student-main/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres-db:5432/db
    username: usr
    password: pwd
    driver-class-name: org.postgresql.Driver
```

**Note importante**: Le hostname `postgres-db` correspond au nom du conteneur PostgreSQL dans le réseau Docker. Les conteneurs peuvent se découvrir mutuellement par leur nom dans un réseau Docker personnalisé.

### 3. Dockerfile Multi-étapes

**Fichier**: `TP1/BackendAPI/simple-api-student-main/Dockerfile`

Le Dockerfile utilise une approche multi-étapes :
- **Stage 1 (Build)**: Compile l'application avec Maven et JDK 21
- **Stage 2 (Run)**: Exécute l'application avec JRE 21 (image plus légère)

## Commandes de Déploiement

### Déploiement Complet

```powershell
# 1. Créer le réseau Docker
docker network create app-network

# 2. Construire et démarrer PostgreSQL
cd C:\Users\cleme\Documents\Efrei\S7\Docker\TD_Docker_S7\TP1\Database
docker build -t postgres-db .
docker run -d --name postgres-db --network app-network -p 5432:5432 postgres-db

# 3. Construire et démarrer l'API Backend
cd ../BackendAPI/simple-api-student-main
docker build -t backend-api .
docker run -d --name backend-api --network app-network -p 8080:8080 backend-api

# 4. Vérifier les logs
docker logs backend-api
docker logs postgres-db
```

### Commandes de Gestion

```powershell
# Voir les conteneurs en cours d'exécution
docker ps

# Arrêter les conteneurs
docker stop backend-api postgres-db

# Redémarrer les conteneurs
docker start postgres-db
docker start backend-api

# Supprimer les conteneurs
docker rm backend-api postgres-db

# Supprimer les images
docker rmi backend-api postgres-db

# Supprimer le réseau
docker network rm app-network
```

## Endpoints de l'API

### Départements

#### Lister tous les départements
```
GET http://localhost:8080/departments
```
**Réponse**:
```json
[
  {"id":1,"name":"IRC"},
  {"id":2,"name":"ETI"},
  {"id":3,"name":"CGP"}
]
```

#### Récupérer un département par nom
```
GET http://localhost:8080/departments/{departmentName}
```

#### Récupérer les étudiants d'un département
```
GET http://localhost:8080/departments/{departmentName}/students
```
**Exemple**: `GET http://localhost:8080/departments/IRC/students`

**Réponse**:
```json
[
  {
    "id": 1,
    "firstname": "Eli",
    "lastname": "Copter",
    "department": {
      "id": 1,
      "name": "IRC"
    }
  }
]
```

### Étudiants

#### Lister tous les étudiants
```
GET http://localhost:8080/students
```

#### Récupérer un étudiant par ID
```
GET http://localhost:8080/students/{id}
```

#### Ajouter un nouvel étudiant
```
POST http://localhost:8080/students
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "department": {
    "id": 1
  }
}
```

## Tests avec PowerShell

```powershell
# Test simple
curl http://localhost:8080/departments

# Test avec formatage JSON (nécessite jq ou ConvertFrom-Json)
(curl http://localhost:8080/students).Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Tester tous les départements
curl http://localhost:8080/departments/IRC/students
curl http://localhost:8080/departments/ETI/students
curl http://localhost:8080/departments/CGP/students
```

## Avantages de l'Architecture avec Réseau Docker

### ✅ Avantages par rapport à `--link` (deprecated)

1. **Résolution DNS automatique**: Les conteneurs peuvent se découvrir par leur nom
2. **Isolation réseau**: Les conteneurs ne sont accessibles que sur le réseau spécifié
3. **Évolutivité**: Facile d'ajouter d'autres conteneurs au réseau
4. **Sécurité**: Meilleure isolation entre les environnements
5. **Modernité**: `--link` est déprécié depuis Docker 1.9

### Communication entre conteneurs

```
backend-api → postgres-db:5432
```

Le backend utilise le hostname `postgres-db` qui est automatiquement résolu par le DNS interne de Docker vers l'adresse IP du conteneur PostgreSQL.

## Troubleshooting

### L'API ne peut pas se connecter à la base de données

```powershell
# Vérifier que les deux conteneurs sont sur le même réseau
docker network inspect app-network

# Vérifier les logs de la base de données
docker logs postgres-db

# Vérifier que la base de données est prête
docker exec -it postgres-db psql -U usr -d db -c "SELECT 1;"
```

### Reconstruire l'application après modifications

```powershell
# Arrêter et supprimer le conteneur backend
docker stop backend-api
docker rm backend-api

# Reconstruire et redémarrer
docker build -t backend-api .
docker run -d --name backend-api --network app-network -p 8080:8080 backend-api
```

## Prochaines Étapes Possibles

1. **Ajouter un serveur HTTP (Nginx)** pour servir un frontend
2. **Utiliser Docker Compose** pour orchestrer tous les conteneurs
3. **Ajouter des volumes persistants** pour la base de données
4. **Implémenter des tests d'intégration** avec Testcontainers
5. **Configurer des variables d'environnement** pour les credentials

## Ressources

- Documentation Spring Boot: https://spring.io/projects/spring-boot
- Documentation Docker Networks: https://docs.docker.com/network/
- PostgreSQL Alpine: https://hub.docker.com/_/postgres
- Eclipse Temurin: https://hub.docker.com/_/eclipse-temurin
