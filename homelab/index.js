// ── Tab switching ────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'topology') requestAnimationFrame(() => setTimeout(drawConns, 60));
  });
});
document.querySelectorAll('.tab-link').forEach(link => {
  link.addEventListener('click', () => {
    const target = document.querySelector('.tab-btn[data-tab="' + link.dataset.tab + '"]');
    if (!target) return;
    target.click();
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  });
});

// ── Accordions ───────────────────────────────────────────────
document.querySelectorAll('.acc-trigger').forEach(t => {
  t.addEventListener('click', () => {
    const body = t.nextElementSibling;
    const wasOpen = body.classList.contains('open');
    t.closest('.accordion').querySelectorAll('.acc-body').forEach(b => b.classList.remove('open'));
    t.closest('.accordion').querySelectorAll('.acc-trigger').forEach(x => x.classList.remove('open'));
    if (!wasOpen) { body.classList.add('open'); t.classList.add('open'); }
  });
});

// ── Connection metadata ───────────────────────────────────────
const NODE_NAMES = {
  'n-tailscale':  { name: 'Tailscale',          ico: '🔒' },
  'n-github':     { name: 'GitHub',              ico: '⑂'  },
  'n-anthropic':  { name: 'Anthropic',           ico: '🤖' },
  'n-openmeteo':  { name: 'Open-Meteo',          ico: '🌤' },
  'n-zoho':       { name: 'SMTP provider',       ico: '📧' },
  'n-residential':{ name: 'Residential Network', ico: '🏢' },
  'n-switch':     { name: 'Unifi Flex Mini',     ico: '🔀' },
  'n-opnsense':   { name: 'OPNsense VM',         ico: '🛡️' },
  'n-adguard':    { name: 'AdGuard Home',        ico: '🚫' },
  'n-unifi-os':   { name: 'Unifi OS Server',     ico: '🖧'  },
  'n-homarr':     { name: 'Homarr',             ico: '📊' },
  'n-jellyfin':   { name: 'Jellyfin',            ico: '🎬' },
  'n-homelab-site': { name: 'homelab-site',      ico: '📖' },
  'n-reports':    { name: 'Cron Reports',        ico: '📅' },
  'n-claude-cli': { name: 'Claude CLI',          ico: '💬' },
  'n-msmtp':      { name: 'msmtp',              ico: '📤' },
  'n-ngrok':      { name: 'ngrok',              ico: '🌐' },
  'n-webhook':    { name: 'webhook.service',     ico: '🪝' },
};

const CLS_META = {
  'cl-internet': { color: 'var(--blue)', label: 'Internet' },
  'cl-wwan':     { color: 'var(--yellow)', label: 'WWAN' },
  'cl-vlan10':   { color: 'var(--teal)', label: 'VLAN 10' },
};

// Which subnet(s) each node participates in — used to light up the matching
// VLAN chips below OPNsense when a node is selected.
const ALL_VLANS = ['lan','v10','v20','v30','v40'];
const NODE_VLAN = {
  'n-residential':     [],            // upstream WAN, not on any internal subnet
  'n-switch':     ALL_VLANS,     // Port 2 trunks LAN + tagged VLAN 10/20/30/40
  'n-opnsense':   ALL_VLANS,     // gateway / DHCP / firewall for every subnet
  'n-tailscale':  ALL_VLANS,     // advertises every subnet to the tailnet
  'n-adguard':    ['v10'],
  'n-unifi-os':   ['v10'],
  'n-homarr':     ['v10'],
  'n-jellyfin':   ['v20'],
  'n-homelab-site': ['v20'],
  'n-reports':    ['v30'],
  'n-claude-cli': ['v30'],
  'n-msmtp':      ['v30'],
  'n-ngrok':      ['v30'],
  'n-webhook':    ['v30'],
  // external SaaS (github, anthropic, openmeteo, zoho) — no internal VLAN
};

