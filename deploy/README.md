# Deploying `admin.bestbond.in` (GitHub: **`reward_system_admin`** — local folder in this monorepo is often `reward-system-frontend`)

**On-server layout:** clone at **`/var/www/admin.bestbond.in`** (folder name = hostname). Nginx `root` is usually **`.../admin.bestbond.in/dist`** after `./deploy.sh` (see `deploy/nginx-admin.bestbond.in.conf.sample`).

**Quick deploy (on server):** from clone root **`./deploy.sh`**. Set `VITE_API_URL` in `.env.production` or export it. **`WEB_ROOT` must not be the clone directory** (same path + `rsync --delete` wipes the repo). Use `WEB_ROOT=$ROOT/public`, a sibling like `/var/www/admin-html`, or point nginx at **`.../dist`**. Optional `RUN_GIT_PULL=1`.

## One-time VPS setup

1. **DNS** — A record for `admin.bestbond.in` → server IP.

2. **Clone** — `git clone ... /var/www/admin.bestbond.in` then `cd /var/www/admin.bestbond.in && chmod +x deploy.sh && ./deploy.sh`. Nginx **`root`** = **`.../admin.bestbond.in/dist`** (do not point `WEB_ROOT` at the clone root).

3. **Nginx** — Copy `deploy/nginx-admin.bestbond.in.conf.sample` to `/etc/nginx/sites-available/admin.bestbond.in`, enable the site, `nginx -t`, reload. Then `certbot --nginx -d admin.bestbond.in`.

4. **First deploy** — `./deploy.sh` on the server, or GitHub Actions after secrets are set.

## Continuous deployment (GitHub Actions)

Workflow: `.github/workflows/deploy-admin.yml` — keep this file in your GitHub repo **`reward_system_admin`**.

Build runs on GitHub (so `VITE_API_URL` is not stored on the VPS). Static files are rsynced to the server.

**Repository secrets**

| Secret          | Purpose                                      |
| --------------- | -------------------------------------------- |
| `VPS_HOST`      | Server hostname or IP (required for SSH/rsync) |
| `VPS_SSH_KEY`   | Private SSH key PEM (full file: `BEGIN` … `END`). Not from Hostinger — generate a key pair and put the **private** file here; put the **public** line in `/root/.ssh/authorized_keys` on the VPS. See backend `deploy/README.md` → “Where does `VPS_SSH_KEY` come from?” for steps. |
| `VITE_API_URL`  | e.g. `https://api.bestbond.in` (no trailing slash) |

**Remote directory** — Default **`/var/www/admin.bestbond.in/dist/`** (nginx `root` = that path). Override with repository variable **`VPS_ADMIN_RSYNC_PATH`** (must end with `/` for rsync of `dist/` contents).

## Coexisting with `bestbond.in`

This uses separate `server_name` values. Add new `sites-available` files; do not remove the existing `bestbond.in` site unless you intend to replace it.
