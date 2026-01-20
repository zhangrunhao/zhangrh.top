#!/usr/bin/env bash
set -euo pipefail

host="101.200.185.29"
user="root"
repo_dir="/var/www/myapp/card-game-demo"
frontend_remote_new="/var/www/card-game-site.new"
frontend_remote_live="/var/www/card-game-site"
backend_pm2_name="card-game-backend"

echo "==> Deploying on server"
ssh "${user}@${host}" "set -e;
  cd ${repo_dir};
  git pull;
  pnpm -C frontend install;
  pnpm -C frontend build;
  rm -rf ${frontend_remote_new};
  mkdir -p ${frontend_remote_new};
  cp -r frontend/dist/. ${frontend_remote_new}/;
  mv ${frontend_remote_live} ${frontend_remote_live}.bak.\$(date +%F_%H%M%S) 2>/dev/null || true;
  mv ${frontend_remote_new} ${frontend_remote_live};
  nginx -t;
  systemctl reload nginx;
  cd ${repo_dir}/backend;
  npm ci --omit=dev;
  pm2 restart ${backend_pm2_name};
  echo \"deploy done\";
"
