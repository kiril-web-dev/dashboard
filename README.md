# Dashboard

Scenarios:

1. No Login (initial visiting)
 * No Cookies -> Load Default Settings
 * Yes Cookies -> Load User Settings (get from client cookies)
2. Yes Login (log in or persist session)
 * No Setting s Provided -> Goto 'No Login'
 * Yes Settings -> Load User Settings (get from profile/db)

API:
* server: node ./server/index.js
* url: http://localhost:3333/dashboard/
* resources:
 * get default settings: GET 'default'
 * get widget content: GET 'widgets/:id'
 * get widget settings: GET 'settings/:id'
 * get app content: GET 'app/:id'
