jest.mock('dotenv', () => ({
    config: jest.fn()
}));

describe('Config Module', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Clear require cache so config.js is evaluated fresh each time
        jest.resetModules();
        // Clone original env to avoid leaking between tests
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should fail fast if DISCORD_APP_TOKEN is missing', () => {
        delete process.env.DISCORD_APP_TOKEN;
        process.env.DISCORD_APP_ID = '12345';
        
        expect(() => require('../../helpers/config')).toThrow(
            'CRITICAL: Missing required environment variables: DISCORD_APP_TOKEN'
        );
    });

    it('should fail fast with multiple missing critical variables', () => {
        delete process.env.DISCORD_APP_TOKEN;
        delete process.env.DISCORD_APP_ID;
        
        expect(() => require('../../helpers/config')).toThrow(
            'CRITICAL: Missing required environment variables: DISCORD_APP_TOKEN, DISCORD_APP_ID'
        );
    });

    it('should load successfully and set proper API toggle flags when all env vars are present', () => {
        process.env.DISCORD_APP_TOKEN = 'token';
        process.env.DISCORD_APP_ID = 'id';
        
        process.env.VES_API_KEY = 'ves-key';
        
        process.env.MOT_API_KEY = 'mot-key';
        process.env.MOT_CLIENT_ID = 'mot-client';
        process.env.MOT_CLIENT_SECRET = 'mot-secret';
        process.env.MOT_CLIENT_AUTHORITY = 'mot-auth';
        process.env.MOT_CLIENT_SCOPE_URL = 'mot-scope';
        
        process.env.VIN_URL = 'vin-url';
        process.env.VIN_AUTH_URL = 'vin-auth';
        process.env.VIN_USERNAME = 'vin-user';
        process.env.VIN_PASSWORD = 'vin-password';

        const config = require('../../helpers/config');

        expect(config.apis.ves.enabled).toBe(true);
        expect(config.apis.mot.enabled).toBe(true);
        expect(config.apis.vin.enabled).toBe(true);
        
        expect(config.discord.token).toBe('token');
        expect(config.discord.clientId).toBe('id');
    });

    it('should disable APIs if their config is partially or fully missing', () => {
        process.env.DISCORD_APP_TOKEN = 'token';
        process.env.DISCORD_APP_ID = 'id';
        
        // Missing VES key
        delete process.env.VES_API_KEY;
        
        // MOT has partial keys
        process.env.MOT_API_KEY = 'mot-key';
        delete process.env.MOT_CLIENT_ID;
        delete process.env.MOT_CLIENT_SECRET;
        delete process.env.MOT_CLIENT_AUTHORITY;
        delete process.env.MOT_CLIENT_SCOPE_URL;
        
        // VIN has partial keys
        process.env.VIN_URL = 'vin-url';
        delete process.env.VIN_AUTH_URL;
        delete process.env.VIN_USERNAME;
        delete process.env.VIN_PASSWORD;

        const config = require('../../helpers/config');

        expect(config.apis.ves.enabled).toBe(false);
        expect(config.apis.mot.enabled).toBe(false);
        expect(config.apis.vin.enabled).toBe(false);
    });
});
