const dns = require('dns');

const tlds = ['ai', 'com', 'net', 'org', 'co', 'info', 'tech', 'pro', 'dev', 'top', 'vip', 'link', 'site', 'space', 'online', 'cc', 'me', 'io'];

async function check() {
  for (const tld of tlds) {
    const host = `api.agnes.${tld}`;
    const host2 = `api.agnesapi.${tld}`;
    const host3 = `agnesapi.${tld}`;
    const host4 = `agnes-api.${tld}`;
    
    for (const h of [host, host2, host3, host4]) {
      dns.resolve4(h, (err, addresses) => {
        if (!err) {
          console.log(`FOUND RESOLVING HOST: ${h} -> ${addresses}`);
        }
      });
    }
  }
}

check();
