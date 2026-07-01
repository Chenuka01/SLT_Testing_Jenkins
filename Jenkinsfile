pipeline {
    agent any

    environment {
        DOCKER_COMPOSE = 'docker-compose'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Stop Existing Containers') {
            steps {
                sh 'docker-compose down || true'
            }
        }

        stage('Build & Deploy Application') {
            steps {
                sh 'docker-compose up --build -d'
            }
        }

        stage('Database Migrations') {
            steps {
                sh 'docker-compose exec -T backend python manage.py migrate'
            }
        }
    }
}
