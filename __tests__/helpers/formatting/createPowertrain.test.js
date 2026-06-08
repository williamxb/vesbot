import { createPowertrain } from '#helpers/formatting/createPowertrain.js';

describe('createPowertrain', () => {
    test('returns EV for Electricity', () => {
        expect(createPowertrain({ mot: { fuelType: 'ELECTRICITY' } })).toStrictEqual({ powertrain: 'EV' });
        expect(createPowertrain({ ves: { fuelType: 'ELECTRIC' } })).toStrictEqual({ powertrain: 'EV' });
    });

    test('returns Litres for car (M1)', () => {
        const data = {
            ves: { typeApproval: 'M1', engineCapacity: 1998, fuelType: 'PETROL' }
        };
        expect(createPowertrain(data)).toStrictEqual({ powertrain: '2.0L Petrol' });
    });

    test('returns cc for bike (L typeApproval)', () => {
        const data = {
            ves: { typeApproval: 'L3e', engineCapacity: 649, fuelType: 'PETROL' }
        };
        expect(createPowertrain(data)).toStrictEqual({ powertrain: '649cc Petrol' });
    });

    test('returns cc for bike (2 WHEEL)', () => {
        const data = {
            ves: { wheelplan: '2 WHEEL', engineCapacity: 125, fuelType: 'PETROL' }
        };
        expect(createPowertrain(data)).toStrictEqual({ powertrain: '125cc Petrol' });
    });

    test('returns Unknown if no fuel type', () => {
        expect(createPowertrain({})).toStrictEqual({ powertrain: 'Unknown' });
    });

    test('falls back to fuelType if engineCapacity is missing', () => {
        const data = {
            mot: { fuelType: 'HYBRID ELECTRIC' }
        };
        expect(createPowertrain(data)).toStrictEqual({ powertrain: 'Hybrid Electric' });
    });

    test('correctly handles 1.0L', () => {
        const data = {
            ves: { typeApproval: 'M1', engineCapacity: 998, fuelType: 'PETROL' }
        };
        expect(createPowertrain(data)).toStrictEqual({ powertrain: '1.0L Petrol' });
    });
});
