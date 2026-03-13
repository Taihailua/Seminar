CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS Merchants (
    MerchantID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    Name VARCHAR(255) NOT NULL,
    Balance DECIMAL(10, 2) NOT NULL DEFAULT 50000.00, -- Initialize with some balance
    Address TEXT
);

CREATE TABLE IF NOT EXISTS Geofences (
    PolygonID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    MerchantID UUID REFERENCES Merchants(MerchantID),
    GeoJSON JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS AudioContents (
    ContentID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    MerchantID UUID REFERENCES Merchants(MerchantID),
    LanguageCode VARCHAR(10) NOT NULL,
    TextPayload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ScanLogs (
    LogID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    MerchantID UUID REFERENCES Merchants(MerchantID),
    DeviceHash VARCHAR(64) NOT NULL,
    Token UUID NOT NULL,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compound index for rapid lookup
CREATE INDEX IF NOT EXISTS trgm_idx_scanlogs ON ScanLogs (MerchantID, DeviceHash, Token);

-- Insert dummy data for "Oc Oanh" test case
INSERT INTO Merchants (Name, Balance, Address) 
VALUES ('Oc Oanh', 50000.00, '534 Vinh Khanh')
ON CONFLICT DO NOTHING;

-- Let's retrieve that UUID and insert polygon and audio later via script or application code.
