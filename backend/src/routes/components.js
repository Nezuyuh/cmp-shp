const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Maps URL-friendly category slugs → DB category values + spec tables
const CATEGORY_MAP = {
  cpu: { dbCategory: 'CPU', specTable: 'cpu_specs' },
  motherboard: { dbCategory: 'Motherboard', specTable: 'motherboard_specs' },
  ram: { dbCategory: 'RAM', specTable: 'ram_specs' },
  gpu: { dbCategory: 'GPU', specTable: 'gpu_specs' },
  case: { dbCategory: 'Case', specTable: 'case_specs' },
  psu: { dbCategory: 'PSU', specTable: 'psu_specs' },
  cooler: { dbCategory: 'Cooler', specTable: 'cooler_specs' },
  storage: { dbCategory: 'Storage', specTable: 'storage_specs' },
  fan: { dbCategory: 'Fan', specTable: 'fan_specs' },
};

// GET /api/components/:category
// Returns all products in the category joined with their compatibility specs.
// Designed for the PC Builder component picker.
router.get('/:category', async (req, res) => {
  try {
    const slug = req.params.category.toLowerCase();
    const mapping = CATEGORY_MAP[slug];

    if (!mapping) {
      return res.status(404).json({
        success: false,
        error: `Unknown component category "${req.params.category}". Valid: ${Object.keys(CATEGORY_MAP).join(', ')}`,
      });
    }

    const { dbCategory, specTable } = mapping;

    // Fetch all products in this category
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('category', dbCategory)
      .order('price', { ascending: true });

    if (productsError) {
      return res.status(500).json({ success: false, error: productsError.message });
    }

    if (!products || products.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Fetch all specs for these products in one query
    const productIds = products.map((p) => p.id);
    const { data: allSpecs, error: specsError } = await supabase
      .from(specTable)
      .select('*')
      .in('product_id', productIds);

    if (specsError) {
      return res.status(500).json({ success: false, error: specsError.message });
    }

    // Index specs by product_id for O(1) lookup
    const specsById = {};
    for (const spec of allSpecs ?? []) {
      specsById[spec.product_id] = spec;
    }

    // Merge products with their specs
    const data = products.map((product) => {
      const { id, product_id, ...specs } = specsById[product.id] ?? {};
      return {
        ...product,
        compatibility_specs: Object.keys(specs).length > 0 ? specs : null,
      };
    });

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
