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

  async run(command) {
    try {
      const std = await exec(
        `${this.bin} -v 0 -I ${this.host} -k ${this.database}/cli-keys/client -p ${this.database}/cli-keys/server.pub --cmd "${command}"`,
        { timeout: this.timeout },
      );

      return { stdout: std.stdout, stderr: '' };
    } catch (e) {
      const stderr = [];

      if (e.signal && e.signal === 'SIGTERM') {
        stderr.push('error: timeout');
      }

      e.stdout = e.stdout.split('\n');
      if (e.stdout[0].toLowerCase().includes('error')) {
        stderr.push(e.stdout[0]);
      }

      stderr.push(e.stderr);

      return { stdout: '', stderr: stderr.join('/n') };
    }
  }
};