// ── Node detail data ─────────────────────────────────────────
const ND = {
  tailscale: {
    ico: '🔒', name: 'Tailscale', type: 'External Service',
    s: [
      { h: 'Role', kv: [['Purpose','Secure remote access VPN'],['Mode','OPNsense as exit node (Tailscale plugin)'],['Advertises','ALL subnets — LAN + VLAN 10/20/30/40']] },
      { h: 'Subnets advertised', kv: [
        ['LAN',          '10.0.0.0/24'],
        ['VLAN 10 mgmt', '10.0.10.0/24'],
        ['VLAN 20 svc',  '10.0.20.0/24'],
        ['VLAN 30 auto', '10.0.30.0/24'],
        ['VLAN 40 iot',  '10.0.40.0/24'],
      ]},
      { h: 'Reachable services', li: [
        {t:'Proxmox VE — proxmox.homelab (10.0.0.XX:8006)',c:'pl-b'},
        {t:'OPNsense admin — opnsense.homelab (10.0.10.1)',c:'pl-b'},
        {t:'AdGuard Home — adguard.homelab (10.0.10.XX)',c:'pl-b'},
        {t:'Unifi OS Server — unifi.homelab (10.0.10.XX)',c:'pl-b'},
        {t:'Homarr dashboard — homarr.homelab (10.0.10.XX)',c:'pl-b'},
        {t:'homelab-site (this page) — map.homelab (10.0.20.XX)',c:'pl-b'},
        {t:'agent60 VM (automation) — agent.homelab (10.0.30.XX)',c:'pl-b'},
        {t:'Jellyfin VM (planned) and any future services on VLAN 20',c:'pl-b'},
        {t:'IoT devices (future) on VLAN 40',c:'pl-b'},
      ]},
      { h: 'Notes', li: [
        {t:'OPNsense Tailscale plugin pushes AdGuard (10.0.10.XX) as DNS to tailnet clients — so .homelab URLs work remotely too',c:'pl-g'},
        {t:'No inbound rules on WAN or Tailscale interface (default deny)',c:'pl-g'},
        {t:'Effectively: anyone on the tailnet has full L3 reach to every subnet',c:'pl-y'},
        {t:'Pending: Tailscale ACLs to restrict which devices reach which subnets',c:'pl-y'},
      ]},
    ]
  },
  'vlan-lan': {
    ico: '🏠', name: 'LAN', type: 'Native subnet · untagged',
    s: [
      { h: 'Network', kv: [
        ['Subnet',     '10.0.0.0/24'],
        ['Gateway',    '10.0.0.1  (OPNsense vmbr1)'],
        ['DHCP range', '10.0.0.50 – 10.0.0.200'],
        ['Tag',        'untagged (native)'],
      ]},
      { h: 'Also lives here', li: [
        {t:'Proxmox VE host — 10.0.0.XX',c:'pl-b'},
        {t:'Trusted wired DHCP devices (10.0.0.50–200)',c:'pl-b'},
      ]},
      { h: 'Firewall — egress rules', li: [
        {t:'Block → mgmt VLAN',c:'pl-r'},
        {t:'Block → services VLAN',c:'pl-r'},
        {t:'Block → automation VLAN',c:'pl-r'},
        {t:'Pass → internet (WAN)',c:'pl-g'},
      ]},
      { h: 'DNS', li: [
        {t:'Resolves via OPNsense (10.0.0.1) → forwards to AdGuard internally',c:'pl-b'},
      ]},
      { h: 'Switch', li: [
        {t:'Untagged frames on Flex Mini Port 2 land on this VLAN',c:'pl-b'},
      ]},
    ]
  },
  'vlan-v10': {
    ico: '⚙️', name: 'VLAN 10 — mgmt', type: 'Management plane · tag 10',
    s: [
      { h: 'Network', kv: [
        ['Subnet',     '10.0.10.0/24'],
        ['Gateway',    '10.0.10.1  (OPNsense)'],
        ['DHCP range', '10.0.10.50 – 10.0.10.200'],
        ['Tag',        '10'],
      ]},
      { h: 'Firewall — egress rules', li: [
        {t:'Pass :53 → AdGuard (DNS)',c:'pl-g'},
        {t:'Block → all other RFC1918',c:'pl-r'},
        {t:'Pass → WAN (updates, APIs)',c:'pl-g'},
      ]},
      { h: 'Access', li: [
        {t:'LAN → mgmt is blocked — reach via Tailscale',c:'pl-y'},
        {t:'OPNsense advertises 10.0.10.0/24 over Tailscale subnet route',c:'pl-b'},
      ]},
    ]
  },
  'vlan-v20': {
    ico: '🎬', name: 'VLAN 20 — services', type: 'Self-hosted services · tag 20',
    s: [
      { h: 'Network', kv: [
        ['Subnet',     '10.0.20.0/24'],
        ['Gateway',    '10.0.20.1  (OPNsense)'],
        ['DHCP range', '10.0.20.50 – 10.0.20.200'],
        ['Tag',        '20'],
      ]},
      { h: 'Devices', li: [
        {t:'homelab-site LXC — 10.0.20.XX · nginx serving this dashboard at http://map.homelab (tailscale-only inbound)',c:'pl-b'},
        {t:'Jellyfin VM (planned) — 10.0.20.x · media server, tailscale-only inbound',c:'pl-b'},
        {t:'Pending: move Homarr here (currently on mgmt)',c:'pl-y'},
      ]},
      { h: 'Egress firewall (OPNsense top-down)', li: [
        {t:'Pass → AdGuard 10.0.10.XX :53 (DNS — specific allow before RFC1918 block)',c:'pl-g'},
        {t:'Block → RFC1918 (no lateral access to LAN / mgmt / automation / iot)',c:'pl-r'},
        {t:'Pass → * :443 (HTTPS — updates, Jellyfin metadata TMDB/TVDB, GitHub SSH-via-443)',c:'pl-g'},
        {t:'Pass → * :80 (HTTP — apt repos)',c:'pl-g'},
        {t:'Default deny everything else',c:'pl-r'},
      ]},
      { h: 'Inbound model', li: [
        {t:'LAN → services: BLOCKED (intentional)',c:'pl-r'},
        {t:'Tailscale → services: allowed via L3 subnet routing — OPNsense Tailscale plugin advertises 10.0.20.0/24 to the tailnet, so tailnet devices reach Jellyfin on any port without a per-port pass rule',c:'pl-b'},
        {t:'No port-forwards, no public exposure',c:'pl-g'},
      ]},
    ]
  },
  'vlan-v30': {
    ico: '🤖', name: 'VLAN 30 — automation', type: 'Automation · tag 30 · internet-only',
    s: [
      { h: 'Network', kv: [
        ['Subnet',     '10.0.30.0/24'],
        ['Gateway',    '10.0.30.1  (OPNsense)'],
        ['DHCP range', '10.0.30.50 – 10.0.30.200'],
        ['Tag',        '30'],
      ]},
      { h: 'Host VM', li: [
        {t:'agent60 VM — Ubuntu (default user) — 10.0.30.XX (DHCP reserved)',c:'pl-r'},
        {t:'Hosts agent60 (reports → Claude CLI → msmtp) and auto-deploy (ngrok + webhook)',c:'pl-b'},
        {t:'Strong random password (password-manager-generated, stored in the same vault) — password SSH safe alongside ed25519 key',c:'pl-g'},
      ]},
      { h: 'Firewall — egress rules', li: [
        {t:'Pass :53 → AdGuard (DNS only)',c:'pl-g'},
        {t:'Block → all RFC1918 (no internal network access)',c:'pl-r'},
        {t:'Pass :443 → WAN (Claude, Notion, GCal, Open-Meteo)',c:'pl-g'},
        {t:'Pass :80 → WAN (apt repos)',c:'pl-g'},
        {t:'Pass :465 → WAN (SMTP/SSL · SMTP provider)',c:'pl-g'},
        {t:'Block * default — deny everything else',c:'pl-r'},
      ]},
      { h: 'Notes', li: [
        {t:'IPv6 disabled — msmtp would otherwise resolve IPv6 first and hang',c:'pl-y'},
        {t:'Reachable via Tailscale (subnet route advertised by OPNsense)',c:'pl-b'},
      ]},
    ]
  },
  'vlan-v40': {
    ico: '💡', name: 'VLAN 40 — iot', type: 'IoT / smart home · tag 40',
    s: [
      { h: 'Network', kv: [
        ['Subnet',     '10.0.40.0/24'],
        ['Gateway',    '10.0.40.1  (OPNsense)'],
        ['DHCP range', '10.0.40.50 – 10.0.40.200'],
        ['Tag',        '40'],
      ]},
      { h: 'Status', li: [
        {t:'No devices yet — VLAN defined but unused',c:'pl-y'},
        {t:'Firewall rules not yet configured',c:'pl-y'},
        {t:'Reserved for smart home / IoT devices',c:'pl-b'},
      ]},
    ]
  },
  github: {
    ico: '⑂', name: 'GitHub', type: 'External Service',
    s: [
      { h: 'Repository', kv: [['Repo','<user>/agent60'],['Branch','main'],['Deploy target','/opt/agent60 on agent60 VM']] },
      { h: 'Webhook', kv: [['Event','push only'],['Content-Type','application/json'],['Auth','HMAC-SHA256'],['URL','<static>.ngrok-free.app/webhook']] },
      { h: 'SSH Config', li: [{t:'Key: ~/.ssh/id_ed25519 (ed25519)',c:'pl-g'},{t:'Routes via ssh.github.com:443 (port 22 blocked on VLAN 30)',c:'pl-y'},{t:'keychain auto-starts SSH agent on login',c:'pl-g'}] },
    ]
  },
  anthropic: {
    ico: '🤖', name: 'Anthropic', type: 'External Service',
    s: [
      { h: 'Claude API', kv: [['Access','claude login session (no separate key)'],['Mode','claude -p headless in shell scripts'],['Port','443 (HTTPS)']] },
      { h: 'MCP Connectors', li: [{t:'Notion — online coding class notes are transcribed and stored here (Friday report)',c:'pl-p'},{t:'Google Calendar — events (Monday + daily briefs)',c:'pl-b'},{t:'Configured at claude.ai/connectors',c:'pl-g'}] },
    ]
  },
  openmeteo: {
    ico: '🌤', name: 'Open-Meteo', type: 'External API',
    s: [
      { h: 'Usage', kv: [['Used by','Monday Brief, Daily Brief'],['Tool','WebFetch via Claude CLI'],['Port','443 (HTTPS)'],['Auth','None — free public API']] },
      { h: 'Data', li: [{t:'7-day forecast (Monday Brief)',c:'pl-b'},{t:"Today's weather + outfit tip (Daily Brief)",c:'pl-b'}] },
    ]
  },
  zoho: {
    ico: '📧', name: 'SMTP provider', type: 'External Service',
    s: [
      { h: 'SMTP Config', kv: [['Host','smtp.example.com'],['Port','465 (implicit TLS)'],['Auth','App password'],['Client','msmtp  (~/.msmtprc  chmod 600)']] },
      { h: 'Notes', li: [{t:'SMTP access must be enabled in SMTP provider settings (off by default)',c:'pl-y'},{t:'Dedicated SMTP provider account — isolated from personal email',c:'pl-g'},{t:'tls_starttls off — implicit TLS on port 465',c:'pl-b'}] },
    ]
  },
  router: {
    ico: '📡', name: 'ISP Router', type: 'Home Network',
    s: [
      { h: 'Network', kv: [['IP','192.168.X.X'],['Subnet','192.168.X.0/24'],['DHCP range','192.168.X.x']] },
      { h: 'Connections', li: [{t:'Cat6 from wall → Mini PC nic0 (vmbr0) — physical WAN to OPNsense',c:'pl-p'},{t:'OPNsense WAN IP: 192.168.X.XX',c:'pl-g'}] },
    ]
  },
  switch: {
    ico: '🔀', name: 'Unifi Flex Mini 2.5G', type: 'Standalone Managed Switch',
    s: [
      { h: 'Device', kv: [
        ['IP','10.0.10.87  (mgmt VLAN)'],
        ['Form factor','External — sits beside the Mini PC'],
        ['Managed by','Unifi OS Server LXC (10.0.10.XX)'],
      ]},
      { h: 'Uplink', kv: [['Port 2 (trunk)','Mini PC USB → USB-C NIC → Cat6 (vmbr1)']] },
      { h: 'Configuration', li: [
        {t:'Port 2 native (untagged) VLAN = LAN 10.0.0.0/24',c:'pl-b'},
        {t:'Port 2 trunks VLAN tags 10/20/30/40 on top — uplink to OPNsense vmbr1',c:'pl-b'},
        {t:'VLAN tags defined in Unifi OS Server',c:'pl-b'},
        {t:'Other ports assigned access VLANs per-device',c:'pl-b'},
      ]},
      { h: 'Notes', li: [{t:'Mgmt interface IP (10.0.10.87) lives on the mgmt VLAN even though the switch chassis is wired to the Mini PC via USB-C',c:'pl-y'},{t:'WAN cable does NOT pass through this switch — it goes wall → Mini PC nic0 directly',c:'pl-y'}] },
    ]
  },
  opnsense: {
    ico: '🛡️', name: 'OPNsense VM', type: 'VM — Firewall & Router · runs the whole network',
    s: [
      { h: 'Resources', kv: [['Cores','4 (1 socket)'],['RAM','2GB / 4GB swap'],['2FA','TOTP enabled']] },
      { h: 'Interfaces', kv: [['WAN','192.168.X.XX/24  (vmbr0)'],['LAN','10.0.0.1/24  (vmbr1)'],['mgmt VLAN','10.0.10.1  (tag 10)']] },
      { h: 'Subnets', kv: [
        ['LAN',          '10.0.0.0/24  ·  DHCP 10.0.0.50–200'],
        ['VLAN 10  mgmt','10.0.10.0/24  ·  DHCP 10.0.10.50–200'],
        ['VLAN 20  svc', '10.0.20.0/24  ·  DHCP 10.0.20.50–200'],
        ['VLAN 30  auto','10.0.30.0/24  ·  DHCP 10.0.30.50–200'],
        ['VLAN 40  iot', '10.0.40.0/24  ·  DHCP 10.0.40.50–200'],
      ]},
      { h: 'Does all the actual networking work', li: [
        {t:'Creates + enables each VLAN on the vmbr1 parent interface (Interfaces → Other Types → VLAN)',c:'pl-g'},
        {t:'Configures each VLAN interface — subnet, gateway IP, MTU — under Interfaces → Assignments',c:'pl-g'},
        {t:'Runs DHCP on every VLAN (advertises AdGuard 10.0.10.XX as DNS)',c:'pl-b'},
        {t:'Acts as default gateway for every subnet (.1 of each /24)',c:'pl-b'},
        {t:'Enforces all firewall rules between VLANs and to/from WAN',c:'pl-b'},
        {t:'Forwards LAN DNS → AdGuard; handles NAT for WAN egress',c:'pl-b'},
      ]},
      { h: 'Plugins / extras', li: [
        {t:'Tailscale plugin — exit node, advertises every VLAN subnet',c:'pl-g'},
        {t:'Proxmox host firewall enabled (Datacenter → Firewall) as a second layer beyond OPNsense — 2026-05-17',c:'pl-g'},
      ]},
    ]
  },
  adguard: {
    ico: '🚫', name: 'AdGuard Home', type: 'LXC — mgmt VLAN',
    s: [
      { h: 'Resources', kv: [['IP','10.0.10.XX'],['Cores','1'],['RAM','2GB / 2GB swap'],['VLAN','mgmt (tag 10)']] },
      { h: 'DNS', kv: [['Listens on','10.0.10.XX:53'],['Upstream','https://dns10.quad9.net/dns-query (Quad9 DoH, malware-blocking)'],['Used by','Every LXC + VM + Tailscale client — OPNsense DHCP and Tailscale plugin both advertise 10.0.10.XX as DNS']] },
      { h: 'DNS rewrites — .homelab URLs', kv: [
        ['proxmox.homelab', '10.0.0.XX'],
        ['opnsense.homelab','10.0.10.1'],
        ['adguard.homelab', '10.0.10.XX'],
        ['unifi.homelab',   '10.0.10.XX'],
        ['homarr.homelab',  '10.0.10.XX'],
        ['map.homelab', '10.0.20.XX  (homelab-site LXC — this dashboard)'],
        ['agent.homelab',     '10.0.30.XX'],
      ]},
      { h: 'Notes', li: [
        {t:'Network-wide ad and tracker blocking',c:'pl-g'},
        {t:'Local .homelab names work from LAN, any VLAN, and Tailscale — no IPs to memorize',c:'pl-g'},
        {t:'LAN devices reach it via OPNsense DNS forwarding; VLAN + tailnet devices query AdGuard directly',c:'pl-b'},
      ]},
    ]
  },
  'unifi-os': {
    ico: '🖧', name: 'Unifi OS Server', type: 'LXC — mgmt VLAN · dumb-pipe configurator',
    s: [
      { h: 'Resources', kv: [['IP','10.0.10.XX'],['Cores','2'],['RAM','4GB / 512MB swap'],['VLAN','mgmt (tag 10)']] },
      { h: 'All it does', li: [
        {t:'Defines the VLAN tag numbers (10 / 20 / 30 / 40) so the switch knows what to forward',c:'pl-b'},
        {t:'Sets Port 2 native VLAN = LAN 10.0.0.0/24 (untagged) + trunks tags 10/20/30/40 — uplink to OPNsense vmbr1',c:'pl-b'},
        {t:'Assigns access VLAN per remaining port as devices are added',c:'pl-b'},
      ]},
      { h: 'Does NOT do', li: [
        {t:'Subnets, gateways, DHCP, DNS, firewall, routing — all of that is OPNsense',c:'pl-y'},
        {t:'Without OPNsense, these tags would be meaningless labels',c:'pl-y'},
      ]},
      { h: 'Notes', li: [{t:'Controller overrides the switch management interface from LAN to mgmt VLAN',c:'pl-y'},{t:'Just needs the matching tag list so the switch does not drop frames in transit',c:'pl-b'}] },
    ]
  },
  homarr: {
    ico: '📊', name: 'Homarr', type: 'LXC — mgmt VLAN',
    s: [
      { h: 'Resources', kv: [['IP','10.0.10.XX'],['Cores','2'],['RAM','2GB / 512MB swap'],['VLAN','mgmt (tag 10)']] },
      { h: 'Access', li: [
        {t:'Reachable from mgmt VLAN directly, or via Tailscale from anywhere (OPNsense advertises 10.0.10.0/24)',c:'pl-b'},
        {t:'NOT reachable from LAN — LAN → mgmt blocked at firewall',c:'pl-y'},
        {t:'Homelab dashboard — service links and status',c:'pl-b'},
        {t:'Pending: move to services VLAN (currently on mgmt)',c:'pl-y'},
      ]},
    ]
  },
  'homelab-site': {
    ico: '📖', name: 'homelab-site', type: 'LXC — services VLAN',
    s: [
      { h: 'Resources', kv: [
        ['IP', '10.0.20.XX (DHCP reserved)'],
        ['Cores', '1'],
        ['RAM', '256MB / 256MB swap'],
        ['Disk', '4GB'],
        ['OS', 'Debian 12'],
        ['VLAN', 'services (tag 20)'],
      ]},
      { h: 'Role', li: [
        {t:'nginx serves /opt/homelab-site/homelab_reorganization.html as the directory index',c:'pl-b'},
        {t:'Accessed at http://map.homelab (AdGuard rewrite → 10.0.20.XX) — no port, no path suffix',c:'pl-b'},
        {t:'Self-hosted, always-current copy of these homelab docs — for personal viewing only',c:'pl-b'},
      ]},
      { h: 'Access', li: [
        {t:'Tailscale-only inbound — LAN → services blocked at firewall',c:'pl-g'},
        {t:'OPNsense Tailscale plugin advertises 10.0.20.0/24 to the tailnet, so tailnet devices have L3 reach without a per-port pass rule',c:'pl-b'},
        {t:'No port-forward, no public DNS, no public exposure of any kind',c:'pl-g'},
      ]},
      { h: 'Repo & deploy', li: [
        {t:'Private GitHub repo cloned via SSH using a read-only deploy key (repo-scoped, not tied to user account)',c:'pl-g'},
        {t:'Deploy key added under repo Settings → Deploy keys with "Allow write access" UNCHECKED — pull-only',c:'pl-g'},
        {t:'SSH tunneled through HTTPS:443 (Host github.com → ssh.github.com:443) because services VLAN only allows :443 outbound, not :22',c:'pl-b'},
        {t:'Manual update: ssh root@10.0.20.XX then cd /opt/homelab-site && git pull. nginx serves new file on next request — no reload needed',c:'pl-b'},
      ]},
      { h: 'Blast radius if compromised', li: [
        {t:'Attacker only gets read access to one repo via the deploy key — no write, no other repos, no user-account scope',c:'pl-g'},
        {t:'No Anthropic / SMTP / agent60 credentials on this LXC — those live on the isolated automation VM',c:'pl-g'},
        {t:'Cannot pivot to other internal subnets — services VLAN egress firewall blocks RFC1918',c:'pl-g'},
      ]},
    ]
  },
  jellyfin: {
    ico: '🎬', name: 'Jellyfin', type: 'VM — services VLAN (planned)',
    s: [
      { h: 'Resources (planned)', kv: [['IP','10.0.20.x (DHCP reserved)'],['VLAN','services (tag 20)'],['Media','Local to VM — no NAS / SMB / NFS reach required']] },
      { h: 'Firewall posture', li: [
        {t:'LAN → services blocked — Jellyfin is NOT reachable from LAN directly',c:'pl-y'},
        {t:'Reachable only via Tailscale — OPNsense Tailscale plugin advertises 10.0.20.0/24 to the tailnet, so any tailnet device has L3 reach',c:'pl-b'},
        {t:'Outbound: DNS to AdGuard, HTTPS/HTTP for updates + TMDB/TVDB metadata, nothing else',c:'pl-g'},
        {t:'No port-forward, no inbound rule needed — tailnet routing handles it',c:'pl-g'},
      ]},
      { h: 'Setup notes', li: [
        {t:'Bind on 0.0.0.0 (default) — Tailscale traffic enters via OPNsense, treated as services-VLAN ingress',c:'pl-b'},
        {t:'Add AdGuard rewrite jellyfin.homelab → 10.0.20.x for a memorable URL across LAN/VLANs/Tailscale',c:'pl-b'},
        {t:'Plain HTTP on :8096 is fine for tailnet-only access; TLS only needed if exposing publicly',c:'pl-b'},
      ]},
    ]
  },
  reports: {
    ico: '📅', name: 'Cron Reports', type: 'Service — agent60',
    s: [
      { h: 'Schedule (UTC offsets for local = UTC offset)', kv: [['Friday Report','0 23 * * 5 → 6:00 PM local'],['Monday Brief','0 10 * * 1 → 5:00 AM local'],['Daily Brief','0 10 * * 2-7 → 5:00 AM local']] },
      { h: 'Data Sources', li: [{t:'Friday: online coding class notes transcribed in Notion · pulled via Notion MCP',c:'pl-p'},{t:'Monday: Google Calendar events + 7-day weather',c:'pl-b'},{t:"Daily: Today's calendar + weather + outfit tip",c:'pl-b'}] },
    ]
  },
  'claude-cli': {
    ico: '💬', name: 'Claude Code CLI', type: 'Service — agent60',
    s: [
      { h: 'Runtime', kv: [['Binary','/home/user/.local/bin/claude'],['Mode','claude -p  headless'],['Install','npm install -g @anthropic-ai/claude-code'],['Auth','claude login session  (~/.claude/)']] },
      { h: 'Tasks', li: [{t:'Query MCP connectors (Notion, Google Calendar)',c:'pl-b'},{t:'Fetch weather via WebFetch (Open-Meteo)',c:'pl-b'},{t:'Fill HTML email template with AI-generated content',c:'pl-g'}] },
    ]
  },
  msmtp: {
    ico: '📤', name: 'msmtp', type: 'Service — agent60',
    s: [
      { h: 'Config', kv: [
        ['msmtp config','~/.msmtprc  (chmod 600)'],
        ['Email config','/opt/agent60/.env  — SMTP_FROM, REPORT_TO_EMAIL (chmod 600)'],
        ['Host','smtp.example.com:465'],
        ['TLS','Implicit (tls_starttls off)'],
        ['Auth','App password'],
      ]},
      { h: 'Notes', li: [{t:'AppArmor requires config at ~/.msmtprc (not inside repo)',c:'pl-y'},{t:'IPv6 disabled on agent60 to prevent connection hangs',c:'pl-y'},{t:'Dedicated SMTP provider account — isolated from personal email',c:'pl-g'}] },
    ]
  },
  ngrok: {
    ico: '🌐', name: 'ngrok', type: 'Service — auto-deploy',
    s: [
      { h: 'Config', kv: [['Service','ngrok.service (systemd, auto-start)'],['Tunnel','localhost:3000 → ngrok-free.app'],['Protocol','HTTPS (port 443 — only outbound port allowed)'],['Config','~/.config/ngrok/ngrok.yml  (chmod 600)']] },
      { h: 'Notes', li: [{t:'Static ngrok-free.app domain — set in ngrok.yml',c:'pl-b'},{t:'Enabled + auto-starts on boot',c:'pl-g'}] },
    ]
  },
  webhook: {
    ico: '🪝', name: 'webhook.service', type: 'Service — auto-deploy',
    s: [
      { h: 'Runtime', kv: [['Service','webhook.service (systemd, auto-start)'],['Script','/opt/webhook/index.js  (Node.js)'],['Port','localhost:3000'],['Auth','HMAC-SHA256 signature'],['Timeout','5s execSync limit']] },
      { h: 'On trigger', li: [{t:'Receives GitHub push event via ngrok tunnel',c:'pl-b'},{t:'Verifies HMAC-SHA256 signature',c:'pl-g'},{t:'Runs: git -C /opt/agent60 pull',c:'pl-g'},{t:'Per-IP 5s rate limit — returns 429 on repeat hits',c:'pl-y'}] },
      { h: 'Logs', kv: [['Live','journalctl -fu webhook'],['Filtered','journalctl -u webhook | grep -E "Pull|Rejected|Webhook"']] },
    ]
  },
};

