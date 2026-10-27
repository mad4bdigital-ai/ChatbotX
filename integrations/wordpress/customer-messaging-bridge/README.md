# Customer Messaging Bridge — WordPress adapter

A minimal WordPress plugin integrating an existing ChatbotX Webchat channel
with ETG WooCommerce Lab.

Status (2026-10-27): deployed and enabled on the ETG WooCommerce Lab site-copy.
Tested with PHP lint, read-only WordPress checks and standalone unit checks.
No changes to ETG production WordPress or the ChatbotX stable branch.

## Deployment

Install customer-messaging-bridge under wp-content/plugins/, activate it in
WordPress and open Settings > Customer Messaging.

Configure a real workspace ID and Webchat ID returned by ChatbotX. The
integration origin is hardcoded to https://chatbotx.mad4b.com rather than
user-configurable to prevent an untrusted script source or SSRF.

The deployed test fixture uses:

- Workspace: MAD4B Digital — 11755877814459770
- Webchat: ETG WooCommerce Lab — 11755877814902375
- WordPress local Lab: http://localhost:8091/
- Allowed ChatbotX embedding hosts: localhost and
  jdj8d534-8091.euw.devtunnels.ms (the latter is not guaranteed online)

The official remote widget script (/chat-widget/plugin.js) is loaded once in
the WordPress footer with public workspace and Webchat IDs. The shortcode
[customer_messaging_webchat] adds only an anchor and never duplicates the
script bootstrap.

## Security and scope

- WordPress settings writes and test actions require manage_options and
  WordPress nonces.
- API origin is fixed. Resource IDs must be digits. Color must be #RRGGBB.
- No secrets enter HTML; the ChatbotX script is served with CORS headers.
- No customer, order or payment details are transmitted by this plugin.
- Maintain a concrete ChatbotX embedding-domain allowlist; an empty list in
  the deployed application allows arbitrary embedding.
- An optional WooCommerce order status-change log stores only transition
  labels and UTC timestamps, capped at 30 local WordPress option rows.
- WooCommerce to external CRM sync stays OFF. Implement only after reviewing
  tenant-scoped authorization, consent/data minimization, idempotency, replay
  and rate limit policy.
- Plugin development does not change the pinned ChatbotX Production SHA.

## Verification

    php -l integrations/wordpress/customer-messaging-bridge/customer-messaging-bridge.php
    php integrations/wordpress/customer-messaging-bridge/tests/standalone.php

The homepage HTML should contain /chat-widget/plugin.js exactly once.
A manual browser test must still verify: chat bubble click, iframe, guest
conversation behavior, and console errors. HTML/API tests alone are not a
complete end-to-end test.

The WordPress Lab is on VPS loopback port 8091. Use an authorized SSH
tunnel or live dev preview to browse it from another computer.
