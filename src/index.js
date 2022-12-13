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

  async run(cmd) {
    try {
      const std = await exec(
        `${this.bin} -v 0 -I ${this.host} -k ${this.database}/cli-keys/client -p ${this.database}/cli-keys/server.pub --cmd "${cmd}"`,
        { timeout: this.timeout },
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

  async list() {
    const COUNT_REGEXP = /\s*(?<count>[0-9]+)\storrents\s*/i;
    const TORRENT_REGEXP = /\s*(?<id>[0-9]+)\s*(?<hash>[A-F0-9]{64})\s*(?<description>.*)?\s(?<downloaded>[0-9]+\w+)\/([0-9]+\w+|[?+]*)\s*(?<total>[0-9]\w+|[?]+)\s*(?<status>[0-9]+\w+\/s|completed|paused)\s*/i;

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
    const ID_REGEXP = /\s*id\s*=\s*(?<id>[0-9]+)\s*/i;
    const HASH_REGEXP = /\s*hash\s*=\s*(?<hash>[A-F0-9]{64})\s*/i;
    const DOWNLOADED_SPEED_REGEXP = /\s*download\sspeed:\s*(?<downloadSpeed>[0-9]+\w+\/s)/i;
    const UPLOAD_SPEED_REGEXP = /\s*upload\sspeed:\s*(?<uploadSpeed>[0-9]+\w+\/s)/i;
    const TOTAL_REGEXP = /\s*total\ssize:\s*(?<total>[0-9]+\w+)\s*/i;
    const DESCRIPTION_REGEXP = /-----------------------------------\s*(?<description>[\s\S]*)\n-----------------------------------/i;
    const DIR_NAME_REGEXP = /\s*dir\sname:\s(?<dirName>.+)\s*/i;
    const ROOT_DIR_REGEXP = /\s*root\sdir:\s(?<rootDir>.+)\s*/i;
    const COUNT_REGEXP = /\s*(?<count>[0-9]+)\sfiles:\s*/i;
    const FILE_REGEXP = /\s*(?<index>[0-9]+):\s\((?<prior>[0-9]+)\)\s*(?<ready>[0-9]+\w+)\/(?<size>[0-9]+\w+)\s*(?<name>.+)\s*/i;

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

  async getPeers(index) {
    const HASH_REGEXP = /\s*torrent\s*(?<hash>[A-F0-9]+)\s*/i;
    const DOWNLOADED_SPEED_REGEXP = /\s*download\sspeed:\s*(?<downloadSpeed>[0-9]+\w+\/s)/i;
    const UPLOAD_SPEED_REGEXP = /\s*upload\sspeed:\s*(?<uploadSpeed>[0-9]+\w+\/s)/i;
    const COUNT_REGEXP = /\s*peers:\s*(?<count>[0-9]+)\s*/i;
    const PEER_REGEXP = /\s*(?<adnl>[\w0-9=/+]+)\s*(?<address>[0-9.:]+)\s*(?<downloadSpeed>[0-9]+\w+\/s)\s*(?<uploadSpeed>[0-9]+\w+\/s)\s*(?<ready>[0-9.%]+)\s*/i;

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
    const ID_REGEXP = /\s*id\s*=\s*(?<id>[0-9]+)\s*/i;
    const HASH_REGEXP = /\s*hash\s*=\s*(?<hash>[A-F0-9]{64})\s*/i;
    const UPLOAD_SPEED_REGEXP = /\s*upload\sspeed:\s*(?<uploadSpeed>[0-9]+\w+\/s)/i;
    const TOTAL_REGEXP = /\s*total\ssize:\s*(?<total>[0-9]+\w+)\s*/i;
    const DESCRIPTION_REGEXP = /-----------------------------------\s*(?<description>[\s\S]*)\n-----------------------------------/i;
    const DIR_NAME_REGEXP = /\s*dir\sname:\s(?<dirName>.+)\s*/i;
    const ROOT_DIR_REGEXP = /\s*root\sdir:\s(?<rootDir>.+)\s*/i;
    const COUNT_REGEXP = /\s*(?<count>[0-9]+)\sfiles:\s*/i;
    const FILE_REGEXP = /\s*(?<index>[0-9]+):\s\((?<prior>[0-9]+)\)\s*(?<ready>[0-9]+\w+)\/(?<size>[0-9]+\w+)\s*(?<name>.+)\s*/i;

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
    const SIZE_REGEXP = /\s*saved\storrent\smeta\s\((?<size>[0-9]+\s\w+)\)\s*/i;
    const SUCCESS_REGEXP = /\s*saved\storrent\smeta\s/i;

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
    const HASH_REGEXP = /\s*hash\s*=\s*(?<hash>[A-F0-9]{64})\s*/i;
    const ROOT_DIR_REGEXP = /\s*root\sdir:\s(?<rootDir>.+)\s*/i;

    const std = await this.run(`add-by-hash ${hash} ${!options.download ? '--paused ' : ''}`
      + `${options.rootDir ? `-d ${options.rootDir} ` : ''}`
      + `${options.partialFiles.length > 0 ? `--partial ${options.partialFiles.join(' ')}` : ''}`);

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
    const ID_REGEXP = /\s*id\s*=\s*(?<id>[0-9]+)\s*/i;
    const HASH_REGEXP = /\s*hash\s*=\s*(?<hash>[A-F0-9]{64})\s*/i;
    const DOWNLOADED_SPEED_REGEXP = /\s*download\sspeed:\s*(?<downloadSpeed>[0-9]+\w+\/s)/i;
    const UPLOAD_SPEED_REGEXP = /\s*upload\sspeed:\s*(?<uploadSpeed>[0-9]+\w+\/s)/i;
    const TOTAL_REGEXP = /\s*total\ssize:\s*(?<total>[0-9]+\w+)\s*/i;
    const DESCRIPTION_REGEXP = /-----------------------------------\s*(?<description>[\s\S]*)\n-----------------------------------/i;
    const DIR_NAME_REGEXP = /\s*dir\sname:\s(?<dirName>.+)\s*/i;
    const ROOT_DIR_REGEXP = /\s*root\sdir:\s(?<rootDir>.+)\s*/i;
    const COUNT_REGEXP = /\s*(?<count>[0-9]+)\sfiles:\s*/i;
    const FILE_REGEXP = /\s*(?<index>[0-9]+):\s\((?<prior>[0-9]+)\)\s*(?<ready>[0-9]+\w+)\/(?<size>[0-9]+\w+)\s*(?<name>.+)\s*/i;

    const std = await this.run(`add-by-meta ${path} ${!options.download ? '--paused ' : ''}`
      + `${options.rootDir ? `-d ${options.rootDir} ` : ''}`
      + `${options.partialFiles.length > 0 ? `--partial ${options.partialFiles.join(' ')}` : ''}`);

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

  async remove(index) {
    const SUCCESS_REGEXP = /\s*success\s*/i;

    const std = await this.run(`remove ${index}`);
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
    const SUCCESS_REGEXP = /\s*success\s*/i;

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
    const SUCCESS_REGEXP = /\s*success\s*/i;

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
    const SUCCESS_REGEXP = /\s*priority\swas\sset\s*/i;

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
    const SUCCESS_REGEXP = /\s*priority\swas\sset\s*/i;

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
    const SUCCESS_REGEXP = /\s*priority\swas\sset\s*/i;

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
};
