/**
 * Configuration constants for the Model Tracking application
 */

// Maximum number of models per testing type that can be in testing simultaneously
// Each testing type (Chamber Test, CST Test, etc.) has its own capacity limit (default: 3)
export const MAX_MODELS_PER_TESTING_TYPE = parseInt(
  process.env.MAX_MODELS_PER_TESTING_TYPE || '3',
  10
);

// Custom error class for capacity exceeded
export class TestingChamberCapacityError extends Error {
  constructor(
    currentCount: number,
    maxCapacity: number,
    testingType: string,
    message?: string
  ) {
    super(
      message ||
        `${testingType} capacity is full. Current: ${currentCount}/${maxCapacity} models in active testing period. Cannot add more models to ${testingType}.`
    );
    this.name = 'TestingChamberCapacityError';
    Object.setPrototypeOf(this, TestingChamberCapacityError.prototype);
  }
}

