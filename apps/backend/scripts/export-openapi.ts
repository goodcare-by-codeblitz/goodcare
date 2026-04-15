import { app } from '../server.js';

await app.ready();
const spec = app.swagger();
process.stdout.write(JSON.stringify(spec, null, 2));
await app.close();
