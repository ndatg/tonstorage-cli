# TON Storage CLI

TON Storage CLI is a Node.js application that you can use to connect to and interact with `storage-daemon`.

Go to the [documentation](https://ndatg.github.io/tonstorage-cli/) for detailed information.

## Installation

```bash
npm install tonstorage-cli --save
```

```js
import { TonstorageCLI } from "tonstorage-cli";

const tonstorage = new TonstorageCLI({
  bin: "/root/storage-daemon-cli",
  host: "127.0.0.1:5555",
  database: "/var/ton-storage",
  timeout: 5000,
});
```

## License

Released under the MIT License.