// ── Detail panel logic ───────────────────────────────────────
const panel     = document.getElementById('detail-panel');
const pIco      = document.getElementById('p-ico');
const pName     = document.getElementById('p-name');
const pType     = document.getElementById('p-type');
const pBody     = document.getElementById('p-body');
let   activeNode = null;

function openPanel(id) {
  const d = ND[id];
  if (!d) return;
  if (activeNode) activeNode.classList.remove('selected');
  if (activeChip) { activeChip.classList.remove('ss-selected'); activeChip = null; }
  activeNode = document.getElementById('n-' + id);
  if (activeNode) activeNode.classList.add('selected');

  pIco.textContent  = d.ico;
  pName.textContent = d.name;
  pType.textContent = d.type;

  const detailHtml = d.s.map(sec => {
    let html = `<div class="panel-section"><h3>${sec.h}</h3>`;
    if (sec.kv) {
      html += '<div class="kv-grid">';
      sec.kv.forEach(([k, v]) => { html += `<span class="kv-k">${k}</span><span class="kv-v">${v}</span>`; });
      html += '</div>';
    }
    if (sec.li) {
      html += '<ul class="panel-list">';
      sec.li.forEach(item => { html += `<li class="${item.c}">${item.t}</li>`; });
      html += '</ul>';
    }
    return html + '</div>';
  }).join('');

  pBody.innerHTML = detailHtml + buildConnSection(id);

  panel.classList.add('open');
  highlightConns('n-' + id);
}

