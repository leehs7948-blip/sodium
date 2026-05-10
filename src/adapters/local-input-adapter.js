export class LocalInputAdapter {
  async connect() {
    throw new Error('LocalInputAdapter.connect must be implemented');
  }

  async moveLocal(_profile) {
    throw new Error('LocalInputAdapter.moveLocal must be implemented');
  }

  async moveTo(_position) {
    throw new Error('LocalInputAdapter.moveTo must be implemented');
  }

  async lookAt(_target) {
    throw new Error('LocalInputAdapter.lookAt must be implemented');
  }

  async wait(_seconds) {
    throw new Error('LocalInputAdapter.wait must be implemented');
  }
}
