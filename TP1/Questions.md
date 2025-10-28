# TP Docker - Questions & Réponses

## 1. Docker Basics

### 1-1 Pourquoi utiliser `-e` pour les variables d'environnement plutôt que les définir dans le Dockerfile ?

**Raisons principales :**
- **Flexibilité** : Permet de modifier les variables sans reconstruire l'image
- **Sécurité** : Évite d'exposer des informations sensibles (mots de passe, clés API) dans le code source versionné
- **Multi-environnement** : Une seule image peut être utilisée pour différents environnements (dev, staging, prod) avec des configurations distinctes
- **Bonnes pratiques** : Séparation entre le code (immuable) et la configuration (variable)

### 1-2 Pourquoi attacher un volume au conteneur Postgres ?

**Objectif : Persistance des données**

Sans volume, toutes les données stockées dans le conteneur sont perdues lors de son arrêt ou suppression. Le volume permet de stocker les données en dehors du cycle de vie du conteneur, garantissant leur conservation même après recréation du conteneur. Essentiel pour une base de données en production.


### 1-3 Documentation du conteneur de base de données

**Dockerfile :**
```dockerfile
FROM postgres:17.2-alpine
ENV POSTGRES_DB=db \
   POSTGRES_USER=usr \
   POSTGRES_PASSWORD=pwd
COPY CreateScheme.sql /docker-entrypoint-initdb.d/01-create-scheme.sql
COPY InsertData.sql /docker-entrypoint-initdb.d/02-insert-data.sql
```

**Commandes :**
```bash
# Construction de l'image
docker build -t mon-postgres -f TP1/Database/Dockerfile .

# Exécution du conteneur
docker run -d --name postgres-db --network app-network -p 5432:5432 mon-postgres
```


### 1-4 Intérêt du multistage build et explication des étapes

**Avantages du multistage build :**
- **Taille réduite** : Image finale ne contient que le runtime, pas les outils de build
- **Sécurité** : Absence d'outils de compilation potentiellement vulnérables en production
- **Performance** : Moins de couches, démarrage plus rapide

**Étape 1 : Build**
```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS myapp-build
ENV MYAPP_HOME=/opt/myapp
WORKDIR $MYAPP_HOME
RUN apk add --no-cache maven
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests
```
- Image JDK complète pour la compilation
- Installation de Maven
- Construction du JAR applicatif

**Étape 2 : Runtime**
```dockerfile
FROM eclipse-temurin:21-jre-alpine
ENV MYAPP_HOME=/opt/myapp
WORKDIR $MYAPP_HOME
COPY --from=myapp-build $MYAPP_HOME/target/*.jar $MYAPP_HOME/myapp.jar
ENTRYPOINT ["java", "-jar", "myapp.jar"]
```
- Image JRE légère (pas de compilateur)
- Copie uniquement du JAR depuis le stage précédent
- Point d'entrée pour l'exécution


### 1-5 Rôle du reverse proxy

**Fonctions principales :**
- **Load balancing** : Distribution du trafic entre plusieurs serveurs backend
- **SSL/TLS termination** : Gestion centralisée du chiffrement HTTPS
- **Caching** : Mise en cache des réponses pour réduire la charge backend
- **Sécurité** : Masquage des serveurs internes et protection contre les attaques
- **Compression** : Réduction de la bande passante utilisée
- **Point d'entrée unique** : Simplification de l'architecture réseau

### 1-6 Importance de docker-compose

Docker-compose simplifie la gestion d'applications multi-conteneurs en permettant de définir l'ensemble des services, réseaux et volumes dans un unique fichier YAML. Facilite le déploiement, la reproductibilité et la coordination entre services.


### 1-7 Commandes docker-compose essentielles

| Commande | Description |
|----------|-------------|
| `docker-compose up -d` | Démarre les conteneurs en mode détaché |
| `docker-compose down` | Arrête et supprime les conteneurs, réseaux et volumes |
| `docker-compose logs -f [service]` | Affiche les logs en temps réel d'un service |
| `docker-compose build [service]` | Reconstruit les images des services |
| `docker-compose ps` | Liste l'état des conteneurs définis |
| `docker-compose exec [service] [cmd]` | Exécute une commande dans un conteneur en cours |
| `docker-compose restart [service]` | Redémarre un ou plusieurs services |


### 1-8 Documentation du fichier docker-compose

**Éléments clés de la configuration :**

**1. Dépendances entre services (`depends_on`)**
- Ordre de démarrage : database → backend → httpd
- `condition: service_healthy` garantit que le service dépendant ne démarre qu'après validation du healthcheck

**2. Health checks**
- **database** : `pg_isready` vérifie la disponibilité de PostgreSQL
- **backend** : `wget` teste l'endpoint API
- Paramètres : `interval`, `timeout`, `retries`, `start_period`

**3. Réseaux**
- Réseau bridge `app-network` pour la communication inter-conteneurs
- Résolution DNS automatique par nom de service

**4. Volumes**
- `db-data` assure la persistance des données PostgreSQL
- Survit aux redémarrages et suppressions de conteneurs

**5. Variables d'environnement**
- Chargées depuis fichier `.env`
- Séparation des informations sensibles du code versionné

**6. Contexte de build**
- Chaque service pointe vers son répertoire Dockerfile
- Build automatique si image absente

