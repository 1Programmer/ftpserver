import errors from '../../errors';

export default function (thisCmd, dir = null) {
  let useDataSocket = thisCmd === 'STAT' ? false : true;
  let detailed = thisCmd === 'NLST' ? false : true;

  if (useDataSocket && !~['PORT', 'PASV'].indexOf(this.previousCommand)) {
    this.reply(503);
    return;
  }

  return this.fs.list(dir)
  .tap((files) => {
    if (!files || !Array.isArray(files)) throw new errors.InvalidListArgument();
  })
  .tap(() => {
    if (useDataSocket) return this.reply(150);
    else return this.reply(213, 'Status begin', null, false);
  })
  .then((files) => files.map(file => detailed ? file.buildStat() : file.name).join('\r\n'))
  .then((msg) => this.write(msg, useDataSocket ? this.dataSocket : null))
  .then(() => {
    if (useDataSocket) return this.dataSocket.end();
  })
  .then(() => {
    if (useDataSocket) return this.reply(226, 'Transfer OK');
    else return this.reply(213, 'Status end');
  })
  .catch((err) => {
    this.bunyan.error(err, {command: thisCmd});
    return this.reply(431, err.code || 'No such directory');
  });
}
