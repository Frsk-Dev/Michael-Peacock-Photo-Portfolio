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

## Can this run on Pterodactyl?

Yes, but understand what Pterodactyl is first: it is a **game server panel**.
It runs your app in a container and gives you an `IP:PORT` allocation. It has
no concept of domains, and it will not give you HTTPS. Everything below is
about bridging that gap.

If you have **root on the VPS**, you almost certainly do not want Pterodactyl
for this — see "Straight on the VPS" further down. It is less setup, not more.

### Running it on a Pterodactyl instance

1. **Create a server using a generic Node.js egg** (the "NodeJS Generic" egg,
   or any egg with Node 20+). Give it at least **1GB RAM** and enough disk for
   the bundle.

2. **Upload the `deploy` folder over SFTP.** Pterodactyl exposes SFTP on the
   panel's connection details — use FileZilla or WinSCP rather than the web
   file manager, which struggles with this many files. Put the *contents* of
   `deploy/` into `/home/container`, so `server.js` sits at the top level.

3. **Set the startup command** to:

   ```
   node server.js
   ```

   Pterodactyl sets `SERVER_PORT` and `SERVER_IP` for you, and Next reads
   `PORT` and `HOSTNAME`, so map them in the egg's startup variables — or use
   the included script instead, which does the translation:

   ```
   ./start.sh
   ```

4. **Check the allocation.** The port Pterodactyl assigned is the port the
   site answers on. At this point `http://<ip>:<port>` should load.

### Getting a domain and HTTPS onto it

This is the part Pterodactyl does not do for you. Pick one:

**Cloudflare Tunnel — best option if you do not control the host.**
Works from any port, gives you HTTPS and a real domain, and nothing needs to
be exposed to the internet. Install `cloudflared` on the machine (or as a
second Pterodactyl server), point it at your allocation, and map the hostname
in the Cloudflare dashboard. Free.

**Cloudflare proxy (orange cloud).** Only works if your allocated port happens
to be one Cloudflare proxies — `8080`, `8880`, `2052`, `2082`, `2086`, `2095`
for HTTP. If your panel let you choose the port, ask for `8080`. If not, use a
tunnel instead.

**Reverse proxy on the host.** If you own the box, put nginx or Caddy in front
and terminate TLS there. Caddy gets you a certificate automatically:

```
michaelpeacock.photo {
    reverse_proxy localhost:PORT
}
```

---

## Straight on the VPS (simpler, if you have root)

Skip Pterodactyl entirely.

```bash
# on the server, once
sudo apt install -y nodejs caddy
mkdir -p /var/www/peacock

# from your machine, each deploy
scp -r deploy/* user@server:/var/www/peacock/
```

Then a systemd unit at `/etc/systemd/system/peacock.service`:

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
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now peacock
```

And a `Caddyfile`:

```
michaelpeacock.photo {
    reverse_proxy 127.0.0.1:3000
}
```

Caddy handles the certificate on its own. That is the whole deployment.

---

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
