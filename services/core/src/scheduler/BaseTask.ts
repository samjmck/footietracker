import * as cron from 'node-cron';
import { ScheduledTask } from "node-cron";

export abstract class BaseTask {
    private task: ScheduledTask;

    constructor(expression: string) {
        this.task = cron.schedule(expression, () => this.doTask());
    }

    protected abstract doTask(): Promise<void>;
}
