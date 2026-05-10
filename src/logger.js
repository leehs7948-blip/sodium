export class Logger {
  constructor({ maxEntries = 5000 } = {}) {
    this.logs = [];
    this.maxEntries = maxEntries;
  }

  log(entry) {
    const row = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.push(row);
    if (this.logs.length > this.maxEntries) {
      this.logs.splice(0, this.logs.length - this.maxEntries);
    }
    return row;
  }
}
