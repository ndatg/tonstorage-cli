const {
  describe, beforeAll, afterAll, test, expect,
} = require('@jest/globals');
const path = require('path');
const fs = require('fs');

const fsPromises = fs.promises;
const TonstorageCLI = require('../src');

const OPTIONS = {
  bin: '/root/storage-daemon-cli',
  host: '127.0.0.1:5555',
  database: '/var/ton-storage',
  timeout: 5000,
};

// clear the list before running the tests!
describe('tonstorage-cli unit tests', () => {
  let CLI;
  let tempFolderPath;
  let hash;

  beforeAll(async () => {
    CLI = new TonstorageCLI(OPTIONS);

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

    const create = await CLI.create(tempFilePath, { upload: true, description: 'readme.md file' });
    hash = Buffer.from(create.result.torrent.hash, 'base64').toString('hex').toUpperCase();

    expect(create.result.files).toEqual([{
      '@type': 'storage.daemon.fileInfo',
      name: 'readme.md',
      size: '12',
      priority: 1,
      downloaded_size: '12',
    }]);
  });

  test('list', async () => {
    const list = await CLI.list(hash);

    expect(list.result.torrents).toEqual([{
      '@type': 'storage.daemon.torrent',
      hash: 'WzZsHGoaB2QLTDMN1gdcLx+WGi9hmTQj6f6Sbbj3ui4=',
      flags: 3,
      total_size: '69',
      description: 'readme.md file',
      files_count: '1',
      included_size: '69',
      dir_name: '',
      downloaded_size: '69',
      root_dir: `${__dirname}/temp/`,
      active_download: false,
      active_upload: true,
      completed: true,
      download_speed: 0,
      upload_speed: 0,
      fatal_error: '',
    }]);
  });

  test('get', async () => {
    const get = await CLI.get(hash);

    expect(get.result.files).toEqual([{
      '@type': 'storage.daemon.fileInfo',
      name: 'readme.md',
      size: '12',
      priority: 1,
      downloaded_size: '12',
    }]);
  });

  test('getPeers', async () => {
    const getPeers = await CLI.getPeers(hash);

    expect(getPeers).toEqual({
      ok: true,
      result: {
        '@type': 'storage.daemon.peerList',
        peers: [],
        download_speed: 0,
        upload_speed: 0,
        total_parts: '1',
      },
      code: 0,
    });
  });

  test('addByHash', async () => {
    const addByHash = await CLI.addByHash('EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F', {
      download: false,
      upload: true,
      rootDir: null,
      partialFiles: [],
    });

    expect(addByHash).toEqual({
      ok: true,
      result: {
        '@type': 'storage.daemon.torrentFull',
        torrent: {
          '@type': 'storage.daemon.torrent',
          hash: '78sfMg+nGz2/QQbNzWxUPGcuocUcWVooVr5gqmLbx28=',
          total_size: '0',
          description: '',
          files_count: '0',
          included_size: '0',
          dir_name: '',
          downloaded_size: '0',
          root_dir: `${OPTIONS.database}/torrent/torrent-files/EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F`,
          active_download: false,
          active_upload: false,
          completed: false,
          download_speed: 0,
          upload_speed: 0,
          fatal_error: '',
        },
        files: [],
      },
      code: 0,
    });
  });

  test('getMeta', async () => {
    const getMeta = await CLI.getMeta(hash, path.join(tempFolderPath, 'meta'));

    expect(getMeta).toEqual({ ok: true, result: { message: 'success', size: '265 B' }, code: 0 });
  });

  test('addByMeta', async () => {
    await CLI.remove(hash);
    const addByMeta = await CLI.addByMeta(path.join(tempFolderPath, 'meta'), {
      upload: true,
      download: false,
      rootDir: null,
      partialFiles: [],
    });

    expect(addByMeta).toEqual({
      ok: true,
      result: {
        '@type': 'storage.daemon.torrentFull',
        torrent: {
          '@type': 'storage.daemon.torrent',
          hash: 'WzZsHGoaB2QLTDMN1gdcLx+WGi9hmTQj6f6Sbbj3ui4=',
          flags: 3,
          total_size: '69',
          description: 'readme.md file',
          files_count: '1',
          included_size: '69',
          dir_name: '',
          downloaded_size: '0',
          root_dir: `${OPTIONS.database}/torrent/torrent-files/${hash}`,
          active_download: false,
          active_upload: false,
          completed: false,
          download_speed: 0,
          upload_speed: 0,
          fatal_error: '',
        },
        files: [
          {
            '@type': 'storage.daemon.fileInfo',
            name: 'readme.md',
            size: '12',
            priority: 1,
            downloaded_size: '0',
          },
        ],
      },
      code: 0,
    });
  });

  test('downloadPause', async () => {
    const downloadPause = await CLI.downloadPause(hash);

    expect(downloadPause).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
  });

  test('downloadResume', async () => {
    const downloadResume = await CLI.downloadResume(hash);

    expect(downloadResume).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
  });

  test('uploadPause', async () => {
    const downloadPause = await CLI.uploadPause(hash);

    expect(downloadPause).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
  });

  test('uploadResume', async () => {
    const downloadResume = await CLI.uploadResume(hash);

    expect(downloadResume).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
  });

  test('priorityAll', async () => {
    const priorityAll = await CLI.priorityAll(hash, 2);
    const get = await CLI.get(hash);

    expect(priorityAll).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
    expect(get.result.files).toEqual([
      {
        '@type': 'storage.daemon.fileInfo',
        name: 'readme.md',
        size: '12',
        priority: 2,
        downloaded_size: '0',
      },
    ]);
  });

  test('priorityName', async () => {
    const priorityName = await CLI.priorityName(hash, 'readme.md', 3);
    const get = await CLI.get(hash);

    expect(priorityName).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
    expect(get.result.files).toEqual([
      {
        '@type': 'storage.daemon.fileInfo',
        name: 'readme.md',
        size: '12',
        priority: 3,
        downloaded_size: '0',
      },
    ]);
  });

  test('priorityIdx', async () => {
    const priorityIdx = await CLI.priorityIdx(hash, 0, 4);
    const get = await CLI.get(hash);

    expect(priorityIdx).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
    expect(get.result.files).toEqual([
      {
        '@type': 'storage.daemon.fileInfo',
        name: 'readme.md',
        size: '12',
        priority: 4,
        downloaded_size: '0',
      },
    ]);
  });

  test('remove', async () => {
    const remove1 = await CLI.remove(hash);
    const remove2 = await CLI.remove('EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F');

    expect(remove1).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
    expect(remove2).toEqual({ ok: true, result: { message: 'success' }, code: 0 });
  });
});
