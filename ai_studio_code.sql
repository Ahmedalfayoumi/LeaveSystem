-- Creates the database. You might need to change the character set based on your needs.
CREATE DATABASE leave_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE leave_system;

-- Table for storing employee information
CREATE TABLE employees (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nationality VARCHAR(100),
    idType VARCHAR(100),
    nationalId VARCHAR(100),
    socialSecurityNumber VARCHAR(100),
    jobTitle VARCHAR(255),
    dateOfBirth DATE,
    hireDate DATE NOT NULL,
    endDate DATE,
    status ENUM('نشط', 'موقوف', 'انتهاء خدمة') NOT NULL DEFAULT 'نشط',
    customAnnualLeaveDays INT,
    initialAnnualBalance DECIMAL(10, 2),
    balanceSetDate DATE
);

-- Table for leave requests
CREATE TABLE leaves (
    id VARCHAR(255) PRIMARY KEY,
    employeeId VARCHAR(255) NOT NULL,
    type ENUM('سنوية', 'مرضية') NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    medicalReportName VARCHAR(255),
    medicalReportContent MEDIUMTEXT, -- For storing base64 data URL of the report
    status VARCHAR(50) NOT NULL DEFAULT 'approved',
    daysTaken DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

-- Table for departure requests
CREATE TABLE departures (
    id VARCHAR(255) PRIMARY KEY,
    employeeId VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(4, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'approved',
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

-- Table for official holidays
CREATE TABLE holidays (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL
);

-- Table for work done on holidays/weekends for compensation
CREATE TABLE holiday_work (
    id VARCHAR(255) PRIMARY KEY,
    employeeId VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type ENUM('عطلة أسبوعية', 'عطلة رسمية') NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

-- Table for manual balance adjustments
CREATE TABLE balance_adjustments (
    id VARCHAR(255) PRIMARY KEY,
    employeeId VARCHAR(255) NOT NULL,
    leaveType ENUM('سنوية', 'مرضية') NOT NULL,
    adjustmentDays DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

-- Table for users and their permissions
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- IMPORTANT: Store hashed passwords, not plain text!
    isAdmin BOOLEAN NOT NULL DEFAULT FALSE,
    permissions JSON -- Storing complex permissions object as JSON is simplest here
);

-- Table for notifications (linked to users)
CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(50),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- A simple key-value table for singleton data like company info and lists
CREATE TABLE app_settings (
    settingKey VARCHAR(255) PRIMARY KEY,
    settingValue JSON NOT NULL
);

-- Example of inserting company info and lists into the settings table
-- INSERT INTO app_settings (settingKey, settingValue) VALUES
-- ('companyInfo', '{"name": "My Company", "address": "123 Main St", "weekendDays": [5, 6]}'),
-- ('nationalities', '["أردني", "مصري"]'),
-- ('idTypes', '["هوية شخصية", "جواز سفر"]');