import childProcess from "child_process";
import util from "util";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import Command from "./Command";

type response = { ok: false, error: string } | { ok: true, result: any };

export default class TonstorageCLI {
  constructor(private bin: string, private host: string, private database: string, private timeout: number) {
  }

  // cli
  async run (cmd: string, options?: {
    timeout?: number,
    maxBuffer?: number,
  }) {
    try {
      const command = new Command(this.bin)
        .setParam("-v", "0")
        .setParam("-I", this.host)
        .setParam("-k", `${ this.database }/cli-keys/client`)
        .setParam("-p", `${ this.database }/cli-keys/server.pub`)
        .setParam("--cmd", cmd);

      const std = await util.promisify(childProcess.exec)(
        command.toString(),
        {
          timeout: options && options.timeout ? options.timeout : this.timeout,
          maxBuffer: options && options.maxBuffer ? options.maxBuffer : 1024 * 1024 * 10,
        },
      );

      return {
        stdout: std.stdout,
        stderr: "",
      };
    } catch (error: any) {
      let stderr = "Unknown error";

      if ("signal" in error && "stderr" in error && "stdout" in error) {
        if (error.signal && error.signal === "SIGTERM") {
          stderr = "Timeout error";
        }

        if (error.stderr.length > 0) {
          stderr = error.stderr;
        }

        if (error.stdout.length > 0 && /invalid|error|unknown|failed/i.test(error.stdout)) {
          stderr = error.stdout;
        }
      } else if (error instanceof Error) {
        return {
          stdout: "",
          stderr: error.message,
        };
      }

      return {
        stdout: "",
        stderr: stderr.replaceAll("\n", " ").trim()
      };
    }
  }

  private async response(cmd: string, options? : { timeout?: number }): Promise<response> {
    try {
      const std = await this.run(cmd, options ?? {});
      if (std.stderr.length > 0) {
        return {
          ok: false,
          error: std.stderr
        };
      }

      return {
        ok: true,
        result: JSON.parse(std.stdout)
      };
    } catch (error: any) {
      return {
        ok: false,
        error: "Stdout parse error"
      };
    }
  }

  private async messageResponse(cmd: string, successMessageRegexp: RegExp, options? : { timeout?: number }): Promise<response> {
    const std = await this.run(cmd, options ?? {});
    if (std.stderr) {
      return {
        ok: false,
        error: std.stderr
      };
    }

    const successMatch = successMessageRegexp.test(std.stdout);
    if (!successMatch) {
      return {
        ok: false,
        error: std.stdout.replaceAll("\n", " ").trim()
      };
    }

    return {
      ok: true,
      result: {
        message: "success",
      }
    };
  }

  async list() {
    const command = new Command("list", true)
      .setFlag("--json");

    const res = await this.response(command.toString());
    return res;
  }

  async get(bagId: string) {
    const command = new Command(`get "${bagId}"`, true)
      .setFlag("--json");

    const res = await this.response(command.toString());
    return res;
  }

  async getPeers(bagId: string) {
    const command = new Command(`get-peers "${bagId}"`, true)
      .setFlag("--json");

    const res = await this.response(command.toString());
    return res;
  }

  async create(path: string, options?: {
    upload?: boolean,
    copy?: boolean,
    desc?: string
  }) {
    const command = new Command(`create "${path}"`, true)
      .setFlag("--json");

    if (options && !options.upload) {
      command.setFlag("--no-upload");
    }

    if (options && options.copy) {
      command.setFlag("--copy");
    }

    if (options && options.desc) {
      command.setParam("-d", options.desc);
    }

    const res = await this.response(command.toString());
    return res;
  }

  async addByHash(bagId: string, options?: {
    download?: boolean,
    upload?: boolean,
    rootDir?: string,
    partialFiles?: string[]
  }) {
    const command = new Command(`add-by-hash "${bagId}"`, true)
      .setFlag("--json");

    if (options && !options.upload) {
      command.setFlag("--no-upload");
    }

    if (options && !options.download) {
      command.setFlag("--paused");
    }

    if (options && options.rootDir) {
      command.setParam("-d", options.rootDir);
    }

    if (options && options.partialFiles && options.partialFiles.length > 0) {
      command.setParam("--partial", options.partialFiles.join(" "));
    }

    const res = await this.response(command.toString());
    return res;
  }