function closePanel() {
  panel.classList.remove('open');
  if (activeNode) { activeNode.classList.remove('selected'); activeNode = null; }
  if (activeChip) { activeChip.classList.remove('ss-selected'); activeChip = null; }
  resetConns();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

document.querySelectorAll('.node[data-node]').forEach(node => {
  node.addEventListener('click', () => {
    const id = node.dataset.node;
    if (panel.classList.contains('open') && activeNode === node) closePanel();
    else openPanel(id);
  });
});

// ── VLAN chip selection ──────────────────────────────────────
let activeChip = null;

document.querySelectorAll('.ss-chip[data-vlan]').forEach(chip => {
  chip.addEventListener('click', () => {
    const vlanId = chip.dataset.vlan;
    if (panel.classList.contains('open') && activeChip === chip) {
      closePanel();
    } else {
      openVlanPanel(chip, vlanId);
    }
  });
});

function openVlanPanel(chipEl, vlanId) {
  const d = ND['vlan-' + vlanId];
  if (!d) return;

  // Clear any prior selection (node or chip)
  if (activeNode) activeNode.classList.remove('selected');
  activeNode = null;
  if (activeChip) activeChip.classList.remove('ss-selected');
  activeChip = chipEl;
  chipEl.classList.add('ss-selected');

  pIco.textContent  = d.ico;
  pName.textContent = d.name;
  pType.textContent = d.type;

  const detailHtml = d.s.map(sec => {
    let html = `<div class="panel-section"><h3>${sec.h}</h3>`;
    if (sec.kv) {
      html += '<div class="kv-grid">';
      sec.kv.forEach(([k, v]) => { html += `<span class="kv-k">${k}</span><span class="kv-v">${v}</span>`; });
      html += '</div>';
    }
    if (sec.li) {
      html += '<ul class="panel-list">';
      sec.li.forEach(item => { html += `<li class="${item.c}">${item.t}</li>`; });
      html += '</ul>';
    }
    return html + '</div>';
  }).join('');

  pBody.innerHTML = detailHtml + buildVlanConnSection(vlanId);

  panel.classList.add('open');
  highlightVlan(vlanId);
}

function highlightVlan(vlanId) {
  // Find every node whose NODE_VLAN includes this vlanId
  const members = new Set();
  for (const [nid, vlans] of Object.entries(NODE_VLAN)) {
    if (vlans.includes(vlanId)) members.add(nid);
  }

  // Lines — dim all of them (a VLAN highlights its devices, not its plumbing)
  document.querySelectorAll('#conn-svg path').forEach(path => {
    path.classList.remove('cl-active');
    path.classList.add('cl-dim');
  });

  // Nodes
  document.querySelectorAll('.node[data-node]').forEach(node => {
    node.classList.toggle('conn-lit', members.has('n-' + node.dataset.node));
  });

  // Chips — only the selected one stays lit
  document.querySelectorAll('.ss-chip[data-vlan]').forEach(chip => {
    chip.classList.toggle('ss-lit', chip.dataset.vlan === vlanId);
  });

  document.getElementById('topo-wrap').classList.add('has-selection');
}

// ── Connection definitions ────────────────────────────────────
const CONNS = [
  { a: 'n-residential', b: 'n-internet', aSide: 'top',    bSide: 'bottom', cls: 'cl-internet'},
  { a: 'n-internet',    b: 'n-vps0',     bSide: 'bottom', aSide: 'left',   cls: 'cl-internet'},
  { a: 'n-internet',    b: 'n-vps1',     bSide: 'bottom', aSide: 'right',  cls: 'cl-internet'},
  { a: 'n-openwrt',     b: 'n-residential', aSide: 'top', bSide: 'bottom', cls: 'cl-wwan'},
  { a: 'n-proxmox0',   b: 'n-proxmox0-brd', aSide: 'right', bSide: 'left', cls: 'cl-vlan10'},
  { a: 'n-proxmox0-brd',   b: 'n-openwrt', aSide: 'right', bSide: 'left', cls: 'cl-vlan10'},
];

// ── SVG helpers ───────────────────────────────────────────────
function getRect(el, wrap) {
  const er = el.getBoundingClientRect();
  const wr = wrap.getBoundingClientRect();
  return {
    x:  er.left - wr.left,
    y:  er.top  - wr.top,
    w:  er.width,
    h:  er.height,
    cx: er.left - wr.left + er.width  / 2,
    cy: er.top  - wr.top  + er.height / 2,
  };
}

// Which side of a rect should we exit toward (tx, ty)?
function pickSide(rect, tx, ty) {
  const dx = tx - rect.cx;
  const dy = ty - rect.cy;
  if (dx === 0 && dy === 0) return 'bottom';
  const slope = Math.abs(dy / (dx === 0 ? 0.0001 : dx));
  const edgeSlope = rect.h / rect.w;
  if (slope <= edgeSlope) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'bottom' : 'top';
}

// Honor a per-connection side hint. Accepts literal sides ('top'/'bottom'/'left'/'right'),
// or 'horizontal'/'vertical' for "auto-pick the closer side along that axis".
function resolveSide(hint, atRect, otherRect) {
  if (!hint) return pickSide(atRect, otherRect.cx, otherRect.cy);
  if (hint === 'horizontal') return (otherRect.cx > atRect.cx) ? 'right' : 'left';
  if (hint === 'vertical')   return (otherRect.cy > atRect.cy) ? 'bottom' : 'top';
  if (hint === 'top' || hint === 'bottom' || hint === 'left' || hint === 'right') return hint;
  return pickSide(atRect, otherRect.cx, otherRect.cy);
}

// Point on a side at parameter t ∈ [0..1], with corner inset
function pointOnSide(rect, side, t) {
  // Wider spread on top/bottom (long lines often exit those) so fan-outs separate cleanly
  const inset = (side === 'top' || side === 'bottom') ? 0.12 : 0.2;
  const u = inset + t * (1 - 2 * inset);
  switch (side) {
    case 'top':    return { x: rect.x + u * rect.w, y: rect.y,             dir: 'top' };
    case 'bottom': return { x: rect.x + u * rect.w, y: rect.y + rect.h,    dir: 'bottom' };
    case 'left':   return { x: rect.x,              y: rect.y + u * rect.h, dir: 'left' };
    case 'right':  return { x: rect.x + rect.w,     y: rect.y + u * rect.h, dir: 'right' };
  }
}

// Smooth bezier — control points extend along each edge's normal.
// Used for cl-mgmt (long-distance VPN/management lines) so they curve gracefully
// instead of stacking into right-angle Z-shapes through the same vertical channel.
function bzEdge(p1, p2) {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const t = Math.min(dist * 0.42, 130);
  const off = dir => ({ top:[0,-t], bottom:[0,t], left:[-t,0], right:[t,0] }[dir] || [0,t]);
  const [ox1, oy1] = off(p1.dir);
  const [ox2, oy2] = off(p2.dir);
  return `M ${p1.x} ${p1.y} C ${p1.x+ox1} ${p1.y+oy1}, ${p2.x+ox2} ${p2.y+oy2}, ${p2.x} ${p2.y}`;
}

// Corridor routing: U-shape through a fixed outer X (e.g. far left or far right
// of the page). Lines from many sources fan into the corridor at distinct lanes
// instead of crossing the diagram middle.
function corridorPath(p1, p2, corridorX) {
  const vDir = d => ({ top:[0,-1], bottom:[0,1], left:[-1,0], right:[1,0] }[d] || [0,1]);
  const stub = 14;
  const [vx1, vy1] = vDir(p1.dir);
  const [vx2, vy2] = vDir(p2.dir);
  const s1x = p1.x + vx1*stub, s1y = p1.y + vy1*stub;
  const s2x = p2.x + vx2*stub, s2y = p2.y + vy2*stub;

  // p1 → stub → corridor (at p1.y) → corridor (at p2.y) → stub at target → p2
  const points = [
    [p1.x, p1.y],
    [s1x, s1y],
    [corridorX, s1y],
    [corridorX, s2y],
    [s2x, s2y],
    [p2.x, p2.y],
  ];
  return roundedPolyline(points, 6);
}

// Perimeter routing: out left, down past everything, across the bottom, then up to target.
// Used when source and target are far apart on the X axis (otherwise the U-corridor
// would still have to cut across the middle of the diagram).
function perimeterPath(p1, p2, leftX, bottomY) {
  const vDir = d => ({ top:[0,-1], bottom:[0,1], left:[-1,0], right:[1,0] }[d] || [0,1]);
  const stub = 14;
  const [vx1, vy1] = vDir(p1.dir);
  const [vx2, vy2] = vDir(p2.dir);
  const s1x = p1.x + vx1*stub, s1y = p1.y + vy1*stub;
  const s2x = p2.x + vx2*stub, s2y = p2.y + vy2*stub;

  // p1 → stub → leftX (down to bottomY) → across bottom to s2x → up to target stub → p2
  const points = [
    [p1.x, p1.y],
    [s1x, s1y],
    [leftX, s1y],
    [leftX, bottomY],
    [s2x, bottomY],
    [s2x, s2y],
    [p2.x, p2.y],
  ];
  return roundedPolyline(points, 6);
}

// Orthogonal (right-angle) path with rounded corners between two edge points
function orthPath(p1, p2) {
  const stub = 14;
  const vDir = d => ({ top:[0,-1], bottom:[0,1], left:[-1,0], right:[1,0] }[d] || [0,1]);
  const [vx1, vy1] = vDir(p1.dir);
  const [vx2, vy2] = vDir(p2.dir);
  const s1x = p1.x + vx1 * stub, s1y = p1.y + vy1 * stub;
  const s2x = p2.x + vx2 * stub, s2y = p2.y + vy2 * stub;
  const v1 = (p1.dir === 'top' || p1.dir === 'bottom');
  const v2 = (p2.dir === 'top' || p2.dir === 'bottom');

  const corners = [];
  corners.push([p1.x, p1.y]);
  corners.push([s1x, s1y]);

  if (v1 && v2) {
    const midY = (s1y + s2y) / 2;
    corners.push([s1x, midY]);
    corners.push([s2x, midY]);
  } else if (!v1 && !v2) {
    const midX = (s1x + s2x) / 2;
    corners.push([midX, s1y]);
    corners.push([midX, s2y]);
  } else if (v1) {                          // p1 vertical → p2 horizontal
    // Drop fully at source column, then turn at target's row (trunk + branch).
    // Avoids stacking vertical descents at the target column when several lines
    // share a target column.
    corners.push([s1x, s2y]);
  } else {                                  // p1 horizontal → p2 vertical
    // Reach up/down at target's column, after a brief horizontal stub.
    corners.push([s2x, s1y]);
  }

  corners.push([s2x, s2y]);
  corners.push([p2.x, p2.y]);

  return roundedPolyline(corners, 6);
}

// Build an SVG path string that connects waypoints with right angles + soft corner radii
function roundedPolyline(pts, radius) {
  // de-dup consecutive identical points
  const uniq = pts.filter((p, i) => i === 0 || p[0] !== pts[i-1][0] || p[1] !== pts[i-1][1]);
  if (uniq.length < 2) return '';
  if (uniq.length === 2) {
    return `M ${uniq[0][0]} ${uniq[0][1]} L ${uniq[1][0]} ${uniq[1][1]}`;
  }
  let d = `M ${uniq[0][0]} ${uniq[0][1]}`;
  for (let i = 1; i < uniq.length - 1; i++) {
    const [px, py] = uniq[i - 1];
    const [cx, cy] = uniq[i];
    const [nx, ny] = uniq[i + 1];
    const len1 = Math.hypot(cx - px, cy - py);
    const len2 = Math.hypot(nx - cx, ny - cy);
    const r = Math.min(radius, len1 * 0.5, len2 * 0.5);
    if (r < 1.5 || len1 === 0 || len2 === 0) {
      d += ` L ${cx} ${cy}`;
      continue;
    }
    const ux1 = (cx - px) / len1, uy1 = (cy - py) / len1;
    const ux2 = (nx - cx) / len2, uy2 = (ny - cy) / len2;
    const bx = cx - ux1 * r, by = cy - uy1 * r;
    const ax = cx + ux2 * r, ay = cy + uy2 * r;
    d += ` L ${bx} ${by} Q ${cx} ${cy} ${ax} ${ay}`;
  }
  const last = uniq[uniq.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

// ── Draw connections (orthogonal + modest edge distribution) ──
function drawConns() {
  const svg  = document.getElementById('conn-svg');
  const wrap = document.getElementById('topo-wrap');
  if (!svg || !wrap) return;
  const w = Math.max(wrap.scrollWidth,  wrap.clientWidth);
  const h = Math.max(wrap.scrollHeight, wrap.clientHeight);
  svg.setAttribute('width',  w);
  svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.style.width  = w + 'px';
  svg.style.height = h + 'px';
  [...svg.querySelectorAll('path')].forEach(p => p.remove());

  // Phase 1: gather rects for every node we need
  const rects = {};
  CONNS.forEach(({ a, b }) => {
    [a, b].forEach(id => {
      if (!rects[id]) {
        const el = document.getElementById(id);
        if (el) rects[id] = getRect(el, wrap);
      }
    });
  });

  // Phase 2: pick a side at each end of each connection, bucket by (node, side)
  const buckets = {};
  const processed = CONNS.map((conn, ci) => {
    const ra = rects[conn.a], rb = rects[conn.b];
    if (!ra || !rb) return null;
    const aSide = resolveSide(conn.aSide, ra, rb);
    const bSide = resolveSide(conn.bSide, rb, ra);
    const itm = { conn, ci, aSide, bSide };
    if (!buckets[conn.a])        buckets[conn.a] = {};
    if (!buckets[conn.a][aSide]) buckets[conn.a][aSide] = [];
    buckets[conn.a][aSide].push({ itm, end: 'a', target: { cx: rb.cx, cy: rb.cy } });
    if (!buckets[conn.b])        buckets[conn.b] = {};
    if (!buckets[conn.b][bSide]) buckets[conn.b][bSide] = [];
    buckets[conn.b][bSide].push({ itm, end: 'b', target: { cx: ra.cx, cy: ra.cy } });
    return itm;
  });

  // Phase 3: distribute exit positions within the middle 50% of each side
  // sorted by target perpendicular coord so lines fan out without crossing at the source
  const slice = {};
  for (const nid in buckets) {
    for (const side in buckets[nid]) {
      const list = buckets[nid][side];
      const horiz = (side === 'top' || side === 'bottom');
      list.sort((p, q) => horiz ? p.target.cx - q.target.cx : p.target.cy - q.target.cy);
      const n = list.length;
      list.forEach((entry, idx) => {
        const t = n === 1 ? 0.5 : idx / (n - 1);
        const ci = entry.itm.ci;
        if (!slice[ci]) slice[ci] = {};
        slice[ci][entry.end] = t;
      });
    }
  }

  // Phase 3b: assign corridor lanes for connections that requested left/right/perimeter routing.
  // Each line gets its own X column in the outer corridor, sorted by source y so adjacent lines
  // stay parallel. Lane base sits in the empty space outside the actual diagram content.
  const LANE_SPACING = 12;
  const corridorLane = {};
  // Find the actual diagram content's bounds so corridor lanes sit OUTSIDE all nodes.
  let contentMinX = w, contentMaxX = 0, contentMaxY = 0;
  for (const id in rects) {
    contentMinX = Math.min(contentMinX, rects[id].x);
    contentMaxX = Math.max(contentMaxX, rects[id].x + rects[id].w);
    contentMaxY = Math.max(contentMaxY, rects[id].y + rects[id].h);
  }
  // Corridor anchors: 22px outside the leftmost/rightmost/bottommost node, clamped inside the wrapper.
  const leftAnchor   = Math.max(15, contentMinX - 22);
  const rightAnchor  = Math.min(w - 15, contentMaxX + 22);
  const bottomAnchor = Math.min(h - 15, contentMaxY + 28);

  const leftCorridorItems  = processed.filter(itm => itm && itm.conn.corridor === 'left')
                                      .sort((a,b) => rects[a.conn.a].cy - rects[b.conn.a].cy);
  const rightCorridorItems = processed.filter(itm => itm && itm.conn.corridor === 'right')
                                      .sort((a,b) => rects[a.conn.a].cy - rects[b.conn.a].cy);
  const perimeterItems     = processed.filter(itm => itm && itm.conn.corridor === 'left-bottom')
                                      .sort((a,b) => rects[a.conn.a].cy - rects[b.conn.a].cy);

  leftCorridorItems.forEach((itm, i) => {
    // Innermost lane sits at the anchor; subsequent lanes step OUTward (toward the wrap edge).
    corridorLane[itm.ci] = Math.max(8, leftAnchor - i * LANE_SPACING);
  });
  rightCorridorItems.forEach((itm, i) => {
    corridorLane[itm.ci] = Math.min(w - 8, rightAnchor + i * LANE_SPACING);
  });
  // Perimeter lines share the leftmost lane band — pushed further out so they don't
  // collide with the plain left-corridor lines.
  perimeterItems.forEach((itm, i) => {
    corridorLane[itm.ci] = Math.max(8, leftAnchor - (leftCorridorItems.length + i + 1) * LANE_SPACING);
  });

  // Phase 4: draw each path — corridor / perimeter routing if hinted, otherwise orthogonal
  processed.forEach(itm => {
    if (!itm) return;
    const { conn, ci, aSide, bSide } = itm;
    const s = slice[ci] || {};
    const p1 = pointOnSide(rects[conn.a], aSide, s.a ?? 0.5);
    const p2 = pointOnSide(rects[conn.b], bSide, s.b ?? 0.5);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let d;
    if (conn.corridor === 'left-bottom') {
      d = perimeterPath(p1, p2, corridorLane[ci], bottomAnchor);
    } else if (corridorLane[ci] !== undefined) {
      d = corridorPath(p1, p2, corridorLane[ci]);
    } else {
      d = orthPath(p1, p2);
    }
    path.setAttribute('d', d);
    path.setAttribute('class', 'cl ' + conn.cls);
    path.setAttribute('data-i', ci);
    path.setAttribute('data-a', conn.a);
    path.setAttribute('data-b', conn.b);
    if (conn.arr) path.setAttribute('marker-end', `url(#${conn.arr})`);
    svg.appendChild(path);
  });

  // Re-apply highlight if a node is currently selected
  if (activeNode) highlightConns('n-' + activeNode.dataset.node);
}

// ── Connection highlighting ───────────────────────────────────
function highlightConns(nodeId) {
  // Clicking a node is a single-selection intent — exit show-all mode if on.
  clearShowAll();
  // Collect all node IDs directly connected to this one
  const lit = new Set([nodeId]);
  CONNS.forEach(c => {
    if (c.a === nodeId) lit.add(c.b);
    if (c.b === nodeId) lit.add(c.a);
  });

  // Lines
  document.querySelectorAll('#conn-svg path').forEach(path => {
    const connected = path.getAttribute('data-a') === nodeId || path.getAttribute('data-b') === nodeId;
    path.classList.toggle('cl-active', connected);
    path.classList.toggle('cl-dim',    !connected);
  });

  // Nodes — mark connected ones so they stay bright
  document.querySelectorAll('.node[data-node]').forEach(node => {
    node.classList.toggle('conn-lit', lit.has('n-' + node.dataset.node));
  });

  // Light up the VLAN chips this node lives on (via NODE_VLAN); explicitly clear
  // all others so a previously-selected chip's `ss-lit` doesn't bleed into a
  // subsequent node click.
  const myVlans = new Set(NODE_VLAN[nodeId] || []);
  document.querySelectorAll('.ss-chip[data-vlan]').forEach(chip => {
    chip.classList.toggle('ss-lit', myVlans.has(chip.dataset.vlan));
  });

  document.getElementById('topo-wrap').classList.add('has-selection');
}

function resetConns() {
  document.querySelectorAll('#conn-svg path').forEach(p => p.classList.remove('cl-active', 'cl-dim'));
  document.querySelectorAll('.node').forEach(n => n.classList.remove('conn-lit'));
  document.querySelectorAll('.ss-chip').forEach(c => c.classList.remove('ss-lit'));
  document.getElementById('topo-wrap')?.classList.remove('has-selection');
  clearShowAll();
}

// ── "Show all connections" toggle ─────────────────────────────
// Reuses the same CSS state classes the per-node highlighter uses, but applies
// them to every node / connector / chip simultaneously. Because every element
// ends up "lit," the dim CSS rules (which only target unlit elements) have
// nothing left to dim — so visually everything glows.
function showAllConns() {
  document.querySelectorAll('#conn-svg path').forEach(p => {
    p.classList.add('cl-active');
    p.classList.remove('cl-dim');
  });
  document.querySelectorAll('.node[data-node]').forEach(n => n.classList.add('conn-lit'));
  document.querySelectorAll('.ss-chip[data-vlan]').forEach(c => c.classList.add('ss-lit'));
  document.getElementById('topo-wrap')?.classList.add('has-selection');
  const btn = document.getElementById('show-all-conns');
  if (btn) { btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); btn.textContent = 'Reset view'; }
}

function clearShowAll() {
  const btn = document.getElementById('show-all-conns');
  if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); btn.textContent = 'Show all connections'; }
}

