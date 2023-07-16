export default class Command {
  constructor(private cmd: string, private internal?: boolean) {
  }

  setParam(key: string, value: string | number) {
    if (this.internal) {
      this.cmd += ` ${ key } "${ value }"`;
      return this;
    }

    this.cmd += ` ${ key } '${ value }'`;
    return this;
  }

  setFlag(key: string) {
    this.cmd += ` ${ key }`;
    return this;
  }

  toString() {
    return this.cmd;
  }
}
