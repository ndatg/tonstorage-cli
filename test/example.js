const TonstorageCLI = require('../src');

(async () => {
  const CLI = new TonstorageCLI({
    bin: '/root/storage-daemon-cli',
    host: '127.0.0.1:5555',
    database: '/var/ton-storage',
    timeout: 5000,
  });

  // console.log(await CLI.run('list'));
  // console.log(await CLI.run('add-by-hash --download 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE'));
  // console.log(await CLI.run('list'));
  // console.log(await CLI.run('get 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE'));
  // console.log(await CLI.run('remove 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE'));

  // console.log(await CLI.run('add-by-hash --download 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE --partial 10. O Come, O Come Emmanuel.flac'));

  // const list = await CLI.list();
  // console.log(list);
  // console.log(list.result);

  // const get = await CLI.get('6E3BEFFB4EF4B695BF5033EF734F58D1D497ABDA891FAEB060F7B979FA2321A7');
  // console.log(get);
  // console.log(get.result);

  // const getPeers = await CLI.getPeers('6E3BEFFB4EF4B695BF5033EF734F58D1D497ABDA891FAEB060F7B979FA2321A7');
  // console.log(getPeers);
  // console.log(getPeers.result);

  // const create = await CLI.create('/root/temp', 'my test qweqweqweqwe description');
  // console.log(create);
  // console.log(create.result);

  // const addByHash = await CLI.addByHash('6E3BEFFB4EF4B695BF5033EF734F58D1D497ABDA891FAEB060F7B979FA2321A7', {
  //   download: false,
  //   partialFiles: [
  //     'readme.md',
  //   ],
  // });
  // console.log(addByHash);
  // console.log(addByHash.result);

  // const addByMeta = await CLI.addByMeta('/root/example3', {
  //   download: false,
  //   partialFiles: [
  //     'readme.md',
  //   ],
  // });
  // console.log(addByMeta);
  // console.log(addByMeta.result);

  // const remove = await CLI.remove('EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F');
  // console.log(remove);

  // const pause = await CLI.downloadPause('EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F');
  // console.log(pause);

  // const resume = await CLI.downloadResume('EFCB1F320FA71B3DBF4106CDCD6C543C672EA1C51C595A2856BE60AA62DBC76F');
  // console.log(resume);

  // const priorityAll = await CLI.priorityAll('6E3BEFFB4EF4B695BF5033EF734F58D1D497ABDA891FAEB060F7B979FA2321A7', 3);
  // console.log(priorityAll);

  // const priorityName = await CLI.priorityName('6E3BEFFB4EF4B695BF5033EF734F58D1D497ABDA891FAEB060F7B979FA2321A7', 'readme.md', 4);
  // console.log(priorityName);

  // const priorityIdx = await CLI.priorityIdx('6E3BEFFB4EF4B695BF5033EF734F58D1D497ABDA891FAEB060F7B979FA2321A7', 0, 5);
  // console.log(priorityIdx);

  // const getMeta = await CLI.getMeta('6E3BEFFB4EF4B695BF5033EF734F58D1D497ABDA891FAEB060F7B979FA2321A7', '/root/example3');
  // console.log(getMeta);

  // const deployProvider = await CLI.deployProvider();
  // console.log(deployProvider);

  // const getProviderInfo = await CLI.getProviderInfo();
  // console.log(getProviderInfo);

  // const setProviderConfig = await CLI.setProviderConfig(98, 300000000000);
  // console.log(setProviderConfig);

  // const getProviderParams = await CLI.getProviderParams('0:E1BBE4E96C479A446E6B1E337D68A30FF356DD1399A4ED03AD310CBB250F854E');
  // console.log(getProviderParams);

  // const setProviderParams = await CLI.setProviderParams(1, 1000000000, 86400, 1024, 1000000000);
  // console.log(setProviderParams);

  // const newContractMessage = await CLI.newContractMessage(
  //   '91AE09E48F9AB5061D1CBC8BBE314F8152221472DFEAF8C18C14CB83B5D6D046',
  //   '/root/file',
  //   0,
  //   '0:E1BBE4E96C479A446E6B1E337D68A30FF356DD1399A4ED03AD310CBB250F854E',
  // );
  // console.log(newContractMessage);
})();
