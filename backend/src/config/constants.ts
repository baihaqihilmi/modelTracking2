export enum TestType {
    CST = 'CST',
    Chamber = 'Chamber',
    Performance = 'Performance Test'
}

export const TEST_CAPACITY_LIMITS: Record<TestType, number> = {
    [TestType.CST]: Number(process.env.CAPACITY_CST || 5),
    [TestType.Chamber]: Number(process.env.CAPACITY_CHAMBER || 3),
    [TestType.Performance]: Number(process.env.CAPACITY_PERFORMANCE || 4),
};

export class TestingCapacityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TestingCapacityError';
    }
}


