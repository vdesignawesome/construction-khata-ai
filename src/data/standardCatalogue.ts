import { db } from '../db';
import type { Material } from '../types';

export interface StandardCatalogueItem {
  category: string;
  name: string;
  unit: string;
  defaultRate?: number;
  minimumStock?: number;
}

export const STANDARD_CONSTRUCTION_CATALOGUE: StandardCatalogueItem[] = [
  // --- CEMENT ---
  { category: 'Cement', name: 'PPC Cement (UltraTech / Ambuja)', unit: 'bags', defaultRate: 380, minimumStock: 50 },
  { category: 'Cement', name: 'OPC 43 Grade Cement', unit: 'bags', defaultRate: 370, minimumStock: 40 },
  { category: 'Cement', name: 'OPC 53 Grade Cement', unit: 'bags', defaultRate: 395, minimumStock: 40 },
  { category: 'Cement', name: 'White Cement (Birla / JK)', unit: 'kg', defaultRate: 35, minimumStock: 25 },

  // --- STEEL ---
  { category: 'Steel', name: '8mm TMT Steel Rebar (Fe 550D)', unit: 'kg', defaultRate: 68, minimumStock: 200 },
  { category: 'Steel', name: '10mm TMT Steel Rebar (Fe 550D)', unit: 'kg', defaultRate: 67, minimumStock: 300 },
  { category: 'Steel', name: '12mm TMT Steel Rebar (Fe 550D)', unit: 'kg', defaultRate: 66, minimumStock: 400 },
  { category: 'Steel', name: '16mm TMT Steel Rebar (Fe 550D)', unit: 'kg', defaultRate: 66, minimumStock: 300 },
  { category: 'Steel', name: '20mm TMT Steel Rebar (Fe 550D)', unit: 'kg', defaultRate: 66, minimumStock: 200 },
  { category: 'Steel', name: 'Binding Wire (18 Gauge)', unit: 'kg', defaultRate: 85, minimumStock: 20 },
  { category: 'Steel', name: 'Cover Blocks (20mm/25mm)', unit: 'pcs', defaultRate: 2.5, minimumStock: 100 },

  // --- BRICKS & BLOCKS ---
  { category: 'Brick', name: 'Red Clay Bricks (1st Class)', unit: 'pcs', defaultRate: 9.5, minimumStock: 2000 },
  { category: 'Brick', name: 'Fly Ash Bricks', unit: 'pcs', defaultRate: 6.5, minimumStock: 1500 },
  { category: 'Brick', name: 'AAC Lightweight Blocks (8 Inch)', unit: 'pcs', defaultRate: 62, minimumStock: 200 },
  { category: 'Brick', name: 'AAC Lightweight Blocks (4 Inch)', unit: 'pcs', defaultRate: 38, minimumStock: 200 },
  { category: 'Brick', name: 'Solid Concrete Blocks 6"', unit: 'pcs', defaultRate: 45, minimumStock: 300 },

  // --- SAND ---
  { category: 'Sand', name: 'River Sand (Reti / Coarse)', unit: 'cft', defaultRate: 55, minimumStock: 200 },
  { category: 'Sand', name: 'M-Sand (Manufactured Sand)', unit: 'cft', defaultRate: 48, minimumStock: 200 },
  { category: 'Sand', name: 'Plaster Sand (Fine Sand)', unit: 'cft', defaultRate: 52, minimumStock: 150 },

  // --- BAJRI / AGGREGATE ---
  { category: 'Bajri', name: '10mm Aggregate (Grit)', unit: 'cft', defaultRate: 40, minimumStock: 150 },
  { category: 'Bajri', name: '20mm Aggregate (Rodi)', unit: 'cft', defaultRate: 38, minimumStock: 250 },
  { category: 'Bajri', name: '40mm Stone Aggregate', unit: 'cft', defaultRate: 36, minimumStock: 100 },
  { category: 'Bajri', name: 'Stone Dust / Crushed Sand', unit: 'cft', defaultRate: 32, minimumStock: 100 },

  // --- SANITARY ---
  { category: 'Sanitary', name: 'Wash Basin with Pedestal', unit: 'pcs', defaultRate: 1850, minimumStock: 2 },
  { category: 'Sanitary', name: 'Table Top Wash Basin (Ceramic)', unit: 'pcs', defaultRate: 2200, minimumStock: 2 },
  { category: 'Sanitary', name: 'Western Toilet / Floor Commode with Seat', unit: 'pcs', defaultRate: 3400, minimumStock: 2 },
  { category: 'Sanitary', name: 'Wall Hung Commode with Soft-Close Seat', unit: 'pcs', defaultRate: 5800, minimumStock: 1 },
  { category: 'Sanitary', name: 'Indian Toilet Pan (Orissa Pan 20")', unit: 'pcs', defaultRate: 1150, minimumStock: 2 },
  { category: 'Sanitary', name: 'PVC Dual-Flush Cistern Tank', unit: 'pcs', defaultRate: 950, minimumStock: 3 },
  { category: 'Sanitary', name: 'Health Faucet with 1m SS Hose & Hook', unit: 'pcs', defaultRate: 480, minimumStock: 4 },
  { category: 'Sanitary', name: 'Brass Long Body Bib Cock (Tap)', unit: 'pcs', defaultRate: 650, minimumStock: 6 },
  { category: 'Sanitary', name: 'Brass Pillar Cock (Basin Tap)', unit: 'pcs', defaultRate: 850, minimumStock: 4 },
  { category: 'Sanitary', name: 'Angle Valve 1/2" with Wall Flange', unit: 'pcs', defaultRate: 320, minimumStock: 10 },
  { category: 'Sanitary', name: 'Concealed Diverter Body Set', unit: 'pcs', defaultRate: 3100, minimumStock: 2 },
  { category: 'Sanitary', name: 'Overhead Shower 8" with Shower Arm', unit: 'pcs', defaultRate: 980, minimumStock: 3 },
  { category: 'Sanitary', name: 'SS Waste Coupling 32mm with Bottle Trap', unit: 'pcs', defaultRate: 450, minimumStock: 4 },
  { category: 'Sanitary', name: 'PVC SWR Drainage Pipe 4" (10ft)', unit: 'pcs', defaultRate: 420, minimumStock: 10 },
  { category: 'Sanitary', name: 'PVC SWR Drainage Pipe 3" (10ft)', unit: 'pcs', defaultRate: 330, minimumStock: 8 },
  { category: 'Sanitary', name: 'PVC Nahani Trap with SS Jali', unit: 'pcs', defaultRate: 160, minimumStock: 6 },
  { category: 'Sanitary', name: 'Flexible Connection Pipe 18" (SS Braided)', unit: 'pcs', defaultRate: 130, minimumStock: 12 },

  // --- ELECTRICAL ---
  { category: 'Electrical', name: '1.0 sq mm FR Copper Wire (90m)', unit: 'bundle', defaultRate: 1350, minimumStock: 4 },
  { category: 'Electrical', name: '1.5 sq mm FR Copper Wire (90m)', unit: 'bundle', defaultRate: 1950, minimumStock: 6 },
  { category: 'Electrical', name: '2.5 sq mm FR Copper Wire (90m)', unit: 'bundle', defaultRate: 3100, minimumStock: 4 },
  { category: 'Electrical', name: '4.0 sq mm FR Copper Wire (90m)', unit: 'bundle', defaultRate: 4800, minimumStock: 2 },
  { category: 'Electrical', name: '6.0 sq mm FR Copper Wire (90m)', unit: 'bundle', defaultRate: 7200, minimumStock: 1 },
  { category: 'Electrical', name: 'Modular Switch 6A (1-Way)', unit: 'pcs', defaultRate: 35, minimumStock: 30 },
  { category: 'Electrical', name: 'Modular Switch 16A Power', unit: 'pcs', defaultRate: 75, minimumStock: 15 },
  { category: 'Electrical', name: 'Modular Socket 6A (3-Pin)', unit: 'pcs', defaultRate: 65, minimumStock: 20 },
  { category: 'Electrical', name: 'Modular Socket 16A / 20A Power', unit: 'pcs', defaultRate: 110, minimumStock: 12 },
  { category: 'Electrical', name: '2-Module Concealed GI Metal Box', unit: 'pcs', defaultRate: 45, minimumStock: 15 },
  { category: 'Electrical', name: '4-Module Concealed GI Metal Box', unit: 'pcs', defaultRate: 65, minimumStock: 15 },
  { category: 'Electrical', name: '6-Module Concealed GI Metal Box', unit: 'pcs', defaultRate: 85, minimumStock: 12 },
  { category: 'Electrical', name: '8-Module Concealed GI Metal Box', unit: 'pcs', defaultRate: 110, minimumStock: 12 },
  { category: 'Electrical', name: '12-Module Concealed GI Metal Box', unit: 'pcs', defaultRate: 145, minimumStock: 8 },
  { category: 'Electrical', name: 'Single Pole MCB 16A / 20A / 25A (C-Curve)', unit: 'pcs', defaultRate: 165, minimumStock: 10 },
  { category: 'Electrical', name: 'Double Pole Isolator 32A / 40A', unit: 'pcs', defaultRate: 420, minimumStock: 3 },
  { category: 'Electrical', name: '8-Way SPN MCB Distribution Board', unit: 'pcs', defaultRate: 950, minimumStock: 2 },
  { category: 'Electrical', name: 'PVC Electrical Conduit Pipe 25mm (10ft)', unit: 'pcs', defaultRate: 55, minimumStock: 50 },
  { category: 'Electrical', name: 'Circular Junction Box 4-Way 25mm', unit: 'pcs', defaultRate: 18, minimumStock: 40 },
  { category: 'Electrical', name: 'Fan Concealed Hook Box (Heavy GI)', unit: 'pcs', defaultRate: 95, minimumStock: 6 },
  { category: 'Electrical', name: 'LED Concealed Panel Light 12W (Round)', unit: 'pcs', defaultRate: 240, minimumStock: 15 },

  // --- PLUMBING ---
  { category: 'Plumbing', name: 'CPVC Pipe 1/2" SDR 11 (10ft)', unit: 'pcs', defaultRate: 135, minimumStock: 15 },
  { category: 'Plumbing', name: 'CPVC Pipe 3/4" SDR 11 (10ft)', unit: 'pcs', defaultRate: 185, minimumStock: 25 },
  { category: 'Plumbing', name: 'CPVC Pipe 1" SDR 11 (10ft)', unit: 'pcs', defaultRate: 285, minimumStock: 15 },
  { category: 'Plumbing', name: 'CPVC Elbow 90° 3/4"', unit: 'pcs', defaultRate: 22, minimumStock: 30 },
  { category: 'Plumbing', name: 'CPVC Brass Female Elbow 3/4" x 1/2"', unit: 'pcs', defaultRate: 85, minimumStock: 20 },
  { category: 'Plumbing', name: 'CPVC Equal Tee 3/4"', unit: 'pcs', defaultRate: 28, minimumStock: 25 },
  { category: 'Plumbing', name: 'CPVC Solvent Cement 250ml Tin', unit: 'pcs', defaultRate: 145, minimumStock: 4 },
  { category: 'Plumbing', name: 'Teflon Sealing Tape 12mm (Roll)', unit: 'pcs', defaultRate: 18, minimumStock: 15 },
  { category: 'Plumbing', name: 'Water Tank 500L Triple Layer (Sintex)', unit: 'pcs', defaultRate: 3400, minimumStock: 1 },
  { category: 'Plumbing', name: 'Water Tank 1000L Triple Layer (Sintex)', unit: 'pcs', defaultRate: 6200, minimumStock: 1 },
  { category: 'Plumbing', name: 'Brass Ball Valve 1" (Heavy)', unit: 'pcs', defaultRate: 420, minimumStock: 2 },

  // --- TILES & STONES ---
  { category: 'Tiles', name: 'Floor Vitrified Tiles 2x2 ft (Nano/GVT)', unit: 'sq ft', defaultRate: 45, minimumStock: 400 },
  { category: 'Tiles', name: 'Glazed Vitrified Tiles 2x4 ft GVT', unit: 'sq ft', defaultRate: 65, minimumStock: 400 },
  { category: 'Tiles', name: 'Bathroom Ceramic Wall Tiles 12x18 inch', unit: 'sq ft', defaultRate: 36, minimumStock: 300 },
  { category: 'Tiles', name: 'Bathroom Anti-Skid Floor Tiles 12x12 inch', unit: 'sq ft', defaultRate: 38, minimumStock: 100 },
  { category: 'Tiles', name: 'Black Granite Kitchen Countertop Slab', unit: 'sq ft', defaultRate: 145, minimumStock: 40 },
  { category: 'Tiles', name: 'Tile Adhesive Polymer Bag 20kg', unit: 'bags', defaultRate: 290, minimumStock: 15 },
  { category: 'Tiles', name: 'Epoxy Waterproof Tile Grout (1kg Kit)', unit: 'kg', defaultRate: 450, minimumStock: 5 },

  // --- PAINT & PUTTY ---
  { category: 'Paint', name: 'White Wall Care Putty 40kg Bag', unit: 'bags', defaultRate: 750, minimumStock: 10 },
  { category: 'Paint', name: 'Interior Wall Primer (Water Based) 20L', unit: 'liter', defaultRate: 130, minimumStock: 20 },
  { category: 'Paint', name: 'Exterior Weatherproof Primer 20L', unit: 'liter', defaultRate: 165, minimumStock: 20 },
  { category: 'Paint', name: 'Interior Acrylic Emulsion Paint 20L', unit: 'liter', defaultRate: 210, minimumStock: 20 },
  { category: 'Paint', name: 'Exterior Weatherproof Apex Paint 20L', unit: 'liter', defaultRate: 295, minimumStock: 20 },
  { category: 'Paint', name: 'Synthetic Enamel Paint 4L (Doors/Grills)', unit: 'liter', defaultRate: 260, minimumStock: 4 },
  { category: 'Paint', name: 'Emery Sanding Paper Roll (80/120 Grit)', unit: 'pcs', defaultRate: 18, minimumStock: 20 },
  { category: 'Paint', name: 'Paint Roller 9" with Tray', unit: 'pcs', defaultRate: 140, minimumStock: 4 },

  // --- HARDWARE ---
  { category: 'Hardware', name: 'Stainless Steel Door Hinges 4" (Pair)', unit: 'pcs', defaultRate: 120, minimumStock: 10 },
  { category: 'Hardware', name: 'Brass / SS Tower Bolt 6"', unit: 'pcs', defaultRate: 95, minimumStock: 8 },
  { category: 'Hardware', name: 'Mortise Door Lock Set with Brass Handles', unit: 'pcs', defaultRate: 1450, minimumStock: 4 },
  { category: 'Hardware', name: 'Stainless Steel Aldrop 10"', unit: 'pcs', defaultRate: 320, minimumStock: 4 },
  { category: 'Hardware', name: '2" Wood Screws (Box of 100)', unit: 'pcs', defaultRate: 85, minimumStock: 5 },
  { category: 'Hardware', name: '3" Wood Screws (Box of 100)', unit: 'pcs', defaultRate: 120, minimumStock: 5 },
  { category: 'Hardware', name: 'Concrete Nails 2" (Hardened Steel)', unit: 'kg', defaultRate: 135, minimumStock: 5 }
];