  async addByMeta(path: string, options?: {
    download?: boolean,
    upload?: boolean,
    rootDir?: string,
    partialFiles?: string[]
  }) {
    const command = new Command(`add-by-meta "${path}"`, true)
      .setFlag("--json");

    if (options && !options.upload) {
      command.setFlag("--no-upload");
    }

    if (options && !options.download) {
      command.setFlag("--paused");
    }

    if (options && options.rootDir) {
      command.setParam("-d", options.rootDir);
    }

    if (options && options.partialFiles && options.partialFiles.length > 0) {
      command.setParam("--partial", options.partialFiles.join(" "));
    }

    const res = await this.response(command.toString());
    return res;
  }

  async getMeta(bagId: string, path: string) {
    const SUCCESS_REGEXP = /saved\smeta/i;

    const command = new Command(`get-meta "${bagId}" "${path}"`, true);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP);
    return res;
  }

  async remove(bagId: string, options?: {
    removeFiles?: boolean
  }): Promise<response> {
    const SUCCESS_REGEXP = /success/i;

    const command = new Command(`remove "${bagId}"`, true);

    if (options && options.removeFiles) {
      command.setFlag("--remove-files");
    }

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP);
    return res;
  }

  async downloadPause(bagId: string) {
    const SUCCESS_REGEXP = /success/i;

    const command = new Command(`download-pause "${bagId}"`);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP);
    return res;
  }

  async downloadResume(bagId: string) {
    const SUCCESS_REGEXP = /success/i;

    const command = new Command(`download-resume "${bagId}"`);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP);
    return res;
  }

  async uploadPause(bagId: string) {
    const SUCCESS_REGEXP = /success/i;

    const command = new Command(`upload-pause "${bagId}"`);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP);
    return res;
  }

  async uploadResume(bagId: string) {
    const SUCCESS_REGEXP = /success/i;

    const command = new Command(`upload-resume "${bagId}"`);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP);
    return res;
  }

  async priorityAll(bagId: string, priority: number) {
    const SUCCESS_REGEXP = /priority\swas\sset/i;

    const command = new Command(`priority-all "${bagId}" "${priority}"`);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP);
    return res;
  }

  async priorityName(bagId: string, name: string, priority: number) {
    const SUCCESS_REGEXP = /priority\swas\sset/i;

    const command = new Command(`priority-name "${bagId}" "${name}" "${priority}"`);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP);
    return res;
  }

  async priorityIdx(bagId: string, fileId: number, priority: number) {
    const SUCCESS_REGEXP = /priority\swas\sset/i;

    const command = new Command(`priority-idx "${bagId}" "${fileId}" ${priority}`);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP);
    return res;
  }

  // provider
  async deployProvider(): Promise<response> {
    const ADDRESS_REGEXP = /address:\s(?<address>[-1|0]:[A-F0-9]{64})/i;
    const NON_BOUNCEABLE_ADDRESS_REGEXP = /non-bounceable\saddress:\s(?<nonBounceableAddress>[A-Z0-9/+]{48})/i;

    const command = new Command("deploy-provider");
    const std = await this.run(command.toString());
    if (std.stderr) {
      return {
        ok: false,
        error: std.stderr
      };
    }

    const addressMatch = ADDRESS_REGEXP.exec(std.stdout);
    const nbAddressMatch = NON_BOUNCEABLE_ADDRESS_REGEXP.exec(std.stdout);
    return {
      ok: true,
      result: {
        address:
          (addressMatch && addressMatch.groups) ? addressMatch.groups.address : null,
        nonBounceableAddress:
          (nbAddressMatch && nbAddressMatch.groups) ? nbAddressMatch.groups.nonBounceableAddress : null,
      }
    };
  }

  async getProviderInfo(options?: {
    contracts?: boolean,
    balances?: boolean
  }) {
    const command = new Command("get-provider-info")
      .setFlag("--json");

    if (options && options.contracts) {
      command.setFlag("--contracts");
    }

    if (options && options.balances) {
      command.setFlag("--balances");
    }

    const res = await this.response(command.toString());
    return res;
  }

  async setProviderConfig(maxContracts: number, maxTotalSize: number) {
    const SUCCESS_REGEXP = /storage\sprovider\sconfig\swas\supdated/i;

    const command = new Command("set-provider-config")
      .setParam("--max-contracts", maxContracts)
      .setParam("--max-total-size", maxTotalSize);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP);
    return res;
  }

  async getProviderParams(providerAddress?: string) {
    const command = new Command("get-provider-params")
      .setFlag("--json");

    if (providerAddress) {
      command.setFlag(providerAddress);
    }

    const res = await this.response(command.toString());
    return res;
  }

  async setProviderParams(accept: number, rate: number, maxSpan: number, minFileSize: number, maxFileSize: number) {
    const SUCCESS_REGEXP = /storage\sprovider\sparameters\swere\supdated/i;

    const command = new Command("set-provider-params")
      .setParam("--accept", accept)
      .setParam("--rate", rate)
      .setParam("--max-span", maxSpan)
      .setParam("--min-file-size", minFileSize)
      .setParam("--max-file-size", maxFileSize);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP, { timeout: 30000 });
    return res;
  }

  async newContractMessage(bagId: string, queryId: number, providerAddress: string): Promise<response> {
    const RATE_REGEXP = /rate\s\(nanoton\sper\smb\*day\):\s(?<rate>[0-9]+)/i;
    const MAX_SPAN_REGEXP = /max\sspan:\s(?<maxSpan>[0-9]+)/i;

    const tempFilePath = path.resolve(
      os.tmpdir(),
      crypto.randomBytes(6).readUIntLE(0, 6).toString(36)
    );

    const command = new Command(`new-contract-message "${bagId}" "${tempFilePath}"`)
      .setParam("--query-id", queryId)
      .setParam("--provider", providerAddress);

    const std = await this.run(command.toString(), { timeout: 30000 });
    if (std.stderr) {
      return {
        ok: false,
        error: std.stderr
      };
    }

    let payload = null;
    try {
      payload = await fs.promises.readFile(tempFilePath, { encoding: "base64" });
      await fs.promises.rm(tempFilePath);
    } catch (error: any) {
      return {
        ok: false,
        error: error.message
      };
    }

    const rateMatch = RATE_REGEXP.exec(std.stdout);
    const maxSpanMatch = MAX_SPAN_REGEXP.exec(std.stdout);
    return {
      ok: true,
      result: {
        payload,
        rate: (rateMatch && rateMatch.groups) ? parseInt(rateMatch.groups.rate, 10) : null,
        maxSpan: (maxSpanMatch && maxSpanMatch.groups) ? parseInt(maxSpanMatch.groups.maxSpan, 10) : null,
      }
    };
  }

  async closeContract(address: string) {
    const SUCCESS_REGEXP = /closing\sstorage\scontract/i;

    const command = new Command( `close-contract "${address}"`);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP, { timeout: 30000 });
    return res;
  }

  async withdraw(address: string) {
    const SUCCESS_REGEXP = /bounty\swas\swithdrawn/i;

    const command = new Command(`withdraw "${address}"`);

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP, { timeout: 30000 });
    return res;
  }

  async withdrawAll() {
    const SUCCESS_REGEXP = /bounty\swas\swithdrawn/i;

    const command = new Command("withdraw-all");

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP, { timeout: 30000 });
    return res;
  }

  async sendCoins(address: string, amount: number, options?: {
    message?: string
  }) {
    const SUCCESS_REGEXP = /internal\smessage\swas\ssent/i;

    const command = new Command(`send-coins "${address}" "${amount}"`);

    if (options && options.message) {
      command.setParam("--message", options.message);
    }

    const res = await this.messageResponse(command.toString(), SUCCESS_REGEXP, { timeout: 30000 });
    return res;
  }
}