document.getElementById('show-all-conns')?.addEventListener('click', () => {
  const btn = document.getElementById('show-all-conns');
  if (btn.classList.contains('active')) {
    // Already showing everything — turn off and return to default view.
    resetConns();
  } else {
    // Close any open per-node panel first so single-selection state doesn't
    // bleed into the show-all view.
    if (panel.classList.contains('open')) closePanel();
    showAllConns();
  }
});

// ── Build "Devices on this VLAN" section ──────────────────────
const VLAN_ROLES = {
  internet: {
    'n-opnsense':  'Gateway 10.0.0.1 · DHCP · DNS forwarder → AdGuard',
    'n-switch':    'Port 2 native (untagged) VLAN',
    'n-tailscale': 'Advertises 10.0.0.0/24 to the tailnet',
  }
};

// Color a member by what kind of role they play on this VLAN
function memberColor(nid) {
  if (nid === 'n-opnsense')  return 'var(--red)';     // gateway / firewall
  if (nid === 'n-switch')    return 'var(--purple)';  // trunk carrier
  if (nid === 'n-tailscale') return 'var(--blue)';    // subnet advertiser
  return 'var(--yellow)';                              // resident device
}

// Ordered so gateway/trunk/tailscale show first, then residents
const MEMBER_ORDER = [
  'n-opnsense','n-switch','n-tailscale',
  'n-adguard','n-unifi-os','n-homarr',
  'n-reports','n-claude-cli','n-msmtp','n-ngrok','n-webhook',
];

