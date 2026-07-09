const dns = require('dns');

const tlds = [
  'ai', 'com', 'net', 'org', 'co', 'info', 'tech', 'pro', 'dev', 'top', 'vip', 'link', 'site', 'space', 'online', 'cc', 'me', 'io',
  'cn', 'xyz', 'icu', 'work', 'fun', 'pub', 'run', 'win', 'club', 'space', 'com.cn', 'net.cn', 'org.cn'
];

async function check() {
  for (const tld of tlds) {
    const hosts = [
      `api.agnesapi.${tld}`,
      `agnesapi.${tld}`,
      `api.agnes-api.${tld}`,
      `agnes-api.${tld}`,
      `api.agnes.${tld}`
    ];
    
    for (const h of hosts) {
      dns.resolve4(h, (err, addresses) => {
        if (!err) {
          console.log(`FOUND RESOLVING HOST: ${h} -> ${addresses}`);
        }
      });
    }
  }
}

check();
