# Pomai-Ecosystem - A Microservices Architecture Case Study with AI RAG Integration.
Pomai Ecosystem its very first start is not the microservices or AI Agent integration, it started as a simple monorepo with a frontend and multi-modules monolith architecture. Services works as inter-module service calling via direct import or via Rest API using only one database is Firebase Firestore.

Pomai began as a monolithic application, characterized by a unified codebase and database. This centralized structure enabled straightforward module integration and immediate data accessibility. However, as the ecosystem expanded, the monolithic architecture presented scalability challenges, particularly in managing concurrent user requests and maintaining code modularity. This limitation prompted a strategic architectural evolution toward a microservices-based design, aimed at enhancing system flexibility, scalability, and maintainability.

<b>You can have a first look at Pomaie ecoystem system design here</b>

![System Design Architecture](./images/structure.png)

# The Pre-Microservices Era: Taming the Multi-Module Monorepo
Before the massive shift to Microservices, Pomai Ecosystem operated as a multi-module monolith. As the system expanded, one of the earliest and most complex architectural challenges was managing different types of "Workspaces" across various isolated modules.

The Problem: Different modules required completely different workspace configurations, business logic, and behaviors. However, they all still needed to share a fundamental set of core functionalities. Hardcoding these dependencies or using massive if/else conditions across the monorepo would have quickly turned the codebase into an unmaintainable spaghetti mess.

The Solution: The Workspace Factory Pattern
To resolve this tight-coupling issue, I implemented a robust Factory Design Pattern at the system design level:

1. The Base Contract: I defined a core BaseWorkspace (interface/abstract layer) that encapsulated the universal logic and strict contracts that every single workspace in the ecosystem must adhere to.
2. The Implementations: I engineered specific workspace classes extending the base, injecting their own custom behaviors and module-specific logic.
3. The Factory Provider: I built a central WorkspaceFactory that dynamically evaluated the runtime context and provided the exact workspace instance required by the requesting module.

You can check how I implement this in [here](./backend/services/task_service/)

```classDiagram
    class BaseTaskStrategy {
        <<abstract>>
        +db
        +getTaskQuotas()
        +validateTaskCreation()
    }
    class SmallBusinessStrategy {
        +getTaskQuotas()
        +validateTaskCreation()
    }
    class EnterpriseStrategy {
        +getTaskQuotas()
        +validateTaskCreation()
    }
    class WorkspaceFactory {
        +getStrategy(type, db)
    }

    BaseTaskStrategy <|-- SmallBusinessStrategy
    BaseTaskStrategy <|-- EnterpriseStrategy
    WorkspaceFactory ..> BaseTaskStrategy : creates
```