function buildVlanConnSection(vlanId) {
  const roleMap = VLAN_ROLES[vlanId] || {};
  const members = MEMBER_ORDER.filter(nid =>
    (NODE_VLAN[nid] || []).includes(vlanId)
  );
  if (!members.length) return '';

  const rows = members.map(nid => {
    const node  = NODE_NAMES[nid] || { name: nid, ico: '?' };
    const role  = roleMap[nid] || 'Member of this VLAN';
    const color = memberColor(nid);
    return `<div class="conn-item">
      <div class="conn-dot" style="background:${color};box-shadow:0 0 5px ${color}"></div>
      <div class="conn-info">
        <span class="conn-name">${node.ico} ${node.name}</span>
        <span class="conn-desc">${role}</span>
      </div>
    </div>`;
  }).join('');

  return `<div class="panel-section"><h3>Devices on this VLAN</h3><div class="conn-list">${rows}</div></div>`;
}

// ── Build connections panel section ───────────────────────────
function buildConnSection(nodeId) {
  const fullId = 'n-' + nodeId;
  const relevant = CONNS.filter(c => c.a === fullId || c.b === fullId);
  if (!relevant.length) return '';

  const rows = relevant.map(c => {
    const isSource = c.a === fullId;
    const otherId  = isSource ? c.b : c.a;
    const other    = NODE_NAMES[otherId] || { name: otherId, ico: '?' };
    const meta     = CLS_META[c.cls]    || { color: 'var(--muted)', label: '' };
    const arrow    = isSource ? '→' : '←';
    return `<div class="conn-item">
      <div class="conn-dot" style="background:${meta.color};box-shadow:0 0 5px ${meta.color}"></div>
      <span class="conn-arrow" style="color:${meta.color}">${arrow}</span>
      <div class="conn-info">
        <span class="conn-name">${other.ico} ${other.name}</span>
        <span class="conn-desc">${c.label}</span>
      </div>
    </div>`;
  }).join('');

  return `<div class="panel-section"><h3>Connections</h3><div class="conn-list">${rows}</div></div>`;
}

window.addEventListener('load', () => setTimeout(drawConns, 120));
new ResizeObserver(() => drawConns()).observe(document.getElementById('topo-wrap') || document.body);