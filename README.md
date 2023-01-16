# TON Storage CLI

TON Storage CLI is a Node.js application that you can use to connect to and interact with `storage-daemon`.

## Overview

| Method                                      	| Description                                                                                      	|
|---------------------------------------------	|--------------------------------------------------------------------------------------------------	|
| **MAIN**                                    	|                                                                                                  	|
| [`run`](#run)                               	| executes a command                                                                               	|
| **CLI**                                     	|                                                                                                  	|
| [`list`](#list)                             	| returns a list of BAG                                                                            	|
| [`get`](#get)                               	| returns information about a BAG                                                                  	|
| [`getPeers`](#getPeers)                     	| returns a list of peers                                                                          	|
| [`create`](#create)                         	| creates a BAG of files from a file or directory                                                  	|
| [`addByHash`](#addByHash)                   	| adds a BAG with a given id                                                                       	|
| [`addByMeta`](#addByMeta)                   	| loads a meta from a file and adds a BAG                                                          	|
| [`getMeta`](#getMeta)                       	| saves a meta of BAG to a file                                                                    	|
| [`remove`](#remove)                         	| removes a BAG                                                                                    	|
| [`downloadPause`](#downloadPause)           	| pauses download of BAG                                                                           	|
| [`downloadResume`](#downloadResume)         	| resumes download of BAG                                                                          	|
| [`uploadPause`](#uploadPause)               	| pauses upload of BAG                                                                             	|
| [`uploadResume`](#uploadResume)             	| resumes upload of BAG                                                                            	|
| [`priorityAll`](#priorityAll)               	| sets a priority of all files in a BAG                                                            	|
| [`priorityName`](#priorityName)             	| sets a file priority by name in a BAG                                                            	|
| [`priorityIdx`](#priorityIdx)               	| sets a file priority by id in a BAG                                                              	|
| **PROVIDER**                                	|                                                                                                  	|
| [`deployProvider`](#deployProvider)         	| initializes a storage provider by deploying a new provider smart contract                        	|
| [`getProviderInfo`](#getProviderInfo)       	| returns information about a storage provider                                                     	|
| [`setProviderConfig`](#setProviderConfig)   	| sets a configuration parameters                                                                  	|
| [`getProviderParams`](#getProviderParams)   	| returns a parameters of smart contract                                                           	|
| [`setProviderParams`](#setProviderParams)   	| sets a parameters of smart contract                                                              	|
| [`newContractMessage`](#newContractMessage) 	| creates a new contract message for a storage provider and saves a message body to a file         	|
| [`closeContract`](#closeContract)           	| closes a storage contract and deletes a BAG (if possible)                                        	|
| [`withdraw`](#withdraw)                     	| sends a bounty from a storage contract to a main contract                                        	|
| [`withdrawAll`](#withdrawAll)               	| sends a bounty from all storage contracts (where at least 1 TON is available) to a main contract 	|
| [`sendCoins`](#sendCoins)                   	| sends an amount in nanoTON to an address from a main contract                                    	|


## Setup

### Installation

```bash
npm install tonstorage-cli --save
```

### Initialization

```js
  const TonstorageCLI = require('tonstorage-cli');

  const CLI = new TonstorageCLI({
    bin: '/root/storage-daemon-cli',
    host: '127.0.0.1:5555',
    database: '/var/ton-storage',
    timeout: 5000,
  });
```

---

## Main

### `run`

```async run(cmd, options = { timeout: 5000 })```

**Example:**
```js
  const list = await CLI.run('list');
  const get = await CLI.run('get 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE', { timeout: 10000 });
  const addByHash = await CLI.run('add-by-hash 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE --partial 10. O Come, O Come Emmanuel.flac');
```

___

## CLI

### `list`

```async list()```

**Example:**
```js
  const list = await CLI.list();
```

___

### `get`

```async get(index)```

**Example:**
```js
  const get = await CLI.get('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
```

___

### `getPeers`

```async getPeers(index)```

**Example:**
```js
  const getPeers = await CLI.getPeers('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
```

___

### `create`

```async create(path, options = { upload: true, copy: false, description: null })```

**Example:**
```js
  const create = await CLI.create('/root/temp', { upload: false, copy: true, description: 'my test description' });
```

___

### `addByHash`

```async addByHash(hash, options = { download: false, upload: true, rootDir: null, partialFiles: [] })```

**Example:**
```js
  const addByHash = await CLI.addByHash('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', {
    download: false,
    upload: false,
    partialFiles: [
      'readme.md',
    ],
  });
```

___

### `addByMeta`

```async addByMeta(path, options = { download: false, upload: true, rootDir: null, partialFiles: [] })```

**Example:**
```js
  const addByMeta = await CLI.addByMeta('/root/meta-file', {
    download: false,
    upload: false,
    partialFiles: [
      'readme.md',
    ],
  });
```

___

### `getMeta`

```async getMeta(index, path)```

**Example:**
```js 
  const getMeta = await CLI.getMeta('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', '/root/meta-file');
```

___

### `remove`

```async remove(index, options = { removeFiles: false })```

**Example:**
```js
  const remove = await CLI.remove('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', { removeFiles: false });
```

___

### `downloadPause`

```async downloadPause(index)```

**Example:**
```js
  const downloadPause = await CLI.downloadPause('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
```

___

### `downloadResume`

```async downloadResume(index)```

**Example:**
```js
  const downloadResume = await CLI.downloadResume('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
```

___

### `uploadPause`

```async uploadPause(index)```

**Example:**
```js
  const uploadPause = await CLI.uploadPause('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
```

___

### `uploadResume`

```async uploadResume(index)```

**Example:**
```js
  const uploadResume = await CLI.uploadResume('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
```

___

### `priorityAll`

```async priorityAll(index, priority)```

**Example:**
```js
  const priorityAll = await CLI.priorityAll('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', 3);
```

___

### `priorityName`

```async priorityName(index, name, priority)```

**Example:**
```js
  const priorityName = await CLI.priorityName('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', 'readme.md', 4);
```

___

### `priorityIdx`

```async priorityIdx(index, fileId, priority)```

**Example:**
```js
  const priorityIdx = await CLI.priorityIdx('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', 0, 5);
```

___

## Provider

### `deployProvider`

```async deployProvider()```

**Example:**
```js
  const deployProvider = await CLI.deployProvider();
```

___

### `getProviderInfo`

```async getProviderInfo(options = { contracts: true, balances: true })```

**Example:**
```js
  const getProviderInfo = await CLI.getProviderInfo();
```

___

### `setProviderConfig`

```async setProviderConfig(maxContracts, maxTotalSize)```

**Example:**
```js
  const setProviderConfig = await CLI.setProviderConfig(98, 300000000000);
```

___

### `getProviderParams`

```async getProviderParams(providerAddress = null)```

**Example:**
```js
  const getProviderParams = await CLI.getProviderParams('0:3D34FF8D7E3665BBAF9092C967318A310FFC760F59FBB620CF20CC40B0EB51A9');
```

___

### `setProviderParams`

```async setProviderParams(accept, rate, maxSpan, minFileSize, maxFileSize)```

**Example:**
```js
  const setProviderParams = await CLI.setProviderParams(1, 1000000000, 86400, 1024, 1000000000);
```

___

### `newContractMessage`

```async newContractMessage(torrent, queryId, providerAddress)```

**Example:**
```js
  const newContractMessage = await CLI.newContractMessage(
    'A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B',
    0,
    '0:3D34FF8D7E3665BBAF9092C967318A310FFC760F59FBB620CF20CC40B0EB51A9',
  );
```

___

### `closeContract`

```async closeContract(address)```

**Example:**
```js
  const closeContract = await CLI.closeContract('0:067A0AE1B039DDE9297BE176318BDB236F4D74819E10D4BB442DBAAD55ABF090');
```

___

### `withdraw`

```async withdraw(address)```

**Example:**
```js
  const withdraw = await CLI.withdraw('0:067A0AE1B039DDE9297BE176318BDB236F4D74819E10D4BB442DBAAD55ABF090');
```

___

### `withdrawAll`

```async withdrawAll()```

**Example:**
```js
  const withdrawAll = await CLI.withdrawAll();
```

___

### `sendCoins`

```async sendCoins(address, amount, options = { message: null })```

**Example:**
```js
  const sendCoins = await CLI.sendCoins('0:067A0AE1B039DDE9297BE176318BDB236F4D74819E10D4BB442DBAAD55ABF090', 1000000000, 'text');
```

___

## License

Released under the [MIT License](LICENSE).