This architectural decision kept the monorepo DRY (Don't Repeat Yourself), highly decoupled, and allowed me to scale the types of workspaces effortlessly without mutating the core system logic.

# Why the shift to Microservices? (The "Exploding Credit Card" Catalyst)
Pomai Ecosystem initially started as a monolith relying entirely on Firebase Firestore. This allowed for rapid prototyping and immediate data accessibility. However, as the ecosystem grew in both user interactions and data complexity, I hit a massive wall: Scalability vs. Cost.

The monolithic structure combined with Firestore's document-read/write pricing model became a severe bottleneck. As daily reads/writes skyrocketed, maintaining complex data schemas became a nightmare, and quite frankly, my credit card exploded from the cloud billing.

To ensure the long-term survival and maintainability of the product, I made the strategic decision to migrate away from a managed NoSQL cloud database to a self-hosted, Microservices-driven architecture using PostgreSQL. This transition not only solved the immediate financial hemorrhage but also provided the strict data integrity and modularity required for the upcoming AI integrations.

## Challenge 1: Migrating from NoSQL (Firestore) to Relational Data (PostgreSQL)
Refactoring the entire data layer from Firestore to PostgreSQL was, without a doubt, the most grueling phase of this architectural evolution.

The Migration Nightmare
The primary challenge lay in Firestore's document-based nature. I had relied heavily on firebase-admin and firebase-functions throughout the codebase. Because my business logic was deeply intertwined with Firestore’s unstructured data model and its specific SDK methods (e.g., .where(), .doc().get(), batch()), moving to a relational database meant:

- **Flattening Nested Data**: Deconstructing deeply nested document structures into normalized, relational tables.

- **Rewriting Data Access**: Replacing every Firestore-specific query with SQL-based logic.

- **Maintaining Consistency**: Ensuring that complex atomic transactions (previously handled by Firestore batches) were correctly mapped to PostgreSQL transactions.

Writing raw SQL for every single operation was not only error-prone but also an immense drain on productivity. I needed a way to bridge the gap: I required the type-safety of a relational database, the convenience of an ORM, and a developer experience that wouldn't slow down the development velocity I had grown accustomed to with Firebase.

Enter Prisma: The Bridge
To overcome the raw SQL bottleneck, I chose Prisma. It became the game-changer for several reasons:

- **Type-Safe Queries**: Prisma’s generated client provided auto-completion and full type safety, which significantly reduced runtime errors that often plague raw SQL implementations.

- **Declarative Schema Modeling**: Defining the relational schema in schema.prisma was intuitive and allowed me to visualize the new PostgreSQL structure far better than standard SQL DDL scripts.

- **Rapid Development Velocity**: Prisma allowed me to perform complex joins and relational queries with a clean, object-oriented syntax. It mimicked the ease of the Firestore SDK while providing the robust power of a relational database.

Abstraction without Compromise: While Prisma handled the heavy lifting of query generation, it didn't hide the underlying database. It allowed me to focus on building features rather than wrestling with SQL syntax, effectively "unlocking" the migration without sacrificing the speed of my development lifecycle.

## Challenge 2: Refining the Microservices: From Fragmentation to Strategic Consolidation
While splitting the monolith into microservices was the initial path to scalability, I quickly realized that "hyper-segmentation" brought its own set of problems, specifically excessive network overhead and increased operational complexity. To build a more resilient system, I executed a Strategic Consolidation phase to balance granularity with performance.

### The Strategic Merge
I moved away from overly granular services, opting instead to group highly coupled domain logic into cohesive modules. This approach reduced inter-service communication latency and simplified cross-domain transactions:

Task & Goal Fusion: By merging the Task and Goal services, I eliminated the need for complex cross-service locking when syncing task progress against high-level goals.

Workspace & Team Unification: Treating Teams as an intrinsic part of the Workspace domain allowed for more efficient permission management and hierarchy traversal.

HR & Payroll Integration: Consolidating HR and Payroll was a clear business decision to maintain data integrity, as these two domains have a synchronous dependency on each other for salary calculation and compliance.

### Why This Matters (The "Macro-services" Benefit)
This transition toward a "Macro-services" architecture provided significant advantages:

Reduced Latency: By keeping related domains within the same runtime, I removed the network hops between them, resulting in significantly faster response times for critical business operations.

Simplified Deployment: Managing fewer, more functional deployment units reduced the complexity of my CI/CD pipeline (Jenkins) and container orchestration.

Balanced Autonomy: I kept the "truly independent" domains Auth, Activity Log, Chat, and Agent Notification as standalone services. These domains require different scaling profiles and have minimal business coupling with the core project management engine, making them perfect candidates for true microservices autonomy.

## Challenge 3: Ensuring Data Integrity in a Distributed Ecosystem
Even with a consolidated "Macro-services" architecture, distributed state management remains a formidable challenge. Ensuring that data remains accurate and consistent across service boundaries when network partitions or partial failures occur was a critical hurdle.

### The Integrity Strategy
To maintain the "Single Source of Truth" without reverting to the monolithic nightmare, I implemented a multi-layered integrity strategy:

Transactional Outbox Pattern: To avoid the "dual-write" problem (where the database updates successfully but the Kafka event fails to send), I utilized the Transactional Outbox Pattern. The service writes the event to a local outbox table within the same PostgreSQL transaction as the main business logic. A separate relay process then polls this table and pushes the event to Kafka, guaranteeing At-Least-Once delivery.

Idempotency as a First-Class Citizen: In a distributed system, Kafka retries are inevitable. To handle this, every Consumer Service is designed to be idempotent. By using a unique event_id or idempotency_key stored in the target database, I ensure that processing the same event multiple times yields the same result, preventing duplicate entries or corrupted states.

Semantic Versioning for Events: I adopted a strict schema registry strategy for events. By versioning the event payloads (e.g., TaskUpdated_v1, TaskUpdated_v2), I ensure that downstream consumers can gracefully handle evolution without breaking the integrity of the data processing pipeline.

### The Outcome: Reliable Asynchrony
By enforcing these patterns, I transformed the system from a fragile web of synchronous calls into a robust, self-healing ecosystem. The Transactional Outbox ensures that my RAG Engine, Activity Log, and Notification Service never miss a state change, even during high-traffic spikes or transient network outages. This approach allowed me to achieve a level of Operational Reliability usually reserved for much larger-scale production systems.

## Challenge 4: Eliminating the "Port-Hell" with a Custom Gateway
As the number of services grew, I quickly encountered the "Port-Hell" problem. Managing individual ports for every service (e.g., 8081 for Auth, 8082 for Chat, 8083 for Product) was impossible to remember and a nightmare for security/frontend integration.

The Solution: The Lightweight Custom Gateway
Instead of relying on a complex, heavy-duty API Gateway at the start, I engineered a lightweight Custom Routing Gateway that acted as the single entry point for all internal services.

Unified Entry Point: All client requests hit the Gateway on a single port (80 or 443). The Gateway then intelligently routes traffic to the internal service based on the URL path (e.g., /api/auth/* -> AuthService, /api/tasks/* -> ProductService).

Centralized Security Layer: By centralizing the entry point, I moved common cross-cutting concerns (such as JWT validation and Rate Limiting) into the Gateway. This kept the individual services focused strictly on their business logic, adhering to the "Separation of Concerns" principle.

Service Discovery Simulation: The Gateway maintains a lightweight mapping configuration that allows me to add, remove, or re-route services on the fly without updating the frontend codebase.

Code Snippet: The Intelligent Router
I implemented this as a clean middleware layer within the Gateway:

```javascript
// A simplified view of the Custom Gateway routing logic
const routes = {
    '/auth': 'http://auth-service:8080',
    '/tasks': 'http://product-service:8081',
    '/chat': 'http://chat-service:8082'
};

const gateway = async (req, res) => {
    const serviceKey = Object.keys(routes).find(key => req.url.startsWith(key));
    
    if (serviceKey) {
        // Transparent Proxying to the target service
        return proxyRequest(req, res, routes[serviceKey]);
    }
    
    return res.status(404).send('Service not found');
};
```

#### Why This Matters (The "Gateway" Efficiency)
This "Gateway-first" approach was critical for maintaining a low-complexity architecture. It provided the full feature set of a traditional API Gateway (Routing, Security, Abstraction) without the operational overhead of a full Kubernetes Ingress or a heavy framework like Kong or Tyk. It allowed the frontend to interact with a single, stable API surface, shielding it from the dynamic nature of the evolving microservices landscape.

## Challenge 5: Transitioning to Kong Gateway for Enterprise-Grade Readiness
In the early stages, I built a lightweight custom gateway to route internal services. It worked well for a handful of services, but as the Pomai Ecosystem evolved, I hit a "Feature Wall." I found myself reinventing the wheel spending more time writing boilerplate code for security, rate limiting, and request retries than building product features.

Why Kong Gateway? (The Move to Production-Ready Infrastructure)
I decided to migrate to Kong Gateway (built on Nginx and OpenResty) because it shifts the burden of infrastructure management from custom code to a battle-tested, high-performance platform:

Centralized Traffic Management: Kong acts as the "Traffic Cop." It handles SSL termination, dynamic routing, and load balancing natively. This removes the overhead from my custom Gateway code, allowing me to focus exclusively on business domain logic.

Declarative Security (The "Plug-and-Play" Advantage): Instead of writing custom JWT validation logic, I leverage Kong's JWT and OAuth2 plugins. This ensures that my backend services are protected by industry-standard security protocols without a single line of security code inside the microservices.

Rate Limiting & Throttling: To protect my RAG Engine and PostgreSQL databases from "noisy neighbor" requests or potential DoS attacks, I use Kong’s Rate Limiting plugin. It provides granular control over request quotas per client/user, which is a requirement for any enterprise-grade application.

Observability & Analytics: Kong integrates seamlessly with Prometheus and Grafana. I can now monitor traffic patterns, latencies, and error rates across all services from a single dashboard, which was impossible to achieve consistently with my custom Gateway.

Extensibility: As my system grows, I can leverage Kong’s plugin ecosystem (e.g., Request Transformer, CORS, OIDC) to add new capabilities instantly, keeping my architecture lean and future-proof.

The "Architectural Trade-off"
Transitioning to Kong was not just a technical choice; it was a business decision. By offloading cross-cutting concerns to a dedicated API Gateway, I reduced my custom codebase, improved system reliability, and gained the ability to scale seamlessly. Kong is not just a tool; it is the infrastructure layer that allows Pomai to behave like an enterprise-level system.

## Challenge 6: Achieving High Availability (HA) with Nginx + Kong Cluster
Having a single API Gateway is a classic Single Point of Failure (SPOF). If that single Gateway instance goes down, your entire backend becomes unreachable, even if your microservices are healthy. To ensure 99.99% uptime, I architected a redundant gateway layer.

The "SPOF" Problem
Initially, I faced a dilemma: If I deploy two Kong Gateway instances to ensure redundancy, how does the Frontend (FE) client know which one to talk to? If I force the FE to request only one, I am still exposing myself to a single point of failure. If I use both, I need a mechanism to distribute traffic efficiently and health-check the gateways.

The Solution: Nginx Load Balancer (Round-Robin)
I introduced Nginx as the "Public Entry Point" acting as a Layer 7 Load Balancer.

The Round-Robin Strategy: Nginx sits in front of the Kong cluster. It receives all incoming requests from the client and distributes them to the available Kong instances using the round-robin algorithm. This ensures no single Kong node is overwhelmed and maximizes resource utilization.

Health Checks & Auto-Failover: Nginx continuously monitors the status of the Kong nodes. If Kong-Instance-1 crashes or stops responding to heartbeat signals, Nginx automatically detects the failure and stops routing traffic to it, instantly redirecting 100% of the traffic to Kong-Instance-2.

Seamless Scalability: Because the FE only knows the address of the Nginx Load Balancer, I can scale the Kong cluster horizontally (add a 3rd or 4th instance) without ever touching the Frontend code.

Why this is "Production-Grade" Architecture
Frontend Decoupling: The Frontend remains simple. It only needs to know one domain/IP (the Nginx entry point), completely unaware of the complex, redundant infrastructure sitting behind it.

Zero-Downtime Maintenance: I can now take down one Kong node for updates, security patching, or configuration changes, and the system stays fully operational because the second node (backed by Nginx) picks up the slack.

Resilience: This architecture protects against both hardware failures and software crashes at the gateway layer, providing the stability required for enterprise users.

## The DevOps

### Challenge 1 - Mastering Containerization & Orchestration
In the early days of Pomai Ecosystem, I manually managed deployment processes, which led to the dreaded "it works on my machine" syndrome and hours spent debugging environment-specific configuration issues. To transition into a robust system, I embraced the Docker-first strategy.

Why Containerization? (Solving Environment Parity)
The first challenge was ensuring that the ecosystem runs identically in development, staging, and production.

Environment Parity: By containerizing every service (Product, Auth, Chat, etc.), I eliminated dependency conflicts. Each container carries its own runtime, libraries, and configurations, ensuring that what I develop in my local environment is exactly what gets deployed to the cloud server.

Resource Isolation: Docker allows me to strictly define CPU and memory limits for each service. This prevents a "noisy neighbor" (like a heavy AI search process) from starving the core business logic of resources, improving overall system stability.

The Portainer Strategy: Why Portainer?
While Docker is powerful, managing dozens of containers via CLI (Command Line Interface) is error-prone and lacks visibility. I adopted Portainer as my orchestration dashboard because:

Visual Management: Portainer provides a GUI to view the real-time status of all containers, networks, and volumes. I can instantly see if a container is failing, check its logs, or view resource consumption without needing to jump into the terminal.

Simplified Orchestration: It abstracts the complexity of docker-compose lifecycle management. I can redeploy stacks, update image versions, and manage environment variables with just a few clicks.

Security & Governance: Portainer allows me to manage user access to the container host. I can provide restricted access to specific team members or services, ensuring that even in a personal project, I am practicing "least privilege" access control.

Architectural Impact
By combining Docker and Portainer, I transformed my deployment process from a manual, fragile routine into a "Single-Click" operation. I no longer spend time configuring servers; I spend time pushing code and using Portainer to verify the deployment in seconds. This is the foundation upon which I built the automated CI/CD pipeline ensuring that every line of code I write is instantly validated and deployed.

### Challenge 2 - Building an On-Premise CI/CD Pipeline
While GitHub is the industry standard, I chose to build an On-Premise CI/CD infrastructure using Gitea and Jenkins. My goal was total autonomy: I wanted my source code and deployment pipelines to remain entirely within my infrastructure, ensuring data sovereignty and zero reliance on third-party cloud outages.

#### Why Gitea? (Self-Hosted Version Control)
I deployed Gitea as my local Git repository manager. It offers a GitHub-like experience but operates with a tiny memory footprint.

Full Data Sovereignty: My codebase never leaves my local server, protecting my Intellectual Property (IP) and ensuring that the entire lifecycle of the Pomai Ecosystem is under my direct control.

Low Latency & High Speed: Since Gitea runs locally, the push/pull speeds are nearly instantaneous, regardless of external internet conditions.

Ease of Integration: It provides robust Webhooks that trigger my deployment pipelines in Jenkins automatically the moment I push code.

#### Why Jenkins? (The Automation Engine)
To move from "Code Commit" to "Live Production" without manual intervention, I integrated Jenkins as the CI/CD orchestrator.

Pipeline as Code: I define my build, test, and deployment steps in a Jenkinsfile. This ensures that my deployment process is versioned alongside my source code.

Automated Quality Gate: Every push to Gitea triggers a Jenkins build. Jenkins runs tests, builds the Docker images, and deploys them to the staging or production environment. If any step fails, the deployment is aborted, and I receive an instant alert.

Environment Agnostic: Jenkins acts as the bridge between my code and the server. It handles the heavy lifting of pulling the latest code, running build scripts, and using the Docker socket to spin up new container versions seamlessly.

#### The "Self-Hosted" Pipeline Flow
The workflow is entirely automated:

Developer (Me) pushes code to the Gitea repository.

Gitea sends a webhook signal to Jenkins.

Jenkins pulls the latest code, runs build/test scripts, and compiles the Docker Image.

Jenkins instructs the local Docker Engine to replace the old container with the new version (Zero-downtime deployment).

System Live: The updated Pomai service is live in seconds, fully tested and integrated.

## The monitoring & logging stack
### From "Log Blindness" to AI-Powered RCA

![](./images/logging_sys.png)

As the Pomai Ecosystem scaled, the volume of access logs and service events from Kong Gateway became massive. Manually inspecting logs via Portainer was no longer feasible it was like trying to find a needle in a haystack of terabytes. I needed a system that could not only store these logs but also automatically diagnose issues before they impacted the user.

The "Million-Log" Problem
Log Overload: Millions of logs per day made human inspection impossible.

Delayed Diagnosis: By the time I manually identified an error in the logs, the downtime had already affected users.

The Complexity of RCA: Root Cause Analysis (RCA) in a microservices environment is notoriously difficult because one request traverses multiple services, making it hard to trace where the failure originated.

The Solution: The "CPU-Only" RAG Logging System
I engineered an autonomous AI-driven logging pipeline. Instead of just "dumping" logs, I built a real-time observability engine that turns raw data into actionable insights using RAG (Retrieval-Augmented Generation).

The Architectural Pipeline:

- High-Throughput Ingestion (Kafka): All Kong access logs and service events are streamed into Kafka, ensuring zero data loss during traffic spikes.

- Stream Processing (Flink): Apache Flink processes the stream in real-time, filtering out noise and structuring the raw text into searchable metadata.

- CPU-only Embedding (llama.cpp): Using llama.cpp, I generate vector embeddings of the logs entirely on the CPU, avoiding the need for expensive GPU hardware.

- Knowledge Storage (Mulvius & Elasticsearch):

    - Elasticsearch stores the structured metadata for fast searching.

    - Mulvius stores vector embeddings for semantic analysis.

- AI Root Cause Analysis (LLM on CPU): The LLM (hosted via llama.cpp) retrieves relevant log patterns from Qdrant/Elasticsearch to perform automated RCA.

**Goals & Impact**

- Autonomous Detection: The system detects anomalies (like a memory leak in the Pomaidraw container) in seconds, far faster than any human could spot in a dashboard.

- Semantic RCA: I can ask the system: "Why did the payment service spike in latency?" and receive a natural language explanation backed by the analyzed log patterns.

- Resource Efficiency: By architecting this to run CPU-only, I proved that enterprise-grade observability can be achieved on standard hardware without relying on costly cloud-managed logging services.

### Holistic Observability with Prometheus & Grafana

While the AI-powered RAG Logging system excels at identifying what went wrong (Root Cause Analysis), it doesn't immediately tell me how the hardware is reacting under load. Relying solely on log analysis led to "blind spots" regarding resource exhaustion, such as sudden CPU spikes or memory leaks in the Pomaidraw service.

#### The Observability GapRaw 
logs are great for event tracking, but they are inefficient for performance monitoring. I needed a way to visualize the "vital signs" of my infrastructure in real-time. Without a metrics-driven approach, I was essentially flying blind, unaware of when a service was approaching its resource limits until it actually crashed.

#### The Monitoring Stack
I implemented a robust monitoring stack to gain full visibility into the Pomai Ecosystem:
1. **cAdvisor** (The Metric Collector): I deployed cAdvisor on the host machine to monitor the resource usage of every individual Docker container. It exposes deep insights into CPU, memory, filesystem, and network usage for every single microservice.  
2. **Prometheus** (The Time-Series Database): Prometheus acts as the central engine, periodically scraping metrics from the cAdvisor endpoints and the Kong Gateway’s metrics export. Its time-series data model is perfect for analyzing trends—allowing me to see exactly when and how resource consumption fluctuates over time. 
3. **Grafana** (The Visualization Engine): I connected Grafana to Prometheus to build real-time, high-fidelity dashboards. Now, I can visualize the exact CPU/RAM usage of any service at any given second. This gives me a "helicopter view" of the entire ecosystem.  

#### Effectiveness & Impact
 - **Proactive Scaling**: By watching the trend lines in Grafana, I can predict when a service needs more resources and scale it before it hits the breaking point, rather than scrambling after a crash.
 - **Correlation Analysis**: I can now overlay log anomalies (from the RAG engine) with system metrics (from Grafana). When a spike occurs, I can instantly see if it was caused by a surge in traffic (via Kong metrics) or a resource-intensive process (via cAdvisor/Prometheus).
 - **Resource Optimization**: It helped me identify that several services were over-provisioned. By monitoring the actual usage, I was able to reclaim wasted RAM and CPU, significantly lowering the "cost per request" of the ecosystem.

