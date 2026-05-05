/**
 * seedDemo.js — Seeds realistic demo data for OpsPilot.
 * Run with: node src/scripts/seedDemo.js
 */

require('dotenv').config({ path: `${__dirname}/../../.env` });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Models ────────────────────────────────────────────────────────────────────
const User         = require('../models/User');
const Template     = require('../models/Template');
const Request      = require('../models/Request');
const RequestStage = require('../models/RequestStage');
const Activity     = require('../models/Activity');
const Notification = require('../models/Notification');

// ── Helpers ───────────────────────────────────────────────────────────────────
const daysAgo  = (n) => new Date(Date.now() - n * 864e5);
const hoursAgo = (n) => new Date(Date.now() - n * 36e5);
const pick     = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── Main ──────────────────────────────────────────────────────────────────────
const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    // Clear existing data
    await Promise.all([
        User.deleteMany({}), Template.deleteMany({}),
        Request.deleteMany({}), RequestStage.deleteMany({}),
        Activity.deleteMany({}), Notification.deleteMany({})
    ]);
    console.log('🗑️  Cleared old data');

    // ── USERS ─────────────────────────────────────────────────────────────────
    const hash = (p) => bcrypt.hash(p, 12);

    const [admin, mgr1, mgr2, emp1, emp2, emp3, emp4, emp5] = await User.insertMany([
        { name: 'Priya Sharma',    email: 'admin@demo.com',      password: await hash('Admin@123'),    role: 'admin',    status: 'active' },
        { name: 'Rahul Mehta',     email: 'rahul@demo.com',      password: await hash('Manager@123'),  role: 'manager',  status: 'active' },
        { name: 'Anjali Verma',    email: 'anjali@demo.com',     password: await hash('Manager@123'),  role: 'manager',  status: 'active' },
        { name: 'Arjun Nair',      email: 'arjun@demo.com',      password: await hash('Employee@123'), role: 'employee', status: 'active' },
        { name: 'Sneha Patel',     email: 'sneha@demo.com',      password: await hash('Employee@123'), role: 'employee', status: 'active' },
        { name: 'Vikram Singh',    email: 'vikram@demo.com',     password: await hash('Employee@123'), role: 'employee', status: 'active' },
        { name: 'Pooja Iyer',      email: 'pooja@demo.com',      password: await hash('Employee@123'), role: 'employee', status: 'active' },
        { name: 'Karan Malhotra',  email: 'karan@demo.com',      password: await hash('Employee@123'), role: 'employee', status: 'inactive' },
    ]);

    // Assign managers
    await User.updateMany({ role: 'employee' }, { manager: mgr1._id });
    console.log('👥 Created 8 users');

    // ── TEMPLATES ─────────────────────────────────────────────────────────────
    const [tLeave, tEquip, tIT, tFinance, tWFH, tTravel] = await Template.insertMany([
        {
            title: 'Annual Leave Request',
            description: 'Submit a request for planned annual leave. Requires manager approval.',
            category: 'HR', priority: 'medium', slaHours: 24, accessLevel: 'all', isPublished: true,
            formSchema: { fields: [
                { name: 'startDate', label: 'Start Date', type: 'date', required: true },
                { name: 'endDate',   label: 'End Date',   type: 'date', required: true },
                { name: 'reason',    label: 'Reason',     type: 'textarea', required: true },
                { name: 'handover',  label: 'Handover Plan', type: 'textarea', required: false }
            ]},
            approvalFlow: [{ stageOrder: 1, roleRequired: 'Manager' }]
        },
        {
            title: 'Equipment Request',
            description: 'Request new hardware, peripherals or office equipment.',
            category: 'IT', priority: 'medium', slaHours: 48, accessLevel: 'all', isPublished: true,
            formSchema: { fields: [
                { name: 'itemName',    label: 'Item Name',        type: 'text',     required: true },
                { name: 'quantity',    label: 'Quantity',         type: 'number',   required: true },
                { name: 'justification', label: 'Justification', type: 'textarea', required: true },
                { name: 'urgency',     label: 'Urgency Level',   type: 'select',   required: true, options: ['Low', 'Medium', 'High'] }
            ]},
            approvalFlow: [{ stageOrder: 1, roleRequired: 'Manager' }, { stageOrder: 2, roleRequired: 'Admin' }]
        },
        {
            title: 'IT Support Ticket',
            description: 'Report technical issues or request IT assistance.',
            category: 'IT', priority: 'high', slaHours: 8, accessLevel: 'all', isPublished: true,
            formSchema: { fields: [
                { name: 'issueType',  label: 'Issue Type',       type: 'select',   required: true, options: ['Hardware', 'Software', 'Network', 'Access'] },
                { name: 'description', label: 'Description',     type: 'textarea', required: true },
                { name: 'priority',   label: 'Priority',         type: 'select',   required: true, options: ['Low', 'Medium', 'High', 'Critical'] }
            ]},
            approvalFlow: [{ stageOrder: 1, roleRequired: 'Manager' }]
        },
        {
            title: 'Budget Approval Request',
            description: 'Request approval for project or department budget allocation.',
            category: 'Finance', priority: 'high', slaHours: 72, accessLevel: 'manager', isPublished: true,
            formSchema: { fields: [
                { name: 'projectName', label: 'Project Name',    type: 'text',     required: true },
                { name: 'amount',      label: 'Amount (₹)',      type: 'number',   required: true },
                { name: 'purpose',     label: 'Purpose',         type: 'textarea', required: true },
                { name: 'timeline',    label: 'Timeline',        type: 'text',     required: true }
            ]},
            approvalFlow: [{ stageOrder: 1, roleRequired: 'Manager' }, { stageOrder: 2, roleRequired: 'Admin' }]
        },
        {
            title: 'Work From Home Request',
            description: 'Request approval to work remotely for a specific period.',
            category: 'HR', priority: 'low', slaHours: 12, accessLevel: 'employee', isPublished: true,
            formSchema: { fields: [
                { name: 'date',    label: 'WFH Date',   type: 'date',     required: true },
                { name: 'reason',  label: 'Reason',     type: 'textarea', required: true }
            ]},
            approvalFlow: [{ stageOrder: 1, roleRequired: 'Manager' }]
        },
        {
            title: 'Business Travel Request',
            description: 'Request approval and reimbursement for business travel.',
            category: 'Operations', priority: 'medium', slaHours: 48, accessLevel: 'all', isPublished: true,
            formSchema: { fields: [
                { name: 'destination', label: 'Destination',       type: 'text',     required: true },
                { name: 'travelDates', label: 'Travel Dates',      type: 'text',     required: true },
                { name: 'purpose',     label: 'Purpose of Travel', type: 'textarea', required: true },
                { name: 'estimatedCost', label: 'Estimated Cost (₹)', type: 'number', required: true }
            ]},
            approvalFlow: [{ stageOrder: 1, roleRequired: 'Manager' }, { stageOrder: 2, roleRequired: 'Admin' }]
        }
    ]);
    console.log('📋 Created 6 templates');

    // ── REQUESTS ──────────────────────────────────────────────────────────────
    const makeSnapshot = (t) => ({
        title: t.title, slaHours: t.slaHours,
        formSchema: t.formSchema, approvalFlow: t.approvalFlow
    });

    const requestDefs = [
        // APPROVED requests (older)
        { requester: emp1, template: tLeave,   status: 'approved',   daysBack: 25,
          formData: { startDate: '2026-04-10', endDate: '2026-04-14', reason: 'Family vacation to Goa', handover: 'Sneha will handle my tasks' },
          stageStatus: 'approved', approver: mgr1, comment: 'Approved. Have a great vacation!', stageIndex: 0 },
        { requester: emp2, template: tWFH,     status: 'approved',   daysBack: 20,
          formData: { date: '2026-04-16', reason: 'Home internet installation required' },
          stageStatus: 'approved', approver: mgr1, comment: 'Approved.', stageIndex: 0 },
        { requester: emp3, template: tIT,      status: 'approved',   daysBack: 18,
          formData: { issueType: 'Software', description: 'VS Code not launching after update', priority: 'High' },
          stageStatus: 'approved', approver: mgr1, comment: 'Ticket resolved by IT team.', stageIndex: 0 },
        { requester: emp4, template: tEquip,   status: 'approved',   daysBack: 15,
          formData: { itemName: 'Mechanical Keyboard', quantity: '1', justification: 'Current keyboard is broken', urgency: 'Medium' },
          stageStatus: 'approved', approver: mgr2, comment: 'Approved. Procurement in progress.', stageIndex: 0 },
        { requester: emp1, template: tTravel,  status: 'approved',   daysBack: 12,
          formData: { destination: 'Mumbai', travelDates: 'Apr 20–22', purpose: 'Client meeting with TechCorp', estimatedCost: '15000' },
          stageStatus: 'approved', approver: mgr1, comment: 'Approved. Book tickets via travel desk.', stageIndex: 0 },
        { requester: emp2, template: tLeave,   status: 'approved',   daysBack: 10,
          formData: { startDate: '2026-04-28', endDate: '2026-04-29', reason: 'Medical appointment', handover: 'Will complete tasks before leave' },
          stageStatus: 'approved', approver: mgr1, comment: 'Approved.', stageIndex: 0 },

        // REJECTED requests
        { requester: emp3, template: tLeave,   status: 'rejected',   daysBack: 14,
          formData: { startDate: '2026-04-15', endDate: '2026-04-22', reason: 'Extended vacation', handover: 'TBD' },
          stageStatus: 'rejected', approver: mgr1, comment: 'Cannot approve during project deadline week.', stageIndex: 0 },
        { requester: emp4, template: tEquip,   status: 'rejected',   daysBack: 8,
          formData: { itemName: '4K Monitor', quantity: '2', justification: 'Better productivity', urgency: 'Low' },
          stageStatus: 'rejected', approver: mgr2, comment: 'Budget not available this quarter.', stageIndex: 0 },

        // PENDING requests (need action — good for demo)
        { requester: emp1, template: tWFH,     status: 'pending',    daysBack: 1,
          formData: { date: '2026-05-07', reason: 'Need to receive a delivery at home' },
          stageStatus: 'pending', approver: mgr1, stageIndex: 0 },
        { requester: emp2, template: tEquip,   status: 'pending',    daysBack: 2,
          formData: { itemName: 'Laptop Stand + Hub', quantity: '1', justification: 'Ergonomic setup needed', urgency: 'Medium' },
          stageStatus: 'pending', approver: mgr1, stageIndex: 0 },
        { requester: emp3, template: tLeave,   status: 'pending',    daysBack: 0,
          formData: { startDate: '2026-05-12', endDate: '2026-05-16', reason: 'Wedding in family', handover: 'Arjun will cover' },
          stageStatus: 'pending', approver: mgr1, stageIndex: 0 },
        { requester: emp4, template: tIT,      status: 'pending',    daysBack: 1,
          formData: { issueType: 'Network', description: 'VPN keeps disconnecting every 10 minutes', priority: 'High' },
          stageStatus: 'pending', approver: mgr2, stageIndex: 0 },
        { requester: emp5, template: tTravel,  status: 'pending',    daysBack: 3,
          formData: { destination: 'Bangalore', travelDates: 'May 10–11', purpose: 'Tech conference attendance', estimatedCost: '12000' },
          stageStatus: 'pending', approver: mgr1, stageIndex: 0 },

        // OVERDUE requests
        { requester: emp3, template: tIT,      status: 'overdue',    daysBack: 10,
          formData: { issueType: 'Hardware', description: 'Laptop fan making loud noise, overheating frequently', priority: 'Critical' },
          stageStatus: 'pending', approver: mgr2, stageIndex: 0, isSlaBreached: true },
        { requester: emp5, template: tEquip,   status: 'overdue',    daysBack: 7,
          formData: { itemName: 'Office Chair', quantity: '1', justification: 'Current chair causing back pain', urgency: 'High' },
          stageStatus: 'pending', approver: mgr1, stageIndex: 0, isSlaBreached: true },

        // ESCALATED
        { requester: emp1, template: tFinance, status: 'escalated',  daysBack: 5,
          formData: { projectName: 'Q2 Marketing Campaign', amount: '250000', purpose: 'Digital ads and event sponsorship', timeline: 'May–June 2026' },
          stageStatus: 'pending', approver: mgr1, stageIndex: 0 },
    ];

    const activities = [];
    const notifications = [];

    for (const def of requestDefs) {
        const createdAt = daysAgo(def.daysBack);
        const slaDeadline = new Date(createdAt.getTime() + def.template.slaHours * 36e5);

        const reqId = new mongoose.Types.ObjectId();

        // Use direct collection insert to bypass pre('save') hook
        // so we can backdate createdAt and set slaDeadline manually
        await Request.collection.insertOne({
            _id: reqId,
            requester: def.requester._id,
            template: def.template._id,
            templateSnapshot: makeSnapshot(def.template),
            formData: def.formData,
            status: def.status,
            currentStageIndex: def.stageIndex,
            isSlaBreached: def.isSlaBreached || false,
            slaDeadline,
            createdAt,
            updatedAt: createdAt
        });

        const req = { _id: reqId };

        // Stage
        await RequestStage.collection.insertOne({
            _id: new mongoose.Types.ObjectId(),
            request: req._id,
            stageIndex: 0,
            stageName: `${def.template.approvalFlow[0].roleRequired} Approval`,
            assignedToUser: def.approver._id,
            status: def.stageStatus,
            actionDate: def.stageStatus !== 'pending' ? hoursAgo(def.daysBack * 20) : undefined,
            comments: def.comment || undefined,
            createdAt,
            updatedAt: createdAt
        });

        // Activity
        activities.push({
            type: 'request_created',
            message: `${def.requester.name} submitted a "${def.template.title}"`,
            user: def.requester._id,
            request: req._id,
            createdAt
        });

        if (def.status === 'approved') {
            activities.push({
                type: 'request_approved',
                message: `${def.approver.name} approved "${def.template.title}" by ${def.requester.name}`,
                user: def.approver._id, request: req._id,
                createdAt: new Date(createdAt.getTime() + 3 * 36e5)
            });
            notifications.push({
                user: def.requester._id, type: 'request_update',
                message: `Your "${def.template.title}" request has been approved!`,
                referenceId: req._id, isRead: true
            });
        } else if (def.status === 'rejected') {
            activities.push({
                type: 'request_rejected',
                message: `${def.approver.name} rejected "${def.template.title}" by ${def.requester.name}`,
                user: def.approver._id, request: req._id,
                createdAt: new Date(createdAt.getTime() + 5 * 36e5)
            });
            notifications.push({
                user: def.requester._id, type: 'request_update',
                message: `Your "${def.template.title}" request was rejected.`,
                referenceId: req._id, isRead: false
            });
        } else if (def.status === 'pending') {
            notifications.push({
                user: def.approver._id, type: 'approval_needed',
                message: `${def.requester.name} submitted a "${def.template.title}" — action required.`,
                referenceId: req._id, isRead: false
            });
        } else if (def.status === 'overdue') {
            activities.push({
                type: 'request_escalated',
                message: `"${def.template.title}" by ${def.requester.name} is overdue — SLA breached`,
                user: def.requester._id, request: req._id, createdAt
            });
            notifications.push({
                user: def.approver._id, type: 'sla_breach',
                message: `SLA breached: "${def.template.title}" by ${def.requester.name} is overdue.`,
                referenceId: req._id, isRead: false
            });
        } else if (def.status === 'escalated') {
            activities.push({
                type: 'request_escalated',
                message: `"${def.template.title}" escalated for admin review`,
                user: def.approver._id, request: req._id, createdAt
            });
        }
    }

    // Extra activities for a rich feed
    activities.push(
        { type: 'user_registered', message: 'Arjun Nair joined OpsPilot',        user: emp1._id, createdAt: daysAgo(30) },
        { type: 'user_registered', message: 'Sneha Patel joined OpsPilot',        user: emp2._id, createdAt: daysAgo(28) },
        { type: 'user_registered', message: 'Vikram Singh joined OpsPilot',       user: emp3._id, createdAt: daysAgo(25) },
        { type: 'template_created', message: 'Admin created "Annual Leave Request" template',  user: admin._id, createdAt: daysAgo(35) },
        { type: 'template_created', message: 'Admin created "Equipment Request" template',     user: admin._id, createdAt: daysAgo(34) },
        { type: 'template_created', message: 'Admin created "IT Support Ticket" template',     user: admin._id, createdAt: daysAgo(33) },
        { type: 'template_created', message: 'Admin created "Budget Approval Request" template', user: admin._id, createdAt: daysAgo(32) },
        { type: 'user_updated', message: 'Rahul Mehta was promoted to Manager',   user: admin._id, createdAt: daysAgo(29) },
        { type: 'user_updated', message: 'Anjali Verma was promoted to Manager',  user: admin._id, createdAt: daysAgo(27) },
    );

    await Activity.insertMany(activities);
    await Notification.insertMany(notifications);

    console.log(`📊 Created ${requestDefs.length} requests`);
    console.log(`📝 Created ${activities.length} activity entries`);
    console.log(`🔔 Created ${notifications.length} notifications`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🎉 Demo data seeded! Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin    → admin@demo.com    / Admin@123');
    console.log('  Manager  → rahul@demo.com    / Manager@123');
    console.log('  Manager  → anjali@demo.com   / Manager@123');
    console.log('  Employee → arjun@demo.com    / Employee@123');
    console.log('  Employee → sneha@demo.com    / Employee@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
};

run().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
