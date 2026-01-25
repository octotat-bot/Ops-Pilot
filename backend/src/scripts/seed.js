/**
 * Database Seed Script for OpsPilot
 * 
 * Usage: npm run seed
 * 
 * This script creates initial data for testing/development:
 * - 1 Admin user
 * - 2 Manager users
 * - 3 Employee users
 * - 3 Sample templates
 */

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Template = require('../models/Template');
const TemplateVersion = require('../models/TemplateVersion');

const connectDB = require('../config/db');

const seedDatabase = async () => {
    try {
        await connectDB();
        console.log('Connected to database...');

        // Clear existing data (optional - comment out in production)
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Template.deleteMany({});
        await TemplateVersion.deleteMany({});

        // Create Admin User
        console.log('Creating users...');
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@opspilot.com',
            password: 'admin123456',
            role: 'admin',
            status: 'active'
        });

        // Create Manager Users
        const manager1 = await User.create({
            name: 'John Manager',
            email: 'john.manager@opspilot.com',
            password: 'manager123',
            role: 'manager',
            status: 'active'
        });

        const manager2 = await User.create({
            name: 'Sarah Manager',
            email: 'sarah.manager@opspilot.com',
            password: 'manager123',
            role: 'manager',
            status: 'active'
        });

        // Create Employee Users
        await User.create({
            name: 'Alice Employee',
            email: 'alice@opspilot.com',
            password: 'employee123',
            role: 'employee',
            status: 'active',
            manager: manager1._id
        });

        await User.create({
            name: 'Bob Employee',
            email: 'bob@opspilot.com',
            password: 'employee123',
            role: 'employee',
            status: 'active',
            manager: manager1._id
        });

        await User.create({
            name: 'Charlie Employee',
            email: 'charlie@opspilot.com',
            password: 'employee123',
            role: 'employee',
            status: 'active',
            manager: manager2._id
        });

        console.log('Users created successfully!');

        // Create Templates
        console.log('Creating templates...');

        const leaveTemplate = await Template.create({
            title: 'Leave Request',
            description: 'Request for vacation, sick leave, or personal time off',
            category: 'HR',
            priority: 'medium',
            slaHours: 48,
            isPublished: true,
            accessLevel: 'all',
            formSchema: {
                fields: [
                    { name: 'leaveType', label: 'Leave Type', type: 'select', required: true, options: ['Vacation', 'Sick Leave', 'Personal', 'Bereavement'] },
                    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
                    { name: 'endDate', label: 'End Date', type: 'date', required: true },
                    { name: 'reason', label: 'Reason', type: 'textarea', required: true }
                ]
            },
            approvalFlow: [
                { stageOrder: 1, roleRequired: 'Manager' }
            ]
        });

        const equipmentTemplate = await Template.create({
            title: 'Equipment Request',
            description: 'Request for new laptop, monitor, or other work equipment',
            category: 'IT',
            priority: 'medium',
            slaHours: 72,
            isPublished: true,
            accessLevel: 'all',
            formSchema: {
                fields: [
                    { name: 'equipmentType', label: 'Equipment Type', type: 'select', required: true, options: ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headset', 'Other'] },
                    { name: 'quantity', label: 'Quantity', type: 'number', required: true },
                    { name: 'justification', label: 'Business Justification', type: 'textarea', required: true },
                    { name: 'urgency', label: 'Urgency', type: 'select', required: true, options: ['Low', 'Medium', 'High'] }
                ]
            },
            approvalFlow: [
                { stageOrder: 1, roleRequired: 'Manager' },
                { stageOrder: 2, roleRequired: 'Admin' }
            ]
        });

        const expenseTemplate = await Template.create({
            title: 'Expense Reimbursement',
            description: 'Submit expense claims for business-related purchases',
            category: 'Finance',
            priority: 'high',
            slaHours: 24,
            isPublished: true,
            accessLevel: 'all',
            formSchema: {
                fields: [
                    { name: 'expenseType', label: 'Expense Type', type: 'select', required: true, options: ['Travel', 'Meals', 'Supplies', 'Software', 'Training', 'Other'] },
                    { name: 'amount', label: 'Amount ($)', type: 'number', required: true },
                    { name: 'date', label: 'Expense Date', type: 'date', required: true },
                    { name: 'description', label: 'Description', type: 'textarea', required: true },
                    { name: 'receiptNumber', label: 'Receipt Number', type: 'text', required: false }
                ]
            },
            approvalFlow: [
                { stageOrder: 1, roleRequired: 'Manager' }
            ]
        });

        // Create initial template versions
        const templates = [leaveTemplate, equipmentTemplate, expenseTemplate];
        for (const template of templates) {
            await TemplateVersion.create({
                template: template._id,
                versionNumber: 1,
                title: template.title,
                description: template.description,
                formFields: template.formSchema?.fields || [],
                approvalFlow: template.approvalFlow,
                slaHours: template.slaHours,
                changeDescription: 'Initial version',
                changedBy: admin._id
            });
        }

        console.log('Templates created successfully!');

        console.log('\n========================================');
        console.log('Database seeded successfully!');
        console.log('========================================\n');
        console.log('Test Accounts:');
        console.log('----------------------------------------');
        console.log('Admin:    admin@opspilot.com / admin123456');
        console.log('Manager:  john.manager@opspilot.com / manager123');
        console.log('Manager:  sarah.manager@opspilot.com / manager123');
        console.log('Employee: alice@opspilot.com / employee123');
        console.log('Employee: bob@opspilot.com / employee123');
        console.log('Employee: charlie@opspilot.com / employee123');
        console.log('----------------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
