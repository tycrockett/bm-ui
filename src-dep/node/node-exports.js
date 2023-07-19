const { spawn, exec } = window.require('child_process');

export const cmd = (value) => (
  new Promise((resolve, reject) => {
    exec(value, { shell: '/bin/zsh' }, (error, stdout, stderror) => {
      
      if (error) { reject(error); }
      if (stderror) { resolve(stderror); }
      resolve(stdout);
    });
  })
);

export const startServer = () => {
  const server = spawn('node', ['server.js']);

  server.on('error', (data) => {
    console.error(`error: ${data}`);
  });
  
  server.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  server.stderr.on('data', (data) => {
    console.log(data);
    console.error(`stderr: ${data}`);
  });
  
  return server;
}

// kill $(lsof -t -i:8080)
