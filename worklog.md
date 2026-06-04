---
Task ID: 1
Agent: Main Agent
Task: Deploy AeroMaint to Oracle Cloud

Work Log:
- Reviewed current project state (Next.js + Prisma + SQLite with API routes)
- Installed dependencies, generated Prisma client
- Built the app successfully with `npm run build`
- Tested standalone server - API responds correctly with data (2 aircraft, 1 work order, 27 rules)
- Created Dockerfile with auto DB initialization via docker-entrypoint.sh
- Updated docker-compose.yml with healthcheck
- Created deploy-oracle.sh (Docker-based deployment)
- Created deploy-direct.sh (systemd-based deployment without Docker)
- Pushed all changes to GitHub repo: agarciavegas/aeromaint

Stage Summary:
- App builds and runs correctly in standalone mode
- Two deployment options provided: Docker and direct (systemd)
- All deployment scripts pushed to GitHub main branch
- User needs to SSH into their Oracle Cloud server and run one of the deployment scripts
