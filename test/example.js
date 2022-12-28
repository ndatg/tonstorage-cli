const TonstorageCLI = require('../src');

(async () => {
  const CLI = new TonstorageCLI({
    bin: '/root/storage-daemon-cli',
    host: '127.0.0.1:5555',
    database: '/var/ton-storage',
    timeout: 5000,
  });

  // console.log(await CLI.run('list'));
  // console.log(await CLI.run('add-by-hash 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE'));
  // console.log(await CLI.run('list'));
  // console.log(await CLI.run('get 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE'));
  // console.log(await CLI.run('remove 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE'));

  // console.log(await CLI.run('add-by-hash 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE --partial 10. O Come, O Come Emmanuel.flac'));

  // const list = await CLI.list();
  // console.log(list);
  // console.log(list.result);

  // const get = await CLI.get('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
  // console.log(get);
  // console.log(get.result);

  // const getPeers = await CLI.getPeers('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
  // console.log(getPeers);
  // console.log(getPeers.result);

  // const create = await CLI.create('/root/temp', { upload: false, copy: true, description: 'my test description' });
  // console.log(create);
  // console.log(create.result);

  // const addByHash = await CLI.addByHash('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', {
  //   download: false,
  //   upload: false,
  //   partialFiles: [
  //     'readme.md',
  //   ],
  // });
  // console.log(addByHash);
  // console.log(addByHash.result);

  // const addByMeta = await CLI.addByMeta('/root/meta-file', {
  //   download: false,
  //   upload: false,
  //   partialFiles: [
  //     'readme.md',
  //   ],
  // });
  // console.log(addByMeta);
  // console.log(addByMeta.result);

  // const remove = await CLI.remove('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', { removeFiles: false });
  // console.log(remove);

  // const downloadPause = await CLI.downloadPause('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
  // console.log(downloadPause);

  // const downloadResume = await CLI.downloadResume('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
  // console.log(downloadResume);

  // const uploadPause = await CLI.uploadPause('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
  // console.log(uploadPause);

  // const uploadResume = await CLI.uploadResume('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B');
  // console.log(uploadResume);

  // const priorityAll = await CLI.priorityAll('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', 3);
  // console.log(priorityAll);

  // const priorityName = await CLI.priorityName('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', 'readme.md', 4);
  // console.log(priorityName);

  // const priorityIdx = await CLI.priorityIdx('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', 0, 5);
  // console.log(priorityIdx);

  // const getMeta = await CLI.getMeta('A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B', '/root/meta-file');
  // console.log(getMeta);

  // const deployProvider = await CLI.deployProvider();
  // console.log(deployProvider);

  // const getProviderInfo = await CLI.getProviderInfo();
  // console.log(getProviderInfo);
  // console.log(getProviderInfo.result);

  // const setProviderConfig = await CLI.setProviderConfig(98, 300000000000);
  // console.log(setProviderConfig);

  // const getProviderParams = await CLI.getProviderParams('0:3D34FF8D7E3665BBAF9092C967318A310FFC760F59FBB620CF20CC40B0EB51A9');
  // console.log(getProviderParams);

  // const setProviderParams = await CLI.setProviderParams(1, 1000000000, 86400, 1024, 1000000000);
  // console.log(setProviderParams);

  // const newContractMessage = await CLI.newContractMessage(
  //   'A474C4FD55BA3B954AD3FD9C86CA593F7E1EF42D7FDAC1D3474CA08AC0945A6B',
  //   0,
  //   '0:3D34FF8D7E3665BBAF9092C967318A310FFC760F59FBB620CF20CC40B0EB51A9',
  // );
  // console.log(newContractMessage);

  // const closeContract = await CLI.closeContract('0:067A0AE1B039DDE9297BE176318BDB236F4D74819E10D4BB442DBAAD55ABF090');
  // console.log(closeContract);

  // const withdraw = await CLI.withdraw('0:067A0AE1B039DDE9297BE176318BDB236F4D74819E10D4BB442DBAAD55ABF090');
  // console.log(withdraw);

  // const withdrawAll = await CLI.withdrawAll();
  // console.log(withdrawAll);

  // const sendCoins = await CLI.sendCoins('0:067A0AE1B039DDE9297BE176318BDB236F4D74819E10D4BB442DBAAD55ABF090', 1000000000, 'text');
  // console.log(sendCoins);
})();
