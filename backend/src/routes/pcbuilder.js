const express = require('express');
const router = express.Router();
const { checkCompatibility } = require('../services/compatibilityEngine');
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

// Category → spec table mapping (same as components route)
const SPEC_TABLE = {
  CPU: 'cpu_specs',
  Motherboard: 'motherboard_specs',
  RAM: 'ram_specs',
  GPU: 'gpu_specs',
  Case: 'case_specs',
  PSU: 'psu_specs',
  Cooler: 'cooler_specs',
  Storage: 'storage_specs',
  Fan: 'fan_specs',
};

/**
 * Resolves a build slot value to a merged { product + specs } object.
 * Accepts either:
 *   - a product UUID string → fetches product + specs from DB
 *   - a plain object (already-resolved specs object) → used as-is
 */
async function resolveComponent(value, category) {
  if (!value) return null;

  // Already an object — use directly
  if (typeof value === 'object') return value;

  // UUID string — look up product + specs
  if (typeof value === 'string') {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', value)
      .single();

    if (productError || !product) return null;

    const specTable = SPEC_TABLE[product.category];
    if (!specTable) return product;

    const { data: specs } = await supabase
      .from(specTable)
      .select('*')
      .eq('product_id', value)
      .single();

    return { ...product, ...(specs ?? {}) };
  }

  return null;
}

// POST /api/pc-builder/validate
// Body: { build: { cpu, motherboard, ram, gpu, case, cooler, storage, psu } }
// Each value can be a product UUID or a pre-resolved specs object.
router.post('/validate', async (req, res) => {
  try {
    const { build } = req.body;

    if (!build || typeof build !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Request body must include a "build" object',
      });
    }

    const slots = ['cpu', 'motherboard', 'ram', 'gpu', 'case', 'cooler', 'storage', 'psu'];

    // Resolve all components (possibly from UUIDs) in parallel
    const resolved = await Promise.all(
      slots.map((slot) => resolveComponent(build[slot], slot))
    );

    const resolvedBuild = {};
    slots.forEach((slot, i) => {
      resolvedBuild[slot] = resolved[i];
    });

    // Run compatibility engine
    const results = checkCompatibility(resolvedBuild);

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const allPassed = failed === 0;

    // Calculate total price for resolved products
    let totalPrice = 0;
    for (const component of Object.values(resolvedBuild)) {
      if (component?.price) {
        totalPrice += parseFloat(component.price);
      }
    }

    return res.json({
      success: true,
      data: {
        compatible: allPassed,
        summary: {
          total_rules_checked: results.length,
          passed,
          failed,
          total_price: parseFloat(totalPrice.toFixed(2)),
        },
        results,
        build: resolvedBuild,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pc-builder/save (authenticated users only)
// Save a validated build to the user's account
// Body: { name, build }
router.post('/save', authenticate, async (req, res) => {
  try {
    const { name, build } = req.body;

    if (!name || !build) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, build',
      });
    }

    // Calculate total price from product IDs in build
    let totalPrice = 0;
    const slots = ['cpu', 'motherboard', 'ram', 'gpu', 'case', 'cooler', 'storage', 'psu'];

    for (const slot of slots) {
      const value = build[slot];
      if (value && typeof value === 'string') {
        const { data: product } = await supabase
          .from('products')
          .select('price')
          .eq('id', value)
          .single();
        if (product?.price) totalPrice += parseFloat(product.price);
      } else if (value?.price) {
        totalPrice += parseFloat(value.price);
      }
    }

    const { data, error } = await supabase
      .from('pc_builds')
      .insert({
        user_id: req.user.id,
        name,
        components: build,
        total_price: parseFloat(totalPrice.toFixed(2)),
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pc-builder/builds (authenticated users only)
// List the current user's saved builds
router.get('/builds', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pc_builds')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data ?? [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
