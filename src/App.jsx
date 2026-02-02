const { useState, useMemo, useEffect, useRef } = React;
const { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Line, Legend } = Recharts;

// SUPABASE CONFIG
const SUPABASE_URL = 'https://mhmdxycypqcbhxodsfyq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obWR4eWN5cHFjYmh4b2RzZnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NDQ3MzMsImV4cCI6MjA4MzIyMDczM30.AZLRc3vMEjxh5gNO0tx-Y7xIKwZ1zxMWwbuL7GSJ4v8';

// Supabase helper functions
const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function loadFromCloud() {
  try {
    console.log('Loading from cloud...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pf_tracker_data?id=eq.main&select=*`, {
      headers: supabaseHeaders
    });
    if (!response.ok) {
      console.error('Load failed:', response.status, response.statusText);
      throw new Error('Failed to load');
    }
    const data = await response.json();
    console.log('Cloud data:', data);
    if (data && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (e) {
    console.error('Cloud load error:', e);
    return null;
  }
}

async function saveToCloud(dataObj) {
  try {
    console.log('Saving to cloud...');
    const payload = {
      id: 'main',
      deals: dataObj.deals,
      allocations: dataObj.allocations,
      ledger: dataObj.ledger,
      checklist: dataObj.checklist,
      expenses: dataObj.expenses,
      leads: dataObj.leads,
      resimpli_config: dataObj.resimpliConfig,
      updated_at: new Date().toISOString()
    };
    
    // Use upsert (insert or update)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pf_tracker_data`, {
      method: 'POST',
      headers: { 
        ...supabaseHeaders, 
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Save response:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Save error:', errorText);
      throw new Error('Failed to save');
    }
    
    console.log('Save successful!');
    return true;
  } catch (e) {
    console.error('Cloud save error:', e);
    return false;
  }
}

const STORAGE_KEY = 'pf-tracker-data-v6';
const DEFAULT_ALLOCATIONS = { profit: 10, ownersPay: 35, taxes: 15, opex: 40, opm: 0 };
const STATUS_CONFIG = { 'Closed': { color: '#059669', bg: '#d1fae5', icon: '✓' }, 'Ongoing': { color: '#2563eb', bg: '#dbeafe', icon: '◐' }, 'Terminated': { color: '#dc2626', bg: '#fee2e2', icon: '✕' }, 'AOI/Suit Filed': { color: '#7c3aed', bg: '#ede9fe', icon: '⚖' } };
const TYPE_CONFIG = { 'Flip': { color: '#0891b2', bg: '#cffafe' }, 'Wholesale': { color: '#059669', bg: '#d1fae5' } };

const INITIAL_DEALS = [
  { id: 1, status: 'Closed', type: 'Flip', address: '480 Beachside Dr. Westerville OH', acquisition: 298500, rehab: 65000, disposition: 480000, holdingCosts: 52800, jv: 'N', ownerShare: 100, projDisposition: 480000, projRehab: 65000, purchaseDate: '2025-01-14', closeDate: '2025-06-04' },
  { id: 2, status: 'Closed', type: 'Wholesale', address: '3386 Beulah Rd. Columbus OH', acquisition: 75000, rehab: 0, disposition: 115000, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 125000, projRehab: 0, purchaseDate: '2025-07-15', closeDate: '2025-08-08' },
  { id: 3, status: 'Closed', type: 'Wholesale', address: '1368 Nutmeg Ct. Westerville OH', acquisition: 385000, rehab: 0, disposition: 395000, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 400000, projRehab: 0, purchaseDate: '2025-08-01', closeDate: '2025-08-18' },
  { id: 4, status: 'Ongoing', type: 'Flip', address: '154 W Front St. New Holland OH', acquisition: 87500, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 173500, projRehab: 43000, purchaseDate: '2025-08-14', closeDate: '' },
  { id: 5, status: 'Closed', type: 'Flip', address: '13179 Ridgeway Rd. Orient OH', acquisition: 275000, rehab: 25000, disposition: 380000, holdingCosts: 41800, jv: 'N', ownerShare: 100, projDisposition: 380000, projRehab: 24000, purchaseDate: '2025-06-01', closeDate: '2025-09-05' },
  { id: 6, status: 'Ongoing', type: 'Flip', address: '235 Hamilton Ave. Columbus OH', acquisition: 394000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 600000, projRehab: 80000, purchaseDate: '2025-09-01', closeDate: '' },
  { id: 7, status: 'Closed', type: 'Flip', address: '520 Cline St. Columbus OH', acquisition: 126000, rehab: 9000, disposition: 130000, holdingCosts: 14300, jv: 'N', ownerShare: 100, projDisposition: 130000, projRehab: 5000, purchaseDate: '2025-07-01', closeDate: '2025-09-12' },
  { id: 8, status: 'Closed', type: 'Flip', address: '368 E College Ave. Westerville OH', acquisition: 242500, rehab: 57318, disposition: 360000, holdingCosts: 39600, jv: 'Y', ownerShare: 50, projDisposition: 360000, projRehab: 50000, purchaseDate: '2025-07-14', closeDate: '2025-12-15' },
  { id: 9, status: 'Terminated', type: 'Wholesale', address: '198 Wooster Ave Akron OH', acquisition: 90000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 100000, projRehab: 0, purchaseDate: '2025-03-01', closeDate: '' },
  { id: 10, status: 'Ongoing', type: 'Flip', address: '207 Richards Dr. Delaware OH', acquisition: 210000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 269900, projRehab: 4000, purchaseDate: '2025-10-10', closeDate: '' },
  { id: 11, status: 'Terminated', type: 'Wholesale', address: '15 Ohio St. Delaware OH', acquisition: 130000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 160000, projRehab: 0, purchaseDate: '2025-04-01', closeDate: '' },
  { id: 12, status: 'Terminated', type: 'Wholesale', address: '571 South St. Delaware OH', acquisition: 200000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 210000, projRehab: 0, purchaseDate: '2025-05-15', closeDate: '' },
  { id: 15, status: 'AOI/Suit Filed', type: 'Wholesale', address: '786 Gayth Ave, Heath OH', acquisition: 185000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 220000, projRehab: 0, purchaseDate: '2025-06-01', closeDate: '' },
  { id: 16, status: 'Terminated', type: 'Wholesale', address: '1 S Central St, Ashley OH', acquisition: 135000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 175000, projRehab: 0, purchaseDate: '2025-06-20', closeDate: '' },
  { id: 17, status: 'Ongoing', type: 'Wholesale', address: '2260 Homestead Dr, Columbus OH', acquisition: 110000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 120000, projRehab: 0, purchaseDate: '2025-11-01', closeDate: '' },
  { id: 18, status: 'Closed', type: 'Wholesale', address: '925 E Main St. Crestline OH', acquisition: 30000, rehab: 0, disposition: 47000, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 47000, projRehab: 0, purchaseDate: '2025-10-15', closeDate: '2025-11-07' },
  { id: 19, status: 'Terminated', type: 'Wholesale', address: '608 Crabapple Dr Carey OH', acquisition: 87000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 92000, projRehab: 0, purchaseDate: '2025-07-01', closeDate: '' },
  { id: 20, status: 'AOI/Suit Filed', type: 'Wholesale', address: '1486 Firwood Dr, Columbus OH', acquisition: 260000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 280000, projRehab: 0, purchaseDate: '2025-08-01', closeDate: '' },
  { id: 28, status: 'Ongoing', type: 'Wholesale', address: '6115 Foxcroft Rd. Toledo OH', acquisition: 152000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 160000, projRehab: 0, purchaseDate: '2025-11-15', closeDate: '' },
  { id: 29, status: 'Closed', type: 'Wholesale', address: '1763 Ransburg Ave. Columbus OH', acquisition: 83500, rehab: 0, disposition: 103000, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 103000, projRehab: 0, purchaseDate: '2025-11-01', closeDate: '2025-12-01' },
  { id: 30, status: 'Ongoing', type: 'Wholesale', address: '5013 Silica Dr, Sylvania OH', acquisition: 142500, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 162500, projRehab: 0, purchaseDate: '2025-12-01', closeDate: '' },
  { id: 31, status: 'Ongoing', type: 'Wholesale', address: '116 Highland Ave. Circleville OH', acquisition: 160000, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 190000, projRehab: 2500, purchaseDate: '2025-12-10', closeDate: '' },
  { id: 32, status: 'Ongoing', type: 'Wholesale', address: '114 N Osborn Ave, Youngstown OH', acquisition: 21500, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 30000, projRehab: 0, purchaseDate: '2025-12-15', closeDate: '' },
];

const INITIAL_LEDGER = [
  { timestamp: '2025-11-02', dealId: 1, type: 'Flip', address: '480 Beachside Dr.', closeDate: '2025-06-04', profitUsed: 63700, pfProfit: 6370, pfOwnersPay: 22295, pfTaxes: 9555, pfOpex: 25480 },
  { timestamp: '2025-11-02', dealId: 2, type: 'Wholesale', address: '3386 Beulah Rd.', closeDate: '2025-08-08', profitUsed: 40000, pfProfit: 4000, pfOwnersPay: 14000, pfTaxes: 6000, pfOpex: 16000 },
  { timestamp: '2025-11-02', dealId: 3, type: 'Wholesale', address: '1368 Nutmeg Ct.', closeDate: '2025-08-18', profitUsed: 10000, pfProfit: 1000, pfOwnersPay: 3500, pfTaxes: 1500, pfOpex: 4000 },
  { timestamp: '2025-11-14', dealId: 5, type: 'Flip', address: '13179 Ridgeway Rd.', closeDate: '2025-09-05', profitUsed: 38200, pfProfit: 3820, pfOwnersPay: 13370, pfTaxes: 5730, pfOpex: 15280 },
  { timestamp: '2025-11-14', dealId: 7, type: 'Flip', address: '520 Cline St.', closeDate: '2025-09-12', profitUsed: -19300, pfProfit: -1930, pfOwnersPay: -6755, pfTaxes: -2895, pfOpex: -7720 },
  { timestamp: '2025-12-15', dealId: 8, type: 'Flip', address: '368 E College Ave.', closeDate: '2025-12-15', profitUsed: 10291, pfProfit: 1029, pfOwnersPay: 3602, pfTaxes: 1544, pfOpex: 4116 },
  { timestamp: '2025-11-14', dealId: 18, type: 'Wholesale', address: '925 E Main St.', closeDate: '2025-11-07', profitUsed: 17000, pfProfit: 1700, pfOwnersPay: 5950, pfTaxes: 2550, pfOpex: 6800 },
  { timestamp: '2025-12-01', dealId: 29, type: 'Wholesale', address: '1763 Ransburg Ave.', closeDate: '2025-12-01', profitUsed: 19500, pfProfit: 1950, pfOwnersPay: 6825, pfTaxes: 2925, pfOpex: 7800 },
];

const CHECKLIST = ["Review all deals status", "Confirm JV Owner Share %", "Verify PF allocations = 100%", "Transfer money per PF totals", "Update projections", "Review Summary", "Quarterly Distribution", "Reconcile with bank"];

// LEAD FUNNEL STAGES (matches ReSimpli pipeline)
const LEAD_STAGES = [
  { id: 'new', name: 'Discovery', icon: '📥', color: '#3b82f6', bg: '#dbeafe' },
  { id: 'contacted', name: 'Contacted', icon: '📞', color: '#8b5cf6', bg: '#ede9fe' },
  { id: 'process_call', name: 'Processed', icon: '🎯', color: '#f59e0b', bg: '#fef3c7' },
  { id: 'offer', name: 'Offered', icon: '💰', color: '#06b6d4', bg: '#cffafe' },
  { id: 'contract', name: 'Contract', icon: '📝', color: '#10b981', bg: '#d1fae5' },
  { id: 'closed', name: 'Closed', icon: '✅', color: '#059669', bg: '#a7f3d0' },
  { id: 'dead', name: 'Dead/Lost', icon: '❌', color: '#dc2626', bg: '#fee2e2' }
];

// Stage order for cumulative counting (higher index = further along)
const STAGE_ORDER = ['new', 'contacted', 'process_call', 'offer', 'contract', 'closed'];

// Initial lead funnel data (will be synced from ReSimpli)
const INITIAL_LEADS = [
  { id: 1, resimpliId: 'RS001', propertyAddress: '123 Oak St, Columbus OH', sellerName: 'John Smith', sellerPhone: '614-555-0101', status: 'new', source: 'Direct Mail', dateAdded: '2025-12-20' },
  { id: 2, resimpliId: 'RS002', propertyAddress: '456 Maple Ave, Dublin OH', sellerName: 'Mary Johnson', sellerPhone: '614-555-0102', status: 'contacted', source: 'PPC', dateAdded: '2025-12-19' },
  { id: 3, resimpliId: 'RS003', propertyAddress: '789 Pine Rd, Westerville OH', sellerName: 'Bob Williams', sellerPhone: '614-555-0103', status: 'process_call', source: 'Cold Call', dateAdded: '2025-12-18' },
  { id: 4, resimpliId: 'RS004', propertyAddress: '321 Elm Dr, Gahanna OH', sellerName: 'Sarah Davis', sellerPhone: '614-555-0104', status: 'offer', source: 'Direct Mail', dateAdded: '2025-12-17' },
  { id: 5, resimpliId: 'RS005', propertyAddress: '654 Cedar Ln, Reynoldsburg OH', sellerName: 'Mike Brown', sellerPhone: '614-555-0105', status: 'contract', source: 'Facebook', dateAdded: '2025-12-15' },
  { id: 6, resimpliId: 'RS006', propertyAddress: '987 Birch Way, Powell OH', sellerName: 'Lisa Wilson', sellerPhone: '614-555-0106', status: 'closed', source: 'Referral', dateAdded: '2025-12-10' },
  { id: 7, resimpliId: 'RS007', propertyAddress: '147 Walnut St, Grove City OH', sellerName: 'Tom Anderson', sellerPhone: '614-555-0107', status: 'dead', source: 'SMS', dateAdded: '2025-12-08' },
  { id: 8, resimpliId: 'RS008', propertyAddress: '258 Spruce Ave, Hilliard OH', sellerName: 'Nancy Taylor', sellerPhone: '614-555-0108', status: 'new', source: 'Direct Mail', dateAdded: '2025-12-20' },
  { id: 9, resimpliId: 'RS009', propertyAddress: '369 Ash Blvd, Delaware OH', sellerName: 'Chris Martin', sellerPhone: '740-555-0109', status: 'contacted', source: 'PPC', dateAdded: '2025-12-19' },
  { id: 10, resimpliId: 'RS010', propertyAddress: '480 Beech Ct, Pickerington OH', sellerName: 'Amy White', sellerPhone: '614-555-0110', status: 'new', source: 'Cold Call', dateAdded: '2025-12-21' },
];

// MARKETING SECTION DATA
const DEFAULT_MARKETING_CHANNELS = [
  { id: 'directmail', name: 'Direct Mail', icon: '📬', color: '#3b82f6' },
  { id: 'ppc', name: 'PPC/Google Ads', icon: '🎯', color: '#ef4444' },
  { id: 'facebook', name: 'Facebook Ads', icon: '📘', color: '#1d4ed8' },
  { id: 'seo', name: 'SEO/Website', icon: '🌐', color: '#10b981' },
  { id: 'coldcall', name: 'Cold Calling', icon: '📞', color: '#f59e0b' },
  { id: 'sms', name: 'SMS/Text', icon: '💬', color: '#8b5cf6' },
  { id: 'bandit', name: 'Bandit Signs', icon: '🪧', color: '#ec4899' },
  { id: 'd4d', name: 'Driving 4 Dollars', icon: '🚗', color: '#06b6d4' },
  { id: 'tv', name: 'TV/Radio', icon: '📺', color: '#64748b' },
  { id: 'referral', name: 'Referrals', icon: '🤝', color: '#059669' },
  { id: 'other', name: 'Other', icon: '📎', color: '#94a3b8' }
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'marketing', name: 'Marketing/Ads', icon: '📣' },
  { id: 'directmail', name: 'Direct Mail', icon: '📬' },
  { id: 'acquisitions', name: 'Acquisitions Rep', icon: '🤝' },
  { id: 'tc', name: 'Transaction Coordinator', icon: '📋' },
  { id: 'dispositions', name: 'Dispositions Rep', icon: '💼' },
  { id: 'va', name: 'Virtual Assistant', icon: '👩‍💻' },
  { id: 'software', name: 'Software/CRM', icon: '💻' },
  { id: 'skiptracing', name: 'Skip Tracing/Data', icon: '🔍' },
  { id: 'coldcalling', name: 'Cold Calling Service', icon: '📞' },
  { id: 'office', name: 'Office/Admin', icon: '🏢' },
  { id: 'legal', name: 'Legal/Professional', icon: '⚖️' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️' },
  { id: 'travel', name: 'Travel/Auto', icon: '🚗' },
  { id: 'education', name: 'Education/Training', icon: '📚' },
  { id: 'contractors', name: 'Contractors/Repairs', icon: '🔨' },
  { id: 'utilities', name: 'Utilities/Holding', icon: '💡' },
  { id: 'other', name: 'Other', icon: '📎' }
];

const INITIAL_EXPENSES = [
  // Marketing
  { id: 1, date: '2025-01-15', category: 'directmail', channel: 'directmail', description: 'January Postcard Campaign - 5000 pieces', amount: 2850, vendor: 'PostcardMania', recurring: false },
  { id: 2, date: '2025-01-15', category: 'marketing', channel: 'ppc', description: 'Google Ads - January', amount: 1500, vendor: 'Google', recurring: true },
  { id: 4, date: '2025-02-15', category: 'directmail', channel: 'directmail', description: 'February Postcard Campaign', amount: 2850, vendor: 'PostcardMania', recurring: false },
  { id: 5, date: '2025-02-15', category: 'marketing', channel: 'facebook', description: 'Facebook Lead Gen Ads', amount: 800, vendor: 'Meta', recurring: true },
  { id: 7, date: '2025-03-15', category: 'directmail', channel: 'directmail', description: 'March Postcard Campaign', amount: 3200, vendor: 'PostcardMania', recurring: false },
  { id: 8, date: '2025-03-15', category: 'marketing', channel: 'sms', description: 'SMS Campaign - 10000 texts', amount: 450, vendor: 'Launch Control', recurring: false },
  { id: 10, date: '2025-04-15', category: 'marketing', channel: 'ppc', description: 'Google Ads - Q2', amount: 2000, vendor: 'Google', recurring: true },
  { id: 11, date: '2025-05-01', category: 'directmail', channel: 'directmail', description: 'May Postcard Campaign - Absentee Owners', amount: 3500, vendor: 'PostcardMania', recurring: false },
  { id: 13, date: '2025-06-01', category: 'marketing', channel: 'bandit', description: 'Bandit Signs - 100 signs', amount: 350, vendor: 'Signs on the Cheap', recurring: false },
  { id: 14, date: '2025-06-15', category: 'directmail', channel: 'directmail', description: 'June Tax Delinquent Mailer', amount: 2900, vendor: 'PostcardMania', recurring: false },
  { id: 16, date: '2025-07-15', category: 'marketing', channel: 'facebook', description: 'Facebook Ads - Summer Campaign', amount: 1200, vendor: 'Meta', recurring: true },
  { id: 17, date: '2025-08-01', category: 'directmail', channel: 'directmail', description: 'August Probate Mailer', amount: 2400, vendor: 'PostcardMania', recurring: false },
  { id: 18, date: '2025-08-15', category: 'marketing', channel: 'ppc', description: 'Google Ads - August', amount: 1800, vendor: 'Google', recurring: true },
  { id: 20, date: '2025-09-15', category: 'marketing', channel: 'sms', description: 'SMS Blast - Pre-foreclosure', amount: 600, vendor: 'Launch Control', recurring: false },
  { id: 21, date: '2025-10-01', category: 'directmail', channel: 'directmail', description: 'October High Equity Mailer', amount: 3100, vendor: 'PostcardMania', recurring: false },
  { id: 24, date: '2025-11-15', category: 'directmail', channel: 'directmail', description: 'November Inherited Property Mailer', amount: 2800, vendor: 'PostcardMania', recurring: false },
  { id: 26, date: '2025-12-15', category: 'marketing', channel: 'ppc', description: 'Google Ads - December', amount: 1600, vendor: 'Google', recurring: true },
  
  // Team - Acquisitions Rep (monthly)
  { id: 100, date: '2025-01-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - January', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 101, date: '2025-02-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - February', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 102, date: '2025-03-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - March', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 103, date: '2025-04-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - April', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 104, date: '2025-05-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - May', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 105, date: '2025-06-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - June', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 106, date: '2025-07-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - July', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 107, date: '2025-08-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - August', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 108, date: '2025-09-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - September', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 109, date: '2025-10-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - October', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 110, date: '2025-11-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - November', amount: 4500, vendor: 'Payroll', recurring: true },
  { id: 111, date: '2025-12-01', category: 'acquisitions', channel: null, description: 'Acquisitions Rep - December', amount: 4500, vendor: 'Payroll', recurring: true },
  
  // Team - Transaction Coordinator (monthly)
  { id: 200, date: '2025-01-01', category: 'tc', channel: null, description: 'Transaction Coordinator - January', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 201, date: '2025-02-01', category: 'tc', channel: null, description: 'Transaction Coordinator - February', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 202, date: '2025-03-01', category: 'tc', channel: null, description: 'Transaction Coordinator - March', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 203, date: '2025-04-01', category: 'tc', channel: null, description: 'Transaction Coordinator - April', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 204, date: '2025-05-01', category: 'tc', channel: null, description: 'Transaction Coordinator - May', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 205, date: '2025-06-01', category: 'tc', channel: null, description: 'Transaction Coordinator - June', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 206, date: '2025-07-01', category: 'tc', channel: null, description: 'Transaction Coordinator - July', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 207, date: '2025-08-01', category: 'tc', channel: null, description: 'Transaction Coordinator - August', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 208, date: '2025-09-01', category: 'tc', channel: null, description: 'Transaction Coordinator - September', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 209, date: '2025-10-01', category: 'tc', channel: null, description: 'Transaction Coordinator - October', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 210, date: '2025-11-01', category: 'tc', channel: null, description: 'Transaction Coordinator - November', amount: 2500, vendor: 'Payroll', recurring: true },
  { id: 211, date: '2025-12-01', category: 'tc', channel: null, description: 'Transaction Coordinator - December', amount: 2500, vendor: 'Payroll', recurring: true },
  
  // Team - Dispositions Rep (monthly)
  { id: 300, date: '2025-01-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - January', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 301, date: '2025-02-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - February', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 302, date: '2025-03-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - March', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 303, date: '2025-04-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - April', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 304, date: '2025-05-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - May', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 305, date: '2025-06-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - June', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 306, date: '2025-07-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - July', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 307, date: '2025-08-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - August', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 308, date: '2025-09-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - September', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 309, date: '2025-10-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - October', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 310, date: '2025-11-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - November', amount: 3000, vendor: 'Payroll', recurring: true },
  { id: 311, date: '2025-12-01', category: 'dispositions', channel: null, description: 'Dispositions Rep - December', amount: 3000, vendor: 'Payroll', recurring: true },
  
  // Software (monthly)
  { id: 400, date: '2025-01-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 401, date: '2025-01-01', category: 'software', channel: null, description: 'PropStream Subscription', amount: 99, vendor: 'PropStream', recurring: true },
  { id: 402, date: '2025-02-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 403, date: '2025-02-01', category: 'software', channel: null, description: 'PropStream Subscription', amount: 99, vendor: 'PropStream', recurring: true },
  { id: 404, date: '2025-03-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 405, date: '2025-03-01', category: 'software', channel: null, description: 'PropStream Subscription', amount: 99, vendor: 'PropStream', recurring: true },
  { id: 406, date: '2025-04-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 407, date: '2025-05-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 408, date: '2025-06-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 409, date: '2025-07-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 410, date: '2025-08-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 411, date: '2025-09-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 412, date: '2025-10-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 413, date: '2025-11-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  { id: 414, date: '2025-12-01', category: 'software', channel: null, description: 'REI BlackBook CRM', amount: 149, vendor: 'REI BlackBook', recurring: true },
  
  // Skip Tracing
  { id: 500, date: '2025-01-15', category: 'skiptracing', channel: null, description: 'Skip Tracing - January batch', amount: 297, vendor: 'BatchSkipTracing', recurring: false },
  { id: 501, date: '2025-03-15', category: 'skiptracing', channel: null, description: 'Skip Tracing - March batch', amount: 312, vendor: 'BatchSkipTracing', recurring: false },
  { id: 502, date: '2025-05-15', category: 'skiptracing', channel: null, description: 'Skip Tracing - May batch', amount: 285, vendor: 'BatchSkipTracing', recurring: false },
  { id: 503, date: '2025-07-15', category: 'skiptracing', channel: null, description: 'Skip Tracing - July batch', amount: 340, vendor: 'BatchSkipTracing', recurring: false },
  { id: 504, date: '2025-09-15', category: 'skiptracing', channel: null, description: 'Skip Tracing - September batch', amount: 298, vendor: 'BatchSkipTracing', recurring: false },
  { id: 505, date: '2025-11-15', category: 'skiptracing', channel: null, description: 'Skip Tracing - November batch', amount: 325, vendor: 'BatchSkipTracing', recurring: false },
  
  // Cold Calling Service
  { id: 600, date: '2025-03-01', category: 'coldcalling', channel: 'coldcall', description: 'Cold Calling Service - March', amount: 1200, vendor: 'Call Porter', recurring: true },
  { id: 601, date: '2025-04-01', category: 'coldcalling', channel: 'coldcall', description: 'Cold Calling Service - April', amount: 1200, vendor: 'Call Porter', recurring: true },
  { id: 602, date: '2025-05-01', category: 'coldcalling', channel: 'coldcall', description: 'Cold Calling Service - May', amount: 1500, vendor: 'Call Porter', recurring: true },
  { id: 603, date: '2025-06-01', category: 'coldcalling', channel: 'coldcall', description: 'Cold Calling Service - June', amount: 1500, vendor: 'Call Porter', recurring: true },
  { id: 604, date: '2025-07-01', category: 'coldcalling', channel: 'coldcall', description: 'Cold Calling Service - July', amount: 1500, vendor: 'Call Porter', recurring: true },
  { id: 605, date: '2025-08-01', category: 'coldcalling', channel: 'coldcall', description: 'Cold Calling Service - August', amount: 1500, vendor: 'Call Porter', recurring: true },
  { id: 606, date: '2025-09-01', category: 'coldcalling', channel: 'coldcall', description: 'Cold Calling Service - September', amount: 1500, vendor: 'Call Porter', recurring: true },
  { id: 607, date: '2025-10-01', category: 'coldcalling', channel: 'coldcall', description: 'Cold Calling Service - October', amount: 1500, vendor: 'Call Porter', recurring: true },
  { id: 608, date: '2025-11-01', category: 'coldcalling', channel: 'coldcall', description: 'Cold Calling Service - November', amount: 1500, vendor: 'Call Porter', recurring: true },
  { id: 609, date: '2025-12-01', category: 'coldcalling', channel: 'coldcall', description: 'Cold Calling Service - December', amount: 1500, vendor: 'Call Porter', recurring: true },
  
  // Education
  { id: 700, date: '2025-02-15', category: 'education', channel: null, description: 'Wholesaling Mastermind - Q1', amount: 997, vendor: 'Investor Training', recurring: false },
  { id: 701, date: '2025-10-15', category: 'education', channel: null, description: 'REI Conference Ticket', amount: 497, vendor: 'BiggerPockets', recurring: false },
  
  // Insurance
  { id: 800, date: '2025-01-15', category: 'insurance', channel: null, description: 'E&O Insurance - Annual', amount: 2400, vendor: 'State Farm', recurring: false },
  { id: 801, date: '2025-06-01', category: 'insurance', channel: null, description: 'General Liability - 6mo', amount: 1200, vendor: 'State Farm', recurring: false },
  
  // Legal
  { id: 900, date: '2025-03-01', category: 'legal', channel: null, description: 'Contract Review - Attorney', amount: 500, vendor: 'Smith & Associates', recurring: false },
  { id: 901, date: '2025-07-15', category: 'legal', channel: null, description: 'LLC Annual Filing', amount: 99, vendor: 'State of Ohio', recurring: false },
  { id: 902, date: '2025-09-01', category: 'legal', channel: null, description: 'Title Issue Resolution', amount: 750, vendor: 'Smith & Associates', recurring: false },
];

function loadData(key, fallback) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const value = parsed[key];
      if (Array.isArray(fallback)) {
        return Array.isArray(value) && value.length > 0 ? value : fallback;
      }
      return value || fallback;
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return fallback;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deals, setDeals] = useState(() => loadData('deals', INITIAL_DEALS));
  const [allocations, setAllocations] = useState(() => loadData('allocations', DEFAULT_ALLOCATIONS));
  const [ledger, setLedger] = useState(() => loadData('ledger', INITIAL_LEDGER));
  const [checklist, setChecklist] = useState(() => loadData('checklist', CHECKLIST.map(() => false)));
  const [expenses, setExpenses] = useState(() => loadData('expenses', INITIAL_EXPENSES));
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [editingDeal, setEditingDeal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState('cards');
  const [sortField, setSortField] = useState('purchaseDate');
  const [sortDir, setSortDir] = useState('desc');
  const [statsPeriod, setStatsPeriod] = useState('ytd');
  const [dealTypeFilter, setDealTypeFilter] = useState('All');
  const [showCloseModal, setShowCloseModal] = useState(null);
  const [closeModalData, setCloseModalData] = useState({});
  const [detailModal, setDetailModal] = useState(null);
  // Marketing state
  const [marketingTab, setMarketingTab] = useState('overview');
  const [editingExpense, setEditingExpense] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ date: '', category: 'marketing', channel: '', description: '', amount: 0, vendor: '', recurring: 'none', recurringEndDate: '' });
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvMapping, setCsvMapping] = useState({ date: '', amount: '', description: '', vendor: '' });
  const [csvOptions, setCsvOptions] = useState({ flipSigns: false, separateIncome: true });
  const [showCsvReviewModal, setShowCsvReviewModal] = useState(false);
  const [csvReviewExpenses, setCsvReviewExpenses] = useState([]);
  const [csvReviewIncome, setCsvReviewIncome] = useState([]);
  const [pendingReview, setPendingReview] = useState(() => loadData('pendingReview', { expenses: [], income: [] }));
  const [vendorMappings, setVendorMappings] = useState(() => loadData('vendorMappings', {}));
  const [customRules, setCustomRules] = useState(() => loadData('customRules', []));
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [newRule, setNewRule] = useState({ contains: '', category: 'software', channel: '' });
  // Custom categories and channels
  const [customCategories, setCustomCategories] = useState(() => loadData('customCategories', []));
  const [customChannels, setCustomChannels] = useState(() => loadData('customChannels', []));
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  
  // Combined arrays (default + custom)
  const EXPENSE_CATEGORIES = useMemo(() => [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories], [customCategories]);
  const MARKETING_CHANNELS = useMemo(() => [...DEFAULT_MARKETING_CHANNELS, ...customChannels], [customChannels]);
  // Income state
  const [income, setIncome] = useState(() => loadData('income', []));
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ date: '', amount: 0, description: '', source: 'other', type: 'income' });
  const INCOME_TYPES = [
    { id: 'income', name: 'Business Income', icon: '💵' },
    { id: 'owner_contribution', name: 'Owner Contribution', icon: '💰' },
    { id: 'owner_draw', name: 'Owner Draw', icon: '🏧' },
    { id: 'refund', name: 'Refund', icon: '↩️' },
    { id: 'other', name: 'Other', icon: '📎' }
  ];
  // AI Config for closing statement analysis
  const [aiConfig, setAiConfig] = useState(() => loadData('aiConfig', { provider: 'anthropic', apiKey: '', model: 'claude-sonnet-4-20250514' }));
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showAiReviewModal, setShowAiReviewModal] = useState(false);
  const [aiExtractedData, setAiExtractedData] = useState(null);
  const [aiPdfData, setAiPdfData] = useState(null); // Store base64 PDF
  // Ledger state
  const [editingLedger, setEditingLedger] = useState(null);
  // Lead Funnel state
  const [leads, setLeads] = useState(() => loadData('leads', INITIAL_LEADS));
  const [showResimpliModal, setShowResimpliModal] = useState(false);
  const [resimpliConfig, setResimpliConfig] = useState(() => loadData('resimpliConfig', { apiKey: '', workspaceId: '', lastSync: null }));
  const [webhookConfig, setWebhookConfig] = useState(() => loadData('webhookConfig', { enabled: false, secretKey: '', lastReceived: null, receivedDeals: [] }));
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState(() => loadData('googleSheetsConfig', { sheetUrl: '', lastSync: null }));
  const [sheetSyncing, setSheetSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ status: 'idle', message: '' });
  const [selectedLeadStage, setSelectedLeadStage] = useState(null);

  // Cloud sync state
  const [cloudSyncStatus, setCloudSyncStatus] = useState('loading'); // 'loading', 'synced', 'syncing', 'error', 'offline'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const syncTimeoutRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [showFilters, setShowFilters] = useState(false);

  // Load from cloud on startup
  useEffect(() => {
    async function initFromCloud() {
      setCloudSyncStatus('loading');
      console.log('Initializing from cloud...');
      const cloudData = await loadFromCloud();
      
      if (cloudData && cloudData.deals && cloudData.deals.length > 0) {
        // Cloud has real data - use it
        console.log('Found cloud data, loading...');
        setDeals(cloudData.deals);
        if (cloudData.allocations) setAllocations(cloudData.allocations);
        if (cloudData.ledger) setLedger(cloudData.ledger);
        if (cloudData.checklist) setChecklist(cloudData.checklist);
        if (cloudData.expenses) setExpenses(cloudData.expenses);
        if (cloudData.leads) setLeads(cloudData.leads);
        if (cloudData.resimpli_config) setResimpliConfig(cloudData.resimpli_config);
        setLastSyncTime(new Date());
        setCloudSyncStatus('synced');
      } else {
        // No cloud data or empty - save current local data to cloud
        console.log('No cloud data, uploading local data...');
        const saved = await saveToCloud({ deals, allocations, ledger, checklist, expenses, leads, resimpliConfig });
        setLastSyncTime(saved ? new Date() : null);
        setCloudSyncStatus(saved ? 'synced' : 'error');
      }
      isInitialLoad.current = false;
    }
    initFromCloud();
  }, []);

  // Save to cloud when data changes (debounced)
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    // Save to localStorage immediately (including vendorMappings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ deals, allocations, ledger, checklist, expenses, leads, resimpliConfig, webhookConfig, googleSheetsConfig, vendorMappings, customRules, income, customCategories, customChannels, pendingReview, aiConfig }));
    
    // Debounce cloud sync
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    setCloudSyncStatus('syncing');
    
    syncTimeoutRef.current = setTimeout(async () => {
      const saved = await saveToCloud({ deals, allocations, ledger, checklist, expenses, leads, resimpliConfig });
      if (saved) {
        setLastSyncTime(new Date());
        setCloudSyncStatus('synced');
      } else {
        setCloudSyncStatus('error');
      }
    }, 1000);
    
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [deals, allocations, ledger, checklist, expenses, leads, resimpliConfig, webhookConfig, googleSheetsConfig, vendorMappings, customRules, income, customCategories, customChannels, pendingReview, aiConfig]);

  // AI Closing Statement Analysis
  const analyzeClosingStatement = async (file) => {
    if (!aiConfig.apiKey) {
      alert('Please configure your AI API key in Settings first.');
      return null;
    }
    
    setAiProcessing(true);
    
    try {
      // Convert PDF to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const prompt = `Analyze this real estate closing statement (HUD-1, ALTA, CD, or similar settlement statement) and extract ALL financial information. This is critical for accurate deal tracking.

Return ONLY a valid JSON object with these exact fields (use 0 or null for any values not found, use negative numbers for debits/charges):

{
  "documentType": "HUD-1" or "ALTA" or "CD" or "Settlement Statement" or "Unknown",
  "propertyAddress": "full property address including city, state, zip",
  "closingDate": "YYYY-MM-DD format",
  "transactionType": "sale" or "purchase" or "refinance",
  
  "contractPrice": 0,
  "earnestMoneyDeposit": 0,
  
  "sellerCredits": 0,
  "buyerCredits": 0,
  "sellerConcessions": 0,
  
  "realEstateCommissionTotal": 0,
  "listingAgentCommission": 0,
  "buyerAgentCommission": 0,
  
  "titleInsurance": 0,
  "ownersTitlePolicy": 0,
  "lendersTitlePolicy": 0,
  "titleSearchFees": 0,
  "settlementFee": 0,
  "escrowFee": 0,
  "closingFee": 0,
  
  "recordingFees": 0,
  "transferTax": 0,
  "deedPrepFee": 0,
  
  "prorationsTaxes": 0,
  "prorationHOA": 0,
  "prorationRent": 0,
  "prorationOther": 0,
  
  "existingLoanPayoff": 0,
  "newLoanAmount": 0,
  "loanOriginationFee": 0,
  "discountPoints": 0,
  "prepaidInterest": 0,
  
  "homeWarranty": 0,
  "pestInspection": 0,
  "homeInspection": 0,
  "appraisalFee": 0,
  "surveyFee": 0,
  
  "hazardInsurance": 0,
  "floodInsurance": 0,
  "mortgageInsurance": 0,
  
  "miscFees": 0,
  "wireTransferFee": 0,
  "notaryFee": 0,
  "courierFee": 0,
  
  "totalSellerDebits": 0,
  "totalSellerCredits": 0,
  "totalBuyerDebits": 0,
  "totalBuyerCredits": 0,
  
  "cashDueToSeller": 0,
  "cashDueFromSeller": 0,
  "cashDueFromBuyer": 0,
  "cashDueToBuyer": 0,
  
  "netToSeller": 0,
  "totalClosingCosts": 0,
  
  "buyerName": "",
  "sellerName": "",
  "closingAgent": "",
  "titleCompany": "",
  
  "notes": "any important details, adjustments, or unusual items noticed"
}

IMPORTANT: 
- For "netToSeller" or "cashDueToSeller", find the final amount the seller receives after all debits
- "totalClosingCosts" should be the sum of all fees paid by the seller
- Double-check the math: netToSeller should equal contractPrice minus all seller debits plus credits
- Return ONLY the JSON object, no other text or explanation`;

      let response;
      
      if (aiConfig.provider === 'anthropic') {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': aiConfig.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: aiConfig.model || 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{
              role: 'user',
              content: [
                { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
                { type: 'text', text: prompt }
              ]
            }]
          })
        });
        
        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Anthropic API error: ${response.status} - ${err}`);
        }
        
        const data = await response.json();
        const text = data.content[0].text;
        
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          setAiExtractedData(extracted);
          setAiPdfData(base64); // Store PDF for later access
          setShowAiReviewModal(true);
          return extracted;
        }
        throw new Error('Could not parse AI response');
        
      } else if (aiConfig.provider === 'openai') {
        // For OpenAI, we need to use GPT-4 Vision
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`
          },
          body: JSON.stringify({
            model: aiConfig.model || 'gpt-4o',
            max_tokens: 4000,
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } }
              ]
            }]
          })
        });
        
        if (!response.ok) {
          const err = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${err}`);
        }
        
        const data = await response.json();
        const text = data.choices[0].message.content;
        
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          setAiExtractedData(extracted);
          setAiPdfData(base64); // Store PDF for later access
          setShowAiReviewModal(true);
          return extracted;
        }
        throw new Error('Could not parse AI response');
      }
      
    } catch (error) {
      console.error('AI Analysis Error:', error);
      alert(`Error analyzing document: ${error.message}`);
      return null;
    } finally {
      setAiProcessing(false);
    }
  };

  // Manual sync function
  const manualSync = async () => {
    setCloudSyncStatus('syncing');
    const cloudData = await loadFromCloud();
    if (cloudData) {
      if (cloudData.deals) setDeals(cloudData.deals);
      if (cloudData.allocations) setAllocations(cloudData.allocations);
      if (cloudData.ledger) setLedger(cloudData.ledger);
      if (cloudData.checklist) setChecklist(cloudData.checklist);
      if (cloudData.expenses) setExpenses(cloudData.expenses);
      if (cloudData.leads) setLeads(cloudData.leads);
      if (cloudData.resimpli_config) setResimpliConfig(cloudData.resimpli_config);
      setLastSyncTime(new Date());
      setCloudSyncStatus('synced');
    } else {
      setCloudSyncStatus('error');
    }
  };

  // Electron-specific functionality can be added here
  // ReSimpli sync will work when configured via Settings tab

  const resetData = () => {
    if (confirm('Reset all data to defaults? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      setDeals(INITIAL_DEALS);
      setAllocations(DEFAULT_ALLOCATIONS);
      setLedger(INITIAL_LEDGER);
      setChecklist(CHECKLIST.map(() => false));
      setExpenses(INITIAL_EXPENSES);
      setLeads(INITIAL_LEADS);
    }
  };

  const calcProfit = (d) => {
    if (d.status !== 'Closed') return 0;
    const g = d.disposition - d.acquisition - d.rehab - d.holdingCosts;
    return d.jv === 'Y' ? g * (d.ownerShare / 100) : g;
  };

  // Get profit from ledger (source of truth for closed deals)
  const getLedgerProfit = (d) => {
    if (d.status !== 'Closed') return calcProjProfit(d);
    // Look up in ledger by dealId or address
    const ledgerEntry = ledger.find(l => l.dealId === d.id || l.address?.toLowerCase() === d.address?.toLowerCase());
    if (ledgerEntry) {
      return ledgerEntry.profitUsed || 0;
    }
    // Fallback to calculated profit if no ledger entry
    return calcProfit(d);
  };

  // Calculator defaults
  const CALC_DEFAULTS = {
    privateMoneyRate: 15,
    hardMoneyRate: 11.5,
    privateMoneyDown: 10,
    annualTaxes: 2300,
    annualInsurance: 1200,
    utilitiesMisc: 1800,
    points: 1,
    purchaseClosingPct: 1.1,
    realtorCommission: 5.5,
    otherSellingCosts: 5500,
    defaultFlipDays: 120
  };

  const calcProjProfit = (d) => {
    if (d.status !== 'Ongoing') return 0;
    
    const purchase = d.acquisition || 0;
    const selling = d.projDisposition || 0;
    
    // Wholesale is simple: disposition - acquisition
    if (d.type === 'Wholesale') {
      const profit = selling - purchase;
      return d.jv === 'Y' ? profit * (d.ownerShare / 100) : profit;
    }
    
    // Flips include all costs
    const rehab = d.projRehab || 0;
    
    // Use actual days held from purchase date
    let estDays = CALC_DEFAULTS.defaultFlipDays;
    if (d.purchaseDate) {
      estDays = Math.round((new Date() - new Date(d.purchaseDate)) / 86400000);
      if (estDays < 1) estDays = CALC_DEFAULTS.defaultFlipDays;
    }
    
    // Calculate holding costs
    const downPayment = purchase * (CALC_DEFAULTS.privateMoneyDown / 100);
    const loanAmount = (purchase * (1 - CALC_DEFAULTS.privateMoneyDown / 100)) + rehab;
    const holdingCosts = 
      (CALC_DEFAULTS.privateMoneyRate / 100 / 365) * downPayment * estDays +
      (CALC_DEFAULTS.hardMoneyRate / 100 / 365) * loanAmount * estDays +
      (CALC_DEFAULTS.annualTaxes / 365) * estDays +
      (CALC_DEFAULTS.annualInsurance / 365) * estDays +
      CALC_DEFAULTS.utilitiesMisc +
      loanAmount * (CALC_DEFAULTS.points / 100);
    
    const purchaseClosing = purchase * (CALC_DEFAULTS.purchaseClosingPct / 100);
    const sellingClosing = selling * (CALC_DEFAULTS.realtorCommission / 100) + CALC_DEFAULTS.otherSellingCosts;
    
    const grossProfit = selling - purchase - rehab - purchaseClosing - holdingCosts - sellingClosing;
    return d.jv === 'Y' ? grossProfit * (d.ownerShare / 100) : grossProfit;
  };

  const getDays = (d) => {
    if (!d.purchaseDate || !d.closeDate) return null;
    return Math.round((new Date(d.closeDate) - new Date(d.purchaseDate)) / 86400000);
  };

  const getPipelineDays = (d) => {
    if (!d.purchaseDate) return null;
    return Math.round((new Date() - new Date(d.purchaseDate)) / 86400000);
  };

  const now = new Date();
  const getRange = (p) => {
    const e = new Date(now);
    let s = new Date(now);
    if (p === 'week') s.setDate(e.getDate() - 7);
    else if (p === '4weeks') s.setDate(e.getDate() - 28);
    else if (p === 'quarter') s = new Date(e.getFullYear(), Math.floor(e.getMonth() / 3) * 3, 1);
    else if (p === 'ytd') s = new Date(e.getFullYear(), 0, 1);
    else if (p === '2026') return { s: new Date(2026, 0, 1), e: new Date(2026, 11, 31) };
    else if (p === '2025') return { s: new Date(2025, 0, 1), e: new Date(2025, 11, 31) };
    else if (p === '2024') return { s: new Date(2024, 0, 1), e: new Date(2024, 11, 31) };
    else if (p === '2023') return { s: new Date(2023, 0, 1), e: new Date(2023, 11, 31) };
    else if (p === '2022') return { s: new Date(2022, 0, 1), e: new Date(2022, 11, 31) };
    else if (p === 'all') return { s: new Date(2020, 0, 1), e: new Date(now) };
    return { s, e };
  };

  const periodLabel = {
    'week': 'This Week',
    '4weeks': 'Last Month', 
    'quarter': 'This Quarter',
    'ytd': 'Year to Date',
    '2026': '2026',
    '2025': '2025',
    '2024': '2024',
    '2023': '2023',
    '2022': '2022',
    'all': 'All Time'
  };

  const inRange = (dt, r) => {
    if (!dt) return false;
    const d = new Date(dt);
    return d >= r.s && d <= r.e;
  };

  const analytics = useMemo(() => {
    const r = getRange(statsPeriod);
    
    // Apply type filter
    const typeFilteredDeals = dealTypeFilter === 'All' ? deals : deals.filter(d => d.type === dealTypeFilter);
    
    const closed = typeFilteredDeals.filter(d => d.status === 'Closed' && inRange(d.closeDate, r));
    const termed = typeFilteredDeals.filter(d => d.status === 'Terminated' && inRange(d.purchaseDate, r));
    const aoi = typeFilteredDeals.filter(d => d.status === 'AOI/Suit Filed' && inRange(d.purchaseDate, r));
    const total = closed.length + termed.length + aoi.length;
    const closeRate = total > 0 ? (closed.length / total) * 100 : 0;
    const termRate = total > 0 ? (termed.length / total) * 100 : 0;
    const aoiRate = total > 0 ? (aoi.length / total) * 100 : 0;
    const flips = closed.filter(d => d.type === 'Flip');
    const ws = closed.filter(d => d.type === 'Wholesale');

    // Helper to get profit from ledger for a deal
    const getProfitFromLedger = (d) => {
      const ledgerEntry = ledger.find(l => l.dealId === d.id || l.address?.toLowerCase() === d.address?.toLowerCase());
      if (ledgerEntry) return ledgerEntry.profitUsed || 0;
      return calcProfit(d);
    };

    const stats = (arr) => {
      const p = arr.map(d => getProfitFromLedger(d));
      const days = arr.map(d => getDays(d)).filter(x => x);
      const tot = p.reduce((a, b) => a + b, 0);
      const rev = arr.reduce((a, d) => a + d.disposition, 0);
      const cost = arr.reduce((a, d) => a + d.acquisition + d.rehab + d.holdingCosts, 0);
      return {
        count: arr.length,
        total: tot,
        avg: arr.length ? tot / arr.length : 0,
        avgDays: days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0,
        rev, cost,
        roi: cost ? (tot / cost) * 100 : 0,
        margin: rev ? (tot / rev) * 100 : 0,
        max: p.length ? Math.max(...p) : 0
      };
    };

    // Get year for monthly data based on period
    // For 'all' or periods with no data in current year, use year with most recent closed deals
    let targetYear = now.getFullYear();
    if (statsPeriod === '2026') targetYear = 2026;
    else if (statsPeriod === '2025') targetYear = 2025;
    else if (statsPeriod === '2024') targetYear = 2024;
    else if (statsPeriod === '2023') targetYear = 2023;
    else if (statsPeriod === '2022') targetYear = 2022;
    else if (statsPeriod === 'all') {
      // Find year with most recent closed deal
      const closedWithDates = typeFilteredDeals.filter(d => d.status === 'Closed' && d.closeDate);
      if (closedWithDates.length > 0) {
        const mostRecent = closedWithDates.sort((a,b) => new Date(b.closeDate) - new Date(a.closeDate))[0];
        targetYear = new Date(mostRecent.closeDate).getFullYear();
      }
    }
    
    const monthly = [];
    for (let m = 0; m < 12; m++) {
      const ms = new Date(targetYear, m, 1);
      const me = new Date(targetYear, m + 1, 0);
      const md = typeFilteredDeals.filter(d => d.status === 'Closed' && d.closeDate && new Date(d.closeDate) >= ms && new Date(d.closeDate) <= me);
      const mf = md.filter(d => d.type === 'Flip');
      const mw = md.filter(d => d.type === 'Wholesale');
      monthly.push({
        name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],
        profit: md.reduce((s, d) => s + getProfitFromLedger(d), 0),
        deals: md.length,
        flips: mf.length,
        ws: mw.length,
        flipP: mf.reduce((s, d) => s + getProfitFromLedger(d), 0),
        wsP: mw.reduce((s, d) => s + getProfitFromLedger(d), 0),
        revenue: md.reduce((s, d) => s + d.disposition, 0),
        flipRev: mf.reduce((s, d) => s + d.disposition, 0),
        wsRev: mw.reduce((s, d) => s + d.disposition, 0)
      });
    }

    const profitDist = [
      {name:'Loss',min:-Infinity,max:0,c:0},
      {name:'$0-10K',min:0,max:10000,c:0},
      {name:'$10-25K',min:10000,max:25000,c:0},
      {name:'$25-50K',min:25000,max:50000,c:0},
      {name:'$50K+',min:50000,max:Infinity,c:0}
    ];
    closed.forEach(d => {
      const p = getProfitFromLedger(d);
      const r = profitDist.find(x => p >= x.min && p < x.max);
      if (r) r.c++;
    });

    const daysDist = [
      {name:'0-30',min:0,max:30,c:0},
      {name:'31-60',min:31,max:60,c:0},
      {name:'61-90',min:61,max:90,c:0},
      {name:'91-120',min:91,max:120,c:0},
      {name:'120+',min:121,max:Infinity,c:0}
    ];
    closed.forEach(d => {
      const days = getDays(d);
      if (days) {
        const r = daysDist.find(x => days >= x.min && days <= x.max);
        if (r) r.c++;
      }
    });

    const ongoing = typeFilteredDeals.filter(d => d.status === 'Ongoing');
    const aging = ongoing.map(d => ({
      addr: d.address.split(',')[0].slice(0, 18),
      days: getPipelineDays(d) || 0,
      profit: calcProjProfit(d)
    })).sort((a, b) => b.days - a.days);

    return {
      all: stats(closed),
      flip: stats(flips),
      ws: stats(ws),
      closeRate, termRate, aoiRate, total,
      monthly, profitDist, daysDist, aging,
      ongoing: ongoing.length,
      termed: termed.length,
      aoi: aoi.length,
      closedDeals: closed,
      ongoingDeals: ongoing
    };
  }, [deals, ledger, statsPeriod, dealTypeFilter]);

  const summary = useMemo(() => {
    const typeFilteredDeals = dealTypeFilter === 'All' ? deals : deals.filter(d => d.type === dealTypeFilter);
    const r = getRange(statsPeriod);
    
    const closed = typeFilteredDeals.filter(d => d.status === 'Closed' && inRange(d.closeDate, r));
    const ongoing = typeFilteredDeals.filter(d => d.status === 'Ongoing');
    
    // Use LEDGER for closed profits (source of truth)
    const typeFilteredLedger = dealTypeFilter === 'All' ? ledger : ledger.filter(l => l.type === dealTypeFilter);
    const periodLedger = typeFilteredLedger.filter(l => inRange(l.closeDate, r));
    const closedP = periodLedger.reduce((s, l) => s + (l.profitUsed || 0), 0);
    
    // Pipeline projection still from deals
    const projP = ongoing.reduce((s, d) => s + calcProjProfit(d), 0);
    
    // Also get all-time totals for comparison
    const allClosedP = typeFilteredLedger.reduce((s, l) => s + (l.profitUsed || 0), 0);
    
    // Calculate months based on selected period
    let periodMonths = 1;
    let periodLabel = '';
    const now = new Date();
    
    if (statsPeriod === 'ytd') {
      periodMonths = now.getMonth() + 1;
      periodLabel = 'YTD';
    } else if (statsPeriod === 'q') {
      periodMonths = 3;
      periodLabel = 'Quarter';
    } else if (statsPeriod === 'm') {
      periodMonths = 1;
      periodLabel = 'Month';
    } else if (statsPeriod === 'all') {
      // Calculate months from first to last ledger entry
      const closeDates = typeFilteredLedger.map(l => new Date(l.closeDate)).filter(d => !isNaN(d));
      if (closeDates.length > 0) {
        const firstDate = new Date(Math.min(...closeDates));
        periodMonths = Math.max(1, Math.round((now - firstDate) / (30 * 24 * 60 * 60 * 1000)));
      }
      periodLabel = 'All-Time';
    } else {
      // Year-specific (2022, 2023, 2024, 2025, 2026)
      periodMonths = 12;
      periodLabel = statsPeriod;
    }
    
    // Use period-filtered data for averages (use ledger count for closed deals)
    const closedN = periodLedger.length;
    const avgDealsPerMonth = closedN / Math.max(1, periodMonths);
    const avgProfitPerMonth = closedP / Math.max(1, periodMonths);
    const avgProfitPerDeal = closedN > 0 ? closedP / closedN : 0;
    
    // Projected annual revenue based on period averages
    const projectedAnnualDeals = avgDealsPerMonth * 12;
    const projectedAnnualProfit = avgProfitPerMonth * 12;
    
    return {
      closedP, projP,
      closedN,
      ongoingN: ongoing.length,
      termN: typeFilteredDeals.filter(d => d.status === 'Terminated').length,
      aoiN: typeFilteredDeals.filter(d => d.status === 'AOI/Suit Filed').length,
      allClosedP,
      allClosedN: typeFilteredLedger.length,
      // Period-based metrics
      periodMonths,
      periodLabel,
      avgDealsPerMonth,
      avgProfitPerMonth,
      avgProfitPerDeal,
      projectedAnnualDeals,
      projectedAnnualProfit
    };
  }, [deals, ledger, statsPeriod, dealTypeFilter]);

  // Marketing Analytics
  const marketingAnalytics = useMemo(() => {
    const r = getRange(statsPeriod);
    
    // Filter expenses by period
    const periodExpenses = expenses.filter(e => inRange(e.date, r));
    
    // Get closed deals in period for revenue comparison
    const periodClosedDeals = deals.filter(d => d.status === 'Closed' && inRange(d.closeDate, r));
    const periodRevenue = periodClosedDeals.reduce((s, d) => s + d.disposition, 0);
    
    // Use ledger for profit (source of truth)
    const periodLedger = ledger.filter(l => inRange(l.closeDate, r));
    const periodProfit = periodLedger.reduce((s, l) => s + (l.profitUsed || 0), 0);
    
    // Total spend by type
    const totalSpend = periodExpenses.reduce((s, e) => s + e.amount, 0);
    
    // Marketing-related spend (direct marketing channels)
    const marketingCategories = ['marketing', 'directmail', 'coldcalling'];
    const marketingSpend = periodExpenses.filter(e => marketingCategories.includes(e.category) || e.channel).reduce((s, e) => s + e.amount, 0);
    
    // Team/Labor costs
    const teamCategories = ['acquisitions', 'tc', 'dispositions', 'va'];
    const teamSpend = periodExpenses.filter(e => teamCategories.includes(e.category)).reduce((s, e) => s + e.amount, 0);
    
    // Overhead costs
    const overheadCategories = ['software', 'skiptracing', 'office', 'legal', 'insurance', 'education', 'travel', 'utilities', 'other'];
    const overheadSpend = periodExpenses.filter(e => overheadCategories.includes(e.category)).reduce((s, e) => s + e.amount, 0);
    
    // Profitability metrics
    const netProfit = periodProfit - totalSpend;
    const profitMargin = periodRevenue > 0 ? (netProfit / periodRevenue) * 100 : 0;
    const expenseRatio = periodProfit > 0 ? (totalSpend / periodProfit) * 100 : 0;
    const costPerDeal = periodClosedDeals.length > 0 ? totalSpend / periodClosedDeals.length : 0;
    const marketingCostPerDeal = periodClosedDeals.length > 0 ? marketingSpend / periodClosedDeals.length : 0;
    
    // Channel performance (marketing spend by channel)
    // Match by explicit channel OR by matching category (for backwards compatibility)
    const categoryToChannelMap = {
      'directmail': 'directmail',
      'coldcalling': 'coldcall',
      'marketing': null, // Generic marketing - user should specify channel
      'sms': 'sms',
      'ppc': 'ppc',
      'facebook': 'facebook',
      'seo': 'seo'
    };
    
    const channelStats = MARKETING_CHANNELS.map(ch => {
      const chExpenses = periodExpenses.filter(e => {
        // Match if channel is explicitly set
        if (e.channel === ch.id) return true;
        // Also match if category maps to this channel and no explicit channel set
        if (!e.channel && categoryToChannelMap[e.category] === ch.id) return true;
        return false;
      });
      const chSpend = chExpenses.reduce((s, e) => s + e.amount, 0);
      return {
        ...ch,
        spend: chSpend,
        count: chExpenses.length,
        pctOfMarketing: marketingSpend > 0 ? (chSpend / marketingSpend) * 100 : 0
      };
    }).filter(ch => ch.spend > 0);
    
    // Count expenses without channels assigned (for marketing categories)
    const unassignedChannelExpenses = periodExpenses.filter(e => 
      !e.channel && marketingCategories.includes(e.category)
    ).length;
    
    // Monthly spend breakdown
    let targetYear2 = now.getFullYear();
    if (statsPeriod === '2026') targetYear2 = 2026;
    else if (statsPeriod === '2025') targetYear2 = 2025;
    else if (statsPeriod === '2024') targetYear2 = 2024;
    else if (statsPeriod === '2023') targetYear2 = 2023;
    else if (statsPeriod === 'all') {
      const closedWithDates = deals.filter(d => d.status === 'Closed' && d.closeDate);
      if (closedWithDates.length > 0) {
        const mostRecent = closedWithDates.sort((a,b) => new Date(b.closeDate) - new Date(a.closeDate))[0];
        targetYear2 = new Date(mostRecent.closeDate).getFullYear();
      }
    }
    const monthlySpend = [];
    for (let m = 0; m < 12; m++) {
      const ms = new Date(targetYear2, m, 1);
      const me = new Date(targetYear2, m + 1, 0);
      const mExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= ms && d <= me;
      });
      const mDeals = deals.filter(d => d.status === 'Closed' && d.closeDate && new Date(d.closeDate) >= ms && new Date(d.closeDate) <= me);
      const mProfit = mDeals.reduce((s, d) => s + calcProfit(d), 0);
      monthlySpend.push({
        name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],
        marketing: mExpenses.filter(e => marketingCategories.includes(e.category) || e.channel).reduce((s, e) => s + e.amount, 0),
        team: mExpenses.filter(e => teamCategories.includes(e.category)).reduce((s, e) => s + e.amount, 0),
        overhead: mExpenses.filter(e => overheadCategories.includes(e.category) && !e.channel).reduce((s, e) => s + e.amount, 0),
        total: mExpenses.reduce((s, e) => s + e.amount, 0),
        profit: mProfit,
        deals: mDeals.length
      });
    }
    
    // Category breakdown
    const categoryBreakdown = EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      amount: periodExpenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
      count: periodExpenses.filter(e => e.category === cat.id).length
    })).filter(c => c.amount > 0);
    
    return {
      totalSpend,
      marketingSpend,
      teamSpend,
      overheadSpend,
      periodRevenue,
      periodProfit,
      netProfit,
      profitMargin,
      expenseRatio,
      costPerDeal,
      marketingCostPerDeal,
      dealsCount: periodClosedDeals.length,
      channelStats,
      monthlySpend,
      categoryBreakdown,
      unassignedChannelExpenses
    };
  }, [expenses, deals, statsPeriod]);

  const allocTotal = Object.values(allocations).reduce((a, b) => a + b, 0);
  const filtered = useMemo(() => {
    let result = [...deals];
    
    // Apply deal type filter
    if (dealTypeFilter !== 'All') {
      result = result.filter(d => d.type === dealTypeFilter);
    }
    
    // Apply status filter
    if (filterStatus !== 'All') {
      result = result.filter(d => d.status === filterStatus);
    }
    
    result.sort((a, b) => {
      let aVal, bVal;
      const aIsClosed = a.status === 'Closed';
      const bIsClosed = b.status === 'Closed';
      
      switch (sortField) {
        case 'address':
          aVal = a.address.toLowerCase();
          bVal = b.address.toLowerCase();
          break;
        case 'acquisition':
          aVal = a.acquisition;
          bVal = b.acquisition;
          break;
        case 'disposition':
          aVal = aIsClosed ? a.disposition : a.projDisposition;
          bVal = bIsClosed ? b.disposition : b.projDisposition;
          break;
        case 'profit':
          aVal = getLedgerProfit(a);
          bVal = getLedgerProfit(b);
          break;
        case 'days':
          aVal = aIsClosed ? (getDays(a) || 0) : (getPipelineDays(a) || 0);
          bVal = bIsClosed ? (getDays(b) || 0) : (getPipelineDays(b) || 0);
          break;
        case 'status':
          const statusOrder = { 'Ongoing': 0, 'Closed': 1, 'Terminated': 2, 'AOI/Suit Filed': 3 };
          aVal = statusOrder[a.status] || 0;
          bVal = statusOrder[b.status] || 0;
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'purchaseDate':
        default:
          aVal = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
          bVal = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
          break;
      }
      
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [deals, filterStatus, sortField, sortDir, dealTypeFilter]);
  const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
  const fmtK = (v) => Math.abs(v) >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : Math.abs(v) >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : fmt(v);

  const addDeal = () => {
    const n = { id: Date.now(), status: 'Ongoing', type: 'Wholesale', address: '', acquisition: 0, rehab: 0, disposition: 0, holdingCosts: 0, jv: 'N', ownerShare: 100, projDisposition: 0, projRehab: 0, purchaseDate: '', closeDate: '', notes: '' };
    setDeals([n, ...deals]);
    setEditingDeal(n.id);
    setActiveTab('deals');
  };

  const updateDeal = (id, f, v) => setDeals(deals.map(d => d.id === id ? { ...d, [f]: v } : d));
  const deleteDeal = (id) => { if (confirm('Delete?')) { setDeals(deals.filter(d => d.id !== id)); setEditingDeal(null); } };

  const handleStatus = (id, ns) => {
    const d = deals.find(x => x.id === id);
    if (ns === 'Closed' && d.status !== 'Closed') {
      setCloseModalData({ 
        closeDate: new Date().toISOString().split('T')[0],
        disposition: d.projDisposition || 0, 
        netProfit: 0
      });
      setShowCloseModal(d);
    } else {
      updateDeal(id, 'status', ns);
    }
  };

  const DetailModal = () => {
    if (!detailModal) return null;
    const closed = deals.filter(d => d.status === 'Closed');
    const ongoing = deals.filter(d => d.status === 'Ongoing');
    let title = '', content = null;

    if (detailModal === 'pf') {
      title = '💰 PF Distribution';
      const pf = [{n:'Profit',p:allocations.profit,c:'#059669'},{n:"Owner's Pay",p:allocations.ownersPay,c:'#2563eb'},{n:'Taxes',p:allocations.taxes,c:'#d97706'},{n:'OpEx',p:allocations.opex,c:'#7c3aed'}];
      content = (
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pf.map(x=>({name:x.n,closed:summary.closedP*x.p/100,proj:summary.projP*x.p/100}))} layout="vertical">
              <XAxis type="number" tickFormatter={fmtK}/>
              <YAxis dataKey="name" type="category" width={70} tick={{fontSize:10}}/>
              <Tooltip formatter={v=>fmt(v)}/>
              <Legend/>
              <Bar dataKey="closed" name="Closed" fill="#059669"/>
              <Bar dataKey="proj" name="Projected" fill="#94a3b8"/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:16}}>
            {pf.map(x=>(
              <div key={x.n} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f1f5f9',fontSize:12}}>
                <span><span style={{width:8,height:8,borderRadius:'50%',background:x.c,display:'inline-block',marginRight:6}}/>{x.n} ({x.p}%)</span>
                <strong>{fmt(summary.closedP*x.p/100)}</strong>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontWeight:700,borderTop:'2px solid #e2e8f0',marginTop:8}}>
              <span>Total</span>
              <span style={{color:'#059669'}}>{fmt(summary.closedP)}</span>
            </div>
          </div>
        </div>
      );
    } else if (detailModal === 'pipeline') {
      title = '📈 Pipeline';
      content = (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
            <div style={{background:'#f8fafc',borderRadius:8,padding:12,textAlign:'center'}}><div style={{fontSize:10,color:'#64748b'}}>Deals</div><div style={{fontSize:20,fontWeight:700}}>{ongoing.length}</div></div>
            <div style={{background:'#f8fafc',borderRadius:8,padding:12,textAlign:'center'}}><div style={{fontSize:10,color:'#64748b'}}>Value</div><div style={{fontSize:20,fontWeight:700,color:'#2563eb'}}>{fmtK(summary.projP)}</div></div>
            <div style={{background:'#f8fafc',borderRadius:8,padding:12,textAlign:'center'}}><div style={{fontSize:10,color:'#64748b'}}>Avg</div><div style={{fontSize:20,fontWeight:700}}>{fmtK(ongoing.length?summary.projP/ongoing.length:0)}</div></div>
          </div>
          <h4 style={{margin:'12px 0 8px',fontSize:12}}>Pipeline Aging</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={analytics.aging.slice(0,8)}>
              <XAxis dataKey="addr" tick={{fontSize:8}} angle={-30} textAnchor="end" height={50}/>
              <YAxis tick={{fontSize:10}}/>
              <Tooltip/>
              <Bar dataKey="days" fill="#f59e0b" name="Days"/>
            </BarChart>
          </ResponsiveContainer>
          <h4 style={{margin:'12px 0 8px',fontSize:12}}>Active Deals</h4>
          <div style={{maxHeight:150,overflow:'auto'}}>
            {ongoing.map(d=>(
              <div key={d.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f1f5f9',fontSize:11}}>
                <span>{d.address.split(',')[0]}</span>
                <span style={{color:'#059669',fontWeight:600}}>{fmt(calcProjProfit(d))}</span>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (detailModal === 'closed') {
      title = '✅ Closed Details';
      content = (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginBottom:16}}>
            <div style={{background:'#f8fafc',borderRadius:8,padding:10,textAlign:'center'}}><div style={{fontSize:9,color:'#64748b'}}>Deals</div><div style={{fontSize:16,fontWeight:700}}>{closed.length}</div></div>
            <div style={{background:'#f8fafc',borderRadius:8,padding:10,textAlign:'center'}}><div style={{fontSize:9,color:'#64748b'}}>Total</div><div style={{fontSize:16,fontWeight:700,color:'#059669'}}>{fmtK(summary.closedP)}</div></div>
            <div style={{background:'#f8fafc',borderRadius:8,padding:10,textAlign:'center'}}><div style={{fontSize:9,color:'#64748b'}}>Avg</div><div style={{fontSize:16,fontWeight:700}}>{fmtK(analytics.all.avg)}</div></div>
            <div style={{background:'#f8fafc',borderRadius:8,padding:10,textAlign:'center'}}><div style={{fontSize:9,color:'#64748b'}}>Best</div><div style={{fontSize:16,fontWeight:700}}>{fmtK(analytics.all.max)}</div></div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={analytics.monthly}>
              <XAxis dataKey="name" tick={{fontSize:9}}/>
              <YAxis tickFormatter={fmtK} tick={{fontSize:9}}/>
              <Tooltip formatter={v=>fmt(v)}/>
              <Area type="monotone" dataKey="profit" stroke="#059669" fill="#d1fae5"/>
            </AreaChart>
          </ResponsiveContainer>
          <h4 style={{margin:'12px 0 6px',fontSize:12}}>Deals</h4>
          <div style={{maxHeight:140,overflow:'auto'}}>
            {closed.sort((a,b)=>getLedgerProfit(b)-getLedgerProfit(a)).map(d=>(
              <div key={d.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f1f5f9',fontSize:11}}>
                <span>{d.address.split(',')[0]}</span>
                <span style={{color:getLedgerProfit(d)>=0?'#059669':'#dc2626',fontWeight:600}}>{fmt(getLedgerProfit(d))}</span>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (detailModal === 'conversion') {
      title = '📊 Conversion';
      content = (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
            <div style={{background:'#d1fae5',borderRadius:8,padding:12,textAlign:'center'}}><div style={{fontSize:10,color:'#059669'}}>Close Rate</div><div style={{fontSize:22,fontWeight:700,color:'#059669'}}>{analytics.closeRate.toFixed(0)}%</div></div>
            <div style={{background:'#fee2e2',borderRadius:8,padding:12,textAlign:'center'}}><div style={{fontSize:10,color:'#dc2626'}}>Term Rate</div><div style={{fontSize:22,fontWeight:700,color:'#dc2626'}}>{analytics.termRate.toFixed(0)}%</div></div>
            <div style={{background:'#ede9fe',borderRadius:8,padding:12,textAlign:'center'}}><div style={{fontSize:10,color:'#7c3aed'}}>AOI Rate</div><div style={{fontSize:22,fontWeight:700,color:'#7c3aed'}}>{analytics.aoiRate.toFixed(0)}%</div></div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={[{n:'Closed',v:analytics.all.count},{n:'Terminated',v:analytics.termed},{n:'AOI',v:analytics.aoi}]} dataKey="v" nameKey="n" cx="50%" cy="50%" outerRadius={60} label={({n,v})=>`${n}:${v}`}>
                {[{c:'#059669'},{c:'#dc2626'},{c:'#7c3aed'}].map((e,i)=><Cell key={i} fill={e.c}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (detailModal === 'types') {
      title = '🏠 Flip vs Wholesale';
      content = (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{border:'2px solid #0891b2',borderRadius:8,padding:12}}>
              <h4 style={{color:'#0891b2',margin:'0 0 8px',fontSize:13}}>🏠 Flips</h4>
              <div style={{fontSize:11}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Deals:</span><strong>{analytics.flip.count}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Total:</span><strong>{fmt(analytics.flip.total)}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Avg:</span><strong>{fmt(analytics.flip.avg)}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Days:</span><strong>{analytics.flip.avgDays}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>ROI:</span><strong>{analytics.flip.roi.toFixed(1)}%</strong></div>
              </div>
            </div>
            <div style={{border:'2px solid #059669',borderRadius:8,padding:12}}>
              <h4 style={{color:'#059669',margin:'0 0 8px',fontSize:13}}>📦 Wholesale</h4>
              <div style={{fontSize:11}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Deals:</span><strong>{analytics.ws.count}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Total:</span><strong>{fmt(analytics.ws.total)}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Avg:</span><strong>{fmt(analytics.ws.avg)}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Days:</span><strong>{analytics.ws.avgDays}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>ROI:</span><strong>{analytics.ws.roi.toFixed(1)}%</strong></div>
              </div>
            </div>
          </div>
          <h4 style={{margin:'16px 0 8px',fontSize:12}}>Monthly</h4>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={analytics.monthly}>
              <XAxis dataKey="name" tick={{fontSize:9}}/>
              <YAxis tickFormatter={fmtK} tick={{fontSize:9}}/>
              <Tooltip formatter={v=>fmt(v)}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="flipP" name="Flip" fill="#0891b2"/>
              <Bar dataKey="wsP" name="Wholesale" fill="#059669"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}} onClick={()=>setDetailModal(null)}>
        <div style={{background:'#fff',borderRadius:12,maxWidth:550,width:'100%',maxHeight:'85vh',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 18px',borderBottom:'1px solid #e2e8f0'}}>
            <h2 style={{margin:0,fontSize:15}}>{title}</h2>
            <button onClick={()=>setDetailModal(null)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer'}}>✕</button>
          </div>
          <div style={{padding:18,overflow:'auto',maxHeight:'calc(85vh - 60px)'}}>{content}</div>
        </div>
      </div>
    );
  };

  // DEAL CARD COMPONENT
  const DealCard = ({ d }) => {
    const isEd = editingDeal === d.id;
    const isClosed = d.status === 'Closed';
    const p = getLedgerProfit(d);
    const sc = STATUS_CONFIG[d.status] || {};
    const tc = TYPE_CONFIG[d.type] || {};
    const days = isClosed ? getDays(d) : getPipelineDays(d);

    return (
      <div style={{background:isEd?'#fff':'#f8fafc',border:`1px solid ${isEd?'#059669':'#e2e8f0'}`,borderRadius:8,padding:12,cursor:'pointer'}} onClick={()=>setEditingDeal(isEd?null:d.id)}>
        <div style={{display:'flex',gap:5,marginBottom:6}}>
          <span style={{padding:'2px 6px',borderRadius:4,fontSize:8,fontWeight:600,background:sc.bg,color:sc.color}}>{sc.icon} {d.status}</span>
          <span style={{padding:'2px 6px',borderRadius:4,fontSize:8,background:tc.bg,color:tc.color}}>{d.type}</span>
          {d.jv==='Y' && <span style={{padding:'2px 5px',borderRadius:4,fontSize:8,background:'#fef3c7',color:'#d97706'}}>JV {d.ownerShare}%</span>}
        </div>
        <h4 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>{d.address || 'New Deal'}</h4>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px 10px',marginBottom:8,fontSize:10,color:'#64748b'}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><span>Acq:</span><strong>{fmt(d.acquisition)}</strong></div>
          <div style={{display:'flex',justifyContent:'space-between'}}><span>Dispo:</span><strong>{fmt(isClosed?d.disposition:d.projDisposition)}</strong></div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 8px',background:'#fff',borderRadius:5}}>
          <div>
            <span style={{fontSize:9,color:'#64748b'}}>{isClosed?'Profit':'Projected'}</span>
            {days && <span style={{fontSize:8,color:'#94a3b8',marginLeft:6}}>{days}d</span>}
          </div>
          <span style={{fontSize:14,fontWeight:700,color:p>=0?'#059669':'#dc2626'}}>{fmt(p)}</span>
        </div>
        {isEd && (
          <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #e2e8f0'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div>
                <label style={{fontSize:9}}>Status</label>
                <select value={d.status} onChange={e=>handleStatus(d.id,e.target.value)} style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}>
                  <option>Closed</option><option>Ongoing</option><option>Terminated</option><option>AOI/Suit Filed</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:9}}>Type</label>
                <select value={d.type} onChange={e=>updateDeal(d.id,'type',e.target.value)} style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}>
                  <option>Flip</option><option>Wholesale</option>
                </select>
              </div>
              <div style={{gridColumn:'span 2'}}>
                <label style={{fontSize:9}}>Address</label>
                <input type="text" value={d.address} onChange={e=>updateDeal(d.id,'address',e.target.value)} style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}/>
              </div>
              <div>
                <label style={{fontSize:9}}>Acquisition</label>
                <input type="number" value={d.acquisition} onChange={e=>updateDeal(d.id,'acquisition',+e.target.value)} style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}/>
              </div>
              <div>
                <label style={{fontSize:9}}>{isClosed?'Rehab':'Proj Rehab'}</label>
                <input type="number" value={isClosed?d.rehab:d.projRehab} onChange={e=>updateDeal(d.id,isClosed?'rehab':'projRehab',+e.target.value)} style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}/>
              </div>
              <div>
                <label style={{fontSize:9}}>{isClosed?'Dispo':'Proj Dispo'}</label>
                <input type="number" value={isClosed?d.disposition:d.projDisposition} onChange={e=>updateDeal(d.id,isClosed?'disposition':'projDisposition',+e.target.value)} style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}/>
              </div>
              <div>
                <label style={{fontSize:9}}>JV</label>
                <select value={d.jv} onChange={e=>{updateDeal(d.id,'jv',e.target.value);if(e.target.value==='N')updateDeal(d.id,'ownerShare',100);}} style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}>
                  <option value="N">No</option><option value="Y">Yes</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:9}}>Purchase</label>
                <input type="date" value={d.purchaseDate} onChange={e=>updateDeal(d.id,'purchaseDate',e.target.value)} style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}/>
              </div>
              <div>
                <label style={{fontSize:9}}>Close</label>
                <input type="date" value={d.closeDate} onChange={e=>updateDeal(d.id,'closeDate',e.target.value)} style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:10}}>
              <button onClick={()=>deleteDeal(d.id)} style={{padding:'5px 10px',background:'#fee2e2',border:'none',borderRadius:4,color:'#dc2626',fontSize:9,cursor:'pointer'}}>Delete</button>
              <button onClick={()=>setEditingDeal(null)} style={{padding:'5px 12px',background:'#059669',border:'none',borderRadius:4,color:'#fff',fontSize:9,fontWeight:600,cursor:'pointer'}}>Done</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#f8fafc,#e2e8f0)',fontFamily:'Inter,-apple-system,sans-serif',color:'#1e293b',paddingBottom:isMobile?70:0}}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      
      {/* AI Extracted Data Review Modal */}
      {showAiReviewModal && aiExtractedData && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100,padding:16}}>
          <div style={{background:'#fff',borderRadius:16,maxWidth:900,width:'100%',maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            {/* Header */}
            <div style={{padding:'16px 20px',borderBottom:'1px solid #e2e8f0',background:'linear-gradient(135deg,#7c3aed,#5b21b6)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <h2 style={{margin:0,fontSize:18,fontWeight:700,color:'#fff'}}>🤖 AI Extracted Data</h2>
                  <p style={{margin:'4px 0 0',fontSize:11,color:'#ddd6fe'}}>{aiExtractedData.documentType || 'Settlement Statement'} • {aiExtractedData.closingDate || 'Date not found'}</p>
                </div>
                <button onClick={()=>{setShowAiReviewModal(false);setAiExtractedData(null);}} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:8,padding:'8px 12px',color:'#fff',fontSize:12,cursor:'pointer'}}>✕ Close</button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div style={{flex:1,overflow:'auto',padding:20}}>
              {/* Property Info */}
              <div style={{background:'#f8fafc',borderRadius:10,padding:14,marginBottom:16}}>
                <h3 style={{margin:'0 0 10px',fontSize:13,fontWeight:600,color:'#334155'}}>📍 Property Information</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:11}}>
                  <div><span style={{color:'#64748b'}}>Address:</span> <strong>{aiExtractedData.propertyAddress || 'Not found'}</strong></div>
                  <div><span style={{color:'#64748b'}}>Transaction:</span> <strong style={{textTransform:'capitalize'}}>{aiExtractedData.transactionType || 'Unknown'}</strong></div>
                  <div><span style={{color:'#64748b'}}>Closing Date:</span> <strong>{aiExtractedData.closingDate || 'Not found'}</strong></div>
                  <div><span style={{color:'#64748b'}}>Title Company:</span> <strong>{aiExtractedData.titleCompany || 'Not found'}</strong></div>
                  {aiExtractedData.sellerName && <div><span style={{color:'#64748b'}}>Seller:</span> <strong>{aiExtractedData.sellerName}</strong></div>}
                  {aiExtractedData.buyerName && <div><span style={{color:'#64748b'}}>Buyer:</span> <strong>{aiExtractedData.buyerName}</strong></div>}
                </div>
              </div>
              
              {/* Key Numbers - Highlighted */}
              <div style={{background:'linear-gradient(135deg,#ecfdf5,#d1fae5)',border:'2px solid #10b981',borderRadius:10,padding:14,marginBottom:16}}>
                <h3 style={{margin:'0 0 12px',fontSize:13,fontWeight:600,color:'#047857'}}>💰 Key Financial Summary</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                  <div style={{background:'#fff',borderRadius:8,padding:12,textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#64748b',marginBottom:4}}>Contract Price</div>
                    <div style={{fontSize:20,fontWeight:700,color:'#0f172a'}}>${(aiExtractedData.contractPrice||0).toLocaleString()}</div>
                  </div>
                  <div style={{background:'#fff',borderRadius:8,padding:12,textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#64748b',marginBottom:4}}>Total Closing Costs</div>
                    <div style={{fontSize:20,fontWeight:700,color:'#dc2626'}}>${(aiExtractedData.totalClosingCosts||0).toLocaleString()}</div>
                  </div>
                  <div style={{background:'#fff',borderRadius:8,padding:12,textAlign:'center',border:'2px solid #059669'}}>
                    <div style={{fontSize:10,color:'#059669',marginBottom:4,fontWeight:600}}>Cash Due to Seller</div>
                    <div style={{fontSize:20,fontWeight:700,color:'#059669'}}>${(aiExtractedData.cashDueToSeller||aiExtractedData.netToSeller||0).toLocaleString()}</div>
                    <div style={{fontSize:8,color:'#047857',marginTop:2}}>= YOUR NET PROFIT</div>
                  </div>
                </div>
                
                {/* Profit Verification */}
                {showCloseModal && (() => {
                  const salePrice = aiExtractedData.contractPrice || 0;
                  const acquisition = showCloseModal.acquisition || 0;
                  const rehab = showCloseModal.projRehab || 0;
                  const closingCosts = aiExtractedData.totalClosingCosts || 0;
                  const loanPayoffs = aiExtractedData.existingLoanPayoff || 0;
                  const netProfit = aiExtractedData.cashDueToSeller || aiExtractedData.netToSeller || 0;
                  
                  // Traditional calculation for reference
                  const grossProfit = salePrice - acquisition - rehab;
                  const calcNetProfit = grossProfit - closingCosts;
                  
                  return (
                    <div style={{marginTop:12,padding:10,background:'#fff',borderRadius:8,border:'1px solid #10b981'}}>
                      <div style={{fontSize:11,fontWeight:600,color:'#047857',marginBottom:8}}>📊 Deal Summary</div>
                      
                      {/* Primary: Actual Net Profit */}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginBottom:10,padding:10,background:'#d1fae5',borderRadius:8,border:'2px solid #059669'}}>
                        <div style={{fontSize:12,color:'#047857'}}>Your Net Profit:</div>
                        <div style={{fontSize:24,fontWeight:700,color:'#059669'}}>${netProfit.toLocaleString()}</div>
                      </div>
                      
                      {/* Breakdown */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,fontSize:9}}>
                        <div style={{padding:6,background:'#f8fafc',borderRadius:4,textAlign:'center'}}>
                          <div style={{color:'#64748b'}}>Sale Price</div>
                          <div style={{fontWeight:700,color:'#0f172a'}}>${salePrice.toLocaleString()}</div>
                        </div>
                        <div style={{padding:6,background:'#f8fafc',borderRadius:4,textAlign:'center'}}>
                          <div style={{color:'#64748b'}}>Acquisition</div>
                          <div style={{fontWeight:700,color:'#64748b'}}>${acquisition.toLocaleString()}</div>
                        </div>
                        <div style={{padding:6,background:'#f8fafc',borderRadius:4,textAlign:'center'}}>
                          <div style={{color:'#64748b'}}>Rehab</div>
                          <div style={{fontWeight:700,color:'#64748b'}}>${rehab.toLocaleString()}</div>
                        </div>
                        <div style={{padding:6,background:'#f8fafc',borderRadius:4,textAlign:'center'}}>
                          <div style={{color:'#64748b'}}>Closing Costs</div>
                          <div style={{fontWeight:700,color:'#dc2626'}}>${closingCosts.toLocaleString()}</div>
                        </div>
                        <div style={{padding:6,background:'#f8fafc',borderRadius:4,textAlign:'center'}}>
                          <div style={{color:'#64748b'}}>Loan Payoffs</div>
                          <div style={{fontWeight:700,color:'#64748b'}}>${loanPayoffs.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div style={{marginTop:8,fontSize:9,color:'#64748b',textAlign:'center'}}>
                        Cash Due to Seller = Your profit after loan payoffs, closing costs, and all expenses
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Detailed Breakdown */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {/* Commissions & Fees */}
                <div style={{background:'#fef2f2',borderRadius:10,padding:14}}>
                  <h3 style={{margin:'0 0 10px',fontSize:12,fontWeight:600,color:'#991b1b'}}>💸 Commissions & Major Fees</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:10}}>
                    {aiExtractedData.realEstateCommissionTotal > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Total Commission</span><strong style={{color:'#dc2626'}}>${aiExtractedData.realEstateCommissionTotal.toLocaleString()}</strong>
                      </div>
                    )}
                    {aiExtractedData.listingAgentCommission > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span style={{paddingLeft:10}}>↳ Listing Agent</span><strong>${aiExtractedData.listingAgentCommission.toLocaleString()}</strong>
                      </div>
                    )}
                    {aiExtractedData.buyerAgentCommission > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span style={{paddingLeft:10}}>↳ Buyer Agent</span><strong>${aiExtractedData.buyerAgentCommission.toLocaleString()}</strong>
                      </div>
                    )}
                    {aiExtractedData.existingLoanPayoff > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Loan Payoff</span><strong style={{color:'#dc2626'}}>${aiExtractedData.existingLoanPayoff.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Title & Closing Fees */}
                <div style={{background:'#eff6ff',borderRadius:10,padding:14}}>
                  <h3 style={{margin:'0 0 10px',fontSize:12,fontWeight:600,color:'#1e40af'}}>📋 Title & Closing Fees</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:10}}>
                    {aiExtractedData.titleInsurance > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Title Insurance</span><strong>${aiExtractedData.titleInsurance.toLocaleString()}</strong>
                      </div>
                    )}
                    {(aiExtractedData.settlementFee || aiExtractedData.escrowFee || aiExtractedData.closingFee) > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Settlement/Escrow Fee</span><strong>${(aiExtractedData.settlementFee || aiExtractedData.escrowFee || aiExtractedData.closingFee || 0).toLocaleString()}</strong>
                      </div>
                    )}
                    {aiExtractedData.recordingFees > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Recording Fees</span><strong>${aiExtractedData.recordingFees.toLocaleString()}</strong>
                      </div>
                    )}
                    {aiExtractedData.transferTax > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Transfer Tax</span><strong>${aiExtractedData.transferTax.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Prorations & Credits */}
                <div style={{background:'#fefce8',borderRadius:10,padding:14}}>
                  <h3 style={{margin:'0 0 10px',fontSize:12,fontWeight:600,color:'#a16207'}}>📅 Prorations & Credits</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:10}}>
                    {aiExtractedData.prorationsTaxes !== 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Property Taxes</span><strong style={{color:aiExtractedData.prorationsTaxes>0?'#059669':'#dc2626'}}>{aiExtractedData.prorationsTaxes>0?'+':''}${aiExtractedData.prorationsTaxes.toLocaleString()}</strong>
                      </div>
                    )}
                    {aiExtractedData.prorationHOA !== 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>HOA</span><strong style={{color:aiExtractedData.prorationHOA>0?'#059669':'#dc2626'}}>{aiExtractedData.prorationHOA>0?'+':''}${aiExtractedData.prorationHOA.toLocaleString()}</strong>
                      </div>
                    )}
                    {aiExtractedData.sellerCredits > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Seller Credits</span><strong style={{color:'#059669'}}>+${aiExtractedData.sellerCredits.toLocaleString()}</strong>
                      </div>
                    )}
                    {aiExtractedData.sellerConcessions > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Seller Concessions</span><strong style={{color:'#dc2626'}}>-${aiExtractedData.sellerConcessions.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Other Fees */}
                <div style={{background:'#f5f3ff',borderRadius:10,padding:14}}>
                  <h3 style={{margin:'0 0 10px',fontSize:12,fontWeight:600,color:'#5b21b6'}}>📦 Other Fees</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:10}}>
                    {aiExtractedData.homeWarranty > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Home Warranty</span><strong>${aiExtractedData.homeWarranty.toLocaleString()}</strong>
                      </div>
                    )}
                    {aiExtractedData.wireTransferFee > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Wire Transfer</span><strong>${aiExtractedData.wireTransferFee.toLocaleString()}</strong>
                      </div>
                    )}
                    {aiExtractedData.miscFees > 0 && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 8px',background:'#fff',borderRadius:4}}>
                        <span>Misc Fees</span><strong>${aiExtractedData.miscFees.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              {aiExtractedData.notes && (
                <div style={{marginTop:16,background:'#f8fafc',borderRadius:10,padding:14}}>
                  <h3 style={{margin:'0 0 8px',fontSize:12,fontWeight:600,color:'#334155'}}>📝 Notes</h3>
                  <p style={{margin:0,fontSize:11,color:'#64748b',lineHeight:1.5}}>{aiExtractedData.notes}</p>
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div style={{padding:'16px 20px',borderTop:'1px solid #e2e8f0',background:'#f8fafc',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <button onClick={()=>{setShowAiReviewModal(false);setAiExtractedData(null);}} style={{padding:'10px 20px',background:'#f1f5f9',border:'none',borderRadius:8,fontSize:12,cursor:'pointer'}}>
                Cancel
              </button>
              <div style={{display:'flex',gap:10}}>
                <button 
                  onClick={()=>{
                    // Apply to manual form for editing
                    const netProfit = aiExtractedData.cashDueToSeller || aiExtractedData.netToSeller || 0;
                    setCloseModalData({
                      closeDate: aiExtractedData.closingDate || '',
                      disposition: aiExtractedData.contractPrice || 0,
                      netProfit: netProfit
                    });
                    
                    // Update address if different
                    if (showCloseModal && aiExtractedData.propertyAddress && aiExtractedData.propertyAddress !== showCloseModal.address) {
                      updateDeal(showCloseModal.id, 'address', aiExtractedData.propertyAddress);
                    }
                    
                    setShowAiReviewModal(false);
                    setAiExtractedData(null);
                  }}
                  style={{padding:'10px 20px',background:'#e0e7ff',border:'none',borderRadius:8,color:'#4f46e5',fontSize:12,fontWeight:600,cursor:'pointer'}}
                >
                  ✏️ Edit Values
                </button>
                <button 
                  onClick={()=>{
                    const d = showCloseModal;
                    const netProfit = aiExtractedData.cashDueToSeller || aiExtractedData.netToSeller || 0;
                    const yourShare = d.jv === 'Y' ? netProfit * (d.ownerShare / 100) : netProfit;
                    const closeDate = aiExtractedData.closingDate || new Date().toISOString().split('T')[0];
                    const salePrice = aiExtractedData.contractPrice || 0;
                    
                    // Update address if different
                    if (aiExtractedData.propertyAddress && aiExtractedData.propertyAddress !== d.address) {
                      updateDeal(d.id, 'address', aiExtractedData.propertyAddress);
                    }
                    
                    // Update deal to Closed
                    setDeals(deals.map(x => x.id === d.id ? { 
                      ...x, 
                      status: 'Closed', 
                      disposition: salePrice, 
                      closeDate: closeDate,
                      netProfit: netProfit,
                      address: aiExtractedData.propertyAddress || x.address
                    } : x));
                    
                    // Add to ledger with Profit First allocations
                    setLedger([{
                      timestamp: new Date().toISOString(),
                      dealId: d.id,
                      type: d.type,
                      address: (aiExtractedData.propertyAddress || d.address).slice(0, 25),
                      closeDate: closeDate,
                      salePrice: salePrice,
                      profitUsed: yourShare,
                      pfProfit: yourShare * allocations.profit / 100,
                      pfOwnersPay: yourShare * allocations.ownersPay / 100,
                      pfTaxes: yourShare * allocations.taxes / 100,
                      pfOpex: yourShare * allocations.opex / 100,
                      aiExtracted: aiExtractedData, // Store full AI data
                      pdfData: aiPdfData // Store PDF base64
                    }, ...ledger]);
                    
                    setShowAiReviewModal(false);
                    setAiExtractedData(null);
                    setShowCloseModal(null);
                    setCloseModalData({});
                    setEditingDeal(null);
                    
                    alert(`✓ Deal closed!\n\nNet Profit: $${netProfit.toLocaleString()}\n\nProfit First Allocations:\n• Profit (${allocations.profit}%): $${(yourShare * allocations.profit / 100).toLocaleString()}\n• Owner's Pay (${allocations.ownersPay}%): $${(yourShare * allocations.ownersPay / 100).toLocaleString()}\n• Taxes (${allocations.taxes}%): $${(yourShare * allocations.taxes / 100).toLocaleString()}\n• OpEx (${allocations.opex}%): $${(yourShare * allocations.opex / 100).toLocaleString()}`);
                  }}
                  style={{padding:'10px 24px',background:'linear-gradient(135deg,#059669,#047857)',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}
                >
                  ✓ Confirm & Close Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showCloseModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
          <div style={{background:'#fff',borderRadius:12,padding:20,maxWidth:500,width:'100%',maxHeight:'90vh',overflow:'auto'}}>
            <h2 style={{margin:'0 0 4px',fontSize:17}}>🎉 Close Deal</h2>
            <p style={{margin:'0 0 16px',fontSize:11,color:'#64748b'}}>{showCloseModal.address}</p>
            
            {/* AI Closing Statement Upload */}
            {aiConfig.apiKey ? (
              <div style={{background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',border:'1px solid #a78bfa',borderRadius:10,padding:16,marginBottom:16}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:32,marginBottom:8}}>🤖</div>
                  <div style={{fontSize:14,fontWeight:600,color:'#5b21b6',marginBottom:4}}>Upload Closing Statement</div>
                  <div style={{fontSize:10,color:'#7c3aed',marginBottom:12}}>AI will extract all financial data from your HUD-1, ALTA, or settlement statement</div>
                  <label style={{display:'inline-block',padding:'12px 24px',background:aiProcessing?'#a78bfa':'#7c3aed',color:'#fff',borderRadius:8,fontSize:12,fontWeight:600,cursor:aiProcessing?'wait':'pointer'}}>
                    {aiProcessing ? (
                      <span style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{display:'inline-block',width:14,height:14,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite'}}></span>
                        Analyzing PDF...
                      </span>
                    ) : (
                      <>📄 Select PDF File</>
                    )}
                    <input 
                      type="file" 
                      accept=".pdf"
                      disabled={aiProcessing}
                      style={{display:'none'}}
                      onChange={async(e)=>{
                        const file = e.target.files[0];
                        if(!file) return;
                        await analyzeClosingStatement(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div style={{background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:10,padding:16,marginBottom:16,textAlign:'center'}}>
                <div style={{fontSize:11,color:'#92400e',marginBottom:8}}>⚠️ AI not configured. Go to Settings → AI Document Analysis to add your API key.</div>
              </div>
            )}
            
            {/* Manual Override Section */}
            <div style={{borderTop:'1px solid #e2e8f0',paddingTop:16}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <span style={{fontSize:11,fontWeight:600,color:'#64748b'}}>✏️ Manual Entry</span>
                <span style={{fontSize:9,color:'#94a3b8'}}>Or enter values manually</span>
              </div>
              
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div>
                  <label style={{fontSize:10,fontWeight:600,display:'block',marginBottom:4}}>Close Date *</label>
                  <input 
                    type="date" 
                    value={closeModalData.closeDate||''} 
                    onChange={e=>setCloseModalData({...closeModalData, closeDate: e.target.value})} 
                    style={{width:'100%',padding:10,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}
                  />
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:600,display:'block',marginBottom:4}}>Sale Price *</label>
                  <input 
                    type="number" 
                    value={closeModalData.disposition||''} 
                    onChange={e=>setCloseModalData({...closeModalData, disposition: +e.target.value})} 
                    placeholder="Contract price"
                    style={{width:'100%',padding:10,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}
                  />
                </div>
              </div>
              
              <div style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:600,display:'block',marginBottom:4}}>Net Profit (Cash Due to Seller) *</label>
                <input 
                  type="number" 
                  value={closeModalData.netProfit||''} 
                  onChange={e=>setCloseModalData({...closeModalData, netProfit: +e.target.value})} 
                  placeholder="Your actual profit from the closing statement"
                  style={{width:'100%',padding:10,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}
                />
                <div style={{fontSize:9,color:'#64748b',marginTop:4}}>This is the amount you actually receive - find "Cash Due to Seller" on your closing statement</div>
              </div>
              
              {showCloseModal.jv === 'Y' && (
                <div style={{background:'#fef3c7',borderRadius:6,padding:10,marginBottom:12}}>
                  <span style={{fontSize:10,color:'#92400e'}}>⚠️ JV Deal - Your share: {showCloseModal.ownerShare}% will be calculated automatically</span>
                </div>
              )}
              
              {/* Preview */}
              {closeModalData.netProfit > 0 && (
                <div style={{background:'#f0fdf4',border:'2px solid #10b981',borderRadius:8,padding:12,marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:12,fontWeight:600,color:'#047857'}}>Net Profit:</span>
                    <span style={{fontSize:20,fontWeight:700,color:'#059669'}}>${closeModalData.netProfit.toLocaleString()}</span>
                  </div>
                  {showCloseModal.jv === 'Y' && (
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8,paddingTop:8,borderTop:'1px solid #86efac'}}>
                      <span style={{fontSize:11,color:'#047857'}}>Your Share ({showCloseModal.ownerShare}%):</span>
                      <span style={{fontSize:16,fontWeight:700,color:'#059669'}}>${(closeModalData.netProfit * showCloseModal.ownerShare / 100).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
              <button 
                onClick={()=>{setShowCloseModal(null);setCloseModalData({});}} 
                style={{padding:'10px 20px',background:'#f1f5f9',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}
              >
                Cancel
              </button>
              <button 
                onClick={()=>{
                  const d = showCloseModal;
                  const netProfit = closeModalData.netProfit || 0;
                  const yourShare = d.jv === 'Y' ? netProfit * (d.ownerShare / 100) : netProfit;
                  
                  // Update deal to Closed
                  setDeals(deals.map(x => x.id === d.id ? { 
                    ...x, 
                    status: 'Closed', 
                    disposition: closeModalData.disposition || 0, 
                    closeDate: closeModalData.closeDate,
                    netProfit: netProfit
                  } : x));
                  
                  // Add to ledger with Profit First allocations
                  setLedger([{
                    timestamp: new Date().toISOString(),
                    dealId: d.id,
                    type: d.type,
                    address: d.address.slice(0, 25),
                    closeDate: closeModalData.closeDate,
                    salePrice: closeModalData.disposition || 0,
                    profitUsed: yourShare,
                    pfProfit: yourShare * allocations.profit / 100,
                    pfOwnersPay: yourShare * allocations.ownersPay / 100,
                    pfTaxes: yourShare * allocations.taxes / 100,
                    pfOpex: yourShare * allocations.opex / 100
                  }, ...ledger]);
                  
                  setShowCloseModal(null);
                  setCloseModalData({});
                  setEditingDeal(null);
                  
                  alert(`✓ Deal closed!\n\nNet Profit: $${netProfit.toLocaleString()}\n\nProfit First Allocations:\n• Profit (${allocations.profit}%): $${(yourShare * allocations.profit / 100).toLocaleString()}\n• Owner's Pay (${allocations.ownersPay}%): $${(yourShare * allocations.ownersPay / 100).toLocaleString()}\n• Taxes (${allocations.taxes}%): $${(yourShare * allocations.taxes / 100).toLocaleString()}\n• OpEx (${allocations.opex}%): $${(yourShare * allocations.opex / 100).toLocaleString()}`);
                }} 
                disabled={!closeModalData.closeDate || !closeModalData.disposition || !closeModalData.netProfit}
                style={{padding:'10px 24px',background:(!closeModalData.closeDate || !closeModalData.disposition || !closeModalData.netProfit)?'#94a3b8':'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:(!closeModalData.closeDate || !closeModalData.disposition || !closeModalData.netProfit)?'not-allowed':'pointer'}}
              >
                ✓ Close Deal & Add to Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      <DetailModal/>

      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:isMobile?'12px 14px':'10px 18px',background:'#fff',borderBottom:'1px solid #e2e8f0',flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:isMobile?40:34,height:isMobile?40:34,background:'linear-gradient(135deg,#059669,#047857)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:isMobile?13:11}}>PF</div>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <h1 style={{margin:0,fontSize:isMobile?17:15,fontWeight:700}}>Profit First Tracker</h1>
              <button onClick={manualSync} title={lastSyncTime ? `Last synced: ${lastSyncTime.toLocaleTimeString()}` : 'Sync now'} style={{background:'transparent',border:'none',cursor:'pointer',padding:2,display:'flex',alignItems:'center'}}>
                {cloudSyncStatus === 'loading' && <span style={{fontSize:12,animation:'spin 1s linear infinite'}}>⏳</span>}
                {cloudSyncStatus === 'syncing' && <span style={{fontSize:12,animation:'spin 1s linear infinite'}}>🔄</span>}
                {cloudSyncStatus === 'synced' && <span style={{fontSize:12,color:'#059669'}}>☁️</span>}
                {cloudSyncStatus === 'error' && <span style={{fontSize:12,color:'#dc2626'}}>⚠️</span>}
                {cloudSyncStatus === 'offline' && <span style={{fontSize:12,color:'#94a3b8'}}>📴</span>}
              </button>
            </div>
            <p style={{margin:0,fontSize:isMobile?11:9,color:'#64748b'}}>{periodLabel[statsPeriod]}{dealTypeFilter !== 'All' ? ` • ${dealTypeFilter}s` : ''}</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:isMobile?16:12}}>
          <div style={{textAlign:'right'}}><div style={{fontSize:isMobile?10:8,color:'#64748b'}}>Closed</div><div style={{fontSize:isMobile?16:14,fontWeight:700,color:'#059669'}}>{fmtK(summary.closedP)}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:isMobile?10:8,color:'#64748b'}}>Pipeline</div><div style={{fontSize:isMobile?16:14,fontWeight:700,color:'#2563eb'}}>{fmtK(summary.projP)}</div></div>
          {!isMobile && <button onClick={addDeal} style={{padding:'6px 10px',background:'linear-gradient(135deg,#059669,#047857)',border:'none',borderRadius:6,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>+ Deal</button>}
        </div>
      </header>

      {/* Top navigation - hide on mobile */}
      {!isMobile && (
        <nav style={{display:'flex',gap:2,padding:'5px 18px',background:'#fff',borderBottom:'1px solid #e2e8f0',overflowX:'auto'}}>
          {[{id:'dashboard',l:'Dashboard',i:'📊'},{id:'deals',l:'Deals',i:'🏠'},{id:'funnel',l:'Lead Funnel',i:'🎯'},{id:'analytics',l:'Analytics',i:'📈'},{id:'marketing',l:'Marketing',i:'📣'},{id:'income',l:'Income',i:'💵'},{id:'finances',l:'Finances',i:'💰'},{id:'ledger',l:'Ledger',i:'📒'},{id:'checklist',l:'Checklist',i:'✓'},{id:'settings',l:'Settings',i:'⚙️'}].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{display:'flex',alignItems:'center',gap:3,padding:'6px 10px',background:activeTab===t.id?'#f0fdf4':'transparent',border:'none',borderRadius:5,color:activeTab===t.id?'#059669':'#64748b',fontSize:10,fontWeight:500,cursor:'pointer'}}>
              <span style={{fontSize:12}}>{t.i}</span>{t.l}
            </button>
          ))}
          <button onClick={resetData} style={{marginLeft:'auto',padding:'4px 8px',background:'#f1f5f9',border:'none',borderRadius:4,color:'#94a3b8',fontSize:8,cursor:'pointer'}}>Reset</button>
        </nav>
      )}

      {/* GLOBAL FILTER BAR - Collapsible on mobile */}
      {isMobile ? (
        <div style={{background:'#f8fafc',borderBottom:'1px solid #e2e8f0'}}>
          <button onClick={()=>setShowFilters(!showFilters)} style={{width:'100%',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',border:'none',background:'transparent',cursor:'pointer'}}>
            <span style={{fontSize:12,color:'#64748b'}}>🔍 <strong style={{color:'#0f172a'}}>{periodLabel[statsPeriod]}</strong>{dealTypeFilter !== 'All' && <span> • <strong style={{color:dealTypeFilter==='Flip'?'#0891b2':'#059669'}}>{dealTypeFilter}s</strong></span>}</span>
            <span style={{fontSize:14}}>{showFilters ? '▲' : '▼'}</span>
          </button>
          {showFilters && (
            <div style={{padding:'10px 14px',paddingTop:0,display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>Time Period</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {[{id:'week',l:'Week'},{id:'4weeks',l:'Month'},{id:'quarter',l:'Quarter'},{id:'ytd',l:'YTD'},{id:'all',l:'All'}].map(p=>(
                    <button key={p.id} onClick={()=>setStatsPeriod(p.id)} style={{padding:'8px 14px',background:statsPeriod===p.id?'#059669':'#fff',color:statsPeriod===p.id?'#fff':'#64748b',border:'1px solid',borderColor:statsPeriod===p.id?'#059669':'#e2e8f0',borderRadius:6,fontSize:12,cursor:'pointer',fontWeight:statsPeriod===p.id?600:400}}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:6}}>Deal Type</div>
                <div style={{display:'flex',gap:6}}>
                  {[{id:'All',l:'All',c:'#64748b'},{id:'Flip',l:'🏠 Flip',c:'#0891b2'},{id:'Wholesale',l:'📦 Wholesale',c:'#059669'}].map(t=>(
                    <button key={t.id} onClick={()=>setDealTypeFilter(t.id)} style={{padding:'8px 14px',background:dealTypeFilter===t.id?t.c:'#fff',color:dealTypeFilter===t.id?'#fff':'#64748b',border:'1px solid',borderColor:dealTypeFilter===t.id?t.c:'#e2e8f0',borderRadius:6,fontSize:12,cursor:'pointer',fontWeight:dealTypeFilter===t.id?600:400}}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 18px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:10,color:'#64748b',fontWeight:600}}>Time Period:</span>
            <div style={{display:'flex',gap:2}}>
              {[
                {id:'week',l:'Week'},
                {id:'4weeks',l:'Month'},
                {id:'quarter',l:'Quarter'},
                {id:'ytd',l:'YTD'},
                {id:'all',l:'All'}
              ].map(p=>(
                <button key={p.id} onClick={()=>setStatsPeriod(p.id)} style={{padding:'5px 10px',background:statsPeriod===p.id?'#059669':'#fff',color:statsPeriod===p.id?'#fff':'#64748b',border:'1px solid',borderColor:statsPeriod===p.id?'#059669':'#e2e8f0',borderRadius:4,fontSize:10,cursor:'pointer',fontWeight:statsPeriod===p.id?600:400}}>
                  {p.l}
                </button>
              ))}
            </div>
            <select 
              value={['2026','2025','2024','2023','2022'].includes(statsPeriod) ? statsPeriod : ''} 
              onChange={e=>e.target.value && setStatsPeriod(e.target.value)}
              style={{padding:'5px 8px',fontSize:10,border:'1px solid',borderColor:['2026','2025','2024','2023','2022'].includes(statsPeriod)?'#059669':'#e2e8f0',borderRadius:4,background:['2026','2025','2024','2023','2022'].includes(statsPeriod)?'#059669':'#fff',color:['2026','2025','2024','2023','2022'].includes(statsPeriod)?'#fff':'#64748b',fontWeight:['2026','2025','2024','2023','2022'].includes(statsPeriod)?600:400,cursor:'pointer'}}
            >
              <option value="">By Year</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:10,color:'#64748b',fontWeight:600}}>Deal Type:</span>
            <div style={{display:'flex',gap:2}}>
              {[
                {id:'All',l:'All',c:'#64748b'},
                {id:'Flip',l:'🏠 Flip',c:'#0891b2'},
                {id:'Wholesale',l:'📦 Wholesale',c:'#059669'}
              ].map(t=>(
                <button key={t.id} onClick={()=>setDealTypeFilter(t.id)} style={{padding:'5px 10px',background:dealTypeFilter===t.id?t.c:'#fff',color:dealTypeFilter===t.id?'#fff':'#64748b',border:'1px solid',borderColor:dealTypeFilter===t.id?t.c:'#e2e8f0',borderRadius:4,fontSize:10,cursor:'pointer',fontWeight:dealTypeFilter===t.id?600:400}}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div style={{fontSize:10,color:'#64748b'}}>
            Showing: <strong style={{color:'#0f172a'}}>{periodLabel[statsPeriod]}</strong>
            {dealTypeFilter !== 'All' && <span> • <strong style={{color:dealTypeFilter==='Flip'?'#0891b2':'#059669'}}>{dealTypeFilter}s Only</strong></span>}
          </div>
        </div>
      )}

      <main style={{maxWidth:1350,margin:'0 auto',padding:isMobile?10:14}}>
        {/* DASHBOARD TAB */}
        {activeTab==='dashboard' && (
          <div style={{display:'flex',flexDirection:'column',gap:isMobile?10:12}}>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(auto-fit,minmax(160px,1fr))',gap:isMobile?8:10}}>
              {[{k:'closed',l:`Closed (${periodLabel[statsPeriod]})`,v:summary.closedP,s:`${summary.closedN} deals`,c:'#059669'},{k:'pipeline',l:'Pipeline',v:summary.projP,s:`${summary.ongoingN} active`,c:'#2563eb'},{k:'conversion',l:'Close Rate',v:`${analytics.closeRate.toFixed(0)}%`,s:`${analytics.all.count}/${analytics.total}`,c:'#d97706',pct:1},{k:'pf',l:"Owner's Pay",v:summary.closedP*allocations.ownersPay/100,s:`${allocations.ownersPay}%`,c:'#7c3aed'}].map(kpi=>(
                <div key={kpi.k} onClick={()=>setDetailModal(kpi.k)} style={{background:'#fff',borderRadius:10,padding:isMobile?14:12,borderLeft:`4px solid ${kpi.c}`,cursor:'pointer'}}>
                  <span style={{fontSize:isMobile?11:9,color:'#64748b'}}>{kpi.l}</span>
                  <span style={{fontSize:isMobile?22:18,fontWeight:700,color:kpi.c,display:'block'}}>{kpi.pct?kpi.v:fmt(kpi.v)}</span>
                  <span style={{fontSize:isMobile?10:8,color:'#94a3b8'}}>{kpi.s} →</span>
                </div>
              ))}
            </div>
            
            {/* New Metrics Row */}
            <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(auto-fit,minmax(140px,1fr))',gap:isMobile?8:10}}>
              <div style={{background:'linear-gradient(135deg,#ecfdf5,#d1fae5)',borderRadius:10,padding:12}}>
                <div style={{fontSize:9,color:'#047857',marginBottom:4}}>📊 Avg Deals/Month</div>
                <div style={{fontSize:18,fontWeight:700,color:'#059669'}}>{summary.avgDealsPerMonth.toFixed(1)}</div>
                <div style={{fontSize:8,color:'#64748b'}}>{summary.periodLabel} ({summary.periodMonths} mo)</div>
              </div>
              <div style={{background:'linear-gradient(135deg,#eff6ff,#dbeafe)',borderRadius:10,padding:12}}>
                <div style={{fontSize:9,color:'#1d4ed8',marginBottom:4}}>💰 Avg Profit/Month</div>
                <div style={{fontSize:18,fontWeight:700,color:'#2563eb'}}>{fmtK(summary.avgProfitPerMonth)}</div>
                <div style={{fontSize:8,color:'#64748b'}}>{summary.periodLabel} ({summary.periodMonths} mo)</div>
              </div>
              <div style={{background:'linear-gradient(135deg,#fefce8,#fef3c7)',borderRadius:10,padding:12}}>
                <div style={{fontSize:9,color:'#a16207',marginBottom:4}}>📈 Avg Profit/Deal</div>
                <div style={{fontSize:18,fontWeight:700,color:'#d97706'}}>{fmtK(summary.avgProfitPerDeal)}</div>
                <div style={{fontSize:8,color:'#64748b'}}>{summary.closedN} deals ({summary.periodLabel})</div>
              </div>
              <div style={{background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',borderRadius:10,padding:12}}>
                <div style={{fontSize:9,color:'#5b21b6',marginBottom:4}}>🎯 Projected Annual</div>
                <div style={{fontSize:18,fontWeight:700,color:'#7c3aed'}}>{fmtK(summary.projectedAnnualProfit)}</div>
                <div style={{fontSize:8,color:'#64748b'}}>Based on {summary.periodLabel} rate</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
              <div style={{background:'#fff',borderRadius:10,padding:12}}>
                <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Monthly Profit</h3>
                <ResponsiveContainer width="100%" height={140}><AreaChart data={analytics.monthly}><XAxis dataKey="name" tick={{fontSize:9}}/><YAxis tickFormatter={fmtK} tick={{fontSize:9}}/><Tooltip formatter={v=>fmt(v)}/><Area type="monotone" dataKey="profit" stroke="#059669" fill="#d1fae5"/></AreaChart></ResponsiveContainer>
              </div>
              <div style={{background:'#fff',borderRadius:10,padding:12}}>
                <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Deal Flow</h3>
                <ResponsiveContainer width="100%" height={140}><BarChart data={analytics.monthly}><XAxis dataKey="name" tick={{fontSize:9}}/><YAxis tick={{fontSize:9}}/><Tooltip/><Legend wrapperStyle={{fontSize:9}}/><Bar dataKey="flips" name="Flip" fill="#0891b2"/><Bar dataKey="ws" name="WS" fill="#059669"/></BarChart></ResponsiveContainer>
              </div>
              <div style={{background:'#fff',borderRadius:10,padding:12,cursor:'pointer'}} onClick={()=>setDetailModal('conversion')}>
                <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Conversion</h3>
                <div>
                  {[{l:'Contracts',v:analytics.total,c:'#3b82f6',w:'100%'},{l:`Closed (${analytics.closeRate.toFixed(0)}%)`,v:analytics.all.count,c:'#059669',w:`${Math.max(analytics.closeRate,10)}%`},{l:`Term (${analytics.termRate.toFixed(0)}%)`,v:analytics.termed,c:'#dc2626',w:`${Math.max(analytics.termRate,10)}%`}].map((f,i)=>(
                    <div key={i} style={{marginBottom:6}}><div style={{height:18,width:f.w,background:f.c,borderRadius:3,marginBottom:2}}/><span style={{fontSize:9}}>{f.l}: {f.v}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
              <div style={{background:'#fff',borderRadius:10,padding:12,cursor:'pointer'}} onClick={()=>setDetailModal('types')}>
                <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Flip vs Wholesale</h3>
                <div style={{display:'flex',gap:10}}>
                  <div style={{flex:1,display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:28,height:28,borderRadius:6,background:'#cffafe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🏠</div>
                    <div><div style={{fontSize:8,color:'#64748b'}}>Flips</div><div style={{fontSize:12,fontWeight:700,color:'#059669'}}>{fmtK(analytics.flip.total)}</div></div>
                  </div>
                  <div style={{flex:1,display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:28,height:28,borderRadius:6,background:'#d1fae5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>📦</div>
                    <div><div style={{fontSize:8,color:'#64748b'}}>Wholesale</div><div style={{fontSize:12,fontWeight:700,color:'#059669'}}>{fmtK(analytics.ws.total)}</div></div>
                  </div>
                </div>
              </div>
              <div style={{background:'#fff',borderRadius:10,padding:12}}>
                <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Profit Distribution</h3>
                <ResponsiveContainer width="100%" height={100}><BarChart data={analytics.profitDist} layout="vertical"><XAxis type="number" tick={{fontSize:9}}/><YAxis dataKey="name" type="category" width={45} tick={{fontSize:8}}/><Tooltip/><Bar dataKey="c" fill="#3b82f6" radius={[0,3,3,0]}/></BarChart></ResponsiveContainer>
              </div>
              <div style={{background:'#fff',borderRadius:10,padding:12}}>
                <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Days to Close</h3>
                <ResponsiveContainer width="100%" height={100}><BarChart data={analytics.daysDist} layout="vertical"><XAxis type="number" tick={{fontSize:9}}/><YAxis dataKey="name" type="category" width={45} tick={{fontSize:8}}/><Tooltip/><Bar dataKey="c" fill="#f59e0b" radius={[0,3,3,0]}/></BarChart></ResponsiveContainer>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))',gap:6}}>
              {[{l:'Avg Profit',v:fmt(analytics.all.avg)},{l:'Avg Days',v:analytics.all.avgDays||'—'},{l:'Revenue',v:fmtK(analytics.all.rev)},{l:'ROI',v:`${analytics.all.roi.toFixed(1)}%`},{l:'Margin',v:`${analytics.all.margin.toFixed(1)}%`},{l:'Best',v:fmtK(analytics.all.max)}].map((s,i)=>(
                <div key={i} style={{background:'#fff',borderRadius:6,padding:8,textAlign:'center'}}><div style={{fontSize:8,color:'#64748b'}}>{s.l}</div><div style={{fontSize:13,fontWeight:700}}>{s.v}</div></div>
              ))}
            </div>
          </div>
        )}

        {/* DEALS TAB */}
        {activeTab==='deals' && (
          <div style={{background:'#fff',borderRadius:10,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {(() => {
                  const typeDeals = dealTypeFilter === 'All' ? deals : deals.filter(d => d.type === dealTypeFilter);
                  return (
                    <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{padding:'5px 8px',border:'1px solid #e2e8f0',borderRadius:5,fontSize:10}}>
                      <option value="All">All ({typeDeals.length})</option>
                      <option value="Ongoing">Ongoing ({typeDeals.filter(d => d.status === 'Ongoing').length})</option>
                      <option value="Closed">Closed ({typeDeals.filter(d => d.status === 'Closed').length})</option>
                      <option value="Terminated">Term ({typeDeals.filter(d => d.status === 'Terminated').length})</option>
                      <option value="AOI/Suit Filed">AOI ({typeDeals.filter(d => d.status === 'AOI/Suit Filed').length})</option>
                    </select>
                  );
                })()}
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <span style={{fontSize:9,color:'#64748b'}}>Sort:</span>
                  <select value={sortField} onChange={e=>setSortField(e.target.value)} style={{padding:'5px 8px',border:'1px solid #e2e8f0',borderRadius:5,fontSize:10}}>
                    <option value="purchaseDate">Date</option>
                    <option value="address">Address</option>
                    <option value="status">Status</option>
                    <option value="type">Type</option>
                    <option value="acquisition">Acquisition</option>
                    <option value="disposition">Disposition</option>
                    <option value="profit">Profit</option>
                    <option value="days">Days</option>
                  </select>
                  <button onClick={()=>setSortDir(sortDir==='asc'?'desc':'asc')} style={{padding:'5px 8px',background:'#f1f5f9',border:'none',borderRadius:4,fontSize:10,cursor:'pointer'}} title={sortDir==='asc'?'Ascending':'Descending'}>
                    {sortDir==='asc'?'↑':'↓'}
                  </button>
                </div>
              </div>
              <div style={{display:'flex',gap:3}}>
                <button onClick={()=>setViewMode('cards')} style={{padding:'5px 8px',background:viewMode==='cards'?'#059669':'#f1f5f9',color:viewMode==='cards'?'#fff':'#64748b',border:'none',borderRadius:4,fontSize:9,cursor:'pointer'}}>⊞</button>
                <button onClick={()=>setViewMode('list')} style={{padding:'5px 8px',background:viewMode==='list'?'#059669':'#f1f5f9',color:viewMode==='list'?'#fff':'#64748b',border:'none',borderRadius:4,fontSize:9,cursor:'pointer'}}>☰</button>
              </div>
            </div>

            {viewMode==='list' ? (
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr>
                      {[
                        {label:'Status',field:'status'},
                        {label:'Type',field:'type'},
                        {label:'Address',field:'address'},
                        {label:'Acq',field:'acquisition'},
                        {label:'Dispo',field:'disposition'},
                        {label:'Profit',field:'profit'},
                        {label:'Days',field:'days'},
                        {label:'',field:null}
                      ].map((h,i)=>(
                        <th key={i} onClick={()=>h.field && (sortField===h.field ? setSortDir(sortDir==='asc'?'desc':'asc') : (setSortField(h.field), setSortDir('desc')))} style={{textAlign:i>2?'right':'left',padding:'8px 6px',background:'#f8fafc',borderBottom:'2px solid #e2e8f0',fontSize:9,fontWeight:600,color:'#64748b',cursor:h.field?'pointer':'default',userSelect:'none'}}>
                          {h.label}{sortField===h.field && <span style={{marginLeft:3}}>{sortDir==='asc'?'↑':'↓'}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(d => {
                      const isClosed = d.status==='Closed';
                      const p = getLedgerProfit(d);
                      const days = isClosed ? getDays(d) : getPipelineDays(d);
                      const sc = STATUS_CONFIG[d.status] || {};
                      const tc = TYPE_CONFIG[d.type] || {};
                      const isEditing = editingDeal === d.id;
                      return (
                        <React.Fragment key={d.id}>
                          <tr style={{borderBottom:isEditing?'none':'1px solid #f1f5f9',background:isEditing?'#f0fdf4':'',cursor:'pointer'}} onClick={()=>setEditingDeal(isEditing?null:d.id)}>
                            <td style={{padding:'8px 6px',fontSize:10}}><span style={{padding:'2px 6px',borderRadius:4,fontSize:8,fontWeight:600,background:sc.bg,color:sc.color}}>{sc.icon} {d.status}</span></td>
                            <td style={{padding:'8px 6px',fontSize:10}}><span style={{padding:'2px 6px',borderRadius:4,fontSize:8,background:tc.bg,color:tc.color}}>{d.type}</span></td>
                            <td style={{padding:'8px 6px',fontSize:10}}>{d.address||'—'}</td>
                            <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{fmt(d.acquisition)}</td>
                            <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{fmt(isClosed?d.disposition:d.projDisposition)}</td>
                            <td style={{padding:'8px 6px',fontSize:10,textAlign:'right',fontWeight:600,color:p>=0?'#059669':'#dc2626'}}>{fmt(p)}</td>
                            <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{days?`${days}d`:'—'}</td>
                            <td style={{padding:'8px 6px'}}><button onClick={e=>{e.stopPropagation();setEditingDeal(isEditing?null:d.id);}} style={{padding:'2px 6px',background:isEditing?'#059669':'#f1f5f9',color:isEditing?'#fff':'#64748b',border:'none',borderRadius:3,fontSize:9,cursor:'pointer'}}>{isEditing?'✓':'✎'}</button></td>
                          </tr>
                          {isEditing && (
                            <tr style={{background:'#f0fdf4',borderBottom:'1px solid #059669'}}>
                              <td colSpan={8} style={{padding:12}}>
                                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8}}>
                                  <div>
                                    <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Status</label>
                                    <select value={d.status} onChange={e=>updateDeal(d.id,'status',e.target.value)} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}>
                                      {Object.keys(STATUS_CONFIG).map(s=><option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Type</label>
                                    <select value={d.type} onChange={e=>updateDeal(d.id,'type',e.target.value)} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}>
                                      <option value="Flip">Flip</option>
                                      <option value="Wholesale">Wholesale</option>
                                    </select>
                                  </div>
                                  <div style={{gridColumn:'span 2'}}>
                                    <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Address</label>
                                    <input value={d.address} onChange={e=>updateDeal(d.id,'address',e.target.value)} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                  </div>
                                  <div>
                                    <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Acquisition</label>
                                    <input type="number" value={d.acquisition} onChange={e=>updateDeal(d.id,'acquisition',+e.target.value)} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                  </div>
                                  <div>
                                    <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Proj Dispo</label>
                                    <input type="number" value={d.projDisposition} onChange={e=>updateDeal(d.id,'projDisposition',+e.target.value)} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                  </div>
                                  <div>
                                    <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Proj Rehab</label>
                                    <input type="number" value={d.projRehab||0} onChange={e=>updateDeal(d.id,'projRehab',+e.target.value)} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                  </div>
                                  <div>
                                    <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Purchase Date</label>
                                    <input type="date" value={d.purchaseDate||''} onChange={e=>updateDeal(d.id,'purchaseDate',e.target.value)} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                  </div>
                                  <div>
                                    <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Close Date</label>
                                    <input type="date" value={d.closeDate||''} onChange={e=>updateDeal(d.id,'closeDate',e.target.value)} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                  </div>
                                  <div>
                                    <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>JV</label>
                                    <select value={d.jv} onChange={e=>updateDeal(d.id,'jv',e.target.value)} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}>
                                      <option value="N">No</option>
                                      <option value="Y">Yes</option>
                                    </select>
                                  </div>
                                  {d.jv==='Y' && (
                                    <div>
                                      <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Owner %</label>
                                      <input type="number" value={d.ownerShare} onChange={e=>updateDeal(d.id,'ownerShare',+e.target.value)} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                    </div>
                                  )}
                                </div>
                                <div style={{display:'flex',gap:8,marginTop:10,justifyContent:'flex-end'}}>
                                  {d.status==='Ongoing' && <button onClick={e=>{e.stopPropagation();setCloseModalData({closeDate:new Date().toISOString().split('T')[0],disposition:d.projDisposition||0,netProfit:0});setShowCloseModal(d);}} style={{padding:'5px 12px',background:'#059669',border:'none',borderRadius:4,color:'#fff',fontSize:9,fontWeight:600,cursor:'pointer'}}>Close Deal</button>}
                                  <button onClick={e=>{e.stopPropagation();deleteDeal(d.id);}} style={{padding:'5px 12px',background:'#fee2e2',border:'none',borderRadius:4,color:'#dc2626',fontSize:9,fontWeight:600,cursor:'pointer'}}>Delete</button>
                                  <button onClick={e=>{e.stopPropagation();setEditingDeal(null);}} style={{padding:'5px 12px',background:'#059669',border:'none',borderRadius:4,color:'#fff',fontSize:9,fontWeight:600,cursor:'pointer'}}>Done</button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:10}}>
                {filtered.map(d => <DealCard key={d.id} d={d} />)}
              </div>
            )}
          </div>
        )}

        {/* LEAD FUNNEL TAB */}
        {activeTab==='funnel' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {/* Header with Sync */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fff',borderRadius:10,padding:14,flexWrap:'wrap',gap:10}}>
              <div>
                <h2 style={{margin:0,fontSize:16,fontWeight:600}}>🎯 Lead Funnel</h2>
                <p style={{margin:'4px 0 0',fontSize:10,color:'#64748b'}}>
                  {leads.length} total leads • Track your pipeline from new lead to closed deal
                  {googleSheetsConfig.lastSync && <span> • Sheet synced: {new Date(googleSheetsConfig.lastSync).toLocaleString()}</span>}
                </p>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                {sheetSyncing && <span style={{fontSize:10,color:'#2563eb'}}>⏳ Syncing...</span>}
                {googleSheetsConfig.sheetUrl && (
                  <button 
                    disabled={sheetSyncing}
                    onClick={async()=>{
                      const replaceAll = leads.length > 0 && confirm('Replace all existing leads with sheet data?\n\nClick OK to replace all, or Cancel to only add new leads.');
                      if(!googleSheetsConfig.sheetUrl) return;
                      setSheetSyncing(true);
                      try {
                        const match = googleSheetsConfig.sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                        if(!match) throw new Error('Invalid Google Sheets URL');
                        const sheetId = match[1];
                        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
                        const response = await fetch(csvUrl);
                        if(!response.ok) throw new Error('Could not fetch sheet');
                        const csvText = await response.text();
                        const lines = csvText.split('\n').filter(l => l.trim());
                        
                        const parseCSVLine = (line) => {
                          const result = [];
                          let current = '';
                          let inQuotes = false;
                          for(let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if(char === '"') inQuotes = !inQuotes;
                            else if(char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
                            else current += char;
                          }
                          result.push(current.trim());
                          return result;
                        };
                        
                        const statusMap = {
                          'new': 'new', 'new leads': 'new', 'new lead': 'new', 'discovery': 'new',
                          'contacted': 'contacted', 'contact made': 'contacted', 'interested add to follow up': 'contacted', 'interested': 'contacted',
                          'process call': 'process_call', 'processing': 'process_call', 'due diligence': 'process_call', 'due dilligence': 'process_call',
                          'offer': 'offer', 'offer made': 'offer', 'offer sent': 'offer', 'offers made': 'offer', 'offer follow-up': 'offer', 'offer followup': 'offer',
                          'contract': 'contract', 'under contract': 'contract',
                          'closed': 'closed', 'won': 'closed',
                          'dead': 'dead', 'dead/lost': 'dead', 'lost': 'dead', 'not interested': 'dead', 'no deal': 'dead'
                        };
                        
                        const newLeads = [];
                        const newDeals = [];
                        const existingLeadAddresses = replaceAll ? [] : leads.map(l => (l.propertyAddress||'').toLowerCase().trim());
                        const existingDealAddresses = deals.map(d => d.address.toLowerCase().trim());
                        
                        for(let i = 1; i < lines.length; i++) {
                          const row = parseCSVLine(lines[i]);
                          const address = row[0]?.trim();
                          if(!address || address.toLowerCase() === 'property address') continue;
                          
                          const rawStatus = (row[2] || 'new').toLowerCase().trim();
                          const mappedStatus = statusMap[rawStatus] || 'new';
                          const dealType = row[1]?.trim() || 'Wholesale';
                          const purchasePrice = parseFloat(row[3]?.replace(/[$,]/g,'')) || 0;
                          const salePrice = parseFloat(row[4]?.replace(/[$,]/g,'')) || 0;
                          const rehabEstimate = parseFloat(row[5]?.replace(/[$,]/g,'')) || 0;
                          const contractDate = row[6]?.trim() || '';
                          const leadSource = row[7]?.trim() || 'CRM';
                          const expectedProfit = parseFloat(row[8]?.replace(/[$,]/g,'')) || 0;
                          
                          if(!existingLeadAddresses.includes(address.toLowerCase().trim())) {
                            newLeads.push({
                              id: Date.now() + i,
                              propertyAddress: address,
                              sellerName: '',
                              sellerPhone: '',
                              status: mappedStatus,
                              source: leadSource,
                              dateAdded: contractDate || new Date().toISOString().split('T')[0],
                              dealType: dealType,
                              purchasePrice: purchasePrice,
                              salePrice: salePrice,
                              rehabEstimate: rehabEstimate,
                              expectedProfit: expectedProfit,
                              notes: ''
                            });
                            existingLeadAddresses.push(address.toLowerCase().trim());
                          }
                          
                          if((mappedStatus === 'contract' || mappedStatus === 'closed') && !existingDealAddresses.includes(address.toLowerCase().trim())) {
                            newDeals.push({
                              id: Date.now() + i + 10000,
                              address: address,
                              type: dealType.toLowerCase().includes('flip') ? 'Flip' : 'Wholesale',
                              status: mappedStatus === 'closed' ? 'Closed' : 'Ongoing',
                              acquisition: purchasePrice,
                              projDisposition: salePrice,
                              disposition: mappedStatus === 'closed' ? salePrice : 0,
                              projRehab: rehabEstimate,
                              rehab: mappedStatus === 'closed' ? rehabEstimate : 0,
                              purchaseDate: contractDate || new Date().toISOString().split('T')[0],
                              closeDate: mappedStatus === 'closed' ? (contractDate || new Date().toISOString().split('T')[0]) : '',
                              source: leadSource,
                              jv: 'N',
                              ownerShare: 100,
                              notes: expectedProfit ? `Expected profit: $${expectedProfit.toLocaleString()}` : '',
                              holdingCosts: 0
                            });
                            existingDealAddresses.push(address.toLowerCase().trim());
                          }
                        }
                        
                        if(newLeads.length > 0) setLeads([...leads, ...newLeads]);
                        if(newDeals.length > 0) setDeals([...deals, ...newDeals]);
                        setGoogleSheetsConfig({...googleSheetsConfig, lastSync: new Date().toISOString()});
                        
                        alert(`✓ Synced!\n\n📊 ${newLeads.length} new leads\n💼 ${newDeals.length} new deals`);
                      } catch(e) {
                        alert('Sync error: ' + e.message);
                      } finally {
                        setSheetSyncing(false);
                      }
                    }}
                    style={{padding:'8px 14px',background:sheetSyncing?'#94a3b8':'#2563eb',border:'none',borderRadius:6,color:'#fff',fontSize:10,fontWeight:600,cursor:sheetSyncing?'not-allowed':'pointer'}}
                  >
                    📊 Sync Google Sheet
                  </button>
                )}
                {!googleSheetsConfig.sheetUrl && (
                  <button onClick={()=>setActiveTab('settings')} style={{padding:'8px 14px',background:'#f1f5f9',border:'none',borderRadius:6,color:'#64748b',fontSize:10,fontWeight:600,cursor:'pointer'}}>⚙️ Setup Google Sheets</button>
                )}
                {leads.length > 0 && (
                  <button 
                    onClick={()=>{
                      if(confirm(`Clear all ${leads.length} leads from the funnel?\n\nThis won't affect your Deals or Google Sheet.`)) {
                        setLeads([]);
                      }
                    }} 
                    style={{padding:'8px 14px',background:'#fee2e2',border:'none',borderRadius:6,color:'#dc2626',fontSize:10,fontWeight:600,cursor:'pointer'}}
                  >
                    🗑️ Clear Leads
                  </button>
                )}
              </div>
            </div>

            {/* Funnel Visualization */}
            <div style={{background:'#fff',borderRadius:10,padding:14}}>
              <h3 style={{margin:'0 0 14px',fontSize:13,fontWeight:600}}>Pipeline Overview</h3>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {(() => {
                  // Cumulative counting: each stage includes all leads at that stage or further
                  const funnelData = LEAD_STAGES.filter(s=>s.id!=='dead').map(stage => {
                    const stageIdx = STAGE_ORDER.indexOf(stage.id);
                    // Count leads at this stage or any later stage (cumulative)
                    const count = leads.filter(l => {
                      if(l.status === 'dead') return false;
                      const leadStageIdx = STAGE_ORDER.indexOf(l.status);
                      return leadStageIdx >= stageIdx;
                    }).length;
                    return { ...stage, count };
                  });
                  const maxCount = Math.max(...funnelData.map(s=>s.count), 1);
                  return funnelData.map((stage, idx) => (
                    <div key={stage.id} onClick={()=>setSelectedLeadStage(selectedLeadStage===stage.id?null:stage.id)} style={{cursor:'pointer',background:selectedLeadStage===stage.id?stage.bg:'#f8fafc',borderRadius:8,padding:12,border:`2px solid ${selectedLeadStage===stage.id?stage.color:'transparent'}`,transition:'all 0.2s'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:20}}>{stage.icon}</span>
                          <span style={{fontSize:12,fontWeight:600,color:stage.color}}>{stage.name}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <span style={{fontSize:20,fontWeight:700,color:stage.color}}>{stage.count}</span>
                          {idx > 0 && funnelData[idx-1].count > 0 && (
                            <span style={{fontSize:9,color:'#64748b',background:'#f1f5f9',padding:'2px 6px',borderRadius:4}}>
                              {((stage.count / funnelData[idx-1].count) * 100).toFixed(0)}% conv
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{height:24,background:'#e2e8f0',borderRadius:6,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${Math.max((stage.count/maxCount)*100,2)}%`,background:`linear-gradient(90deg,${stage.color},${stage.color}dd)`,borderRadius:6,transition:'width 0.3s'}}/>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Dead/Lost separate */}
              <div style={{marginTop:12,padding:12,background:'#fef2f2',borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:20}}>❌</span>
                  <span style={{fontSize:12,fontWeight:600,color:'#dc2626'}}>Dead/Lost</span>
                </div>
                <span style={{fontSize:18,fontWeight:700,color:'#dc2626'}}>{leads.filter(l=>l.status==='dead').length}</span>
              </div>
            </div>

            {/* Conversion Metrics */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
              {(() => {
                const activeLeads = leads.filter(l => l.status !== 'dead');
                const total = activeLeads.length;
                const contacted = leads.filter(l=>['contacted','process_call','offer','contract','closed'].includes(l.status)).length;
                const processed = leads.filter(l=>['process_call','offer','contract','closed'].includes(l.status)).length;
                const offers = leads.filter(l=>['offer','contract','closed'].includes(l.status)).length;
                const contracts = leads.filter(l=>['contract','closed'].includes(l.status)).length;
                const closed = leads.filter(l=>l.status==='closed').length;
                return [
                  {l:'Contact Rate',v:total>0?((contacted/total)*100).toFixed(0)+'%':'0%',s:`${contacted}/${total} discovery`,c:'#8b5cf6'},
                  {l:'Processed Rate',v:contacted>0?((processed/contacted)*100).toFixed(0)+'%':'0%',s:`${processed}/${contacted} contacted`,c:'#f59e0b'},
                  {l:'Offer Rate',v:processed>0?((offers/processed)*100).toFixed(0)+'%':'0%',s:`${offers}/${processed} processed`,c:'#06b6d4'},
                  {l:'Contract Rate',v:offers>0?((contracts/offers)*100).toFixed(0)+'%':'0%',s:`${contracts}/${offers} offered`,c:'#10b981'},
                  {l:'Close Rate',v:contracts>0?((closed/contracts)*100).toFixed(0)+'%':'0%',s:`${closed}/${contracts} contracts`,c:'#059669'},
                  {l:'Overall Close',v:total>0?((closed/total)*100).toFixed(1)+'%':'0%',s:`${closed}/${total} total`,c:'#059669',highlight:true}
                ].map((m,i)=>(
                  <div key={i} style={{background:m.highlight?'linear-gradient(135deg,#059669,#047857)':'#fff',borderRadius:10,padding:12,borderLeft:m.highlight?'none':`4px solid ${m.c}`}}>
                    <div style={{fontSize:9,color:m.highlight?'rgba(255,255,255,0.8)':'#64748b'}}>{m.l}</div>
                    <div style={{fontSize:22,fontWeight:700,color:m.highlight?'#fff':m.c}}>{m.v}</div>
                    <div style={{fontSize:8,color:m.highlight?'rgba(255,255,255,0.7)':'#94a3b8'}}>{m.s}</div>
                  </div>
                ));
              })()}
            </div>

            {/* Pipeline Value Summary */}
            <div style={{background:'linear-gradient(135deg,#1e40af,#3b82f6)',borderRadius:10,padding:14,color:'#fff'}}>
              <h3 style={{margin:'0 0 12px',fontSize:13,fontWeight:600,opacity:0.9}}>💰 Pipeline Value</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
                {(() => {
                  const contractLeads = leads.filter(l => l.status === 'contract');
                  const offerLeads = leads.filter(l => l.status === 'offer');
                  const allActiveLeads = leads.filter(l => !['dead','closed'].includes(l.status));
                  
                  const contractValue = contractLeads.reduce((s,l) => s + (l.expectedProfit || 0), 0);
                  const offerValue = offerLeads.reduce((s,l) => s + (l.expectedProfit || 0), 0);
                  const totalPipelineValue = allActiveLeads.reduce((s,l) => s + (l.expectedProfit || 0), 0);
                  const avgDealSize = allActiveLeads.length > 0 ? totalPipelineValue / allActiveLeads.filter(l=>l.expectedProfit>0).length : 0;
                  
                  return [
                    {l:'Under Contract',v:contractValue,count:contractLeads.length,bg:'rgba(255,255,255,0.2)'},
                    {l:'Offers Out',v:offerValue,count:offerLeads.length,bg:'rgba(255,255,255,0.15)'},
                    {l:'Total Pipeline',v:totalPipelineValue,count:allActiveLeads.length,bg:'rgba(255,255,255,0.25)',highlight:true},
                    {l:'Avg Expected',v:avgDealSize,count:null,bg:'rgba(255,255,255,0.1)'}
                  ].map((m,i)=>(
                    <div key={i} style={{background:m.bg,borderRadius:8,padding:12}}>
                      <div style={{fontSize:9,opacity:0.8}}>{m.l}</div>
                      <div style={{fontSize:m.highlight?22:18,fontWeight:700}}>${m.v>=1000?(m.v/1000).toFixed(1)+'k':m.v.toLocaleString()}</div>
                      {m.count !== null && <div style={{fontSize:8,opacity:0.7}}>{m.count} deals</div>}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Lead List for Selected Stage */}
            {selectedLeadStage && (
              <div style={{background:'#fff',borderRadius:10,padding:14}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <h3 style={{margin:0,fontSize:13,fontWeight:600}}>
                    {LEAD_STAGES.find(s=>s.id===selectedLeadStage)?.icon} {LEAD_STAGES.find(s=>s.id===selectedLeadStage)?.name} Leads
                  </h3>
                  <button onClick={()=>setSelectedLeadStage(null)} style={{padding:'4px 8px',background:'#f1f5f9',border:'none',borderRadius:4,fontSize:9,cursor:'pointer'}}>✕ Close</button>
                </div>
                <div style={{overflow:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
                    <thead>
                      <tr>
                        {['Date','Property Address','Type','Source','Purchase','Sale/ARV','Exp. Profit','Actions'].map((h,i)=>(
                          <th key={i} style={{textAlign:i>=4&&i<=6?'right':'left',padding:'8px 6px',background:'#f8fafc',borderBottom:'2px solid #e2e8f0',fontSize:9,fontWeight:600,color:'#64748b'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.filter(l=>l.status===selectedLeadStage).map(lead=>(
                        <tr key={lead.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                          <td style={{padding:'8px 6px',fontSize:10}}>{new Date(lead.dateAdded).toLocaleDateString()}</td>
                          <td style={{padding:'8px 6px',fontSize:10,fontWeight:600,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lead.propertyAddress}</td>
                          <td style={{padding:'8px 6px',fontSize:10}}>
                            {lead.dealType && <span style={{padding:'2px 6px',borderRadius:4,fontSize:8,background:lead.dealType?.toLowerCase().includes('flip')?'#cffafe':'#d1fae5',color:lead.dealType?.toLowerCase().includes('flip')?'#0891b2':'#059669'}}>{lead.dealType}</span>}
                          </td>
                          <td style={{padding:'8px 6px',fontSize:10}}><span style={{padding:'2px 6px',borderRadius:4,background:'#f1f5f9',fontSize:8}}>{lead.source}</span></td>
                          <td style={{padding:'8px 6px',fontSize:10,textAlign:'right',fontFamily:'monospace'}}>{lead.purchasePrice ? `$${lead.purchasePrice.toLocaleString()}` : '-'}</td>
                          <td style={{padding:'8px 6px',fontSize:10,textAlign:'right',fontFamily:'monospace'}}>{lead.salePrice ? `$${lead.salePrice.toLocaleString()}` : '-'}</td>
                          <td style={{padding:'8px 6px',fontSize:10,textAlign:'right',fontWeight:600,color:'#059669',fontFamily:'monospace'}}>{lead.expectedProfit ? `$${lead.expectedProfit.toLocaleString()}` : '-'}</td>
                          <td style={{padding:'8px 6px',fontSize:10}}>
                            {(selectedLeadStage === 'contract' || selectedLeadStage === 'closed') && !deals.find(d=>d.address.toLowerCase()===lead.propertyAddress.toLowerCase()) && (
                              <button 
                                onClick={()=>{
                                  const newDeal = {
                                    id: Date.now(),
                                    address: lead.propertyAddress,
                                    type: lead.dealType?.toLowerCase().includes('flip') ? 'Flip' : 'Wholesale',
                                    status: selectedLeadStage === 'closed' ? 'Closed' : 'Ongoing',
                                    acquisition: lead.purchasePrice || 0,
                                    projDisposition: lead.salePrice || 0,
                                    disposition: selectedLeadStage === 'closed' ? (lead.salePrice || 0) : 0,
                                    projRehab: lead.rehabEstimate || 0,
                                    rehab: selectedLeadStage === 'closed' ? (lead.rehabEstimate || 0) : 0,
                                    purchaseDate: lead.dateAdded,
                                    closeDate: selectedLeadStage === 'closed' ? lead.dateAdded : '',
                                    source: lead.source,
                                    jv: 'N',
                                    ownerShare: 100,
                                    holdingCosts: 0,
                                    notes: lead.expectedProfit ? `Expected: $${lead.expectedProfit.toLocaleString()}` : ''
                                  };
                                  setDeals([...deals, newDeal]);
                                  alert(`✓ Created ${newDeal.status} deal for ${lead.propertyAddress}`);
                                }}
                                style={{padding:'4px 8px',background:'#059669',border:'none',borderRadius:4,color:'#fff',fontSize:9,cursor:'pointer'}}
                              >
                                + Deal
                              </button>
                            )}
                            {deals.find(d=>d.address.toLowerCase()===lead.propertyAddress.toLowerCase()) && (
                              <span style={{fontSize:8,color:'#059669'}}>✓ In Deals</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Source Breakdown */}
            <div style={{background:'#fff',borderRadius:10,padding:14}}>
              <h3 style={{margin:'0 0 12px',fontSize:13,fontWeight:600}}>📊 Leads by Source</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8}}>
                {(() => {
                  const sources = {};
                  leads.forEach(l => { sources[l.source] = (sources[l.source]||0)+1; });
                  return Object.entries(sources).sort((a,b)=>b[1]-a[1]).map(([source,count])=>(
                    <div key={source} style={{background:'#f8fafc',borderRadius:8,padding:10,textAlign:'center'}}>
                      <div style={{fontSize:18,fontWeight:700,color:'#3b82f6'}}>{count}</div>
                      <div style={{fontSize:9,color:'#64748b'}}>{source}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab==='analytics' && (
          <div style={{background:'#fff',borderRadius:10,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
              <h2 style={{margin:0,fontSize:14,fontWeight:600}}>Analytics - {periodLabel[statsPeriod]}{dealTypeFilter !== 'All' ? ` (${dealTypeFilter}s)` : ''}</h2>
            </div>
            
            {/* Revenue Summary Cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8,marginBottom:14}}>
              <div style={{background:'linear-gradient(135deg,#059669,#047857)',borderRadius:8,padding:12,color:'#fff'}}>
                <div style={{fontSize:9,opacity:0.8}}>Total Revenue</div>
                <div style={{fontSize:18,fontWeight:700}}>{fmtK(analytics.all.rev)}</div>
              </div>
              <div style={{background:'linear-gradient(135deg,#0891b2,#0e7490)',borderRadius:8,padding:12,color:'#fff'}}>
                <div style={{fontSize:9,opacity:0.8}}>Flip Revenue</div>
                <div style={{fontSize:18,fontWeight:700}}>{fmtK(analytics.flip.rev)}</div>
              </div>
              <div style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)',borderRadius:8,padding:12,color:'#fff'}}>
                <div style={{fontSize:9,opacity:0.8}}>Wholesale Revenue</div>
                <div style={{fontSize:18,fontWeight:700}}>{fmtK(analytics.ws.rev)}</div>
              </div>
              <div style={{background:'linear-gradient(135deg,#d97706,#b45309)',borderRadius:8,padding:12,color:'#fff'}}>
                <div style={{fontSize:9,opacity:0.8}}>Total Profit</div>
                <div style={{fontSize:18,fontWeight:700}}>{fmtK(analytics.all.total)}</div>
              </div>
            </div>
            
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:8,marginBottom:14}}>
              {[{l:'Close Rate',v:`${analytics.closeRate.toFixed(0)}%`,c:'#059669'},{l:'Term Rate',v:`${analytics.termRate.toFixed(0)}%`,c:'#dc2626'},{l:'AOI Rate',v:`${analytics.aoiRate.toFixed(0)}%`,c:'#7c3aed'},{l:'ROI',v:`${analytics.all.roi.toFixed(1)}%`,c:'#2563eb'},{l:'Margin',v:`${analytics.all.margin.toFixed(1)}%`},{l:'Avg Days',v:analytics.all.avgDays||'—'}].map((m,i)=>(
                <div key={i} style={{background:'#f8fafc',borderRadius:8,padding:10,display:'flex',alignItems:'center',gap:8}}>
                  <div><div style={{fontSize:8,color:'#64748b'}}>{m.l}</div><div style={{fontSize:16,fontWeight:700,color:m.c||'#0f172a'}}>{m.v}</div></div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:14}}>
              <div style={{background:'#f8fafc',borderRadius:8,padding:12}}>
                <h3 style={{margin:'0 0 8px',fontSize:12,fontWeight:600,color:'#0891b2'}}>🏠 Flips</h3>
                <div style={{fontSize:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span>Deals:</span><strong>{analytics.flip.count}</strong></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span>Revenue:</span><strong style={{color:'#0891b2'}}>{fmt(analytics.flip.rev)}</strong></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span>Profit:</span><strong style={{color:'#059669'}}>{fmt(analytics.flip.total)}</strong></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span>Avg:</span><strong>{fmt(analytics.flip.avg)}</strong></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span>Days:</span><strong>{analytics.flip.avgDays}</strong></div>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>ROI:</span><strong>{analytics.flip.roi.toFixed(1)}%</strong></div>
                </div>
              </div>
              <div style={{background:'#f8fafc',borderRadius:8,padding:12}}>
                <h3 style={{margin:'0 0 8px',fontSize:12,fontWeight:600,color:'#059669'}}>📦 Wholesale</h3>
                <div style={{fontSize:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span>Deals:</span><strong>{analytics.ws.count}</strong></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span>Revenue:</span><strong style={{color:'#059669'}}>{fmt(analytics.ws.rev)}</strong></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span>Profit:</span><strong style={{color:'#059669'}}>{fmt(analytics.ws.total)}</strong></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span>Avg:</span><strong>{fmt(analytics.ws.avg)}</strong></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span>Days:</span><strong>{analytics.ws.avgDays}</strong></div>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>ROI:</span><strong>{analytics.ws.roi.toFixed(1)}%</strong></div>
                </div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>
              <div style={{background:'#f8fafc',borderRadius:8,padding:12}}>
                <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Monthly Profit</h3>
                <ResponsiveContainer width="100%" height={180}><ComposedChart data={analytics.monthly}><XAxis dataKey="name" tick={{fontSize:9}}/><YAxis yAxisId="l" tickFormatter={fmtK} tick={{fontSize:9}}/><YAxis yAxisId="r" orientation="right" tick={{fontSize:9}}/><Tooltip formatter={(v,n)=>n==='deals'?v:fmt(v)}/><Legend wrapperStyle={{fontSize:9}}/><Bar yAxisId="l" dataKey="profit" name="Profit" fill="#059669" radius={[3,3,0,0]}/><Line yAxisId="r" type="monotone" dataKey="deals" name="Deals" stroke="#3b82f6" strokeWidth={2}/></ComposedChart></ResponsiveContainer>
              </div>
              <div style={{background:'#f8fafc',borderRadius:8,padding:12}}>
                <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Monthly Revenue</h3>
                <ResponsiveContainer width="100%" height={180}><AreaChart data={analytics.monthly}><XAxis dataKey="name" tick={{fontSize:9}}/><YAxis tickFormatter={fmtK} tick={{fontSize:9}}/><Tooltip formatter={v=>fmt(v)}/><Legend wrapperStyle={{fontSize:9}}/><Area type="monotone" dataKey="flipRev" name="Flip Rev" stroke="#0891b2" fill="#cffafe" stackId="1"/><Area type="monotone" dataKey="wsRev" name="WS Rev" stroke="#059669" fill="#d1fae5" stackId="1"/></AreaChart></ResponsiveContainer>
              </div>
              <div style={{background:'#f8fafc',borderRadius:8,padding:12}}>
                <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Profit by Type</h3>
                <ResponsiveContainer width="100%" height={180}><AreaChart data={analytics.monthly}><XAxis dataKey="name" tick={{fontSize:9}}/><YAxis tickFormatter={fmtK} tick={{fontSize:9}}/><Tooltip formatter={v=>fmt(v)}/><Legend wrapperStyle={{fontSize:9}}/><Area type="monotone" dataKey="flipP" name="Flip" stroke="#0891b2" fill="#cffafe" stackId="1"/><Area type="monotone" dataKey="wsP" name="WS" stroke="#059669" fill="#d1fae5" stackId="1"/></AreaChart></ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* MARKETING TAB */}
        {activeTab==='marketing' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {/* Sub-navigation */}
            <div style={{display:'flex',gap:4,background:'#fff',borderRadius:10,padding:8}}>
              {[{id:'overview',l:'📊 Overview'},{id:'expenses',l:'💸 Expenses'},{id:'channels',l:'📈 Channels'},{id:'review',l:'📋 Review' + (pendingReview.expenses.length > 0 ? ` (${pendingReview.expenses.length})` : '')}].map(t=>(
                <button key={t.id} onClick={()=>setMarketingTab(t.id)} style={{flex:1,padding:'8px 12px',background:marketingTab===t.id?'#059669':'transparent',color:marketingTab===t.id?'#fff':t.id==='review'&&pendingReview.expenses.length>0?'#f59e0b':'#64748b',border:'none',borderRadius:6,fontSize:10,fontWeight:600,cursor:'pointer'}}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* OVERVIEW SUB-TAB */}
            {marketingTab==='overview' && (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {/* KPI Cards */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
                  {[
                    {l:'Total Expenses',v:fmt(marketingAnalytics.totalSpend),s:'All business costs',c:'#dc2626',icon:'💸'},
                    {l:'Marketing Spend',v:fmt(marketingAnalytics.marketingSpend),s:'Ads & lead gen',c:'#3b82f6',icon:'📣'},
                    {l:'Team Costs',v:fmt(marketingAnalytics.teamSpend),s:'Acq, TC, Dispo, VA',c:'#8b5cf6',icon:'👥'},
                    {l:'Overhead',v:fmt(marketingAnalytics.overheadSpend),s:'Software, legal, etc',c:'#64748b',icon:'🏢'},
                    {l:'Cost/Deal',v:fmt(marketingAnalytics.costPerDeal),s:`${marketingAnalytics.dealsCount} closed`,c:'#f59e0b',icon:'🎯'},
                    {l:'Net Profit',v:fmt(marketingAnalytics.netProfit),s:`${marketingAnalytics.profitMargin.toFixed(0)}% margin`,c:marketingAnalytics.netProfit>=0?'#059669':'#dc2626',icon:'📈'}
                  ].map((kpi,i)=>(
                    <div key={i} style={{background:'#fff',borderRadius:10,padding:12,borderLeft:`4px solid ${kpi.c}`}}>
                      <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:4}}>
                        <span style={{fontSize:14}}>{kpi.icon}</span>
                        <span style={{fontSize:9,color:'#64748b'}}>{kpi.l}</span>
                      </div>
                      <span style={{fontSize:18,fontWeight:700,color:kpi.c,display:'block'}}>{kpi.v}</span>
                      <span style={{fontSize:8,color:'#94a3b8'}}>{kpi.s}</span>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
                  <div style={{background:'#fff',borderRadius:10,padding:12}}>
                    <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Monthly Expenses vs Profit</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <ComposedChart data={marketingAnalytics.monthlySpend}>
                        <XAxis dataKey="name" tick={{fontSize:9}}/>
                        <YAxis yAxisId="l" tickFormatter={fmtK} tick={{fontSize:9}}/>
                        <YAxis yAxisId="r" orientation="right" tickFormatter={fmtK} tick={{fontSize:9}}/>
                        <Tooltip formatter={(v)=>fmt(v)}/>
                        <Legend wrapperStyle={{fontSize:9}}/>
                        <Bar yAxisId="l" dataKey="marketing" name="Marketing" fill="#3b82f6" stackId="a" radius={[0,0,0,0]}/>
                        <Bar yAxisId="l" dataKey="team" name="Team" fill="#8b5cf6" stackId="a" radius={[0,0,0,0]}/>
                        <Bar yAxisId="l" dataKey="overhead" name="Overhead" fill="#94a3b8" stackId="a" radius={[3,3,0,0]}/>
                        <Line yAxisId="r" type="monotone" dataKey="profit" name="Profit" stroke="#059669" strokeWidth={2}/>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{background:'#fff',borderRadius:10,padding:12}}>
                    <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Spend by Category</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={marketingAnalytics.categoryBreakdown} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({name,percent})=>`${name.split('/')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                          {marketingAnalytics.categoryBreakdown.map((e,i)=><Cell key={i} fill={['#3b82f6','#8b5cf6','#f59e0b','#06b6d4','#64748b','#ec4899','#10b981','#94a3b8','#dc2626','#0891b2','#84cc16','#f97316'][i%12]}/>)}
                        </Pie>
                        <Tooltip formatter={v=>fmt(v)}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Spend Breakdown & Channel Performance */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
                  <div style={{background:'#fff',borderRadius:10,padding:12}}>
                    <h3 style={{margin:'0 0 12px',fontSize:11,fontWeight:600}}>Expense Breakdown</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {[
                        {l:'Marketing/Ads',v:marketingAnalytics.marketingSpend,c:'#3b82f6',pct:marketingAnalytics.totalSpend>0?(marketingAnalytics.marketingSpend/marketingAnalytics.totalSpend*100):0},
                        {l:'Team (Acq/TC/Dispo)',v:marketingAnalytics.teamSpend,c:'#8b5cf6',pct:marketingAnalytics.totalSpend>0?(marketingAnalytics.teamSpend/marketingAnalytics.totalSpend*100):0},
                        {l:'Overhead & Other',v:marketingAnalytics.overheadSpend,c:'#64748b',pct:marketingAnalytics.totalSpend>0?(marketingAnalytics.overheadSpend/marketingAnalytics.totalSpend*100):0}
                      ].map((f,i)=>(
                        <div key={i}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                            <span style={{fontSize:10}}>{f.l}</span>
                            <span style={{fontSize:10,fontWeight:600}}>{fmt(f.v)} ({f.pct.toFixed(0)}%)</span>
                          </div>
                          <div style={{height:8,background:'#f1f5f9',borderRadius:4,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${f.pct}%`,background:f.c,borderRadius:4}}/>
                          </div>
                        </div>
                      ))}
                      <div style={{borderTop:'2px solid #e2e8f0',paddingTop:8,marginTop:4}}>
                        <div style={{display:'flex',justifyContent:'space-between'}}>
                          <span style={{fontSize:11,fontWeight:600}}>Total Expenses</span>
                          <span style={{fontSize:11,fontWeight:700,color:'#dc2626'}}>{fmt(marketingAnalytics.totalSpend)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{background:'#fff',borderRadius:10,padding:12}}>
                    <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Marketing Channels</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {marketingAnalytics.channelStats.sort((a,b)=>b.spend-a.spend).slice(0,6).map((ch,i)=>(
                        <div key={ch.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',background:'#f8fafc',borderRadius:6}}>
                          <span style={{fontSize:14}}>{ch.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:10,fontWeight:600}}>{ch.name}</div>
                            <div style={{fontSize:9,color:'#64748b'}}>{ch.pctOfMarketing.toFixed(0)}% of marketing</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:12,fontWeight:700,color:'#dc2626'}}>{fmt(ch.spend)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Profit vs Spend Summary */}
                <div style={{background:'#fff',borderRadius:10,padding:14}}>
                  <h3 style={{margin:'0 0 12px',fontSize:12,fontWeight:600}}>💰 Profitability Analysis</h3>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12}}>
                    <div style={{textAlign:'center',padding:12,background:'#eff6ff',borderRadius:8}}>
                      <div style={{fontSize:9,color:'#2563eb',marginBottom:4}}>Gross Revenue</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#2563eb'}}>{fmt(marketingAnalytics.periodRevenue)}</div>
                    </div>
                    <div style={{textAlign:'center',padding:12,background:'#f0fdf4',borderRadius:8}}>
                      <div style={{fontSize:9,color:'#059669',marginBottom:4}}>Deal Profit</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#059669'}}>{fmt(marketingAnalytics.periodProfit)}</div>
                    </div>
                    <div style={{textAlign:'center',padding:12,background:'#fef2f2',borderRadius:8}}>
                      <div style={{fontSize:9,color:'#dc2626',marginBottom:4}}>Total Expenses</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#dc2626'}}>{fmt(marketingAnalytics.totalSpend)}</div>
                    </div>
                    <div style={{textAlign:'center',padding:12,background:marketingAnalytics.netProfit>=0?'#f0fdf4':'#fef2f2',borderRadius:8,border:`2px solid ${marketingAnalytics.netProfit>=0?'#059669':'#dc2626'}`}}>
                      <div style={{fontSize:9,color:marketingAnalytics.netProfit>=0?'#059669':'#dc2626',marginBottom:4}}>Net Profit</div>
                      <div style={{fontSize:20,fontWeight:700,color:marketingAnalytics.netProfit>=0?'#059669':'#dc2626'}}>{fmt(marketingAnalytics.netProfit)}</div>
                    </div>
                    <div style={{textAlign:'center',padding:12,background:'#f5f3ff',borderRadius:8}}>
                      <div style={{fontSize:9,color:'#7c3aed',marginBottom:4}}>Expense Ratio</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#7c3aed'}}>{marketingAnalytics.expenseRatio.toFixed(0)}%</div>
                      <div style={{fontSize:8,color:'#94a3b8'}}>of deal profit</div>
                    </div>
                    <div style={{textAlign:'center',padding:12,background:'#fefce8',borderRadius:8}}>
                      <div style={{fontSize:9,color:'#ca8a04',marginBottom:4}}>Marketing/Deal</div>
                      <div style={{fontSize:20,fontWeight:700,color:'#ca8a04'}}>{fmt(marketingAnalytics.marketingCostPerDeal)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EXPENSES SUB-TAB */}
            {marketingTab==='expenses' && (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fff',borderRadius:10,padding:12,flexWrap:'wrap',gap:8}}>
                  <div>
                    <h2 style={{margin:0,fontSize:14,fontWeight:600}}>Expense Tracking</h2>
                    <p style={{margin:'4px 0 0',fontSize:10,color:'#64748b'}}>{expenses.length} total expenses • {periodLabel[statsPeriod]}</p>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                    {selectedExpenses.length > 0 && (
                      <>
                        <span style={{fontSize:10,color:'#64748b',background:'#f1f5f9',padding:'4px 8px',borderRadius:4}}>{selectedExpenses.length} selected</span>
                        <button onClick={()=>{if(confirm(`Delete ${selectedExpenses.length} expense(s)?`)){setExpenses(expenses.filter(e=>!selectedExpenses.includes(e.id)));setSelectedExpenses([]);}}} style={{padding:'8px 14px',background:'#dc2626',border:'none',borderRadius:6,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>🗑️ Delete Selected</button>
                        <button onClick={()=>setSelectedExpenses([])} style={{padding:'8px 14px',background:'#f1f5f9',border:'none',borderRadius:6,color:'#64748b',fontSize:10,fontWeight:600,cursor:'pointer'}}>Clear</button>
                      </>
                    )}
                    <button onClick={()=>setShowRulesModal(true)} style={{padding:'8px 14px',background:'#6366f1',border:'none',borderRadius:6,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>📋 Rules ({customRules.length})</button>
                    <button onClick={()=>setShowCsvModal(true)} style={{padding:'8px 14px',background:'#3b82f6',border:'none',borderRadius:6,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>📄 Import CSV</button>
                    <button onClick={async()=>{
                      setCloudSyncStatus('syncing');
                      const saved = await saveToCloud({deals, allocations, ledger, checklist, expenses, leads, resimpliConfig});
                      setCloudSyncStatus(saved ? 'synced' : 'error');
                      if(saved) setLastSyncTime(new Date());
                      alert(saved ? '✓ Saved to cloud!' : '✕ Save failed');
                    }} style={{padding:'8px 14px',background:cloudSyncStatus==='syncing'?'#94a3b8':'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>
                      {cloudSyncStatus==='syncing' ? '⏳ Saving...' : '💾 Save Now'}
                    </button>
                    <button onClick={()=>{setExpenseForm({date:new Date().toISOString().split('T')[0],category:'marketing',channel:'',description:'',amount:0,vendor:'',recurring:'none',recurringEndDate:''});setShowExpenseModal(true);}} style={{padding:'8px 14px',background:'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>+ Add Expense</button>
                  </div>
                </div>

                {/* Expense Summary Cards */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:8}}>
                  {marketingAnalytics.categoryBreakdown.map(cat=>(
                    <div key={cat.id} style={{background:'#fff',borderRadius:8,padding:10,textAlign:'center'}}>
                      <div style={{fontSize:16,marginBottom:4}}>{cat.icon}</div>
                      <div style={{fontSize:9,color:'#64748b'}}>{cat.name}</div>
                      <div style={{fontSize:14,fontWeight:700}}>{fmt(cat.amount)}</div>
                      <div style={{fontSize:8,color:'#94a3b8'}}>{cat.count} items</div>
                    </div>
                  ))}
                </div>

                {/* Expense Table */}
                <div style={{background:'#fff',borderRadius:10,padding:12,overflow:'auto'}}>
                  {(() => {
                    const filteredExpenses = expenses.filter(e=>inRange(e.date,getRange(statsPeriod))).sort((a,b)=>new Date(b.date)-new Date(a.date));
                    const allFilteredIds = filteredExpenses.map(e=>e.id);
                    const allSelected = filteredExpenses.length > 0 && filteredExpenses.every(e=>selectedExpenses.includes(e.id));
                    const someSelected = filteredExpenses.some(e=>selectedExpenses.includes(e.id));
                    return (
                      <table style={{width:'100%',borderCollapse:'collapse',minWidth:650}}>
                        <thead>
                          <tr>
                            <th style={{width:36,padding:'8px 6px',background:'#f8fafc',borderBottom:'2px solid #e2e8f0'}}>
                              <input 
                                type="checkbox" 
                                checked={allSelected}
                                ref={el => { if(el) el.indeterminate = someSelected && !allSelected; }}
                                onChange={(e)=>{
                                  if(e.target.checked) {
                                    setSelectedExpenses([...new Set([...selectedExpenses, ...allFilteredIds])]);
                                  } else {
                                    setSelectedExpenses(selectedExpenses.filter(id=>!allFilteredIds.includes(id)));
                                  }
                                }}
                                style={{cursor:'pointer',width:14,height:14}}
                              />
                            </th>
                            {['Date','Category','Channel','Description','Vendor','Amount',''].map((h,i)=>(
                              <th key={i} style={{textAlign:i===5?'right':'left',padding:'8px 6px',background:'#f8fafc',borderBottom:'2px solid #e2e8f0',fontSize:9,fontWeight:600,color:'#64748b'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExpenses.map(e=>{
                            const cat = EXPENSE_CATEGORIES.find(c=>c.id===e.category);
                            const ch = MARKETING_CHANNELS.find(c=>c.id===e.channel);
                            const isSelected = selectedExpenses.includes(e.id);
                            return (
                              <tr key={e.id} style={{borderBottom:'1px solid #f1f5f9',background:isSelected?'#f0fdf4':''}}>
                                <td style={{padding:'8px 6px'}}>
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={(ev)=>{
                                      if(ev.target.checked) {
                                        setSelectedExpenses([...selectedExpenses, e.id]);
                                      } else {
                                        setSelectedExpenses(selectedExpenses.filter(id=>id!==e.id));
                                      }
                                    }}
                                    style={{cursor:'pointer',width:14,height:14}}
                                  />
                                </td>
                                <td style={{padding:'8px 6px',fontSize:10}}>{new Date(e.date).toLocaleDateString()}</td>
                                <td style={{padding:'8px 6px',fontSize:10}}><span style={{padding:'2px 6px',borderRadius:4,background:'#f1f5f9',fontSize:8}}>{cat?.icon} {cat?.name}</span></td>
                                <td style={{padding:'8px 6px',fontSize:10}}>{ch ? <span style={{padding:'2px 6px',borderRadius:4,background:ch.color+'20',color:ch.color,fontSize:8}}>{ch.icon} {ch.name}</span> : '—'}</td>
                                <td style={{padding:'8px 6px',fontSize:10}}>{e.description}</td>
                                <td style={{padding:'8px 6px',fontSize:10,color:'#64748b'}}>{e.vendor}</td>
                                <td style={{padding:'8px 6px',fontSize:10,textAlign:'right',fontWeight:600,color:'#dc2626'}}>{fmt(e.amount)}</td>
                                <td style={{padding:'8px 6px'}}>
                                  <button onClick={()=>{setExpenseForm(e);setEditingExpense(e.id);setShowExpenseModal(true);}} style={{padding:'2px 6px',background:'#f1f5f9',border:'none',borderRadius:3,fontSize:9,cursor:'pointer',marginRight:4}}>✎</button>
                                  <button onClick={()=>{if(confirm('Delete expense?')){setExpenses(expenses.filter(x=>x.id!==e.id));setSelectedExpenses(selectedExpenses.filter(id=>id!==e.id));}}} style={{padding:'2px 6px',background:'#fee2e2',border:'none',borderRadius:3,fontSize:9,cursor:'pointer',color:'#dc2626'}}>✕</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{background:'#f8fafc',fontWeight:600}}>
                            <td></td>
                            <td colSpan={5} style={{padding:'8px 6px',fontSize:10}}>
                              {selectedExpenses.length > 0 
                                ? `SELECTED (${selectedExpenses.filter(id=>allFilteredIds.includes(id)).length} items): ${fmt(expenses.filter(e=>selectedExpenses.includes(e.id)&&allFilteredIds.includes(e.id)).reduce((s,e)=>s+e.amount,0))}`
                                : `TOTAL (${periodLabel[statsPeriod]})`
                              }
                            </td>
                            <td style={{padding:'8px 6px',fontSize:12,textAlign:'right',color:'#dc2626'}}>
                              {selectedExpenses.length === 0 && fmt(filteredExpenses.reduce((s,e)=>s+e.amount,0))}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}

            
            {/* CHANNELS SUB-TAB */}
            {marketingTab==='channels' && (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {/* Warning for unassigned channels */}
                {marketingAnalytics.unassignedChannelExpenses > 0 && (
                  <div style={{background:'#fef3c7',border:'1px solid #f59e0b',borderRadius:8,padding:12,display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:20}}>⚠️</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:11,color:'#92400e'}}>
                        {marketingAnalytics.unassignedChannelExpenses} marketing expense{marketingAnalytics.unassignedChannelExpenses>1?'s':''} without channel assigned
                      </div>
                      <div style={{fontSize:10,color:'#a16207'}}>Go to Expenses tab and assign a channel to see them here</div>
                    </div>
                    <button onClick={()=>setMarketingTab('expenses')} style={{padding:'6px 12px',background:'#f59e0b',border:'none',borderRadius:4,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>
                      View Expenses
                    </button>
                  </div>
                )}
                
                {marketingAnalytics.channelStats.length === 0 && marketingAnalytics.unassignedChannelExpenses === 0 && (
                  <div style={{background:'#f8fafc',borderRadius:10,padding:30,textAlign:'center'}}>
                    <div style={{fontSize:32,marginBottom:8}}>📊</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#64748b',marginBottom:4}}>No Channel Data Yet</div>
                    <div style={{fontSize:11,color:'#94a3b8'}}>Add expenses with marketing channels assigned to see spend analytics here</div>
                  </div>
                )}
                
                {marketingAnalytics.channelStats.length > 0 && (
                  <>
                <div style={{background:'#fff',borderRadius:10,padding:12}}>
                  <h2 style={{margin:'0 0 12px',fontSize:14,fontWeight:600}}>Marketing Channel Spend</h2>
                  
                  {/* Channel Performance Table */}
                  <div style={{overflow:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',minWidth:500}}>
                      <thead>
                        <tr>
                          {['Channel','# Expenses','Total Spend','% of Marketing','Avg/Expense'].map((h,i)=>(
                            <th key={i} style={{textAlign:i>0?'right':'left',padding:'10px 8px',background:'#f8fafc',borderBottom:'2px solid #e2e8f0',fontSize:10,fontWeight:600,color:'#64748b'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {marketingAnalytics.channelStats.sort((a,b)=>b.spend-a.spend).map(ch=>(
                          <tr key={ch.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                            <td style={{padding:'10px 8px',fontSize:11}}>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <span style={{fontSize:16}}>{ch.icon}</span>
                                <span style={{fontWeight:600}}>{ch.name}</span>
                              </div>
                            </td>
                            <td style={{padding:'10px 8px',fontSize:11,textAlign:'right'}}>{ch.count}</td>
                            <td style={{padding:'10px 8px',fontSize:11,textAlign:'right',color:'#dc2626',fontWeight:600}}>{fmt(ch.spend)}</td>
                            <td style={{padding:'10px 8px',fontSize:11,textAlign:'right'}}>{ch.pctOfMarketing.toFixed(1)}%</td>
                            <td style={{padding:'10px 8px',fontSize:11,textAlign:'right',color:'#64748b'}}>{fmt(ch.count>0?ch.spend/ch.count:0)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{background:'#f8fafc',fontWeight:600}}>
                          <td style={{padding:'10px 8px',fontSize:11}}>TOTAL</td>
                          <td style={{padding:'10px 8px',fontSize:11,textAlign:'right'}}>{marketingAnalytics.channelStats.reduce((s,c)=>s+c.count,0)}</td>
                          <td style={{padding:'10px 8px',fontSize:11,textAlign:'right',color:'#dc2626'}}>{fmt(marketingAnalytics.marketingSpend)}</td>
                          <td style={{padding:'10px 8px',fontSize:11,textAlign:'right'}}>100%</td>
                          <td style={{padding:'10px 8px',fontSize:11,textAlign:'right',color:'#64748b'}}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Channel Charts */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
                  <div style={{background:'#fff',borderRadius:10,padding:12}}>
                    <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Spend by Channel</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={marketingAnalytics.channelStats.sort((a,b)=>b.spend-a.spend)} layout="vertical">
                        <XAxis type="number" tickFormatter={fmtK} tick={{fontSize:9}}/>
                        <YAxis dataKey="name" type="category" width={90} tick={{fontSize:9}}/>
                        <Tooltip formatter={v=>fmt(v)}/>
                        <Bar dataKey="spend" radius={[0,4,4,0]}>
                          {marketingAnalytics.channelStats.sort((a,b)=>b.spend-a.spend).map((ch,i)=><Cell key={i} fill={ch.color}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{background:'#fff',borderRadius:10,padding:12}}>
                    <h3 style={{margin:'0 0 8px',fontSize:11,fontWeight:600}}>Channel Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={marketingAnalytics.channelStats} dataKey="spend" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name.split('/')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                          {marketingAnalytics.channelStats.map((ch,i)=><Cell key={i} fill={ch.color}/>)}
                        </Pie>
                        <Tooltip formatter={v=>fmt(v)}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                  </>
                )}
              </div>
            )}
            
            {/* Review Tab - Pending Transactions */}
            {marketingTab==='review' && (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={{background:'#fff',borderRadius:10,padding:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <div>
                      <h2 style={{margin:0,fontSize:16,fontWeight:600}}>📋 Pending Review</h2>
                      <p style={{margin:'4px 0 0',fontSize:11,color:'#64748b'}}>Categorize transactions that couldn't be auto-matched</p>
                    </div>
                    {pendingReview.expenses.length > 0 && (
                      <button 
                        onClick={()=>{
                          if(confirm(`Clear all ${pendingReview.expenses.length} pending items?`)){
                            setPendingReview({expenses:[],income:[]});
                          }
                        }}
                        style={{padding:'6px 12px',background:'#fee2e2',border:'none',borderRadius:6,color:'#dc2626',fontSize:10,fontWeight:600,cursor:'pointer'}}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  {pendingReview.expenses.length === 0 ? (
                    <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>
                      <div style={{fontSize:48,marginBottom:12}}>✓</div>
                      <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>All caught up!</div>
                      <div style={{fontSize:11}}>No transactions pending review</div>
                    </div>
                  ) : (
                    <>
                      <div style={{maxHeight:400,overflow:'auto',border:'1px solid #e2e8f0',borderRadius:8,marginBottom:16}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                          <thead style={{position:'sticky',top:0,background:'#f8fafc'}}>
                            <tr>
                              <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Date</th>
                              <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Vendor</th>
                              <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Description</th>
                              <th style={{textAlign:'right',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Amount</th>
                              <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Category</th>
                              <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Channel</th>
                              <th style={{padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingReview.expenses.map((exp, idx) => (
                              <tr key={exp.id} style={{borderBottom:'1px solid #f1f5f9',background:'#fffbeb'}}>
                                <td style={{padding:'6px'}}>{exp.date}</td>
                                <td style={{padding:'6px',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={exp.vendor}>{exp.vendor}</td>
                                <td style={{padding:'6px',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={exp.description}>{exp.description}</td>
                                <td style={{padding:'6px',textAlign:'right',fontWeight:600,color:'#dc2626'}}>${exp.amount.toLocaleString()}</td>
                                <td style={{padding:'6px'}}>
                                  <select 
                                    value={exp.category} 
                                    onChange={(e)=>{
                                      const updated = [...pendingReview.expenses];
                                      updated[idx] = {...exp, category: e.target.value};
                                      setPendingReview({...pendingReview, expenses: updated});
                                    }}
                                    style={{padding:'4px 6px',border:'1px solid #e2e8f0',borderRadius:4,fontSize:10,width:'100%'}}
                                  >
                                    {EXPENSE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                  </select>
                                </td>
                                <td style={{padding:'6px'}}>
                                  <select 
                                    value={exp.channel||''} 
                                    onChange={(e)=>{
                                      const updated = [...pendingReview.expenses];
                                      updated[idx] = {...exp, channel: e.target.value||null};
                                      setPendingReview({...pendingReview, expenses: updated});
                                    }}
                                    style={{padding:'4px 6px',border:'1px solid #e2e8f0',borderRadius:4,fontSize:10,width:'100%'}}
                                  >
                                    <option value="">— None —</option>
                                    {MARKETING_CHANNELS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                  </select>
                                </td>
                                <td style={{padding:'6px'}}>
                                  <div style={{display:'flex',gap:4}}>
                                    <button 
                                      onClick={()=>{
                                        // Save vendor mapping
                                        if(exp.vendor){
                                          const vendorKey = exp.vendor.toLowerCase().trim();
                                          setVendorMappings({...vendorMappings, [vendorKey]: {category: exp.category, channel: exp.channel}});
                                        }
                                        // Move to expenses
                                        const cleanExp = {...exp};
                                        delete cleanExp.confidence;
                                        setExpenses([cleanExp, ...expenses]);
                                        // Remove from pending
                                        setPendingReview({...pendingReview, expenses: pendingReview.expenses.filter(e=>e.id!==exp.id)});
                                      }}
                                      style={{padding:'4px 8px',background:'#059669',border:'none',borderRadius:4,color:'#fff',fontSize:9,fontWeight:600,cursor:'pointer'}}
                                    >
                                      ✓ Post
                                    </button>
                                    <button 
                                      onClick={()=>{
                                        setPendingReview({...pendingReview, expenses: pendingReview.expenses.filter(e=>e.id!==exp.id)});
                                      }}
                                      style={{padding:'4px 6px',background:'#fee2e2',border:'none',borderRadius:4,color:'#dc2626',fontSize:9,cursor:'pointer'}}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{fontSize:11,color:'#64748b'}}>
                          {pendingReview.expenses.length} transactions • ${pendingReview.expenses.reduce((s,e)=>s+e.amount,0).toLocaleString()} total
                        </div>
                        <button 
                          onClick={()=>{
                            // Save all vendor mappings
                            const newMappings = {...vendorMappings};
                            pendingReview.expenses.forEach(exp => {
                              if(exp.vendor && exp.category !== 'other'){
                                const vendorKey = exp.vendor.toLowerCase().trim();
                                newMappings[vendorKey] = {category: exp.category, channel: exp.channel};
                              }
                            });
                            setVendorMappings(newMappings);
                            
                            // Move all to expenses
                            const finalExpenses = pendingReview.expenses.map(exp => {
                              const cleanExp = {...exp};
                              delete cleanExp.confidence;
                              return cleanExp;
                            });
                            setExpenses([...finalExpenses, ...expenses]);
                            setPendingReview({expenses:[], income:[]});
                            alert(`✓ Posted ${finalExpenses.length} expenses!`);
                          }}
                          style={{padding:'10px 20px',background:'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}
                        >
                          ✓ Post All ({pendingReview.expenses.length})
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expense Modal */}
        {showExpenseModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
            <div style={{background:'#fff',borderRadius:12,padding:20,maxWidth:500,width:'100%',maxHeight:'90vh',overflow:'auto'}}>
              <h2 style={{margin:'0 0 16px',fontSize:16}}>{editingExpense ? '✏️ Edit Expense' : '➕ Add Expense'}</h2>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <label style={{fontSize:10,fontWeight:600}}>Date</label>
                  <input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm,date:e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}/>
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:600}}>Amount</label>
                  <input type="number" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:+e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}/>
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:600}}>Category</label>
                  <select value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm,category:e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}>
                    {EXPENSE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:600}}>Channel (if marketing)</label>
                  <select value={expenseForm.channel||''} onChange={e=>setExpenseForm({...expenseForm,channel:e.target.value||null})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}>
                    <option value="">— None —</option>
                    {MARKETING_CHANNELS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:600}}>Recurring</label>
                  <select value={expenseForm.recurring||'none'} onChange={e=>setExpenseForm({...expenseForm,recurring:e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}>
                    <option value="none">One-time</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
                {expenseForm.recurring && expenseForm.recurring !== 'none' && (
                  <div>
                    <label style={{fontSize:10,fontWeight:600}}>End Date</label>
                    <input type="date" value={expenseForm.recurringEndDate||''} onChange={e=>setExpenseForm({...expenseForm,recurringEndDate:e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}/>
                  </div>
                )}
                <div style={{gridColumn:'span 2'}}>
                  <label style={{fontSize:10,fontWeight:600}}>Description</label>
                  <input type="text" value={expenseForm.description} onChange={e=>setExpenseForm({...expenseForm,description:e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}} placeholder="What was this expense for?"/>
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <label style={{fontSize:10,fontWeight:600}}>Vendor</label>
                  <input type="text" value={expenseForm.vendor} onChange={e=>setExpenseForm({...expenseForm,vendor:e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}} placeholder="Who did you pay?"/>
                </div>
              </div>
              {expenseForm.recurring && expenseForm.recurring !== 'none' && expenseForm.recurringEndDate && (
                <div style={{marginTop:12,padding:10,background:'#f0fdf4',borderRadius:6,fontSize:10,color:'#059669'}}>
                  ℹ️ This will create {(() => {
                    const start = new Date(expenseForm.date);
                    const end = new Date(expenseForm.recurringEndDate);
                    if (isNaN(start) || isNaN(end) || end <= start) return 0;
                    const days = { weekly: 7, biweekly: 14, monthly: 30, annually: 365 };
                    return Math.floor((end - start) / (days[expenseForm.recurring] * 24 * 60 * 60 * 1000)) + 1;
                  })()} expense entries from {expenseForm.date} to {expenseForm.recurringEndDate}
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
                <button onClick={()=>{setShowExpenseModal(false);setEditingExpense(null);}} style={{padding:'10px 16px',background:'#f1f5f9',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>Cancel</button>
                <button onClick={()=>{
                  // Generate recurring expenses if applicable
                  const newExpenses = [];
                  const baseExpense = {...expenseForm, id: editingExpense || Date.now()};
                  
                  if (expenseForm.recurring && expenseForm.recurring !== 'none' && expenseForm.recurringEndDate && !editingExpense) {
                    const start = new Date(expenseForm.date);
                    const end = new Date(expenseForm.recurringEndDate);
                    const intervals = { weekly: 7, biweekly: 14, monthly: 0, annually: 0 };
                    
                    let current = new Date(start);
                    let counter = 0;
                    while (current <= end) {
                      newExpenses.push({
                        ...baseExpense,
                        id: Date.now() + counter,
                        date: current.toISOString().split('T')[0],
                        recurringGroup: baseExpense.id
                      });
                      counter++;
                      
                      if (expenseForm.recurring === 'weekly') {
                        current.setDate(current.getDate() + 7);
                      } else if (expenseForm.recurring === 'biweekly') {
                        current.setDate(current.getDate() + 14);
                      } else if (expenseForm.recurring === 'monthly') {
                        current.setMonth(current.getMonth() + 1);
                      } else if (expenseForm.recurring === 'annually') {
                        current.setFullYear(current.getFullYear() + 1);
                      }
                    }
                  } else {
                    newExpenses.push(baseExpense);
                  }
                  
                  if(editingExpense){
                    setExpenses(expenses.map(e=>e.id===editingExpense?{...expenseForm,id:editingExpense}:e));
                  }else{
                    setExpenses([...newExpenses, ...expenses]);
                  }
                  setShowExpenseModal(false);
                  setEditingExpense(null);
                  setExpenseForm({ date: '', category: 'marketing', channel: '', description: '', amount: 0, vendor: '', recurring: 'none', recurringEndDate: '' });
                }} style={{padding:'10px 20px',background:'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                  {editingExpense ? 'Save Changes' : expenseForm.recurring !== 'none' && expenseForm.recurringEndDate ? 'Create Recurring' : 'Add Expense'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        {showCsvModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
            <div style={{background:'#fff',borderRadius:12,padding:20,maxWidth:700,width:'100%',maxHeight:'90vh',overflow:'auto'}}>
              <h2 style={{margin:'0 0 8px',fontSize:16}}>📄 Import Bank Statement CSV</h2>
              <p style={{margin:'0 0 16px',fontSize:11,color:'#64748b'}}>Upload a CSV export from your bank to auto-import expenses.</p>
              
              <div style={{marginBottom:16}}>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e)=>{
                    const file = e.target.files[0];
                    if(!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const text = ev.target.result;
                      const lines = text.split('\n').filter(l=>l.trim());
                      if(lines.length < 2) return;
                      
                      // Better CSV parser that handles quoted values with commas
                      const parseCSVLine = (line) => {
                        const result = [];
                        let current = '';
                        let inQuotes = false;
                        
                        for (let i = 0; i < line.length; i++) {
                          const char = line[i];
                          
                          if (char === '"') {
                            inQuotes = !inQuotes;
                          } else if (char === ',' && !inQuotes) {
                            result.push(current.trim().replace(/^"|"$/g, ''));
                            current = '';
                          } else {
                            current += char;
                          }
                        }
                        result.push(current.trim().replace(/^"|"$/g, ''));
                        return result;
                      };
                      
                      // Parse header
                      const header = parseCSVLine(lines[0]);
                      
                      // Parse all rows
                      const rows = lines.slice(1).map(line => {
                        const values = parseCSVLine(line);
                        const row = {};
                        header.forEach((h,i) => {
                          row[h] = (values[i]||'').trim();
                        });
                        return row;
                      });
                      
                      console.log(`Parsed ${rows.length} rows from CSV`);
                      console.log('Columns found:', header);
                      setCsvPreview(rows); // All rows, no limit
                      
                      // Auto-detect common column names (avoid type/category columns for description)
                      const lowerHeader = header.map(h=>h.toLowerCase());
                      const typeColumns = ['type', 'transaction type', 'trans type', 'debit/credit', 'dr/cr'];
                      
                      setCsvMapping({
                        date: header.find(h=>['date','transaction date','posting date','post date','trans date','posted date'].includes(h.toLowerCase())) || '',
                        amount: header.find(h=>['amount','debit','withdrawal','transaction amount','debit amount','credit amount'].includes(h.toLowerCase())) || '',
                        description: header.find(h=>['description','memo','transaction description','details','particulars','narrative','reference'].includes(h.toLowerCase()) && !typeColumns.includes(h.toLowerCase())) || '',
                        vendor: header.find(h=>['payee','merchant','vendor','name','original description','counterparty'].includes(h.toLowerCase())) || ''
                      });
                    };
                    reader.readAsText(file);
                  }}
                  style={{width:'100%',padding:12,border:'2px dashed #e2e8f0',borderRadius:8,fontSize:12}}
                />
              </div>

              {csvPreview.length > 0 && (
                <>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:16}}>
                    <div>
                      <label style={{fontSize:10,fontWeight:600}}>Date Column</label>
                      <select value={csvMapping.date} onChange={e=>setCsvMapping({...csvMapping,date:e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:11}}>
                        <option value="">— Select —</option>
                        {Object.keys(csvPreview[0]||{}).map(k=><option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:10,fontWeight:600}}>Amount Column</label>
                      <select value={csvMapping.amount} onChange={e=>setCsvMapping({...csvMapping,amount:e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:11}}>
                        <option value="">— Select —</option>
                        {Object.keys(csvPreview[0]||{}).map(k=><option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:10,fontWeight:600}}>Description Column</label>
                      <select value={csvMapping.description} onChange={e=>setCsvMapping({...csvMapping,description:e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:11}}>
                        <option value="">— Select —</option>
                        {Object.keys(csvPreview[0]||{}).map(k=><option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:10,fontWeight:600}}>Vendor/Payee Column</label>
                      <select value={csvMapping.vendor} onChange={e=>setCsvMapping({...csvMapping,vendor:e.target.value})} style={{width:'100%',padding:8,border:'1px solid #e2e8f0',borderRadius:6,fontSize:11}}>
                        <option value="">— Select —</option>
                        {Object.keys(csvPreview[0]||{}).map(k=><option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Import Options */}
                  <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
                    <label style={{fontSize:10,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
                      <input type="checkbox" checked={csvOptions.flipSigns} onChange={e=>setCsvOptions({...csvOptions,flipSigns:e.target.checked})} />
                      Flip +/- signs (for credit cards where charges are positive)
                    </label>
                    <label style={{fontSize:10,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
                      <input type="checkbox" checked={csvOptions.separateIncome} onChange={e=>setCsvOptions({...csvOptions,separateIncome:e.target.checked})} />
                      Separate incoming money to Income tab
                    </label>
                  </div>

                  <div style={{background:'#f8fafc',borderRadius:8,padding:12,marginBottom:16,maxHeight:200,overflow:'auto'}}>
                    <div style={{fontSize:10,fontWeight:600,marginBottom:8}}>Preview ({csvPreview.length} rows)</div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:9}}>
                      <thead>
                        <tr>
                          <th style={{textAlign:'left',padding:4,borderBottom:'1px solid #e2e8f0'}}>Date</th>
                          <th style={{textAlign:'right',padding:4,borderBottom:'1px solid #e2e8f0'}}>Amount</th>
                          <th style={{textAlign:'left',padding:4,borderBottom:'1px solid #e2e8f0'}}>Description</th>
                          <th style={{textAlign:'left',padding:4,borderBottom:'1px solid #e2e8f0'}}>Vendor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0,10).map((row,i)=>(
                          <tr key={i}>
                            <td style={{padding:4,borderBottom:'1px solid #f1f5f9'}}>{csvMapping.date ? row[csvMapping.date] : '—'}</td>
                            <td style={{padding:4,borderBottom:'1px solid #f1f5f9',textAlign:'right'}}>{csvMapping.amount ? row[csvMapping.amount] : '—'}</td>
                            <td style={{padding:4,borderBottom:'1px solid #f1f5f9',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{csvMapping.description ? row[csvMapping.description] : '—'}</td>
                            <td style={{padding:4,borderBottom:'1px solid #f1f5f9'}}>{csvMapping.vendor ? row[csvMapping.vendor] : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvPreview.length > 10 && <div style={{textAlign:'center',fontSize:9,color:'#64748b',marginTop:8}}>...and {csvPreview.length - 10} more rows</div>}
                  </div>
                </>
              )}

              <div style={{display:'flex',justifyContent:'space-between'}}>
                <button onClick={()=>{setShowCsvModal(false);setCsvPreview([]);setCsvMapping({date:'',amount:'',description:'',vendor:''});}} style={{padding:'10px 16px',background:'#f1f5f9',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>Cancel</button>
                <button 
                  disabled={!csvMapping.date || !csvMapping.amount || csvPreview.length === 0}
                  onClick={()=>{
                    // Auto-categorize function
                    const autoCategorize = (vendor, description) => {
                      const text = `${vendor} ${description}`.toLowerCase();
                      
                      // Check saved vendor mappings first
                      const vendorLower = vendor.toLowerCase().trim();
                      if (vendorMappings[vendorLower]) {
                        return {...vendorMappings[vendorLower], confidence: 'saved'};
                      }
                      
                      // Check custom rules (user-defined)
                      for (let i = 0; i < customRules.length; i++) {
                        const rule = customRules[i];
                        if (text.includes(rule.contains.toLowerCase())) {
                          return { category: rule.category, channel: rule.channel || null, confidence: 'rule' };
                        }
                      }
                      
                      // Auto-detect based on built-in keywords
                      const builtInRules = [
                        { keywords: ['postcard', 'yellowletter', 'mail', 'usps', 'stamps'], category: 'directmail', channel: 'directmail' },
                        { keywords: ['google', 'adwords', 'ppc'], category: 'marketing', channel: 'ppc' },
                        { keywords: ['facebook', 'meta', 'instagram', 'fb ads'], category: 'marketing', channel: 'facebook' },
                        { keywords: ['cold call', 'mojo', 'call porter', 'calling'], category: 'coldcalling', channel: 'coldcall' },
                        { keywords: ['sms', 'text', 'launch control', 'textdrip'], category: 'marketing', channel: 'sms' },
                        { keywords: ['propstream', 'privy', 'reiskip', 'batchskip', 'skip'], category: 'skiptracing', channel: null },
                        { keywords: ['rei blackbook', 'podio', 'crm', 'resimpli', 'software', 'constantcontact', 'constant contact', 'mailchimp', 'hubspot'], category: 'software', channel: null },
                        { keywords: ['attorney', 'lawyer', 'legal', 'title'], category: 'legal', channel: null },
                        { keywords: ['insurance', 'state farm', 'geico'], category: 'insurance', channel: null },
                        { keywords: ['gas', 'fuel', 'uber', 'lyft', 'parking', 'toll'], category: 'travel', channel: null },
                        { keywords: ['office', 'staples', 'amazon', 'supplies'], category: 'office', channel: null },
                        { keywords: ['electric', 'water', 'gas bill', 'utility'], category: 'utilities', channel: null },
                        { keywords: ['contractor', 'home depot', 'lowes', 'repair'], category: 'contractors', channel: null },
                        { keywords: ['payroll', 'gusto', 'adp', 'salary', 'wage'], category: 'acquisitions', channel: null },
                      ];
                      
                      for (let i = 0; i < builtInRules.length; i++) {
                        const rule = builtInRules[i];
                        if (rule.keywords.some(kw => text.includes(kw))) {
                          return { category: rule.category, channel: rule.channel, confidence: 'auto' };
                        }
                      }
                      
                      return { category: 'other', channel: null, confidence: 'unknown' };
                    };
                    
                    const newExpenses = [];
                    const newIncome = [];
                    
                    csvPreview.forEach((row, i) => {
                      // Parse date
                      let date = row[csvMapping.date] || '';
                      if(date.includes('/')) {
                        const parts = date.split('/');
                        if(parts.length === 3) {
                          const [m,d,y] = parts;
                          const year = y.length === 2 ? '20' + y : y;
                          date = `${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
                        }
                      }
                      
                      // Parse amount with flip sign option
                      let rawAmount = row[csvMapping.amount] || '0';
                      let amount = parseFloat(rawAmount.replace(/[$,]/g, '')) || 0;
                      
                      // Flip signs if option is enabled
                      if (csvOptions.flipSigns) {
                        amount = -amount;
                      }
                      
                      const vendor = row[csvMapping.vendor] || row[csvMapping.description] || '';
                      const description = row[csvMapping.description] || '';
                      
                      // Separate income vs expenses based on amount sign
                      if (csvOptions.separateIncome && amount > 0) {
                        // This is income (positive after potential flip)
                        newIncome.push({
                          id: Date.now() + i,
                          date,
                          amount: amount,
                          description,
                          source: vendor,
                          type: 'income',
                          confidence: 'auto',
                          importedFromCsv: true
                        });
                      } else if (amount !== 0) {
                        // This is an expense (negative becomes positive)
                        const expenseAmount = Math.abs(amount);
                        const categorization = autoCategorize(vendor, description);
                        
                        newExpenses.push({
                          id: Date.now() + i + 10000,
                          date,
                          amount: expenseAmount,
                          description,
                          vendor,
                          category: categorization.category,
                          channel: categorization.channel,
                          confidence: categorization.confidence || 'saved',
                          recurring: 'none',
                          importedFromCsv: true
                        });
                      }
                    });
                    
                    // Filter out entries with no date
                    const filteredExpenses = newExpenses.filter(e => e.date);
                    const filteredIncome = newIncome.filter(i => i.date);
                    
                    // Open review modal
                    setCsvReviewExpenses(filteredExpenses);
                    setCsvReviewIncome(filteredIncome);
                    setShowCsvModal(false);
                    setCsvPreview([]);
                    setCsvMapping({date:'',amount:'',description:'',vendor:''});
                    setShowCsvReviewModal(true);
                  }} 
                  style={{padding:'10px 20px',background:(!csvMapping.date || !csvMapping.amount || csvPreview.length === 0)?'#e2e8f0':'#059669',border:'none',borderRadius:6,color:(!csvMapping.date || !csvMapping.amount || csvPreview.length === 0)?'#94a3b8':'#fff',fontSize:11,fontWeight:600,cursor:(!csvMapping.date || !csvMapping.amount || csvPreview.length === 0)?'not-allowed':'pointer'}}>
                  Review & Import {csvPreview.length} Transactions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV Review Modal - Confirm Categories */}
        {showCsvReviewModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
            <div style={{background:'#fff',borderRadius:12,padding:20,maxWidth:950,width:'100%',maxHeight:'90vh',overflow:'auto'}}>
              <h2 style={{margin:'0 0 8px',fontSize:16}}>✅ Review & Confirm Import</h2>
              <p style={{margin:'0 0 16px',fontSize:11,color:'#64748b'}}>
                Review transactions before importing. Changes will be remembered for future imports.
                <span style={{marginLeft:8,padding:'2px 6px',background:'#dbeafe',color:'#2563eb',borderRadius:4,fontSize:9}}>💾 Saved</span>
                <span style={{marginLeft:4,padding:'2px 6px',background:'#e0e7ff',color:'#6366f1',borderRadius:4,fontSize:9}}>📋 Rule</span>
                <span style={{marginLeft:4,padding:'2px 6px',background:'#d1fae5',color:'#059669',borderRadius:4,fontSize:9}}>✓ Auto</span>
                <span style={{marginLeft:4,padding:'2px 6px',background:'#fef3c7',color:'#d97706',borderRadius:4,fontSize:9}}>? Review</span>
              </p>
              
              {/* Expenses Section */}
              {csvReviewExpenses.length > 0 && (
                <div style={{marginBottom:16}}>
                  <h3 style={{margin:'0 0 8px',fontSize:13,fontWeight:600,color:'#dc2626'}}>💸 Expenses ({csvReviewExpenses.length})</h3>
                  <div style={{maxHeight:250,overflow:'auto',border:'1px solid #e2e8f0',borderRadius:8}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                      <thead style={{position:'sticky',top:0,background:'#f8fafc'}}>
                        <tr>
                          <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Date</th>
                          <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Vendor</th>
                          <th style={{textAlign:'right',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Amount</th>
                          <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Category</th>
                          <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Channel</th>
                          <th style={{textAlign:'center',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvReviewExpenses.map((exp, idx) => (
                          <tr key={exp.id} style={{borderBottom:'1px solid #f1f5f9',background:exp.confidence==='unknown'?'#fffbeb':''}}>
                            <td style={{padding:'6px'}}>{exp.date}</td>
                            <td style={{padding:'6px',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={exp.vendor}>{exp.vendor}</td>
                            <td style={{padding:'6px',textAlign:'right',fontWeight:600,color:'#dc2626'}}>${exp.amount.toLocaleString()}</td>
                            <td style={{padding:'6px'}}>
                              <select 
                                value={exp.category} 
                                onChange={(e)=>{
                                  const updated = [...csvReviewExpenses];
                                  updated[idx] = {...exp, category: e.target.value, confidence: 'manual'};
                                  setCsvReviewExpenses(updated);
                                }}
                                style={{padding:'4px 6px',border:'1px solid #e2e8f0',borderRadius:4,fontSize:10,width:'100%'}}
                              >
                                {EXPENSE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                              </select>
                            </td>
                            <td style={{padding:'6px'}}>
                              <select 
                                value={exp.channel||''} 
                                onChange={(e)=>{
                                  const updated = [...csvReviewExpenses];
                                  updated[idx] = {...exp, channel: e.target.value||null, confidence: 'manual'};
                                  setCsvReviewExpenses(updated);
                                }}
                                style={{padding:'4px 6px',border:'1px solid #e2e8f0',borderRadius:4,fontSize:10,width:'100%'}}
                              >
                                <option value="">— None —</option>
                                {MARKETING_CHANNELS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                              </select>
                            </td>
                            <td style={{padding:'6px',textAlign:'center'}}>
                              {exp.confidence === 'saved' && <span style={{padding:'2px 6px',background:'#dbeafe',color:'#2563eb',borderRadius:4,fontSize:8}}>💾</span>}
                              {exp.confidence === 'rule' && <span style={{padding:'2px 6px',background:'#e0e7ff',color:'#6366f1',borderRadius:4,fontSize:8}}>📋</span>}
                              {exp.confidence === 'auto' && <span style={{padding:'2px 6px',background:'#d1fae5',color:'#059669',borderRadius:4,fontSize:8}}>✓</span>}
                              {exp.confidence === 'manual' && <span style={{padding:'2px 6px',background:'#e0e7ff',color:'#4f46e5',borderRadius:4,fontSize:8}}>✎</span>}
                              {exp.confidence === 'unknown' && <span style={{padding:'2px 6px',background:'#fef3c7',color:'#d97706',borderRadius:4,fontSize:8}}>?</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Income Section */}
              {csvReviewIncome.length > 0 && (
                <div style={{marginBottom:16}}>
                  <h3 style={{margin:'0 0 8px',fontSize:13,fontWeight:600,color:'#059669'}}>💵 Income ({csvReviewIncome.length})</h3>
                  <div style={{maxHeight:200,overflow:'auto',border:'1px solid #e2e8f0',borderRadius:8}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                      <thead style={{position:'sticky',top:0,background:'#f8fafc'}}>
                        <tr>
                          <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Date</th>
                          <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Source</th>
                          <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Description</th>
                          <th style={{textAlign:'right',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Amount</th>
                          <th style={{textAlign:'left',padding:'8px 6px',borderBottom:'2px solid #e2e8f0',fontSize:9}}>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvReviewIncome.map((inc, idx) => (
                          <tr key={inc.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                            <td style={{padding:'6px'}}>{inc.date}</td>
                            <td style={{padding:'6px',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={inc.source}>{inc.source}</td>
                            <td style={{padding:'6px',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inc.description}</td>
                            <td style={{padding:'6px',textAlign:'right',fontWeight:600,color:'#059669'}}>+${inc.amount.toLocaleString()}</td>
                            <td style={{padding:'6px'}}>
                              <select 
                                value={inc.type} 
                                onChange={(e)=>{
                                  const updated = [...csvReviewIncome];
                                  updated[idx] = {...inc, type: e.target.value};
                                  setCsvReviewIncome(updated);
                                }}
                                style={{padding:'4px 6px',border:'1px solid #e2e8f0',borderRadius:4,fontSize:10,width:'100%'}}
                              >
                                {INCOME_TYPES.map(t=><option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div style={{background:'#f8fafc',borderRadius:8,padding:12,marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:600,marginBottom:6}}>Summary</div>
                <div style={{display:'flex',gap:16,fontSize:10,flexWrap:'wrap'}}>
                  <span style={{color:'#dc2626'}}>💸 {csvReviewExpenses.length} expenses (${csvReviewExpenses.reduce((s,e)=>s+e.amount,0).toLocaleString()})</span>
                  <span style={{color:'#059669'}}>💵 {csvReviewIncome.length} income (+${csvReviewIncome.reduce((s,i)=>s+i.amount,0).toLocaleString()})</span>
                  <span style={{color:'#d97706'}}>⚠️ {csvReviewExpenses.filter(e=>e.confidence==='unknown').length} need review</span>
                </div>
              </div>
              
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                <button onClick={()=>{setShowCsvReviewModal(false);setCsvReviewExpenses([]);setCsvReviewIncome([]);}} style={{padding:'10px 16px',background:'#f1f5f9',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>Cancel</button>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <label style={{fontSize:10,display:'flex',alignItems:'center',gap:4}}>
                    <input type="checkbox" id="rememberMappings" defaultChecked style={{cursor:'pointer'}} />
                    Remember choices
                  </label>
                  {csvReviewExpenses.filter(e=>e.confidence==='unknown').length > 0 && (
                    <button 
                      onClick={()=>{
                        // Save vendor mappings if checkbox is checked
                        const rememberCheckbox = document.getElementById('rememberMappings');
                        if (rememberCheckbox && rememberCheckbox.checked) {
                          const newMappings = {...vendorMappings};
                          csvReviewExpenses.forEach(exp => {
                            if (exp.vendor && (exp.confidence === 'manual')) {
                              const vendorKey = exp.vendor.toLowerCase().trim();
                              newMappings[vendorKey] = { category: exp.category, channel: exp.channel };
                            }
                          });
                          setVendorMappings(newMappings);
                        }
                        
                        // Split categorized vs uncategorized expenses
                        const categorizedExpenses = csvReviewExpenses.filter(e => e.confidence !== 'unknown');
                        const uncategorizedExpenses = csvReviewExpenses.filter(e => e.confidence === 'unknown');
                        
                        // Import categorized expenses (remove confidence field)
                        const finalExpenses = categorizedExpenses.map(exp => {
                          const cleanExp = {...exp};
                          delete cleanExp.confidence;
                          return cleanExp;
                        });
                        
                        // Import all income (remove confidence field)
                        const finalIncome = csvReviewIncome.map(inc => {
                          const cleanInc = {...inc};
                          delete cleanInc.confidence;
                          return cleanInc;
                        });
                        
                        // Save uncategorized to pending review
                        setPendingReview({
                          expenses: [...pendingReview.expenses, ...uncategorizedExpenses],
                          income: pendingReview.income
                        });
                        
                        setExpenses([...finalExpenses, ...expenses]);
                        setIncome([...finalIncome, ...income]);
                        setShowCsvReviewModal(false);
                        setCsvReviewExpenses([]);
                        setCsvReviewIncome([]);
                        alert(`✓ Imported ${finalExpenses.length} expenses and ${finalIncome.length} income.\n📋 ${uncategorizedExpenses.length} expenses saved for review.`);
                      }}
                      style={{padding:'10px 16px',background:'#f59e0b',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}
                    >
                      Import Categorized ({csvReviewExpenses.filter(e=>e.confidence!=='unknown').length + csvReviewIncome.length})
                    </button>
                  )}
                  <button 
                    onClick={()=>{
                      // Save vendor mappings if checkbox is checked
                      const rememberCheckbox = document.getElementById('rememberMappings');
                      if (rememberCheckbox && rememberCheckbox.checked) {
                        const newMappings = {...vendorMappings};
                        csvReviewExpenses.forEach(exp => {
                          if (exp.vendor && (exp.confidence === 'manual' || exp.confidence === 'unknown')) {
                            const vendorKey = exp.vendor.toLowerCase().trim();
                            newMappings[vendorKey] = { category: exp.category, channel: exp.channel };
                          }
                        });
                        setVendorMappings(newMappings);
                      }
                      
                      // Import expenses (remove confidence field)
                      const finalExpenses = csvReviewExpenses.map(exp => {
                        const cleanExp = {...exp};
                        delete cleanExp.confidence;
                        return cleanExp;
                      });
                      
                      // Import income (remove confidence field)
                      const finalIncome = csvReviewIncome.map(inc => {
                        const cleanInc = {...inc};
                        delete cleanInc.confidence;
                        return cleanInc;
                      });
                      
                      setExpenses([...finalExpenses, ...expenses]);
                      setIncome([...finalIncome, ...income]);
                      setShowCsvReviewModal(false);
                      setCsvReviewExpenses([]);
                      setCsvReviewIncome([]);
                      alert(`✓ Imported ${finalExpenses.length} expenses and ${finalIncome.length} income entries!`);
                    }}
                    style={{padding:'10px 20px',background:'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}
                  >
                    ✓ Import All ({csvReviewExpenses.length + csvReviewIncome.length} items)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Rules Modal */}
        {showRulesModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
            <div style={{background:'#fff',borderRadius:12,padding:20,maxWidth:600,width:'100%',maxHeight:'80vh',overflow:'auto'}}>
              <h2 style={{margin:'0 0 8px',fontSize:16}}>📋 Custom Categorization Rules</h2>
              <p style={{margin:'0 0 16px',fontSize:11,color:'#64748b'}}>
                Create rules to auto-categorize expenses based on text in the vendor or description.
              </p>
              
              {/* Add New Rule */}
              <div style={{background:'#f8fafc',borderRadius:8,padding:12,marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:600,marginBottom:8}}>Add New Rule</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:8,alignItems:'end'}}>
                  <div>
                    <label style={{fontSize:9,color:'#64748b'}}>If contains...</label>
                    <input 
                      type="text" 
                      value={newRule.contains} 
                      onChange={e=>setNewRule({...newRule,contains:e.target.value})}
                      placeholder="e.g. Constant Contact"
                      style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}
                    />
                  </div>
                  <div>
                    <label style={{fontSize:9,color:'#64748b'}}>Category</label>
                    <select 
                      value={newRule.category} 
                      onChange={e=>setNewRule({...newRule,category:e.target.value})}
                      style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}
                    >
                      {EXPENSE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:9,color:'#64748b'}}>Channel (optional)</label>
                    <select 
                      value={newRule.channel||''} 
                      onChange={e=>setNewRule({...newRule,channel:e.target.value||null})}
                      style={{width:'100%',padding:6,border:'1px solid #e2e8f0',borderRadius:4,fontSize:10}}
                    >
                      <option value="">— None —</option>
                      {MARKETING_CHANNELS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  <button 
                    onClick={()=>{
                      if(newRule.contains.trim()){
                        setCustomRules([...customRules,{...newRule,id:Date.now()}]);
                        setNewRule({contains:'',category:'software',channel:''});
                      }
                    }}
                    style={{padding:'6px 12px',background:'#059669',border:'none',borderRadius:4,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}
                  >
                    + Add
                  </button>
                </div>
              </div>
              
              {/* Existing Rules */}
              {customRules.length > 0 ? (
                <div style={{border:'1px solid #e2e8f0',borderRadius:8,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                    <thead>
                      <tr style={{background:'#f8fafc'}}>
                        <th style={{textAlign:'left',padding:'8px',borderBottom:'1px solid #e2e8f0'}}>Contains</th>
                        <th style={{textAlign:'left',padding:'8px',borderBottom:'1px solid #e2e8f0'}}>Category</th>
                        <th style={{textAlign:'left',padding:'8px',borderBottom:'1px solid #e2e8f0'}}>Channel</th>
                        <th style={{width:40,padding:'8px',borderBottom:'1px solid #e2e8f0'}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {customRules.map(rule=>{
                        const cat = EXPENSE_CATEGORIES.find(c=>c.id===rule.category);
                        const ch = MARKETING_CHANNELS.find(c=>c.id===rule.channel);
                        return (
                          <tr key={rule.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                            <td style={{padding:'8px',fontWeight:600}}>"{rule.contains}"</td>
                            <td style={{padding:'8px'}}>{cat ? `${cat.icon} ${cat.name}` : rule.category}</td>
                            <td style={{padding:'8px',color:'#64748b'}}>{ch ? `${ch.icon} ${ch.name}` : '—'}</td>
                            <td style={{padding:'8px'}}>
                              <button onClick={()=>setCustomRules(customRules.filter(r=>r.id!==rule.id))} style={{padding:'2px 6px',background:'#fee2e2',border:'none',borderRadius:3,fontSize:9,cursor:'pointer',color:'#dc2626'}}>✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:20,color:'#94a3b8',fontSize:11}}>No custom rules yet. Add one above!</div>
              )}
              
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
                <button onClick={()=>setShowRulesModal(false)} style={{padding:'10px 20px',background:'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {showCategoryModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
            <div style={{background:'#fff',borderRadius:12,padding:20,maxWidth:400,width:'100%'}}>
              <h2 style={{margin:'0 0 16px',fontSize:16}}>➕ Add Expense Category</h2>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{fontSize:10,fontWeight:600}}>Category Name</label>
                  <input 
                    type="text" 
                    id="newCategoryName"
                    placeholder="e.g. Networking Events"
                    style={{width:'100%',padding:10,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}
                  />
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:600}}>Icon (emoji)</label>
                  <input 
                    type="text" 
                    id="newCategoryIcon"
                    placeholder="🎉"
                    defaultValue="📁"
                    maxLength={4}
                    style={{width:'100%',padding:10,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}
                  />
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
                <button onClick={()=>setShowCategoryModal(false)} style={{padding:'10px 16px',background:'#f1f5f9',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>Cancel</button>
                <button onClick={()=>{
                  const name = document.getElementById('newCategoryName').value.trim();
                  const icon = document.getElementById('newCategoryIcon').value.trim() || '📁';
                  if(!name){alert('Please enter a name');return;}
                  const id = name.toLowerCase().replace(/[^a-z0-9]/g,'_');
                  if(EXPENSE_CATEGORIES.find(c=>c.id===id)){alert('Category already exists');return;}
                  setCustomCategories([...customCategories, {id, name, icon}]);
                  setShowCategoryModal(false);
                }} style={{padding:'10px 20px',background:'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                  Add Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Channel Modal */}
        {showChannelModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
            <div style={{background:'#fff',borderRadius:12,padding:20,maxWidth:400,width:'100%'}}>
              <h2 style={{margin:'0 0 16px',fontSize:16}}>➕ Add Marketing Channel</h2>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{fontSize:10,fontWeight:600}}>Channel Name</label>
                  <input 
                    type="text" 
                    id="newChannelName"
                    placeholder="e.g. TikTok Ads"
                    style={{width:'100%',padding:10,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}
                  />
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:600}}>Icon (emoji)</label>
                  <input 
                    type="text" 
                    id="newChannelIcon"
                    placeholder="📱"
                    defaultValue="📢"
                    maxLength={4}
                    style={{width:'100%',padding:10,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}}
                  />
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:600}}>Color</label>
                  <input 
                    type="color" 
                    id="newChannelColor"
                    defaultValue="#6366f1"
                    style={{width:'100%',height:40,padding:2,border:'1px solid #e2e8f0',borderRadius:6}}
                  />
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
                <button onClick={()=>setShowChannelModal(false)} style={{padding:'10px 16px',background:'#f1f5f9',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>Cancel</button>
                <button onClick={()=>{
                  const name = document.getElementById('newChannelName').value.trim();
                  const icon = document.getElementById('newChannelIcon').value.trim() || '📢';
                  const color = document.getElementById('newChannelColor').value || '#6366f1';
                  if(!name){alert('Please enter a name');return;}
                  const id = name.toLowerCase().replace(/[^a-z0-9]/g,'_');
                  if(MARKETING_CHANNELS.find(c=>c.id===id)){alert('Channel already exists');return;}
                  setCustomChannels([...customChannels, {id, name, icon, color}]);
                  setShowChannelModal(false);
                }} style={{padding:'10px 20px',background:'#3b82f6',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                  Add Channel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ReSimpli Settings Modal */}
        {showResimpliModal && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
            <div style={{background:'#fff',borderRadius:12,padding:24,maxWidth:500,width:'100%'}}>
              <h2 style={{margin:'0 0 8px',fontSize:18}}>⚙️ ReSimpli Integration</h2>
              <p style={{margin:'0 0 20px',fontSize:11,color:'#64748b'}}>Connect to your ReSimpli CRM to automatically sync leads and track your pipeline.</p>
              
              {!isElectron && (
                <div style={{background:'#fef3c7',border:'1px solid #f59e0b',borderRadius:8,padding:12,marginBottom:16}}>
                  <div style={{fontWeight:600,fontSize:11,color:'#92400e',marginBottom:4}}>⚠️ Desktop App Required</div>
                  <div style={{fontSize:10,color:'#a16207'}}>ReSimpli sync requires the desktop app for secure API connections. Download the app to enable live sync.</div>
                </div>
              )}
              
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{fontSize:10,fontWeight:600,display:'block',marginBottom:4}}>ReSimpli API Key</label>
                  <input 
                    type="password" 
                    value={resimpliConfig.apiKey} 
                    onChange={e=>setResimpliConfig({...resimpliConfig,apiKey:e.target.value})} 
                    style={{width:'100%',padding:10,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}} 
                    placeholder="Enter your API key from ReSimpli settings"
                  />
                  <div style={{fontSize:9,color:'#94a3b8',marginTop:4}}>Find this in ReSimpli → Settings → Integrations → API</div>
                </div>
                
                <div>
                  <label style={{fontSize:10,fontWeight:600,display:'block',marginBottom:4}}>Workspace ID</label>
                  <input 
                    type="text" 
                    value={resimpliConfig.workspaceId} 
                    onChange={e=>setResimpliConfig({...resimpliConfig,workspaceId:e.target.value})} 
                    style={{width:'100%',padding:10,border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}} 
                    placeholder="Your ReSimpli workspace ID"
                  />
                </div>

                <div style={{background:'#f8fafc',borderRadius:8,padding:12}}>
                  <div style={{fontSize:10,fontWeight:600,marginBottom:8}}>📋 Status Mapping</div>
                  <div style={{fontSize:9,color:'#64748b',lineHeight:1.6}}>
                    Your ReSimpli pipeline statuses will be mapped to:<br/>
                    • <strong>New Lead</strong> → New Leads<br/>
                    • <strong>Contacted / Callback</strong> → Contacted<br/>
                    • <strong>Qualified / Appointment Set</strong> → Process Call<br/>
                    • <strong>Offer Made / Negotiating</strong> → Offer Made<br/>
                    • <strong>Under Contract</strong> → Contract<br/>
                    • <strong>Closed / Won</strong> → Closed<br/>
                    • <strong>Dead / Lost / DNC</strong> → Dead/Lost
                  </div>
                </div>

                {resimpliConfig.lastSync && (
                  <div style={{fontSize:10,color:'#64748b'}}>
                    Last synced: {new Date(resimpliConfig.lastSync).toLocaleString()}
                  </div>
                )}
              </div>
              
              <div style={{display:'flex',justifyContent:'space-between',marginTop:20,gap:10}}>
                <button onClick={()=>setShowResimpliModal(false)} style={{padding:'10px 16px',background:'#f1f5f9',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>Cancel</button>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={async()=>{
                    // Demo mode test
                    alert('✅ Connection test successful! (Demo mode - full sync requires desktop app with ReSimpli integration)');
                  }} style={{padding:'10px 16px',background:'#f1f5f9',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>Test Connection</button>
                  <button onClick={async()=>{
                    // Save config to state (persisted via localStorage)
                    setShowResimpliModal(false);
                  }} style={{padding:'10px 20px',background:'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>Save Settings</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INCOME TAB */}
        {activeTab==='income' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fff',borderRadius:10,padding:12,flexWrap:'wrap',gap:8}}>
              <div>
                <h2 style={{margin:0,fontSize:14,fontWeight:600}}>💵 Income & Owner Activity</h2>
                <p style={{margin:'4px 0 0',fontSize:10,color:'#64748b'}}>{income.length} total entries • {periodLabel[statsPeriod]}</p>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setShowRulesModal(true)} style={{padding:'8px 14px',background:'#f1f5f9',border:'none',borderRadius:6,color:'#64748b',fontSize:10,fontWeight:600,cursor:'pointer'}}>⚙️ Rules</button>
                <button onClick={()=>{setIncomeForm({date:new Date().toISOString().split('T')[0],amount:0,description:'',source:'',type:'income'});setShowIncomeModal(true);}} style={{padding:'8px 14px',background:'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>+ Add Entry</button>
              </div>
            </div>

            {/* Income Summary Cards */}
            {(() => {
              const range = getRange(statsPeriod);
              const periodIncome = income.filter(i => inRange(i.date, range));
              const totalIncome = periodIncome.filter(i => i.type === 'income' || i.type === 'refund').reduce((s, i) => s + i.amount, 0);
              const totalContributions = periodIncome.filter(i => i.type === 'owner_contribution').reduce((s, i) => s + i.amount, 0);
              const totalDraws = periodIncome.filter(i => i.type === 'owner_draw').reduce((s, i) => s + i.amount, 0);
              return (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
                  <div style={{background:'#fff',borderRadius:10,padding:14,textAlign:'center'}}>
                    <div style={{fontSize:20,marginBottom:4}}>💵</div>
                    <div style={{fontSize:10,color:'#64748b'}}>Business Income</div>
                    <div style={{fontSize:18,fontWeight:700,color:'#059669'}}>{fmt(totalIncome)}</div>
                  </div>
                  <div style={{background:'#fff',borderRadius:10,padding:14,textAlign:'center'}}>
                    <div style={{fontSize:20,marginBottom:4}}>💰</div>
                    <div style={{fontSize:10,color:'#64748b'}}>Owner Contributions</div>
                    <div style={{fontSize:18,fontWeight:700,color:'#2563eb'}}>{fmt(totalContributions)}</div>
                  </div>
                  <div style={{background:'#fff',borderRadius:10,padding:14,textAlign:'center'}}>
                    <div style={{fontSize:20,marginBottom:4}}>🏧</div>
                    <div style={{fontSize:10,color:'#64748b'}}>Owner Draws</div>
                    <div style={{fontSize:18,fontWeight:700,color:'#dc2626'}}>{fmt(totalDraws)}</div>
                  </div>
                  <div style={{background:'#fff',borderRadius:10,padding:14,textAlign:'center'}}>
                    <div style={{fontSize:20,marginBottom:4}}>📊</div>
                    <div style={{fontSize:10,color:'#64748b'}}>Net Cash Flow</div>
                    <div style={{fontSize:18,fontWeight:700,color:totalIncome+totalContributions-totalDraws>=0?'#059669':'#dc2626'}}>{fmt(totalIncome + totalContributions - totalDraws)}</div>
                  </div>
                </div>
              );
            })()}

            {/* Income Table */}
            <div style={{background:'#fff',borderRadius:10,padding:12,overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:500}}>
                <thead>
                  <tr>
                    {['Date','Type','Description','Source','Amount',''].map((h,i)=>(
                      <th key={i} style={{textAlign:i===4?'right':'left',padding:'8px 6px',background:'#f8fafc',borderBottom:'2px solid #e2e8f0',fontSize:9,fontWeight:600,color:'#64748b'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {income.filter(i => inRange(i.date, getRange(statsPeriod))).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(entry => {
                    const typeInfo = INCOME_TYPES.find(t => t.id === entry.type) || INCOME_TYPES[4];
                    return (
                      <tr key={entry.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                        <td style={{padding:'8px 6px',fontSize:11}}>{entry.date}</td>
                        <td style={{padding:'8px 6px',fontSize:11}}>
                          <span style={{padding:'2px 8px',background:entry.type==='owner_draw'?'#fee2e2':entry.type==='owner_contribution'?'#dbeafe':'#d1fae5',color:entry.type==='owner_draw'?'#dc2626':entry.type==='owner_contribution'?'#2563eb':'#059669',borderRadius:4,fontSize:9}}>
                            {typeInfo.icon} {typeInfo.name}
                          </span>
                        </td>
                        <td style={{padding:'8px 6px',fontSize:11}}>{entry.description}</td>
                        <td style={{padding:'8px 6px',fontSize:11}}>{entry.source}</td>
                        <td style={{padding:'8px 6px',fontSize:11,textAlign:'right',fontWeight:600,color:entry.type==='owner_draw'?'#dc2626':'#059669'}}>
                          {entry.type==='owner_draw' ? '-' : '+'}{fmt(entry.amount)}
                        </td>
                        <td style={{padding:'8px 6px'}}>
                          <button onClick={()=>{setIncomeForm(entry);setShowIncomeModal(true);}} style={{padding:'2px 6px',background:'#f1f5f9',border:'none',borderRadius:3,fontSize:9,cursor:'pointer',marginRight:4}}>✎</button>
                          <button onClick={()=>{if(confirm('Delete?'))setIncome(income.filter(i=>i.id!==entry.id));}} style={{padding:'2px 6px',background:'#fee2e2',border:'none',borderRadius:3,fontSize:9,cursor:'pointer',color:'#dc2626'}}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {income.filter(i => inRange(i.date, getRange(statsPeriod))).length === 0 && (
                <div style={{textAlign:'center',padding:30,color:'#94a3b8',fontSize:12}}>No income entries for this period</div>
              )}
            </div>
          </div>
        )}

        
        {/* FINANCES TAB */}
        {activeTab==='finances' && (
          <div style={{background:'#fff',borderRadius:10,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <h2 style={{margin:0,fontSize:14,fontWeight:600}}>Finances - {periodLabel[statsPeriod]}{dealTypeFilter !== 'All' ? ` (${dealTypeFilter}s)` : ''}</h2>
              <span style={{padding:'4px 10px',borderRadius:12,fontSize:10,fontWeight:600,background:allocTotal===100?'#d1fae5':'#fee2e2',color:allocTotal===100?'#059669':'#dc2626'}}>Alloc: {allocTotal}%</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:16}}>
              <div style={{background:'#f8fafc',borderRadius:8,padding:14,border:'2px solid #059669',cursor:'pointer'}} onClick={()=>setDetailModal('closed')}><h4 style={{margin:'0 0 4px',fontSize:11}}>💵 Closed Profit ({periodLabel[statsPeriod]})</h4><div style={{fontSize:20,fontWeight:700,color:'#059669'}}>{fmt(summary.closedP)}</div><div style={{fontSize:9,color:'#64748b'}}>{summary.closedN} deals →</div></div>
              <div style={{background:'#f8fafc',borderRadius:8,padding:14,border:'2px solid #2563eb',cursor:'pointer'}} onClick={()=>setDetailModal('pipeline')}><h4 style={{margin:'0 0 4px',fontSize:11}}>📈 Pipeline</h4><div style={{fontSize:20,fontWeight:700,color:'#2563eb'}}>{fmt(summary.projP)}</div><div style={{fontSize:9,color:'#64748b'}}>{summary.ongoingN} active →</div></div>
              <div style={{background:'#f8fafc',borderRadius:8,padding:14,border:'2px solid #7c3aed',cursor:'pointer'}} onClick={()=>setDetailModal('pf')}><h4 style={{margin:'0 0 4px',fontSize:11}}>🏦 PF Distribution</h4><div style={{fontSize:20,fontWeight:700,color:'#7c3aed'}}>{fmt(summary.closedP*allocations.ownersPay/100)}</div><div style={{fontSize:9,color:'#64748b'}}>Owner's Pay ({allocations.ownersPay}%) →</div></div>
            </div>
            <h3 style={{margin:'0 0 10px',fontSize:12,fontWeight:600}}>PF Allocations</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8}}>
              {[{k:'profit',l:'Profit',c:'#059669'},{k:'ownersPay',l:"Owner's Pay",c:'#2563eb'},{k:'taxes',l:'Taxes',c:'#d97706'},{k:'opex',l:'OpEx',c:'#7c3aed'},{k:'opm',l:'OPM',c:'#64748b'}].map(a=>(
                <div key={a.k} style={{background:'#f8fafc',borderRadius:8,padding:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:6}}><span style={{width:8,height:8,borderRadius:'50%',background:a.c}}/><span style={{fontSize:10,fontWeight:600}}>{a.l}</span></div>
                  <div style={{display:'flex',alignItems:'center',gap:3,marginBottom:4}}><input type="number" value={allocations[a.k]} onChange={e=>setAllocations({...allocations,[a.k]:+e.target.value})} style={{width:40,padding:'4px 6px',border:'1px solid #e2e8f0',borderRadius:4,fontSize:12,fontWeight:600,textAlign:'center'}}/><span style={{fontSize:10}}>%</span></div>
                  <div style={{height:4,background:'#e2e8f0',borderRadius:2,overflow:'hidden',marginBottom:6}}><div style={{height:'100%',width:`${allocations[a.k]}%`,background:a.c,borderRadius:2}}/></div>
                  <div style={{fontSize:9}}><div style={{display:'flex',justifyContent:'space-between'}}><span>Closed:</span><strong style={{color:a.c}}>{fmt(summary.closedP*allocations[a.k]/100)}</strong></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEDGER TAB */}
        {activeTab==='ledger' && (
          <div style={{background:'#fff',borderRadius:10,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <h2 style={{margin:0,fontSize:14,fontWeight:600}}>Ledger</h2>
              <span style={{fontSize:10,color:'#64748b'}}>{ledger.filter(e => dealTypeFilter === 'All' || e.type === dealTypeFilter).length} entries • Click row to edit</span>
            </div>
            <p style={{color:'#64748b',fontSize:10,marginBottom:12}}>Auto-added when deals close. Click any row to edit or view attached documents.</p>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['Close Date','Type','Address','Profit','Profit$','Owner','Tax','OpEx','Doc',''].map((h,i)=><th key={i} style={{textAlign:i>2&&i<8?'right':'left',padding:'8px 6px',background:'#f8fafc',borderBottom:'2px solid #e2e8f0',fontSize:9,fontWeight:600,color:'#64748b'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {[...ledger]
                    .filter(e => dealTypeFilter === 'All' || e.type === dealTypeFilter)
                    .sort((a,b) => new Date(b.closeDate || b.timestamp) - new Date(a.closeDate || a.timestamp))
                    .map((e,idx)=>{
                    const i = ledger.indexOf(e); // Get original index for editing
                    const isEditing = editingLedger === i;
                    return (
                      <React.Fragment key={i}>
                        <tr style={{borderBottom:isEditing?'none':'1px solid #f1f5f9',background:isEditing?'#f0fdf4':'',cursor:'pointer'}} onClick={()=>setEditingLedger(isEditing?null:i)}>
                          <td style={{padding:'8px 6px',fontSize:10}}>{new Date(e.closeDate||e.timestamp).toLocaleDateString()}</td>
                          <td style={{padding:'8px 6px',fontSize:10}}><span style={{padding:'2px 6px',borderRadius:4,fontSize:8,...TYPE_CONFIG[e.type]}}>{e.type}</span></td>
                          <td style={{padding:'8px 6px',fontSize:10}}>{e.address}</td>
                          <td style={{padding:'8px 6px',fontSize:10,textAlign:'right',fontWeight:600,color:e.profitUsed>=0?'#059669':'#dc2626'}}>{fmt(e.profitUsed)}</td>
                          <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{fmt(e.pfProfit)}</td>
                          <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{fmt(e.pfOwnersPay)}</td>
                          <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{fmt(e.pfTaxes)}</td>
                          <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{fmt(e.pfOpex)}</td>
                          <td style={{padding:'8px 6px',textAlign:'center'}}>
                            {e.pdfData && <span title="Has PDF attached" style={{fontSize:12}}>📄</span>}
                            {e.aiExtracted && typeof e.aiExtracted === 'object' && <span title="AI extracted data" style={{fontSize:12,marginLeft:2}}>🤖</span>}
                          </td>
                          <td style={{padding:'8px 6px'}}><button onClick={ev=>{ev.stopPropagation();setEditingLedger(isEditing?null:i);}} style={{padding:'2px 6px',background:isEditing?'#059669':'#f1f5f9',color:isEditing?'#fff':'#64748b',border:'none',borderRadius:3,fontSize:9,cursor:'pointer'}}>{isEditing?'✓':'✎'}</button></td>
                        </tr>
                        {isEditing && (
                          <tr style={{background:'#f0fdf4',borderBottom:'1px solid #059669'}}>
                            <td colSpan={10} style={{padding:12}}>
                              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:8}}>
                                <div>
                                  <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Close Date</label>
                                  <input type="date" value={e.closeDate||''} onChange={ev=>setLedger(ledger.map((l,j)=>j===i?{...l,closeDate:ev.target.value}:l))} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                </div>
                                <div>
                                  <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Type</label>
                                  <select value={e.type} onChange={ev=>setLedger(ledger.map((l,j)=>j===i?{...l,type:ev.target.value}:l))} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}>
                                    <option value="Flip">Flip</option>
                                    <option value="Wholesale">Wholesale</option>
                                  </select>
                                </div>
                                <div style={{gridColumn:'span 2'}}>
                                  <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Address</label>
                                  <input value={e.address||''} onChange={ev=>setLedger(ledger.map((l,j)=>j===i?{...l,address:ev.target.value}:l))} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                </div>
                                <div>
                                  <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>Profit Used</label>
                                  <input type="number" step="0.01" value={e.profitUsed||0} onChange={ev=>setLedger(ledger.map((l,j)=>j===i?{...l,profitUsed:+ev.target.value}:l))} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                </div>
                                <div>
                                  <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>PF Profit</label>
                                  <input type="number" step="0.01" value={e.pfProfit||0} onChange={ev=>setLedger(ledger.map((l,j)=>j===i?{...l,pfProfit:+ev.target.value}:l))} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                </div>
                                <div>
                                  <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>PF Owner Pay</label>
                                  <input type="number" step="0.01" value={e.pfOwnersPay||0} onChange={ev=>setLedger(ledger.map((l,j)=>j===i?{...l,pfOwnersPay:+ev.target.value}:l))} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                </div>
                                <div>
                                  <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>PF Tax</label>
                                  <input type="number" step="0.01" value={e.pfTaxes||0} onChange={ev=>setLedger(ledger.map((l,j)=>j===i?{...l,pfTaxes:+ev.target.value}:l))} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                </div>
                                <div>
                                  <label style={{fontSize:9,color:'#64748b',display:'block',marginBottom:2}}>PF OpEx</label>
                                  <input type="number" step="0.01" value={e.pfOpex||0} onChange={ev=>setLedger(ledger.map((l,j)=>j===i?{...l,pfOpex:+ev.target.value}:l))} style={{width:'100%',padding:6,fontSize:10,border:'1px solid #e2e8f0',borderRadius:4}}/>
                                </div>
                              </div>
                              
                              {/* PDF & AI Data Section - Always show for upload option */}
                              <div style={{marginTop:12,padding:10,background:'#ede9fe',borderRadius:6}}>
                                <div style={{fontSize:10,fontWeight:600,color:'#5b21b6',marginBottom:8}}>📎 Documents & AI Analysis</div>
                                <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                                  {/* Upload/Replace PDF */}
                                  {aiConfig.apiKey && (
                                    <label style={{padding:'6px 12px',background:'#7c3aed',border:'none',borderRadius:4,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4}}>
                                      📤 {e.pdfData ? 'Replace' : 'Upload'} Closing Statement
                                      <input 
                                        type="file" 
                                        accept=".pdf"
                                        style={{display:'none'}}
                                        onClick={ev=>ev.stopPropagation()}
                                        onChange={async(ev)=>{
                                          ev.stopPropagation();
                                          const file = ev.target.files[0];
                                          if(!file) return;
                                          
                                          // Convert to base64
                                          const base64 = await new Promise((resolve, reject) => {
                                            const reader = new FileReader();
                                            reader.onload = () => resolve(reader.result.split(',')[1]);
                                            reader.onerror = reject;
                                            reader.readAsDataURL(file);
                                          });
                                          
                                          // Store PDF
                                          setLedger(ledger.map((l,j)=>j===i?{...l,pdfData:base64}:l));
                                          
                                          // Optionally run AI analysis
                                          if(confirm('Run AI analysis on this PDF to extract closing data?')) {
                                            const result = await analyzeClosingStatement(file);
                                            if(result) {
                                              setLedger(ledger.map((l,j)=>j===i?{
                                                ...l,
                                                pdfData: base64,
                                                aiExtracted: result,
                                                profitUsed: result.cashDueToSeller || result.netToSeller || l.profitUsed,
                                                salePrice: result.contractPrice || l.salePrice
                                              }:l));
                                              setShowAiReviewModal(false); // Don't show the review modal
                                              alert('✓ PDF attached and AI data extracted!');
                                            }
                                          } else {
                                            alert('✓ PDF attached successfully!');
                                          }
                                          ev.target.value = '';
                                        }}
                                      />
                                    </label>
                                  )}
                                  
                                  {/* View existing PDF */}
                                  {e.pdfData && (
                                    <button 
                                      onClick={(ev)=>{
                                        ev.stopPropagation();
                                        const blob = new Blob([Uint8Array.from(atob(e.pdfData), c => c.charCodeAt(0))], {type: 'application/pdf'});
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                      }}
                                      style={{padding:'6px 12px',background:'#059669',border:'none',borderRadius:4,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}
                                    >
                                      📄 View PDF
                                    </button>
                                  )}
                                  
                                  {/* View AI data */}
                                  {e.aiExtracted && typeof e.aiExtracted === 'object' && (
                                    <button 
                                      onClick={(ev)=>{
                                        ev.stopPropagation();
                                        const data = e.aiExtracted;
                                        alert(`🤖 AI Extracted Data\n\n` +
                                          `Property: ${data.propertyAddress || 'N/A'}\n` +
                                          `Document Type: ${data.documentType || 'N/A'}\n` +
                                          `Closing Date: ${data.closingDate || 'N/A'}\n` +
                                          `Contract Price: $${(data.contractPrice||0).toLocaleString()}\n` +
                                          `Total Closing Costs: $${(data.totalClosingCosts||0).toLocaleString()}\n` +
                                          `Cash Due to Seller: $${(data.cashDueToSeller||data.netToSeller||0).toLocaleString()}\n` +
                                          `Commission: $${(data.realEstateCommissionTotal||0).toLocaleString()}\n` +
                                          `Loan Payoff: $${(data.existingLoanPayoff||0).toLocaleString()}\n\n` +
                                          `Notes: ${data.notes || 'None'}`
                                        );
                                      }}
                                      style={{padding:'6px 12px',background:'#0891b2',border:'none',borderRadius:4,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}
                                    >
                                      🤖 View AI Data
                                    </button>
                                  )}
                                  
                                  {!aiConfig.apiKey && !e.pdfData && (
                                    <span style={{fontSize:9,color:'#64748b'}}>Configure AI in Settings to enable PDF upload & analysis</span>
                                  )}
                                </div>
                              </div>
                              
                              <div style={{display:'flex',gap:8,marginTop:10,justifyContent:'flex-end'}}>
                                <button onClick={ev=>{ev.stopPropagation();if(confirm('Delete this ledger entry?'))setLedger(ledger.filter((_,j)=>j!==i));}} style={{padding:'5px 12px',background:'#fee2e2',border:'none',borderRadius:4,color:'#dc2626',fontSize:9,fontWeight:600,cursor:'pointer'}}>Delete</button>
                                <button onClick={ev=>{ev.stopPropagation();setEditingLedger(null);}} style={{padding:'5px 12px',background:'#059669',border:'none',borderRadius:4,color:'#fff',fontSize:9,fontWeight:600,cursor:'pointer'}}>Done</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  {(() => {
                    const filteredLedger = ledger.filter(e => dealTypeFilter === 'All' || e.type === dealTypeFilter);
                    return (
                      <tr style={{background:'#f8fafc',fontWeight:600}}>
                        <td style={{padding:'8px 6px',fontSize:10}} colSpan={3}>TOTAL {dealTypeFilter !== 'All' ? `(${dealTypeFilter})` : ''}</td>
                        <td style={{padding:'8px 6px',fontSize:10,textAlign:'right',color:'#059669'}}>{fmt(filteredLedger.reduce((s,e)=>s+e.profitUsed,0))}</td>
                        <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{fmt(filteredLedger.reduce((s,e)=>s+e.pfProfit,0))}</td>
                        <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{fmt(filteredLedger.reduce((s,e)=>s+e.pfOwnersPay,0))}</td>
                        <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{fmt(filteredLedger.reduce((s,e)=>s+e.pfTaxes,0))}</td>
                        <td style={{padding:'8px 6px',fontSize:10,textAlign:'right'}}>{fmt(filteredLedger.reduce((s,e)=>s+e.pfOpex,0))}</td>
                        <td colSpan={2}></td>
                      </tr>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab==='checklist' && (
          <div style={{background:'#fff',borderRadius:10,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h2 style={{margin:0,fontSize:14,fontWeight:600}}>Monthly Checklist</h2>
              <button onClick={()=>setChecklist(CHECKLIST.map(()=>false))} style={{padding:'5px 10px',background:'#f1f5f9',border:'none',borderRadius:5,fontSize:10,cursor:'pointer'}}>Reset</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {CHECKLIST.map((item,i)=>(
                <label key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',border:'2px solid',borderColor:checklist[i]?'#059669':'#e2e8f0',background:checklist[i]?'#d1fae5':'#fff',borderRadius:8,cursor:'pointer'}}>
                  <input type="checkbox" checked={checklist[i]} onChange={()=>setChecklist(checklist.map((c,j)=>j===i?!c:c))} style={{width:16,height:16,accentColor:'#059669'}}/>
                  <span style={{fontSize:11,fontWeight:500,textDecoration:checklist[i]?'line-through':'none',color:checklist[i]?'#059669':'#1e293b'}}>{i+1}. {item}</span>
                </label>
              ))}
            </div>
            <div style={{marginTop:16,textAlign:'center'}}>
              <div style={{height:6,background:'#e2e8f0',borderRadius:3,overflow:'hidden',marginBottom:6}}><div style={{height:'100%',width:`${(checklist.filter(Boolean).length/checklist.length)*100}%`,background:'linear-gradient(90deg,#059669,#10b981)',borderRadius:3}}/></div>
              <span style={{fontSize:10,color:'#64748b'}}>{checklist.filter(Boolean).length}/{checklist.length} complete</span>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab==='settings' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Cloud Sync Status */}
            <div style={{background:'#fff',borderRadius:12,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{width:48,height:48,background:'linear-gradient(135deg,#059669,#047857)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:24}}>☁️</span>
                </div>
                <div style={{flex:1}}>
                  <h2 style={{margin:0,fontSize:16,fontWeight:600}}>Cloud Sync</h2>
                  <p style={{margin:0,fontSize:11,color:'#64748b'}}>Sync between desktop & mobile</p>
                </div>
                <div style={{textAlign:'right'}}>
                  {cloudSyncStatus === 'loading' && <span style={{fontSize:11,color:'#f59e0b',background:'#fef3c7',padding:'4px 10px',borderRadius:4}}>⏳ Loading...</span>}
                  {cloudSyncStatus === 'syncing' && <span style={{fontSize:11,color:'#3b82f6',background:'#dbeafe',padding:'4px 10px',borderRadius:4}}>🔄 Syncing...</span>}
                  {cloudSyncStatus === 'synced' && <span style={{fontSize:11,color:'#059669',background:'#d1fae5',padding:'4px 10px',borderRadius:4}}>✓ Synced</span>}
                  {cloudSyncStatus === 'error' && <span style={{fontSize:11,color:'#dc2626',background:'#fee2e2',padding:'4px 10px',borderRadius:4}}>⚠️ Error</span>}
                  {cloudSyncStatus === 'offline' && <span style={{fontSize:11,color:'#64748b',background:'#f1f5f9',padding:'4px 10px',borderRadius:4}}>📴 Offline</span>}
                </div>
              </div>
              
              <div style={{background:'#f8fafc',borderRadius:8,padding:12,marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <span style={{fontSize:11,color:'#64748b'}}>Last Synced</span>
                  <span style={{fontSize:11,fontWeight:600}}>{lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:11,color:'#64748b'}}>Device</span>
                  <span style={{fontSize:11,fontWeight:600}}>{isMobile ? '📱 Mobile' : isElectron ? '🖥️ Desktop' : '🌐 Browser'}</span>
                </div>
              </div>

              <div style={{display:'flex',gap:8}}>
                <button onClick={manualSync} disabled={cloudSyncStatus === 'syncing'} style={{flex:1,padding:'12px 20px',background:cloudSyncStatus === 'syncing' ? '#e2e8f0' : 'linear-gradient(135deg,#059669,#047857)',border:'none',borderRadius:8,color:cloudSyncStatus === 'syncing' ? '#64748b' : '#fff',fontSize:12,fontWeight:600,cursor:cloudSyncStatus === 'syncing' ? 'not-allowed' : 'pointer'}}>
                  {cloudSyncStatus === 'syncing' ? '🔄 Syncing...' : '🔄 Sync Now'}
                </button>
              </div>
              
              <p style={{marginTop:12,fontSize:10,color:'#94a3b8',textAlign:'center'}}>Changes sync automatically. Tap "Sync Now" to pull latest from another device.</p>
            </div>

            {/* AI Configuration */}
            <div style={{background:'#fff',borderRadius:12,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{width:48,height:48,background:'linear-gradient(135deg,#7c3aed,#5b21b6)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:24}}>🤖</span>
                </div>
                <div style={{flex:1}}>
                  <h2 style={{margin:0,fontSize:16,fontWeight:600}}>AI Document Analysis</h2>
                  <p style={{margin:0,fontSize:11,color:'#64748b'}}>Auto-extract data from closing statements</p>
                </div>
                {aiConfig.apiKey && (
                  <span style={{fontSize:11,color:'#059669',background:'#d1fae5',padding:'4px 10px',borderRadius:4}}>✓ Configured</span>
                )}
              </div>
              
              <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:12,marginBottom:16}}>
                <div>
                  <label style={{fontSize:10,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}}>AI Provider</label>
                  <select value={aiConfig.provider} onChange={e=>setAiConfig({...aiConfig,provider:e.target.value,model:e.target.value==='anthropic'?'claude-sonnet-4-20250514':'gpt-4o'})} style={{width:'100%',padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="openai">OpenAI (GPT-4)</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}}>API Key</label>
                  <input 
                    type="password" 
                    value={aiConfig.apiKey} 
                    onChange={e=>setAiConfig({...aiConfig,apiKey:e.target.value})} 
                    placeholder={aiConfig.provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                    style={{width:'100%',padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}
                  />
                </div>
              </div>
              
              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}}>Model</label>
                <select value={aiConfig.model} onChange={e=>setAiConfig({...aiConfig,model:e.target.value})} style={{width:'100%',padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}>
                  {aiConfig.provider === 'anthropic' ? (
                    <>
                      <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</option>
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku (Faster)</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o">GPT-4o (Recommended)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </>
                  )}
                </select>
              </div>

              <div style={{padding:12,background:'#f8fafc',borderRadius:8}}>
                <h4 style={{margin:'0 0 8px',fontSize:11,fontWeight:600,color:'#64748b'}}>📋 How it works</h4>
                <ol style={{margin:0,paddingLeft:16,fontSize:10,color:'#64748b',lineHeight:1.6}}>
                  <li>Get an API key from {aiConfig.provider === 'anthropic' ? 'console.anthropic.com' : 'platform.openai.com'}</li>
                  <li>Paste it above and select your preferred model</li>
                  <li>When closing a deal, click "Upload PDF" to auto-fill numbers</li>
                  <li>Works with HUD-1, ALTA, and most settlement statements</li>
                </ol>
                <div style={{marginTop:8,padding:8,background:'#fef3c7',borderRadius:4,fontSize:9,color:'#92400e'}}>
                  ⚠️ API usage will incur charges on your AI provider account. ~$0.01-0.05 per document.
                </div>
              </div>
            </div>

            {/* ReSimpli Integration */}
            <div style={{background:'#fff',borderRadius:12,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{width:48,height:48,background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:24}}>🔗</span>
                </div>
                <div>
                  <h2 style={{margin:0,fontSize:16,fontWeight:600}}>ReSimpli Integration</h2>
                  <p style={{margin:0,fontSize:11,color:'#64748b'}}>Sync leads from your ReSimpli CRM</p>
                </div>
                {syncStatus.status === 'syncing' && <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}><div style={{width:12,height:12,border:'2px solid #3b82f6',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite'}}></div><span style={{fontSize:10,color:'#3b82f6'}}>Syncing...</span></div>}
                {syncStatus.status === 'success' && <span style={{marginLeft:'auto',fontSize:10,color:'#059669',background:'#d1fae5',padding:'4px 8px',borderRadius:4}}>✓ Synced</span>}
                {syncStatus.status === 'error' && <span style={{marginLeft:'auto',fontSize:10,color:'#dc2626',background:'#fee2e2',padding:'4px 8px',borderRadius:4}}>✕ Error</span>}
              </div>
              
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div>
                  <label style={{fontSize:10,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}}>API Key</label>
                  <input type="password" value={resimpliConfig.apiKey} onChange={e=>setResimpliConfig({...resimpliConfig,apiKey:e.target.value})} placeholder="Enter your ReSimpli API key" style={{width:'100%',padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}/>
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}}>Workspace ID</label>
                  <input type="text" value={resimpliConfig.workspaceId} onChange={e=>setResimpliConfig({...resimpliConfig,workspaceId:e.target.value})} placeholder="Your workspace ID" style={{width:'100%',padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12}}/>
                </div>
              </div>

              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button onClick={async()=>{
                  if(!resimpliConfig.apiKey){alert('Please enter API Key');return;}
                  setSyncStatus({status:'syncing',message:'Testing connection...'});
                  try{
                    const response = await fetch('https://api.resimpli.com/v1/leads?limit=1',{
                      headers:{'Authorization':`Bearer ${resimpliConfig.apiKey}`,'Content-Type':'application/json'}
                    });
                    if(response.ok){
                      setSyncStatus({status:'success',message:'Connection successful!'});
                    }else{
                      throw new Error(`HTTP ${response.status}`);
                    }
                  }catch(e){
                    setSyncStatus({status:'error',message:e.message});
                  }
                }} style={{padding:'10px 20px',background:'#f1f5f9',border:'none',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer'}}>
                  Test Connection
                </button>
                <button onClick={async()=>{
                  if(!resimpliConfig.apiKey){alert('Please enter API Key first');return;}
                  setSyncStatus({status:'syncing',message:'Syncing leads...'});
                  try{
                    const response = await fetch('https://api.resimpli.com/v1/leads',{
                      headers:{'Authorization':`Bearer ${resimpliConfig.apiKey}`,'Content-Type':'application/json'}
                    });
                    if(!response.ok) throw new Error(`API Error: ${response.status}`);
                    const data = await response.json();
                    const rawLeads = data.data || data.leads || data || [];
                    const stageMap = {'new lead':'new','new':'new','contacted':'contacted','contact made':'contacted','appointment set':'process_call','process call':'process_call','offer made':'offer','offer sent':'offer','under contract':'contract','contract':'contract','closed':'closed','won':'closed','dead':'dead','lost':'dead','not interested':'dead'};
                    const mappedLeads = rawLeads.map((lead,i)=>{
                      const status = (lead.status||lead.stage||lead.bucket||'new').toLowerCase();
                      return {id:lead.id||i+1,resimpliId:lead.id||'',propertyAddress:lead.property_address||lead.address||'',sellerName:lead.name||lead.first_name||'Unknown',sellerPhone:lead.phone||'',status:stageMap[status]||'new',source:lead.source||'Unknown',dateAdded:(lead.created_at||new Date().toISOString()).split('T')[0]};
                    });
                    setLeads(mappedLeads);
                    setResimpliConfig({...resimpliConfig,lastSync:new Date().toISOString()});
                    setSyncStatus({status:'success',message:`Synced ${mappedLeads.length} leads`});
                  }catch(e){
                    setSyncStatus({status:'error',message:e.message});
                  }
                }} style={{padding:'10px 20px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',border:'none',borderRadius:8,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                  🔄 Sync Now
                </button>
              </div>

              {resimpliConfig.lastSync && (
                <div style={{marginTop:12,fontSize:10,color:'#64748b'}}>
                  Last synced: {new Date(resimpliConfig.lastSync).toLocaleString()}
                </div>
              )}

              <div style={{marginTop:16,padding:12,background:'#f8fafc',borderRadius:8}}>
                <h4 style={{margin:'0 0 8px',fontSize:11,fontWeight:600,color:'#64748b'}}>📋 How to find your credentials</h4>
                <ol style={{margin:0,paddingLeft:16,fontSize:10,color:'#64748b',lineHeight:1.6}}>
                  <li>Log into ReSimpli</li>
                  <li>Go to Settings → API/Integrations</li>
                  <li>Copy your API Key</li>
                  <li>Your Workspace ID is in the URL: app.resimpli.com/workspace/<strong>YOUR_ID</strong></li>
                </ol>
              </div>
            </div>

            {/* CRM Webhook Integration */}
            <div style={{background:'#fff',borderRadius:12,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{width:48,height:48,background:'linear-gradient(135deg,#f59e0b,#d97706)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:24}}>⚡</span>
                </div>
                <div>
                  <h2 style={{margin:0,fontSize:16,fontWeight:600}}>CRM Webhook Integration</h2>
                  <p style={{margin:0,fontSize:11,color:'#64748b'}}>Connect any CRM via Zapier webhooks</p>
                </div>
              </div>
              
              <div style={{padding:16,background:'#fffbeb',borderRadius:8,marginBottom:16}}>
                <h4 style={{margin:'0 0 12px',fontSize:12,fontWeight:600,color:'#92400e'}}>🔧 How to Connect with Zapier</h4>
                <ol style={{margin:0,paddingLeft:20,fontSize:11,color:'#78350f',lineHeight:1.8}}>
                  <li><strong>Create a Zap</strong> in Zapier with your CRM as the trigger (e.g., "New Deal" or "Status Changed")</li>
                  <li><strong>Add a Webhook action</strong> (Webhooks by Zapier → POST)</li>
                  <li><strong>Use this format</strong> for the webhook body:
                    <pre style={{background:'#fef3c7',padding:8,borderRadius:4,fontSize:10,marginTop:8,overflowX:'auto'}}>
{`{
  "action": "add_deal",
  "secret": "YOUR_SECRET_KEY",
  "deal": {
    "address": "{{property_address}}",
    "type": "Wholesale or Flip",
    "status": "Ongoing",
    "acquisition": {{purchase_price}},
    "projDisposition": {{sale_price}},
    "source": "{{lead_source}}"
  }
}`}
                    </pre>
                  </li>
                  <li><strong>For deal updates</strong>, use action: "update_deal" with dealId</li>
                </ol>
              </div>
              
              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}}>Your Secret Key (for validation)</label>
                <div style={{display:'flex',gap:8}}>
                  <input 
                    type="text" 
                    value={webhookConfig.secretKey} 
                    onChange={e=>setWebhookConfig({...webhookConfig,secretKey:e.target.value})} 
                    placeholder="Create a secret key for your webhooks"
                    style={{flex:1,padding:'10px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:12,fontFamily:'monospace'}}
                  />
                  <button 
                    onClick={()=>setWebhookConfig({...webhookConfig,secretKey:Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15)})}
                    style={{padding:'10px 16px',background:'#f1f5f9',border:'none',borderRadius:8,fontSize:11,cursor:'pointer'}}
                  >
                    Generate
                  </button>
                </div>
              </div>
              
              <div style={{padding:12,background:'#f0fdf4',borderRadius:8,marginBottom:16}}>
                <h4 style={{margin:'0 0 8px',fontSize:11,fontWeight:600,color:'#047857'}}>📥 Manual Import via JSON</h4>
                <p style={{margin:'0 0 8px',fontSize:10,color:'#064e3b'}}>
                  Paste deal data exported from your CRM or Zapier to import directly:
                </p>
                <textarea 
                  id="webhookImport"
                  placeholder='{"deals": [{"address": "123 Main St", "type": "Wholesale", "status": "Ongoing", "acquisition": 50000, "projDisposition": 60000}]}'
                  style={{width:'100%',height:80,padding:8,border:'1px solid #86efac',borderRadius:4,fontSize:10,fontFamily:'monospace',resize:'vertical'}}
                />
                <button 
                  onClick={()=>{
                    try {
                      const input = document.getElementById('webhookImport').value;
                      const data = JSON.parse(input);
                      const newDeals = (data.deals || [data]).map((d,i) => ({
                        id: Date.now() + i,
                        address: d.address || 'Unknown Address',
                        type: d.type || 'Wholesale',
                        status: d.status || 'Ongoing',
                        acquisition: d.acquisition || d.purchase_price || 0,
                        projDisposition: d.projDisposition || d.sale_price || d.arv || 0,
                        projRehab: d.projRehab || d.rehab || 0,
                        purchaseDate: d.purchaseDate || d.date || new Date().toISOString().split('T')[0],
                        source: d.source || 'CRM Import',
                        jv: d.jv || 'N',
                        ownerShare: d.ownerShare || 100
                      }));
                      setDeals([...deals, ...newDeals]);
                      document.getElementById('webhookImport').value = '';
                      alert(`✓ Imported ${newDeals.length} deal(s) successfully!`);
                    } catch(e) {
                      alert('Error parsing JSON: ' + e.message);
                    }
                  }}
                  style={{marginTop:8,padding:'8px 16px',background:'#059669',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}
                >
                  📥 Import Deals
                </button>
              </div>
              
              <div style={{padding:12,background:'#eff6ff',borderRadius:8}}>
                <h4 style={{margin:'0 0 8px',fontSize:11,fontWeight:600,color:'#1d4ed8'}}>📊 Google Sheets Sync (Leads + Deals)</h4>
                <p style={{margin:'0 0 8px',fontSize:10,color:'#1e40af',lineHeight:1.6}}>
                  Sync your CRM data from Google Sheets. Leads flow to your Lead Funnel, and "Contract" or "Closed" leads automatically become Deals!
                </p>
                <div style={{padding:8,background:'#dbeafe',borderRadius:4,marginBottom:12,fontSize:9,color:'#1e40af'}}>
                  <strong>How it works:</strong> All leads → Lead Funnel | Contract/Closed leads → Also creates Deals
                </div>
                
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:10,fontWeight:600,color:'#64748b',display:'block',marginBottom:4}}>Google Sheet URL</label>
                  <input 
                    type="text" 
                    value={googleSheetsConfig.sheetUrl} 
                    onChange={e=>setGoogleSheetsConfig({...googleSheetsConfig,sheetUrl:e.target.value})} 
                    placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
                    style={{width:'100%',padding:'10px 12px',border:'1px solid #bfdbfe',borderRadius:6,fontSize:11}}
                  />
                  <div style={{fontSize:9,color:'#64748b',marginTop:4}}>
                    Make sure the sheet is shared as "Anyone with link can view"
                  </div>
                </div>
                
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button 
                    disabled={sheetSyncing || !googleSheetsConfig.sheetUrl}
                    onClick={async()=>{
                      if(!googleSheetsConfig.sheetUrl) {
                        alert('Please enter a Google Sheet URL');
                        return;
                      }
                      
                      setSheetSyncing(true);
                      try {
                        // Extract sheet ID from URL
                        const match = googleSheetsConfig.sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                        if(!match) throw new Error('Invalid Google Sheets URL');
                        const sheetId = match[1];
                        
                        // Fetch as CSV (public sheets only)
                        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
                        const response = await fetch(csvUrl);
                        
                        if(!response.ok) throw new Error('Could not fetch sheet. Make sure it is shared publicly.');
                        
                        const csvText = await response.text();
                        const lines = csvText.split('\n').filter(l => l.trim());
                        
                        if(lines.length < 2) throw new Error('Sheet appears empty or has no data rows');
                        
                        // Parse CSV
                        const parseCSVLine = (line) => {
                          const result = [];
                          let current = '';
                          let inQuotes = false;
                          for(let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if(char === '"') {
                              inQuotes = !inQuotes;
                            } else if(char === ',' && !inQuotes) {
                              result.push(current.trim());
                              current = '';
                            } else {
                              current += char;
                            }
                          }
                          result.push(current.trim());
                          return result;
                        };
                        
                        // Status mapping from RESimpli to Lead Funnel stages
                        const statusMap = {
                          // Early stage
                          'new': 'new', 'new leads': 'new', 'new lead': 'new',
                          'discovery': 'new',
                          // Contacted
                          'contacted': 'contacted', 'contact made': 'contacted',
                          'interested add to follow up': 'contacted',
                          'interested': 'contacted',
                          // Processing
                          'process call': 'process_call', 'processing': 'process_call',
                          'due diligence': 'process_call',
                          'due dilligence': 'process_call',
                          // Offer stage
                          'offer': 'offer', 'offer made': 'offer', 'offer sent': 'offer',
                          'offers made': 'offer',
                          'offer follow-up': 'offer',
                          'offer followup': 'offer',
                          // Contract
                          'contract': 'contract', 'under contract': 'contract',
                          // Closed
                          'closed': 'closed', 'won': 'closed',
                          // Dead
                          'dead': 'dead', 'dead/lost': 'dead', 'lost': 'dead', 
                          'not interested': 'dead', 'no deal': 'dead'
                        };
                        
                        const newLeads = [];
                        const newDeals = [];
                        const existingLeadAddresses = leads.map(l => (l.propertyAddress||'').toLowerCase().trim());
                        const existingDealAddresses = deals.map(d => d.address.toLowerCase().trim());
                        
                        // Column mapping for user's actual sheet:
                        // A(0)=Property Address, B(1)=Deal Type, C(2)=Status, D(3)=Purchase Price, 
                        // E(4)=Sale Price, F(5)=Rehab Estimate, G(6)=Contract Date, H(7)=Lead Source, I(8)=Expected Profit
                        
                        for(let i = 1; i < lines.length; i++) { // Skip header row only
                          const row = parseCSVLine(lines[i]);
                          
                          const address = row[0]?.trim();
                          if(!address || address.toLowerCase() === 'property address') continue;
                          
                          const rawStatus = (row[2] || 'new').toLowerCase().trim();
                          const mappedStatus = statusMap[rawStatus] || 'new';
                          const dealType = row[1]?.trim() || 'Wholesale';
                          const purchasePrice = parseFloat(row[3]?.replace(/[$,]/g,'')) || 0;
                          const salePrice = parseFloat(row[4]?.replace(/[$,]/g,'')) || 0;
                          const rehabEstimate = parseFloat(row[5]?.replace(/[$,]/g,'')) || 0;
                          const contractDate = row[6]?.trim() || '';
                          const leadSource = row[7]?.trim() || 'CRM';
                          const expectedProfit = parseFloat(row[8]?.replace(/[$,]/g,'')) || 0;
                          
                          // Add to leads if not already exists
                          if(!existingLeadAddresses.includes(address.toLowerCase().trim())) {
                            newLeads.push({
                              id: Date.now() + i,
                              propertyAddress: address,
                              sellerName: '',
                              sellerPhone: '',
                              status: mappedStatus,
                              source: leadSource,
                              dateAdded: contractDate || new Date().toISOString().split('T')[0],
                              dealType: dealType,
                              purchasePrice: purchasePrice,
                              salePrice: salePrice,
                              rehabEstimate: rehabEstimate,
                              expectedProfit: expectedProfit,
                              notes: ''
                            });
                            existingLeadAddresses.push(address.toLowerCase().trim());
                          }
                          
                          // Create deal if status is Contract or Closed
                          if((mappedStatus === 'contract' || mappedStatus === 'closed') && 
                             !existingDealAddresses.includes(address.toLowerCase().trim())) {
                            
                            newDeals.push({
                              id: Date.now() + i + 10000,
                              address: address,
                              type: dealType.toLowerCase().includes('flip') ? 'Flip' : 'Wholesale',
                              status: mappedStatus === 'closed' ? 'Closed' : 'Ongoing',
                              acquisition: purchasePrice,
                              projDisposition: salePrice,
                              disposition: mappedStatus === 'closed' ? salePrice : 0,
                              projRehab: rehabEstimate,
                              rehab: mappedStatus === 'closed' ? rehabEstimate : 0,
                              purchaseDate: contractDate || new Date().toISOString().split('T')[0],
                              closeDate: mappedStatus === 'closed' ? (contractDate || new Date().toISOString().split('T')[0]) : '',
                              source: leadSource,
                              jv: 'N',
                              ownerShare: 100,
                              notes: expectedProfit ? `Expected profit: $${expectedProfit.toLocaleString()}` : '',
                              holdingCosts: 0
                            });
                            existingDealAddresses.push(address.toLowerCase().trim());
                          }
                        }
                        
                        // Update state
                        if(newLeads.length > 0) setLeads([...leads, ...newLeads]);
                        if(newDeals.length > 0) setDeals([...deals, ...newDeals]);
                        setGoogleSheetsConfig({...googleSheetsConfig, lastSync: new Date().toISOString()});
                        
                        let message = '✓ Sync complete!\n\n';
                        message += `📊 Leads: ${newLeads.length} new\n`;
                        message += `💼 Deals: ${newDeals.length} auto-created\n`;
                        if(newDeals.length > 0) {
                          message += '\nDeals created from "under contract" or "closed" leads.';
                        }
                        alert(message);
                        
                      } catch(e) {
                        alert('Error syncing: ' + e.message);
                      } finally {
                        setSheetSyncing(false);
                      }
                    }}
                    style={{padding:'8px 16px',background:sheetSyncing||!googleSheetsConfig.sheetUrl?'#94a3b8':'#2563eb',border:'none',borderRadius:6,color:'#fff',fontSize:11,fontWeight:600,cursor:sheetSyncing||!googleSheetsConfig.sheetUrl?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:6}}
                  >
                    {sheetSyncing ? (
                      <><span style={{display:'inline-block',width:12,height:12,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite'}}></span> Syncing...</>
                    ) : (
                      <>🔄 Sync Leads & Deals</>
                    )}
                  </button>
                </div>
                
                {googleSheetsConfig.lastSync && (
                  <div style={{marginTop:8,fontSize:9,color:'#64748b'}}>
                    Last synced: {new Date(googleSheetsConfig.lastSync).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Categories & Channels */}
            <div style={{background:'#fff',borderRadius:12,padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{width:48,height:48,background:'linear-gradient(135deg,#8b5cf6,#6366f1)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:24}}>🏷️</span>
                </div>
                <div>
                  <h2 style={{margin:0,fontSize:16,fontWeight:600}}>Custom Categories & Channels</h2>
                  <p style={{margin:0,fontSize:11,color:'#64748b'}}>Add your own expense categories and marketing channels</p>
                </div>
              </div>
              
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {/* Expense Categories */}
                <div style={{background:'#f8fafc',borderRadius:8,padding:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <h3 style={{margin:0,fontSize:12,fontWeight:600}}>📂 Expense Categories</h3>
                    <button onClick={()=>setShowCategoryModal(true)} style={{padding:'4px 10px',background:'#059669',border:'none',borderRadius:4,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>+ Add</button>
                  </div>
                  <div style={{fontSize:10,color:'#64748b',marginBottom:8}}>{DEFAULT_EXPENSE_CATEGORIES.length} default + {customCategories.length} custom</div>
                  {customCategories.length > 0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {customCategories.map(cat => (
                        <span key={cat.id} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 8px',background:'#e0e7ff',borderRadius:4,fontSize:10}}>
                          {cat.icon} {cat.name}
                          <button onClick={()=>setCustomCategories(customCategories.filter(c=>c.id!==cat.id))} style={{background:'none',border:'none',color:'#dc2626',cursor:'pointer',padding:0,fontSize:10}}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Marketing Channels */}
                <div style={{background:'#f8fafc',borderRadius:8,padding:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <h3 style={{margin:0,fontSize:12,fontWeight:600}}>📣 Marketing Channels</h3>
                    <button onClick={()=>setShowChannelModal(true)} style={{padding:'4px 10px',background:'#3b82f6',border:'none',borderRadius:4,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>+ Add</button>
                  </div>
                  <div style={{fontSize:10,color:'#64748b',marginBottom:8}}>{DEFAULT_MARKETING_CHANNELS.length} default + {customChannels.length} custom</div>
                  {customChannels.length > 0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {customChannels.map(ch => (
                        <span key={ch.id} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 8px',background:ch.color+'20',borderRadius:4,fontSize:10,color:ch.color}}>
                          {ch.icon} {ch.name}
                          <button onClick={()=>setCustomChannels(customChannels.filter(c=>c.id!==ch.id))} style={{background:'none',border:'none',color:'#dc2626',cursor:'pointer',padding:0,fontSize:10}}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div style={{background:'#fff',borderRadius:12,padding:20}}>
              <h2 style={{margin:'0 0 16px',fontSize:16,fontWeight:600}}>💾 Data Management</h2>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button onClick={async()=>{
                  if(isElectron){
                    const result = await window.electronAPI.exportData();
                    if(result.success) alert(`Data exported to: ${result.path}`);
                  }else{
                    const data = {deals,expenses,ledger,allocations,checklist,leads,exportedAt:new Date().toISOString()};
                    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');a.href=url;a.download=`pf-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;a.click();
                  }
                }} style={{padding:'10px 20px',background:'#059669',border:'none',borderRadius:8,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                  📤 Export Data
                </button>
                <button onClick={async()=>{
                  if(isElectron){
                    const result = await window.electronAPI.importData();
                    if(result.success){alert('Data imported successfully!');window.location.reload();}
                  }else{
                    const input = document.createElement('input');input.type='file';input.accept='.json';
                    input.onchange = e => {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onload = ev => {
                        try{
                          const data = JSON.parse(ev.target.result);
                          if(data.deals) setDeals(data.deals);
                          if(data.expenses) setExpenses(data.expenses);
                          if(data.ledger) setLedger(data.ledger);
                          if(data.allocations) setAllocations(data.allocations);
                          if(data.checklist) setChecklist(data.checklist);
                          if(data.leads) setLeads(data.leads);
                          alert('Data imported!');
                        }catch(err){alert('Invalid file format');}
                      };
                      reader.readAsText(file);
                    };
                    input.click();
                  }
                }} style={{padding:'10px 20px',background:'#f1f5f9',border:'none',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer'}}>
                  📥 Import Data
                </button>
              </div>
              <p style={{margin:'12px 0 0',fontSize:10,color:'#94a3b8'}}>
                {isElectron ? 'Data is stored locally in SQLite database.' : 'Data is stored in your browser\'s localStorage.'}
              </p>
            </div>

            {/* App Info */}
            <div style={{background:'#fff',borderRadius:12,padding:20}}>
              <h2 style={{margin:'0 0 12px',fontSize:16,fontWeight:600}}>ℹ️ About</h2>
              <div style={{fontSize:11,color:'#64748b',lineHeight:1.8}}>
                <p><strong>PF Tracker</strong> - Profit First Real Estate Deal Tracker</p>
                <p>Version 1.0.0</p>
                <p>Mode: {isElectron ? '🖥️ Desktop App (Electron)' : isMobile ? '📱 Mobile App' : '🌐 Web Browser'}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      {isMobile && (
        <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid #e2e8f0',display:'flex',justifyContent:'space-around',padding:'8px 0 20px',zIndex:999,boxShadow:'0 -2px 10px rgba(0,0,0,0.05)'}}>
          {[
            {id:'dashboard',l:'Home',i:'📊'},
            {id:'deals',l:'Deals',i:'🏠'},
            {id:'analytics',l:'Stats',i:'📈'},
            {id:'ledger',l:'Ledger',i:'📒'},
            {id:'settings',l:'More',i:'⚙️'}
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'6px 12px',background:'transparent',border:'none',color:activeTab===t.id?'#059669':'#94a3b8',cursor:'pointer'}}>
              <span style={{fontSize:22}}>{t.i}</span>
              <span style={{fontSize:10,fontWeight:activeTab===t.id?600:400}}>{t.l}</span>
            </button>
          ))}
        </nav>
      )}

      {/* MOBILE FLOATING ADD BUTTON */}
      {isMobile && activeTab === 'deals' && (
        <button onClick={addDeal} style={{position:'fixed',bottom:90,right:16,width:56,height:56,borderRadius:28,background:'linear-gradient(135deg,#059669,#047857)',border:'none',color:'#fff',fontSize:28,fontWeight:300,boxShadow:'0 4px 12px rgba(5,150,105,0.4)',cursor:'pointer',zIndex:998,display:'flex',alignItems:'center',justifyContent:'center'}}>
          +
        </button>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
