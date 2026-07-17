pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // Automatically pulls the latest code from Gitea into the Jenkins workspace
                checkout scm
            }
        }
        
        stage('Build & Deploy') {
            steps {
                script {
                    echo "Syncing code and deploying via Docker Compose..."
                    
                    // We copy the checked-out code from the Jenkins workspace into the mapped host directory
                    // so that docker-compose volume mounts remain stable and point to the host's actual folders.
                    sh '''
                    # Copy everything except .git from Jenkins workspace to the host mount
                    tar --exclude=.git -cf - . | (cd /home/autocookie/pomaieco && tar -xf -)
                    
                    cd /home/autocookie/pomaieco
                    
                    echo "Building and Deploying Infrastructure..."
                    docker compose -f docker-compose.infra.yml up -d
                    
                    echo "Building new Application Docker images..."
                    cd the_pomegranate
                    docker compose build
                    
                    echo "Deploying Application containers..."
                    docker compose up -d
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo "CI/CD Pipeline finished."
            script {
                sh '''
                echo "Running automated Docker garbage collection to save disk space..."
                # Removes old dangling images that are no longer used by any container
                docker image prune -f
                # Clears out old build cache layers from previous builds
                docker builder prune -f
                '''
            }
        }
        success {
            echo "Deployment successful!"
        }
        failure {
            echo "Deployment failed! Check the logs."
        }
    }
}
