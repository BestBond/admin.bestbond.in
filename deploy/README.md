# Deploying `admin.bestbond.in` (GitHub: **`reward_system_admin`** — local folder in this monorepo is often `reward-system-frontend`)

**On-server layout:** static site lives at **`/var/www/admin.bestbond.in`** (directory name = hostname).

## One-time VPS setup

1. **DNS** — A record for `admin.bestbond.in` → server IP.

2. **Web root** (static files only; no Node process required):

   ```bash
   mkdir -p /var/www/admin.bestbond.in
   chown -R www-data:www-data /var/www/admin.bestbond.in
   ```

3. **Nginx** — Copy `deploy/nginx-admin.bestbond.in.conf.sample` to `/etc/nginx/sites-available/admin.bestbond.in`, enable the site, `nginx -t`, reload. Then `certbot --nginx -d admin.bestbond.in`.

4. **First deploy** — Either push to `main` after Actions are configured, or build locally and `rsync -avz dist/ root@SERVER:/var/www/admin.bestbond.in/`.

## Continuous deployment (GitHub Actions)

Workflow: `.github/workflows/deploy-admin.yml` — keep this file in your GitHub repo **`reward_system_admin`**.

Build runs on GitHub (so `VITE_API_URL` is not stored on the VPS). Static files are rsynced to the server.

**Repository secrets**

| Secret          | Purpose                                      |
| --------------- | -------------------------------------------- |
| `VPS_HOST`      | Server hostname or IP                        |
| `VPS_SSH_KEY`   | Private key with write access to the web root |
| `VITE_API_URL`  | e.g. `https://api.bestbond.in` (no trailing slash) |

**Remote directory** — Default **`/var/www/admin.bestbond.in/`**. Override with repository variable **`VPS_ADMIN_RSYNC_PATH`** (must end with `/` for rsync of `dist/` contents).

## Coexisting with `bestbond.in`

This uses separate `server_name` values. Add new `sites-available` files; do not remove the existing `bestbond.in` site unless you intend to replace it.
