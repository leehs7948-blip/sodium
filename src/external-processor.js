export class ExternalProcessor {
  async createPlan(_request) {
    throw new Error('ExternalProcessor.createPlan must be implemented');
  }
}
