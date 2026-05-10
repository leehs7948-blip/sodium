export class Logger {
  constructor() {
    this.logs = [];
  }

  log(entry) {
    const row = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.push(row);
    return row;
  }
}
