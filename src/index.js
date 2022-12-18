const util = require('util');
const childProcess = require('child_process');

const exec = util.promisify(childProcess.exec);

module.exports = class TonstorageCLI {
  constructor(options) {
    this.bin = options.bin;
    this.host = options.host;
    this.database = options.database;
    this.timeout = options.timeout;
  }

  // main
  async run(cmd, options = {}) {
    try {
      const std = await exec(
        `${this.bin} -v 0 -I ${this.host} -k ${this.database}/cli-keys/client -p ${this.database}/cli-keys/server.pub --cmd "${cmd}"`,
        { timeout: options.timeout ? options.timeout : this.timeout },
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

      return { stdout: '', stderr: stderr.join('/n') };
    }
  }

  // cli
  async list() {
    const COUNT_REGEXP = /(?<count>[0-9]+)\storrents/i;
    const TORRENT_REGEXP = /(?<id>[0-9]+)\s*(?<hash>[A-F0-9]{64})\s*(?<description>.*)?\s(?<downloaded>[0-9]+\w+)\/([0-9]+\w+|[?+]*)\s*(?<total>[0-9]\w+|[?]+)\s*(?<status>[0-9]+\w+\/s|completed|paused)/i;

    const std = await this.run('list --hashes');
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
    }

    const countMatch = COUNT_REGEXP.exec(std.stdout);

    const torrents = [];
    const lines = std.stdout.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const torrentMatch = TORRENT_REGEXP.exec(line);
      if (torrentMatch && torrentMatch.groups) {
        torrents.push({
          ...torrentMatch.groups,
          id: parseInt(torrentMatch.groups.id, 10),
          status: torrentMatch.groups.status,
          description: torrentMatch.groups.description ? torrentMatch.groups.description.trim() : null,
        });
      }
    }

    return {
      ok: true,
      result: {
        count: (countMatch && countMatch.groups) ? parseInt(countMatch.groups.count, 10) : null,
        torrents,
      },
      code: 0,
    };
  }

  async get(index) {
    const ID_REGEXP = /id\s*=\s*(?<id>[0-9]+)/i;
    const HASH_REGEXP = /hash\s*=\s*(?<hash>[A-F0-9]{64})/i;
    const DOWNLOADED_SPEED_REGEXP = /download\sspeed:\s*(?<downloadSpeed>[0-9]+\w+\/s)/i;
    const UPLOAD_SPEED_REGEXP = /upload\sspeed:\s*(?<uploadSpeed>[0-9]+\w+\/s)/i;
    const TOTAL_REGEXP = /total\ssize:\s*(?<total>[0-9]+\w+)/i;
    const DESCRIPTION_REGEXP = /-----------------------------------\s*(?<description>[\s\S]*)\n-----------------------------------/i;
    const DIR_NAME_REGEXP = /dir\sname:\s(?<dirName>.+)/i;
    const ROOT_DIR_REGEXP = /root\sdir:\s(?<rootDir>.+)/i;
    const COUNT_REGEXP = /(?<count>[0-9]+)\sfiles:/i;
    const FILE_REGEXP = /(?<index>[0-9]+):\s\((?<prior>[0-9|-]+)\)\s*(?<ready>[0-9|-]+\w*)\/(?<size>[0-9]+\w+)\s*(?<name>.+)/i;

    const std = await this.run(`get ${index}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
    }

    const idMatch = ID_REGEXP.exec(std.stdout);
    const hashMatch = HASH_REGEXP.exec(std.stdout);
    const downloadSpeedMatch = DOWNLOADED_SPEED_REGEXP.exec(std.stdout);
    const uploadSpeedMatch = UPLOAD_SPEED_REGEXP.exec(std.stdout);
    const totalMatch = TOTAL_REGEXP.exec(std.stdout);
    const descriptionMatch = DESCRIPTION_REGEXP.exec(std.stdout);
    const dirNameMatch = DIR_NAME_REGEXP.exec(std.stdout);
    const rootDirMatch = ROOT_DIR_REGEXP.exec(std.stdout);
    const countMatch = COUNT_REGEXP.exec(std.stdout);

    const files = [];
    const lines = std.stdout.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const fileMatch = FILE_REGEXP.exec(line);
      if (fileMatch && fileMatch.groups) {
        files.push({
          ...fileMatch.groups,
          index: parseInt(fileMatch.groups.index, 10),
          prior: fileMatch.groups.prior !== '---' ? parseInt(fileMatch.groups.prior, 10) : null,
          ready: fileMatch.groups.ready !== '---' ? fileMatch.groups.ready : null,
        });
      }
    }

    return {
      ok: true,
      result: {
        id: (idMatch && idMatch.groups) ? parseInt(idMatch.groups.id, 10) : null,
        hash: (hashMatch && hashMatch.groups) ? hashMatch.groups.hash : null,
        downloadSpeed: (downloadSpeedMatch && downloadSpeedMatch.groups) ? downloadSpeedMatch.groups.downloadSpeed : null,
        uploadSpeed: (uploadSpeedMatch && uploadSpeedMatch.groups) ? uploadSpeedMatch.groups.uploadSpeed : null,
        total: (totalMatch && totalMatch.groups) ? totalMatch.groups.total : null,
        description: (descriptionMatch && descriptionMatch.groups) ? descriptionMatch.groups.description : null,
        dirName: (dirNameMatch && dirNameMatch.groups) ? dirNameMatch.groups.dirName : null,
        rootDir: (rootDirMatch && rootDirMatch.groups) ? rootDirMatch.groups.rootDir : null,
        count: (countMatch && countMatch.groups) ? parseInt(countMatch.groups.count, 10) : null,
        files,
      },
      code: 0,
    };
  }

  async getPeers(index) {
    const HASH_REGEXP = /torrent\s*(?<hash>[A-F0-9]+)/i;
    const DOWNLOADED_SPEED_REGEXP = /download\sspeed:\s*(?<downloadSpeed>[0-9]+\w+\/s)/i;
    const UPLOAD_SPEED_REGEXP = /upload\sspeed:\s*(?<uploadSpeed>[0-9]+\w+\/s)/i;
    const COUNT_REGEXP = /peers:\s*(?<count>[0-9]+)/i;
    const PEER_REGEXP = /(?<adnl>[\w0-9=/+]+)\s*(?<address>[0-9.:]+)\s*(?<downloadSpeed>[0-9]+\w+\/s)\s*(?<uploadSpeed>[0-9]+\w+\/s)\s*(?<ready>[0-9.%]+)/i;

    const std = await this.run(`get-peers ${index}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
    }

    const hashMatch = HASH_REGEXP.exec(std.stdout);
    const downloadSpeedMatch = DOWNLOADED_SPEED_REGEXP.exec(std.stdout);
    const uploadSpeedMatch = UPLOAD_SPEED_REGEXP.exec(std.stdout);
    const countMatch = COUNT_REGEXP.exec(std.stdout);

    const peers = [];
    const lines = std.stdout.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const fileMatch = PEER_REGEXP.exec(line);
      if (fileMatch && fileMatch.groups) {
        peers.push({
          ...fileMatch.groups,
        });
      }
    }

    return {
      ok: true,
      result: {
        hash: (hashMatch && hashMatch.groups) ? hashMatch.groups.hash : null,
        downloadSpeed: (downloadSpeedMatch && downloadSpeedMatch.groups) ? downloadSpeedMatch.groups.downloadSpeed : null,
        uploadSpeed: (uploadSpeedMatch && uploadSpeedMatch.groups) ? uploadSpeedMatch.groups.uploadSpeed : null,
        count: (countMatch && countMatch.groups) ? parseInt(countMatch.groups.count, 10) : null,
        peers,
      },
      code: 0,
    };
  }

  async create(path, description = null) {
    const ID_REGEXP = /id\s*=\s*(?<id>[0-9]+)/i;
    const HASH_REGEXP = /hash\s*=\s*(?<hash>[A-F0-9]{64})/i;
    const UPLOAD_SPEED_REGEXP = /upload\sspeed:\s*(?<uploadSpeed>[0-9]+\w+\/s)/i;
    const TOTAL_REGEXP = /total\ssize:\s*(?<total>[0-9]+\w+)/i;
    const DESCRIPTION_REGEXP = /-----------------------------------\s*(?<description>[\s\S]*)\n-----------------------------------/i;
    const DIR_NAME_REGEXP = /dir\sname:\s(?<dirName>.+)/i;
    const ROOT_DIR_REGEXP = /root\sdir:\s(?<rootDir>.+)/i;
    const COUNT_REGEXP = /(?<count>[0-9]+)\sfiles:/i;
    const FILE_REGEXP = /(?<index>[0-9]+):\s\((?<prior>[0-9]+)\)\s*(?<ready>[0-9]+\w+)\/(?<size>[0-9]+\w+)\s*(?<name>.+)/i;

    const std = await this.run(`create ${path} ${description ? `-d '${description}'` : ''}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
    }

    const idMatch = ID_REGEXP.exec(std.stdout);
    const hashMatch = HASH_REGEXP.exec(std.stdout);
    const uploadSpeedMatch = UPLOAD_SPEED_REGEXP.exec(std.stdout);
    const totalMatch = TOTAL_REGEXP.exec(std.stdout);
    const descriptionMatch = DESCRIPTION_REGEXP.exec(std.stdout);
    const dirNameMatch = DIR_NAME_REGEXP.exec(std.stdout);
    const rootDirMatch = ROOT_DIR_REGEXP.exec(std.stdout);
    const countMatch = COUNT_REGEXP.exec(std.stdout);
    const files = [];
    const lines = std.stdout.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const fileMatch = FILE_REGEXP.exec(line);
      if (fileMatch && fileMatch.groups) {
        files.push({
          ...fileMatch.groups,
          index: parseInt(fileMatch.groups.index, 10),
          prior: parseInt(fileMatch.groups.prior, 10),
        });
      }
    }

    return {
      ok: true,
      result: {
        id: (idMatch && idMatch.groups) ? parseInt(idMatch.groups.id, 10) : null,
        hash: (hashMatch && hashMatch.groups) ? hashMatch.groups.hash : null,
        uploadSpeed: (uploadSpeedMatch && uploadSpeedMatch.groups) ? uploadSpeedMatch.groups.uploadSpeed : null,
        total: (totalMatch && totalMatch.groups) ? totalMatch.groups.total : null,
        description: (descriptionMatch && descriptionMatch.groups) ? descriptionMatch.groups.description : null,
        dirName: (dirNameMatch && dirNameMatch.groups) ? dirNameMatch.groups.dirName : null,
        rootDir: (rootDirMatch && rootDirMatch.groups) ? rootDirMatch.groups.rootDir : null,
        count: (countMatch && countMatch.groups) ? parseInt(countMatch.groups.count, 10) : null,
        files,
      },
      code: 0,
    };
  }

  async getMeta(index, path) {
    const SIZE_REGEXP = /saved\storrent\smeta\s\((?<size>[0-9]+\s\w+)\)/i;
    const SUCCESS_REGEXP = /saved\storrent\smeta/i;

    const std = await this.run(`get-meta ${index} ${path}`);
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

  async addByHash(hash, options = { download: false, rootDir: null, partialFiles: [] }) {
    const HASH_REGEXP = /hash\s*=\s*(?<hash>[A-F0-9]{64})/i;
    const ROOT_DIR_REGEXP = /root\sdir:\s(?<rootDir>.+)/i;

    const std = await this.run(`add-by-hash ${hash} ${!options.download ? '--paused ' : ''}`
      + `${options.rootDir ? `-d ${options.rootDir} ` : ''}`
      + `${options.partialFiles && options.partialFiles.length > 0 ? `--partial ${options.partialFiles.join(' ')}` : ''}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
    }

    const hashMatch = HASH_REGEXP.exec(std.stdout);
    const rootDirMatch = ROOT_DIR_REGEXP.exec(std.stdout);

    return {
      ok: true,
      result: {
        hash: (hashMatch && hashMatch.groups) ? hashMatch.groups.hash : null,
        rootDir: (rootDirMatch && rootDirMatch.groups) ? rootDirMatch.groups.rootDir : null,
      },
      code: 0,
    };
  }

  async addByMeta(path, options = { download: false, rootDir: null, partialFiles: [] }) {
    const ID_REGEXP = /id\s*=\s*(?<id>[0-9]+)/i;
    const HASH_REGEXP = /hash\s*=\s*(?<hash>[A-F0-9]{64})/i;
    const DOWNLOADED_SPEED_REGEXP = /download\sspeed:\s*(?<downloadSpeed>[0-9]+\w+\/s)/i;
    const UPLOAD_SPEED_REGEXP = /upload\sspeed:\s*(?<uploadSpeed>[0-9]+\w+\/s)/i;
    const TOTAL_REGEXP = /total\ssize:\s*(?<total>[0-9]+\w+)/i;
    const DESCRIPTION_REGEXP = /-----------------------------------\s*(?<description>[\s\S]*)\n-----------------------------------/i;
    const DIR_NAME_REGEXP = /dir\sname:\s(?<dirName>.+)/i;
    const ROOT_DIR_REGEXP = /root\sdir:\s(?<rootDir>.+)/i;
    const COUNT_REGEXP = /(?<count>[0-9]+)\sfiles:/i;
    const FILE_REGEXP = /(?<index>[0-9]+):\s\((?<prior>[0-9]+)\)\s*(?<ready>[0-9]+\w+)\/(?<size>[0-9]+\w+)\s*(?<name>.+)/i;

    const std = await this.run(`add-by-meta ${path} ${!options.download ? '--paused ' : ''}`
      + `${options.rootDir ? `-d ${options.rootDir} ` : ''}`
      + `${options.partialFiles && options.partialFiles.length > 0 ? `--partial ${options.partialFiles.join(' ')}` : ''}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
    }

    const idMatch = ID_REGEXP.exec(std.stdout);
    const hashMatch = HASH_REGEXP.exec(std.stdout);
    const downloadSpeedMatch = DOWNLOADED_SPEED_REGEXP.exec(std.stdout);
    const uploadSpeedMatch = UPLOAD_SPEED_REGEXP.exec(std.stdout);
    const totalMatch = TOTAL_REGEXP.exec(std.stdout);
    const descriptionMatch = DESCRIPTION_REGEXP.exec(std.stdout);
    const dirNameMatch = DIR_NAME_REGEXP.exec(std.stdout);
    const rootDirMatch = ROOT_DIR_REGEXP.exec(std.stdout);
    const countMatch = COUNT_REGEXP.exec(std.stdout);

    const files = [];
    const lines = std.stdout.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const fileMatch = FILE_REGEXP.exec(line);
      if (fileMatch && fileMatch.groups) {
        files.push({
          ...fileMatch.groups,
          index: parseInt(fileMatch.groups.index, 10),
          prior: parseInt(fileMatch.groups.prior, 10),
        });
      }
    }

    return {
      ok: true,
      result: {
        id: (idMatch && idMatch.groups) ? parseInt(idMatch.groups.id, 10) : null,
        hash: (hashMatch && hashMatch.groups) ? hashMatch.groups.hash : null,
        downloadSpeed: (downloadSpeedMatch && downloadSpeedMatch.groups) ? downloadSpeedMatch.groups.downloadSpeed : null,
        uploadSpeed: (uploadSpeedMatch && uploadSpeedMatch.groups) ? uploadSpeedMatch.groups.uploadSpeed : null,
        total: (totalMatch && totalMatch.groups) ? totalMatch.groups.total : null,
        description: (descriptionMatch && descriptionMatch.groups) ? descriptionMatch.groups.description : null,
        dirName: (dirNameMatch && dirNameMatch.groups) ? dirNameMatch.groups.dirName : null,
        rootDir: (rootDirMatch && rootDirMatch.groups) ? rootDirMatch.groups.rootDir : null,
        count: (countMatch && countMatch.groups) ? parseInt(countMatch.groups.count, 10) : null,
        files,
      },
      code: 0,
    };
  }

  async remove(index, options = { removeFiles: false }) {
    const SUCCESS_REGEXP = /success/i;

    const std = await this.run(`remove ${index}${options.removeFiles ? ' --remove-files' : ''}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

    const std = await this.run(`download-pause ${index}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

    const std = await this.run(`download-resume ${index}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

    const std = await this.run(`priority-all ${index} ${priority}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

    const std = await this.run(`priority-name ${index} ${name} ${priority}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

    const std = await this.run(`priority-idx ${index} ${fileId} ${priority}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

    const std = await this.run('deploy-provider');
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

  async getProviderInfo() {
    const ADDRESS_REGEXP = /storage\sprovider\s(?<address>[-1|0]:[A-F0-9]{64})/i;
    const CONTRACTS_REGEXP = /storage\scontracts:\s(?<count>[0-9]+)\s\/\s(?<limit>[0-9]+)/i;
    const SIZE_REGEXP = /total\ssize:\s(?<size>[0-9]+\w+)\s\/\s(?<total>[0-9]+\w+)/i;
    const BALANCE_REGEXP = /main\scontract\sbalance:\s(?<balance>[0-9.]+)\ston/i;
    const CONTRACT_REGEXP = /(?<address>[-1|0]:[A-F0-9]{64})\s*(?<hash>[A-F0-9]{64})\s*(?<date>.+)\s\s(?<size>[0-9]+\w+)\s*(?<state>\w+)\s*(?<clientBalance>[0-9.]+)\s*(?<contractBalance>[0-9.]+)/i;

    const std = await this.run('get-provider-info --contracts --balances');
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
    }

    const addressMatch = ADDRESS_REGEXP.exec(std.stdout);
    const contractsMatch = CONTRACTS_REGEXP.exec(std.stdout);
    const sizeMatch = SIZE_REGEXP.exec(std.stdout);
    const balanceMatch = BALANCE_REGEXP.exec(std.stdout);

    const contracts = [];
    const lines = std.stdout.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const contractMatch = CONTRACT_REGEXP.exec(line);
      if (contractMatch && contractMatch.groups) {
        contracts.push({
          ...contractMatch.groups,
          date: +new Date(contractMatch.groups.date),
        });
      }
    }

    return {
      ok: true,
      result: {
        address: (addressMatch && addressMatch.groups) ? addressMatch.groups.address : null,
        size: (sizeMatch && sizeMatch.groups) ? sizeMatch.groups.size : null,
        total: (sizeMatch && sizeMatch.groups) ? sizeMatch.groups.total : null,
        balance: (balanceMatch && balanceMatch.groups) ? parseFloat(balanceMatch.groups.balance) : null,
        contractsCount: (contractsMatch && contractsMatch.groups) ? parseInt(contractsMatch.groups.count, 10) : null,
        contractsLimit: (contractsMatch && contractsMatch.groups) ? parseInt(contractsMatch.groups.limit, 10) : null,
        contracts,
      },
      code: 0,
    };
  }

  async setProviderConfig(maxContracts, maxTotalSize) {
    const SUCCESS_REGEXP = /storage\sprovider\sconfig\swas\supdated/i;

    const std = await this.run(`set-provider-config --max-contracts ${maxContracts} --max-total-size ${maxTotalSize}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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
    const ACCEPT_REGEXP = /accept\snew\scontracts:\s(?<accept>\w+)/i;
    const RATE_REGEXP = /rate\s\(nanoton\sper\sday\*mb\):\s(?<rate>[0-9]+)/i;
    const MAX_SPAN_REGEXP = /max\sspan:\s(?<maxSpan>[0-9]+)/i;
    const MIN_FILE_SIZE_REGEXP = /min\sfile\ssize:\s(?<minFileSize>[0-9]+)/i;
    const MAX_FILE_SIZE_REGEXP = /max\sfile\ssize:\s(?<maxFileSize>[0-9]+)/i;

    const std = await this.run(`get-provider-params${providerAddress ? ` ${providerAddress}` : ''}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
    }

    const acceptMatch = ACCEPT_REGEXP.exec(std.stdout);
    const rateMatch = RATE_REGEXP.exec(std.stdout);
    const maxSpanMatch = MAX_SPAN_REGEXP.exec(std.stdout);
    const minFileSizeMatch = MIN_FILE_SIZE_REGEXP.exec(std.stdout);
    const maxFileSizeMatch = MAX_FILE_SIZE_REGEXP.exec(std.stdout);

    return {
      ok: true,
      result: {
        accept: (acceptMatch && acceptMatch.groups) ? Boolean(acceptMatch.groups.accept) : null,
        rate: (rateMatch && rateMatch.groups) ? parseInt(rateMatch.groups.rate, 10) : null,
        maxSpan: (maxSpanMatch && maxSpanMatch.groups) ? parseInt(maxSpanMatch.groups.maxSpan, 10) : null,
        minFileSizeMatch: (minFileSizeMatch && minFileSizeMatch.groups) ? parseInt(minFileSizeMatch.groups.minFileSize, 10) : null,
        maxFileSizeMatch: (maxFileSizeMatch && maxFileSizeMatch.groups) ? parseInt(maxFileSizeMatch.groups.maxFileSize, 10) : null,
      },
      code: 0,
    };
  }

  async setProviderParams(accept, rate, maxSpan, minFileSize, maxFileSize) {
    const SUCCESS_REGEXP = /storage\sprovider\sparameters\swere\supdated/i;

    const std = await this.run(`set-provider-params --accept ${accept} --rate ${rate} --max-span ${maxSpan} --min-file-size ${minFileSize} --max-file-size ${maxFileSize}`, { timeout: 30000 });
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

  async newContractMessage(torrent, file, queryId, providerAddress) {
    const RATE_REGEXP = /rate\s\(nanoton\sper\smb\*day\):\s(?<rate>[0-9]+)/i;
    const MAX_SPAN_REGEXP = /max\sspan:\s(?<maxSpan>[0-9]+)/i;

    const std = await this.run(`new-contract-message ${torrent} ${file} --query-id ${queryId} --provider ${providerAddress}`);
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
    }

    const rateMatch = RATE_REGEXP.exec(std.stdout);
    const maxSpanMatch = MAX_SPAN_REGEXP.exec(std.stdout);

    return {
      ok: true,
      result: {
        file,
        rate: (rateMatch && rateMatch.groups) ? parseInt(rateMatch.groups.rate, 10) : null,
        maxSpan: (maxSpanMatch && maxSpanMatch.groups) ? parseInt(maxSpanMatch.groups.maxSpan, 10) : null,
      },
      code: 0,
    };
  }

  async closeContract(address) {
    const SUCCESS_REGEXP = /closing\sstorage\scontract/i;

    const std = await this.run(`close-contract ${address}`, { timeout: 30000 });
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

    const std = await this.run(`withdraw ${address}`, { timeout: 30000 });
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

    const std = await this.run('withdraw-all', { timeout: 30000 });
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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

    const std = await this.run(`send-coins ${address} ${amount}${options.message ? ` --message ${options.message}` : ''}`, { timeout: 30000 });
    if (std.stderr) {
      const error = std.stderr.replaceAll('/n', '');
      return { ok: false, error, code: 400 };
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
