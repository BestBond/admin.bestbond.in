/** PM2 — SPA fallback required for React Router paths (/login, /terms-of-service, etc.) */
module.exports = {
  apps: [
    {
      name: 'bestbond-admin',
      cwd: '/var/www/admin.bestbond.in',
      script: 'npx',
      args: 'serve dist -s -l 3002',
      interpreter: 'none',
    },
  ],
};