/**
 * Loads standard construction materials for a specific site without duplicating existing names.
 * @param siteId Current active site ID
 * @param categoryFilter Optional category filter (e.g. 'Sanitary' or 'Electrical'). If omitted, loads all.
 * @returns Object with count of added items and categories
 */
export async function loadStandardCatalogueForSite(
  siteId: string,
  categoryFilter?: string
): Promise<{ addedCount: number; existingCount: number; categories: string[] }> {
  if (!siteId) throw new Error('Site ID is required to load standard catalogue');

  // Fetch all existing materials for this site
  const existing = await db.materials.where({ siteId }).toArray();
  const existingNameSet = new Set(existing.map((m) => m.name.toLowerCase().trim()));

  const targetItems = categoryFilter && categoryFilter !== 'all'
    ? STANDARD_CONSTRUCTION_CATALOGUE.filter((it) => it.category.toLowerCase() === categoryFilter.toLowerCase())
    : STANDARD_CONSTRUCTION_CATALOGUE;

  const toAdd: Material[] = [];
  const addedCategories = new Set<string>();

  for (const item of targetItems) {
    if (existingNameSet.has(item.name.toLowerCase().trim())) {
      continue;
    }

    const matId = 'mat_std_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    toAdd.push({
      id: matId,
      siteId,
      category: item.category,
      name: item.name,
      unit: item.unit,
      minimumStock: item.minimumStock || 10,
      defaultRate: item.defaultRate || 0,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    addedCategories.add(item.category);
    existingNameSet.add(item.name.toLowerCase().trim());
  }

  if (toAdd.length > 0) {
    await db.materials.bulkAdd(toAdd);
  }

  return {
    addedCount: toAdd.length,
    existingCount: existing.length,
    categories: Array.from(addedCategories)
  };
}
