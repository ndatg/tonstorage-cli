const util = require('util');
const childProcess = require('child_process');
const { resolve } = require('path');
const { tmpdir } = require('os');
const crypto = require('crypto');
const fs = require('fs');

const fsPromise = fs.promises;
const exec = util.promisify(childProcess.exec);

module.exports = class TonstorageCLI {
  constructor(options) {
    this.bin = options.bin;
    this.host = options.host;
    this.database = options.database;
    this.timeout = options.timeout;
    this.maxBuffer = options.maxBuffer;
  }

  // main
  async run(cmd, options = {}) {
    try {
      const std = await exec(
        `${this.bin} -v 0 -I ${this.host} -k ${this.database}/cli-keys/client -p ${this.database}/cli-keys/server.pub --cmd "${cmd}"`, { 
          timeout: options.timeout ? options.timeout : this.timeout,         
          maxBuffer: options.maxBuffer ? options.maxBuffer : this.maxBuffer },
      );

      return { stdout: std.stdout, stderr: '' };
    } catch (e) {
      const stderr = [];

      if (e.signal && e.signal === 'SIGTERM') {
        stderr.push('error: timeout');
      }

      e.stdout = e.stdout.split('\n');
      if (/invalid|error|unknown|failed/i.test(e.stdout[0])) {
        stderr.push(e.stdout[0]);
      }

      stderr.push(e.stderr);

      return { stdout: '', stderr: stderr.join('/n').replaceAll('/n', ' ').trim() };
    }
  }

  async response(cmd) {
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    try {
      return { ok: true, result: JSON.parse(std.stdout), code: 0 };
    } catch (e) {
      return { ok: false, error: `error: ${e.message}`, code: 400 };
    }
  }

  // cli
  async list() {
    const cmd = 'list --json';

    const res = await this.response(cmd);
    return res;
  }

  async get(index) {
    const cmd = `get ${index} --json`;

    const res = await this.response(cmd);
    return res;
  }

  async getPeers(index) {
    const cmd = `get-peers ${index} --json`;

    const res = await this.response(cmd);
    return res;
  }

  async create(path, options = { upload: true, copy: false, description: null }) {
    const cmd = `create '${path}' --json ${!options.upload ? '--no-upload' : ''} `
      + `${options.copy ? '--copy' : ''} `
      + `${options.description ? `-d '${options.description}'` : ''}`;

    const res = await this.response(cmd);
    return res;
  }

  async addByHash(hash, options = {
    download: false, upload: true, rootDir: null, partialFiles: [],
  }) {
    const cmd = `add-by-hash --json ${hash} ${!options.upload ? '--no-upload ' : ''}`
      + `${!options.download ? '--paused ' : ''}`
      + `${options.rootDir ? `-d ${options.rootDir} ` : ''}`
      + `${options.partialFiles && options.partialFiles.length > 0 ? `--partial ${options.partialFiles.join(' ')}` : ''}`;

    const res = await this.response(cmd);
    return res;
  }

  async addByMeta(path, options = {
    download: false, upload: true, rootDir: null, partialFiles: [],
  }) {
    const cmd = `add-by-meta --json ${path} ${!options.upload ? '--no-upload ' : ''}`
      + `${!options.download ? '--paused ' : ''}`
      + `${options.rootDir ? `-d ${options.rootDir} ` : ''}`
      + `${options.partialFiles && options.partialFiles.length > 0 ? `--partial ${options.partialFiles.join(' ')}` : ''}`;

    const res = await this.response(cmd);
    return res;
  }

  async getMeta(index, path) {
    const SIZE_REGEXP = /saved\smeta\s\((?<size>[0-9]+\s\w+)\)/i;
    const SUCCESS_REGEXP = /saved\smeta/i;

    const cmd = `get-meta ${index} ${path}`;
    const std = await this.run(cmd);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
    }

    const sizeMatch = SIZE_REGEXP.exec(std.stdout);
    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
        size: (sizeMatch && sizeMatch.groups) ? sizeMatch.groups.size : null,
      },
      code: 0,
    };
  }

  async remove(index, options = { removeFiles: false }) {
    const SUCCESS_REGEXP = /success/i;

    const cmd = `remove ${index}${options.removeFiles ? ' --remove-files' : ''}`;
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async downloadPause(index) {
    const SUCCESS_REGEXP = /success/i;

    const cmd = `download-pause ${index}`;
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async downloadResume(index) {
    const SUCCESS_REGEXP = /success/i;

    const cmd = `download-resume ${index}`;
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async uploadPause(index) {
    const SUCCESS_REGEXP = /success/i;

    const cmd = `upload-pause ${index}`;
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async uploadResume(index) {
    const SUCCESS_REGEXP = /success/i;

    const cmd = `upload-resume ${index}`;
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async priorityAll(index, priority) {
    const SUCCESS_REGEXP = /priority\swas\sset/i;

    const cmd = `priority-all ${index} ${priority}`;
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async priorityName(index, name, priority) {
    const SUCCESS_REGEXP = /priority\swas\sset/i;

    const cmd = `priority-name ${index} '${name}' ${priority}`;
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async priorityIdx(index, fileId, priority) {
    const SUCCESS_REGEXP = /priority\swas\sset/i;

    const cmd = `priority-idx ${index} ${fileId} ${priority}`;
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  // provider
  async deployProvider() {
    const ADDRESS_REGEXP = /address:\s(?<address>[-1|0]:[A-F0-9]{64})/i;
    const NON_BOUNCEABLE_ADDRESS_REGEXP = /non-bounceable\saddress:\s(?<nonBounceableAddress>[A-Z0-9/+]{48})/i;

    const cmd = 'deploy-provider';
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const addressMatch = ADDRESS_REGEXP.exec(std.stdout);
    const nonBounceableAddressMatch = NON_BOUNCEABLE_ADDRESS_REGEXP.exec(std.stdout);

    return {
      ok: true,
      result: {
        address: (addressMatch && addressMatch.groups) ? addressMatch.groups.address : null,
        nonBounceableAddress: (nonBounceableAddressMatch && nonBounceableAddressMatch.groups) ? nonBounceableAddressMatch.groups.nonBounceableAddress : null,
      },
      code: 0,
    };
  }

  async getProviderInfo(options = { contracts: true, balances: true }) {
    const cmd = `get-provider-info --json ${options.contracts ? '--contracts' : ''} ${options.balances ? '--balances' : ''}`;

    const res = await this.response(cmd);
    return res;
  }

  async setProviderConfig(maxContracts, maxTotalSize) {
    const SUCCESS_REGEXP = /storage\sprovider\sconfig\swas\supdated/i;

    const cmd = `set-provider-config --max-contracts ${maxContracts} --max-total-size ${maxTotalSize}`;
    const std = await this.run(cmd);
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async getProviderParams(providerAddress = null) {
    const cmd = `get-provider-params --json ${providerAddress ? `${providerAddress}` : ''}`;

    const res = await this.response(cmd);
    return res;
  }

  async setProviderParams(accept, rate, maxSpan, minFileSize, maxFileSize) {
    const SUCCESS_REGEXP = /storage\sprovider\sparameters\swere\supdated/i;

    const cmd = `set-provider-params --accept ${accept} --rate ${rate} --max-span ${maxSpan} --min-file-size ${minFileSize} --max-file-size ${maxFileSize}`;
    const std = await this.run(cmd, { timeout: 30000 });
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async newContractMessage(torrent, queryId, providerAddress) {
    const RATE_REGEXP = /rate\s\(nanoton\sper\smb\*day\):\s(?<rate>[0-9]+)/i;
    const MAX_SPAN_REGEXP = /max\sspan:\s(?<maxSpan>[0-9]+)/i;

    const tempFilePath = resolve(tmpdir(), crypto.randomBytes(6).readUIntLE(0, 6).toString(36));

    const cmd = `new-contract-message ${torrent} ${tempFilePath} --query-id ${queryId} --provider ${providerAddress}`;
    const std = await this.run(cmd, { timeout: 30000 });
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const rateMatch = RATE_REGEXP.exec(std.stdout);
    const maxSpanMatch = MAX_SPAN_REGEXP.exec(std.stdout);

    let payload = '';
    try {
      payload = await fsPromise.readFile(tempFilePath, { encoding: 'base64' });
      await fsPromise.rm(tempFilePath);
    } catch (e) {
      return { ok: false, error: `error: ${e.message}`, code: 400 };
    }

    return {
      ok: true,
      result: {
        payload,
        rate: (rateMatch && rateMatch.groups) ? parseInt(rateMatch.groups.rate, 10) : null,
        maxSpan: (maxSpanMatch && maxSpanMatch.groups) ? parseInt(maxSpanMatch.groups.maxSpan, 10) : null,
      },
      code: 0,
    };
  }

  async closeContract(address) {
    const SUCCESS_REGEXP = /closing\sstorage\scontract/i;

    const cmd = `close-contract ${address}`;
    const std = await this.run(cmd, { timeout: 30000 });
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async withdraw(address) {
    const SUCCESS_REGEXP = /bounty\swas\swithdrawn/i;

    const cmd = `withdraw ${address}`;
    const std = await this.run(cmd, { timeout: 30000 });
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async withdrawAll() {
    const SUCCESS_REGEXP = /bounty\swas\swithdrawn/i;

    const cmd = 'withdraw-all';
    const std = await this.run(cmd, { timeout: 30000 });
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }

  async sendCoins(address, amount, options = { message: null }) {
    const SUCCESS_REGEXP = /internal\smessage\swas\ssent/i;

    const cmd = `send-coins ${address} ${amount}${options.message ? ` --message '${options.message}'` : ''}`;
    const std = await this.run(cmd, { timeout: 30000 });
    if (std.stderr) {
      return { ok: false, error: std.stderr, code: 400 };
    }

    const successMatch = SUCCESS_REGEXP.test(std.stdout);
    if (!successMatch) {
      return { ok: false, error: 'error: unknown error', code: 401 };
    }

    return {
      ok: true,
      result: {
        message: 'success',
      },
      code: 0,
    };
  }
};
