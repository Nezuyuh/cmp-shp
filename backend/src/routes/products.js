const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Category → spec table mapping
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

// GET /api/products
// Query params: ?category=CPU
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id
// Returns the product row joined with its category-specific spec row
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Fetch category-specific specs
    const specTable = SPEC_TABLE[product.category];
    let specs = null;

    if (specTable) {
      const { data: specData, error: specError } = await supabase
        .from(specTable)
        .select('*')
        .eq('product_id', id)
        .single();

      if (!specError && specData) {
        specs = specData;
      }
    }

    // Fetch variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('price', { ascending: true });

    return res.json({
      success: true,
      data: {
        ...product,
        specs: specs ?? null,
        variants: variants ?? [],
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products (admin only)
// Body: { name, brand, category, price, stock, sku, image_url, specs?, variants? }
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, brand, category, price, stock, sku, image_url, specs, variants } = req.body;

    if (!name || !brand || !category || price == null || stock == null || !sku) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, brand, category, price, stock, sku',
      });
    }

    if (!SPEC_TABLE[category] && category !== 'Fan') {
      return res.status(400).json({
        success: false,
        error: `Invalid category "${category}". Valid categories: ${Object.keys(SPEC_TABLE).join(', ')}`,
      });
    }

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({ name, brand, category, price, stock, sku, image_url })
      .select()
      .single();

    if (productError) {
      return res.status(400).json({ success: false, error: productError.message });
    }

    let insertedSpecs = null;
    let insertedVariants = [];

    // Insert specs if provided
    const specTable = SPEC_TABLE[category];
    if (specTable && specs && typeof specs === 'object') {
      const { data: specData, error: specError } = await supabase
        .from(specTable)
        .insert({ ...specs, product_id: product.id })
        .select()
        .single();

      if (specError) {
        return res.status(400).json({ success: false, error: `Specs insert failed: ${specError.message}` });
      }
      insertedSpecs = specData;
    }

    // Insert variants if provided
    if (Array.isArray(variants) && variants.length > 0) {
      const variantRows = variants.map((v) => ({ ...v, product_id: product.id }));
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .insert(variantRows)
        .select();

      if (variantError) {
        return res.status(400).json({ success: false, error: `Variants insert failed: ${variantError.message}` });
      }
      insertedVariants = variantData;
    }

    return res.status(201).json({
      success: true,
      data: {
        ...product,
        specs: insertedSpecs,
        variants: insertedVariants,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
