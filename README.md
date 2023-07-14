# TON Storage CLI

TON Storage CLI is a Node.js application that you can use to connect to and interact with `storage-daemon`.

Go to the [documentation](https://ndatg.github.io/tonstorage-cli/) for detailed information.

## Installation

```bash
npm install tonstorage-cli --save
```

```js
import { TonstorageCLI } from "tonstorage-cli";

const CLI = new TonstorageCLI(
  "/root/storage-daemon-cli",
  "127.0.0.1:5555",
  "/var/ton-storage",
  5000
);
```

## License

Released under the MIT License.
