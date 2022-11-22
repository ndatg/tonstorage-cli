const TonstorageCLI = require('./index');

(async () => {
  const CLI = new TonstorageCLI({
    bin: '/usr/bin/ton/storage/storage-daemon/storage-daemon-cli',
    host: '127.0.0.1:5555',
    database: '/var/ton-storage',
    timeout: 5000,
  });

  console.log(await CLI.run('list'));
  console.log(await CLI.run('add-by-hash --download 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE'));
  console.log(await CLI.run('list'));
  console.log(await CLI.run('get 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE'));
  console.log(await CLI.run('remove 93EFBE92E0B21EEEF8EA8D3412CB15146A8BFEDEF3338509F7B9983362E15CDE'));
})();
