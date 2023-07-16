import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import { TonstorageCLI } from "./index";
import path from "path";
import fs from "fs";

describe("tonstorage-cli tests", () => {
  let tonstorage: TonstorageCLI;
  let tempFolderPath: string;
  let bagId: string;

  beforeAll(async () => {
    tonstorage = new TonstorageCLI(
      "/root/storage-daemon-cli",
      "127.0.0.1:5555",
      "/var/ton-storage",
      5000
    );

    tempFolderPath = path.resolve(__dirname, "temp");
    if (fs.existsSync(tempFolderPath)) {
      await fs.promises.rm(tempFolderPath, { recursive: true });
    }
    await fs.promises.mkdir(tempFolderPath);
  });

  afterAll(async () => {
    await fs.promises.rm(tempFolderPath, { recursive: true });
  });

  test("list", async () => {
    const list = await tonstorage.list();
    if (!list.ok) {
      throw new Error(list.error);
    }

    expect(list).toEqual({
      "ok": true,
      "result": {
        "@type": "storage.daemon.torrentList",
        "torrents": []
      }
    });
  });

  test("create", async () => {
    const tempFilePath = path.resolve(tempFolderPath, "readme.md");
    await fs.promises.writeFile(tempFilePath, "hello world!", { encoding: "utf-8" });

    const create = await tonstorage.create(tempFilePath, { upload: true, desc: "readme.md file" });
    if (!create.ok) {
      throw new Error(create.error);
    }

    bagId = Buffer.from(create.result.torrent.hash, "base64").toString("hex").toUpperCase();
    expect(create.ok).toEqual(true);
  });


  test("get", async () => {
    const get = await tonstorage.get(bagId);
    if (!get.ok) {
      throw new Error(get.error);
    }

    expect(get.result.files).toEqual([
      {
        "@type" : "storage.daemon.fileInfo",
        "name": "readme.md",
        "size" : "12",
        "priority" : 1,
        "downloaded_size" : "12"
      }
    ]);
  });

  test("getPeers", async () => {
    const getPeers = await tonstorage.getPeers(bagId);
    if (!getPeers.ok) {
      throw new Error(getPeers.error);
    }

    expect(getPeers).toEqual({
      "ok": true,
      "result": {
        "@type": "storage.daemon.peerList",
        "peers": [],
        "download_speed": 0,
        "upload_speed": 0,
        "total_parts": "1"
      }
    });
  });

  test("addByHash", async () => {
    const addByHash = await tonstorage.addByHash("7FEA7AF2325F0A5B6908939C9D72F92DB4C0CA52CCA8CE2C48BB2708BF188541", {
      download: true,
      upload: true,
      partialFiles: [
        "duck.png"
      ]
    });
    if (!addByHash.ok) {
      throw new Error(addByHash.error);
    }
  });

  test("getMeta", async () => {
    const getMeta = await tonstorage.getMeta(bagId, path.join(tempFolderPath, "meta"));
    if (!getMeta.ok) {
      throw new Error(getMeta.error);
    }

    expect(getMeta).toEqual({
      "ok": true,
      "result": {
        "message": "success"
      }
    });
  });

  test("addByMeta", async() => {
    await tonstorage.remove(bagId);
    const addByMeta = await tonstorage.addByMeta(path.join(tempFolderPath, "meta"), {
      download: true,
      upload: true,
      partialFiles: [
        "duck.png"
      ]
    });
    if (!addByMeta.ok) {
      throw new Error(addByMeta.error);
    }
  });

  test("downloadPause", async () => {
    const downloadPause = await tonstorage.downloadPause(bagId);

    expect(downloadPause).toEqual({
      "ok": true,
      "result": {
        "message": "success"
      }
    });
  });

  test("downloadResume", async () => {
    const downloadResume = await tonstorage.downloadResume(bagId);

    expect(downloadResume).toEqual({
      "ok": true,
      "result": {
        "message": "success"
      }
    });
  });

  test("uploadPause", async () => {
    const uploadPause = await tonstorage.uploadPause(bagId);

    expect(uploadPause).toEqual({
      "ok": true,
      "result": {
        "message": "success"
      }
    });
  });

  test("uploadResume", async () => {
    const uploadResume = await tonstorage.uploadResume(bagId);

    expect(uploadResume).toEqual({
      "ok": true,
      "result": {
        "message": "success"
      }
    });
  });

  test("priorityAll", async () => {
    const uploadResume = await tonstorage.priorityAll(bagId, 2);

    expect(uploadResume).toEqual({
      "ok": true,
      "result": {
        "message": "success"
      }
    });
  });

  test("priorityName", async () => {
    const uploadResume = await tonstorage.priorityName(bagId, "readme.md", 3);

    expect(uploadResume).toEqual({
      "ok": true,
      "result": {
        "message": "success"
      }
    });
  });

  test("priorityIdx", async () => {
    const uploadResume = await tonstorage.priorityIdx(bagId, 0, 4);

    expect(uploadResume).toEqual({
      "ok": true,
      "result": {
        "message": "success"
      }
    });
  });

  test("remove", async() => {
    const remove1 = await tonstorage.remove(bagId, {
      removeFiles: true
    });
    expect(remove1.ok).toEqual(true);

    const remove2 = await tonstorage.remove("7FEA7AF2325F0A5B6908939C9D72F92DB4C0CA52CCA8CE2C48BB2708BF188541", {
      removeFiles: true
    });
    expect(remove2.ok).toEqual(true);
  });
});
