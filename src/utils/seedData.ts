import { db } from '../db';
import { createPurchase, createPayment, recordMaterialUsage } from '../engine/accounting';
import type { Site, Account, Material } from '../types';

export async function seedDemoData() {
  // Create Site 1: House - Sector 35
  const site1Id = 'site_sec35';
  const site1: Site = {
    id: site1Id,
    name: 'House - Sector 35',
    clientName: 'Er. Rajesh Verma',
    location: 'Sector 35, Chandigarh',
    budget: 4500000,
    startDate: '2026-08-01',
    status: 'active',
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now()
  };

  // Create Site 2: House - Model Town
  const site2Id = 'site_modeltown';
  const site2: Site = {
    id: site2Id,
    name: 'House - Model Town',
    clientName: 'Sardar Gurpreet Singh',
    location: 'Model Town, Jalandhar',
    budget: 6500000,
    startDate: '2026-08-15',
    status: 'active',
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now()
  };

  // Create Site 3: Shop - Main Road
  const site3Id = 'site_shopmain';
  const site3: Site = {
    id: site3Id,
    name: 'Shop - Main Road',
    clientName: 'M/s Gupta Retail',
    location: 'Main Road Market',
    budget: 1800000,
    startDate: '2026-09-01',
    status: 'active',
    createdAt: Date.now() - 10 * 86400000,
    updatedAt: Date.now()
  };

  await db.sites.bulkPut([site1, site2, site3]);

  // Seed Accounts for Site 1
  const supplier1: Account = {
    id: 'acc_sharma_sec35',
    siteId: site1Id,
    type: 'supplier',
    name: 'Sharma Hardware',
    phone: '9876543210',
    address: 'Shop 12, Timber Market',
    openingBalance: 0,
    notes: 'Primary plumbing and hardware dealer',
    status: 'active',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now()
  };

  const supplier2: Account = {
    id: 'acc_bajaj_sec35',
    siteId: site1Id,
    type: 'supplier',
    name: 'Bajaj Cement & Steel',
    phone: '9812345678',
    address: 'Industrial Area',
    openingBalance: 0,
    notes: 'UltraTech & Kamdhenu TMT',
    status: 'active',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now()
  };

  // Multiple Rakesh accounts on Site 1 for AI Disambiguation test!
  const labourRakeshPlumber: Account = {
    id: 'acc_rakesh_plumber',
    siteId: site1Id,
    type: 'labour',
    name: 'Rakesh Plumber',
    phone: '9876000001',
    address: 'Labor Colony',
    openingBalance: 0,
    notes: 'Master Plumber',
    status: 'active',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now()
  };

  const labourRakeshMason: Account = {
    id: 'acc_rakesh_mason',
    siteId: site1Id,
    type: 'labour',
    name: 'Rakesh Mistri (Mason)',
    phone: '9876000002',
    address: 'Old Camp',
    openingBalance: 0,
    notes: 'Brickwork Contractor',
    status: 'active',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now()
  };

  await db.accounts.bulkPut([supplier1, supplier2, labourRakeshPlumber, labourRakeshMason]);

  // Seed Materials for Site 1
  const matCpvc: Material = {
    id: 'mat_cpvc_pipe',
    siteId: site1Id,
    category: 'Plumbing',
    name: 'CPVC Pipe 1"',
    unit: 'pcs',
    minimumStock: 25,
    defaultRate: 120,
    notes: 'Astral Heavy Duty',
    status: 'active',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now()
  };

  const matCement: Material = {
    id: 'mat_cement_ultratech',
    siteId: site1Id,
    category: 'Cement',
    name: 'UltraTech Cement OPC 53',
    unit: 'bags',
    minimumStock: 50,
    defaultRate: 420,
    status: 'active',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now()
  };

  const matSteel: Material = {
    id: 'mat_steel_12mm',
    siteId: site1Id,
    category: 'Steel',
    name: 'TMT Bar 12mm Fe550D',
    unit: 'kg',
    minimumStock: 200,
    defaultRate: 68,
    status: 'active',
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now()
  };

  await db.materials.bulkPut([matCpvc, matCement, matSteel]);

  // Record an initial Purchase for Site 1:
  // Sharma Hardware: 100 CPVC Pipe 1" @ ₹120 = ₹12,000. Paid: ₹5,000, Pending: ₹7,000
  await createPurchase({
    siteId: site1Id,
    supplierId: supplier1.id,
    invoiceNumber: 'INV-SH-101',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    items: [
      {
        materialId: matCpvc.id,
        quantity: 100,
        rate: 120,
        discount: 0,
        tax: 0
      }
    ],
    paidAmount: 5000,
    paymentMode: 'upi',
    notes: 'Initial plumbing line supply'
  });

  // Use 20 CPVC pipes -> Stock should become 80!
  await recordMaterialUsage({
    siteId: site1Id,
    materialId: matCpvc.id,
    quantity: 20,
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    notes: 'First floor bathroom piping'
  });

  return site1Id;
}
