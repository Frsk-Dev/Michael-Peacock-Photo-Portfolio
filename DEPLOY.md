# Deploying

```bash
npm run build:deploy
```

That produces `./deploy` — a self-contained folder (~139MB, most of it your
photographs). Upload it, run `node server.js`, done. **No `npm install` on the
server**: the dependencies are already inside, including the Linux build of
`sharp`.

```
deploy/
  server.js       the entry point
  start.sh        reads SERVER_PORT / SERVER_IP if a panel sets them
  node_modules/   only what the server actually needs
  .next/          the compiled app
  public/         the photographs
```

By default it packages `sharp` for **linux-x64 (glibc)**, which covers almost
every VPS. For an ARM server or an Alpine image:

```bash
npm run build:deploy -- --arch arm64
npm run build:deploy -- --libc musl
```

---

## Recommended: straight on the VPS

You have root, so this is the shortest path — and it gets you HTTPS on your
own domain automatically. Pterodactyl is not involved.

### 1. Point the domain at the server

At whichever registrar holds the domain, add an A record:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | your VPS IP |
| A | `www` | your VPS IP |

You do not need Cloudflare. Caddy will get the certificate directly from
Let's Encrypt. DNS usually propagates in minutes; check with
`nslookup yourdomain.com` before moving on, because Caddy cannot issue a
certificate until the domain resolves to the server.

### 2. Install what is needed

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs caddy
sudo mkdir -p /var/www/peacock
sudo chown -R $USER:$USER /var/www/peacock
sudo ufw allow 80,443/tcp
```

### 3. Upload the bundle

From your machine, in the project folder (PowerShell has `scp` built in):

```bash
npm run build:deploy
scp -r deploy/* user@YOUR_SERVER_IP:/var/www/peacock/
```

It is ~139MB, so the first upload takes a few minutes. Later deploys are
faster if you only send what changed.

### 4. Run it as a service

`/etc/systemd/system/peacock.service`:

```ini
[Unit]
Description=Michael Peacock Photography
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/peacock
ExecStart=/usr/bin/node server.js
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
Restart=always
RestartSec=5
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /var/www/peacock
sudo systemctl daemon-reload
sudo systemctl enable --now peacock
sudo systemctl status peacock      # should say active (running)
```

`HOSTNAME=127.0.0.1` binds it to localhost only, so the app is reachable
solely through Caddy — nobody can hit it on port 3000 directly.

### 5. Put Caddy in front

`/etc/caddy/Caddyfile`:

```
yourdomain.com, www.yourdomain.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}
```

```bash
sudo systemctl reload caddy
```

That is it. Caddy requests the certificate on first request and renews it
forever. `https://yourdomain.com` should now serve the site.

### Troubleshooting

```bash
sudo journalctl -u peacock -f     # app logs
sudo journalctl -u caddy -f       # certificate / proxy logs
curl -I localhost:3000            # is the app itself up?
```

---

## If you would rather run it through Pterodactyl

It works, and it is a fair choice if you already manage everything else in
that panel. Understand what it does and does not give you: Pterodactyl runs
the app in a container and hands you an `IP:PORT` allocation. It has no
concept of domains and will not give you HTTPS — you still need Caddy in
front, exactly as above, just pointing at the allocation port instead of 3000.

1. Create a server on a generic Node.js egg (Node 20+), at least 1GB RAM.
2. SFTP the *contents* of `deploy/` into `/home/container`, so `server.js`
   sits at the top level. Use FileZilla or WinSCP — the web file manager
   struggles with this many files.
3. Set the startup command to `./start.sh`, which reads Pterodactyl's
   `SERVER_PORT` and `SERVER_IP` and passes them to Next.
4. Point Caddy at `127.0.0.1:<allocation port>`.

The only real cost is the extra layer: a container boundary, a panel to click
through, and Pterodactyl's own resource limits sitting between you and a
process that just needs to run. For a website, systemd does the same job with
less in the way.

## The contact form

It needs environment variables to actually send. Set these wherever you are
running the app — Pterodactyl startup variables, or `Environment=` lines in
the systemd unit:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_TO=michaelpeacock1993@gmail.com
CONTACT_FROM=site@yourdomain.com
```

Without them the form still validates and tells the sender it is not
connected, offering your email address instead. Nothing is silently lost.

---

## Before you go live

Set `url` in `data/site.ts` to your real domain. It is what Open Graph and the
structured data use, so link previews break without it.

## Updating the site later

```bash
npm run import-photos -- --from "..." --event "..."   # if adding photos
npm run build:deploy
# re-upload ./deploy, restart the server
```

Only `public/images/` and `.next/` change between most deploys, so you can
re-upload just those if the full transfer is slow.

---

## A note on why it is packaged this way

`sharp` — the library that resizes your photographs on demand — ships a
compiled binary per operating system, and npm only installs the one for the
machine doing the installing. Building on Windows and uploading to Linux gives
you a bundle with a Windows binary in it.

Worse, when `sharp` fails to load, Next does **not** error. It quietly serves
the original file instead, so the site looks fine while sending 362KB where it
should send 12KB. `npm run build:deploy` fetches the Linux binaries and then
actually loads `sharp` out of the assembled bundle to prove it works, so this
cannot ship broken without you being told.
