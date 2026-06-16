export type VinCase = {
  name: string;
  vin: string;
  expect?: { make?: string; model?: string; year?: number };
  expectGracefulFailure?: boolean;
};

// Live/best-effort against vPIC.
export const VIN_CASES: VinCase[] = [
  { name: "2015 Honda Accord", vin: "1HGCR2F3XFA027534", expect: { make: "Honda", model: "Accord", year: 2015 } },
  { name: "2013 Ford F-150", vin: "1FTFW1ET5DFC10312", expect: { make: "Ford", model: "F-150", year: 2013 } },
  { name: "Garbage VIN → graceful", vin: "XXXXXXXXXXXXXXXXX", expectGracefulFailure: true },
];