**7. Politique de redémarrage**
- `restart: unless-stopped` pour la résilience en production
- Redémarrage automatique sauf arrêt manuel

**8. Exposition des ports**
- Seul httpd expose le port 80 vers l'hôte
- Database et backend accessibles uniquement via le réseau interne (principe de moindre exposition)




### 1-10 Intérêt d'un registre d'images en ligne

**Avantages :**
- **Distribution** : Partage facilité entre environnements et équipes
- **CI/CD** : Intégration dans les pipelines automatisés
- **Versioning** : Gestion des versions et tags d'images
- **Disponibilité** : Accès centralisé depuis n'importe quel environnement
- **Collaboration** : Facilite le travail en équipe

---

## 2. CI/CD & GitHub Actions

### 2-1 Qu'est-ce que Testcontainers ?

Testcontainers est une bibliothèque Java permettant d'instancier des conteneurs Docker éphémères (bases de données, navigateurs Selenium, etc.) pour les tests d'intégration. Permet de tester avec de vrais services dans des environnements isolés et reproductibles.

### 2-2 Utilité des variables sécurisées

Les variables sécurisées protègent les informations sensibles (mots de passe, clés API, tokens) contre leur exposition dans le code source, les logs ou l'historique Git. Essentielles pour la sécurité en CI/CD.


### 2-3 Rôle de `needs: build-and-test-backend`

La directive `needs` établit une dépendance entre jobs : le job courant ne s'exécute que si `build-and-test-backend` réussit. Garantit l'intégrité du pipeline en évitant de déployer du code non testé ou ne compilant pas.

### 2-4 Pourquoi push les images Docker ?

Le push d'images vers un registre permet :
- **Distribution** : Déploiement sur différents environnements
- **CI/CD** : Intégration dans les pipelines automatisés
- **Versioning** : Traçabilité des versions déployées
- **Centralisation** : Point unique de stockage et récupération
- **Collaboration** : Partage entre équipes



---

## 3. Ansible

### 3-1 Inventaire et commandes de base

**Commandes essentielles :**

```bash
# Test de connectivité
ansible all -i inventories/setup.yml -m ping

# Récupération d'informations système
ansible all -i inventories/setup.yml -m setup -a "filter=ansible_distribution*"

# Installation/suppression de paquets (avec privilèges)
ansible all -m apt -a "name=apache2 state=absent" --become
```

**Structure de l'inventaire :**
```yaml
all:
  vars:
    ansible_user: admin
    ansible_ssh_private_key_file: ~/.ssh/id_rsa
    ansible_python_interpreter: /opt/docker_venv/bin/python
  children:
    prod:
      hosts:
        clement.laatar.takima.cloud:
```


### 3-2 Documentation du playbook

**Structure :**
```yaml
---
- hosts: all
  gather_facts: true
  become: true
  roles:
    - docker
    - network
    - database
    - app
    - proxy
```

**Exécution séquentielle des rôles :**
1. **docker** : Installation Docker Engine et Python SDK
2. **network** : Création des réseaux backend et frontend
3. **database** : Déploiement PostgreSQL sur backend-network
4. **app** : Déploiement API Spring Boot (pont entre les deux réseaux)
5. **proxy** : Déploiement Apache HTTP sur frontend-network

Variables sensibles externalisées dans `group_vars/all.yml`.


### 3-3 Configuration docker_container

**Database (PostgreSQL) :**
- Healthcheck via `pg_isready` avant démarrage des services dépendants
- Connecté uniquement à `backend-network` (isolation)
- Variables : `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

**Backend API (Spring Boot) :**
- Connecté aux deux réseaux (rôle de pont)
- `SPRING_DATASOURCE_URL` utilise la résolution DNS Docker (`postgres-db:5432`)
- Dépend du healthcheck de la database

**Proxy (Apache HTTP) :**
- Expose le port 80 vers l'hôte
- Connecté uniquement à `frontend-network`
- `restart_policy: always` pour haute disponibilité
- Configuration ProxyPass vers le backend

**Segmentation réseau :**
- `backend-network` : Communication DB ↔ API uniquement
- `frontend-network` : Communication API ↔ Proxy uniquement
- Le proxy ne peut pas accéder directement à la base de données


### 3-4 Sécurité du déploiement automatique

**Risques du déploiement automatique :**
- Absence de validation humaine avant production
- Déploiement immédiat de vulnérabilités potentielles
- Pas de test en environnement de staging
- Changements cassants non détectés
- Compromission de dépendances déployée automatiquement

**Mesures de sécurisation recommandées :**

1. **Environnement de staging** : Déploiement intermédiaire avant production
2. **Approval gate manuel** : Validation humaine requise via GitHub Environments
3. **Scan de vulnérabilités** : Intégration de Trivy ou Snyk dans le pipeline
4. **Versioning des images** : Tags avec SHA ou numéro de version plutôt que `latest`
5. **Registre privé** : Utilisation de registres privés pour images sensibles
6. **Health checks post-déploiement** : Validation automatique du déploiement
7. **Rollback automatique** : Retour arrière en cas d'échec des health checks
8. **Blue-Green deployment** : Bascule progressive du trafic
9. **Fenêtre de déploiement** : Limitation aux heures ouvrées pour monitoring
10. **Audit et logs** : Traçabilité complète des déploiements


