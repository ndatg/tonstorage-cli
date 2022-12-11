const {
  describe, beforeAll, afterAll, test, expect,
} = require('@jest/globals');
const path = require('path');
const fs = require('fs');

const fsPromises = fs.promises;
const TonstorageCLI = require('../index');

describe('tonstorage-cli unit tests', () => {
  let CLI;
  let tempFolderPath;
  let hash;

  beforeAll(async () => {
    CLI = new TonstorageCLI({
      bin: '/root/storage-daemon-cli',
      host: '127.0.0.1:5555',
      database: '/var/ton-storage',
      timeout: 5000,
    });

    tempFolderPath = path.resolve(__dirname, 'temp');
    const tempFolderExists = fs.existsSync(tempFolderPath);
    if (tempFolderExists) {
      await fsPromises.rm(tempFolderPath, { recursive: true });
    }

    await fsPromises.mkdir(tempFolderPath);
  });

  afterAll(async () => {
    await fsPromises.rm(tempFolderPath, { recursive: true });
  });

  test('create', async () => {
    const tempFilePath = path.resolve(__dirname, 'temp', 'readme.md');
    await fsPromises.writeFile(tempFilePath, 'hello world!', { encoding: 'utf-8' });

    const create = await CLI.create(tempFilePath, 'readme.md file');
    hash = create.result.hash;

    expect(create.result.files[0]).toEqual({
      index: 0,
      prior: 1,
      ready: '12B',
      size: '12B',
      name: 'readme.md',
    });
  });

  test('list', async () => {
    const list = await CLI.list(hash);

    expect(list.result.torrents[0]).toEqual({
      id: 0,
      hash,
      description: 'readme.md file',
      downloaded: '69B',
      total: '69B',
      status: 'COMPLETED',
    });
  });

  test('get', async () => {
    const get = await CLI.get(hash);

    expect(get.result.files[0]).toEqual({
      index: 0,
      prior: 1,
      ready: '12B',
      size: '12B',
      name: 'readme.md',
    });
  });

  test('getPeers', async () => {
    const getPeers = await CLI.getPeers(hash);

    expect(getPeers).toEqual({
      ok: true,
      result: {
        hash: '86E62F6715E0397D128F85586867C7042C15F91B8F65EF1B6F191B852CFD2B83',
        downloadSpeed: '0B/s',
        uploadSpeed: '0B/s',
        count: 0,
        peers: [],
      },
      code: 0,
    });
  });

  test('addByHash', async () => {
    const addByHash = await CLI.addByHash('EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F', {
      download: false,
      rootDir: null,
      partialFiles: [],
    });

    expect(addByHash).toEqual({
      ok: true,
      result: {
        hash: 'EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F',
        rootDir: '/var/ton-storage/torrent/torrent-files/EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F',
      },
      code: 0,
    });
  });

  test('getMeta', async () => {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const getMeta = await CLI.getMeta('EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F', path.join(tempFolderPath, 'meta'));

    expect(getMeta).toEqual({ ok: true, result: { message: 'success', size: '107 B' }, code: 0 });
  });

  test('addByMeta', async () => {
    await CLI.remove('EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F');
    const addByMeta = await CLI.addByMeta(path.join(tempFolderPath, 'meta'), {
      download: false,
      rootDir: null,
      partialFiles: [],
    });

    expect(addByMeta).toEqual({
      ok: true,
      result: {
        id: 0,
        hash: 'EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F',
        downloadSpeed: null,
        uploadSpeed: '0B/s',
        total: '47MB',
        description: null,
        dirName: null,
        rootDir: '/var/ton-storage/torrent/torrent-files/EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F',
        count: null,
        files: [],
      },
      code: 0,
    });
  });

  test('downloadResume', async () => {
    const downloadResume = await CLI.downloadResume(hash);

    expect(downloadResume).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
  });

  test('downloadPause', async () => {
    const downloadPause = await CLI.downloadPause(hash);

    expect(downloadPause).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
  });

  test('priorityAll', async () => {
    const priorityAll = await CLI.priorityAll(hash, 2);
    const get = await CLI.get(hash);

    expect(priorityAll).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
    expect(get.result.files).toEqual([{
      index: 0, prior: 2, ready: '12B', size: '12B', name: 'readme.md',
    }]);
  });

  test('priorityName', async () => {
    const priorityName = await CLI.priorityName(hash, 'readme.md', 3);
    const get = await CLI.get(hash);

    expect(priorityName).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
    expect(get.result.files).toEqual([{
      index: 0, prior: 3, ready: '12B', size: '12B', name: 'readme.md',
    }]);
  });

  test('priorityIdx', async () => {
    const priorityIdx = await CLI.priorityIdx(hash, 0, 4);
    const get = await CLI.get(hash);

    expect(priorityIdx).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
    expect(get.result.files).toEqual([{
      index: 0, prior: 4, ready: '12B', size: '12B', name: 'readme.md',
    }]);
  });

  test('remove', async () => {
    const remove1 = await CLI.remove(hash);
    const remove2 = await CLI.remove('EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F');

    expect(remove1).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
    expect(remove2).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
  });
});
