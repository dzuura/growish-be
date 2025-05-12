const supabaseResearcher = require('../config/supabase-researcher');

exports.createCategory = async (req, res) => {
  const { name, calories_min, calories_max, protein_min, protein_max, total_fat_min, total_fat_max, saturated_fat_min, saturated_fat_max, trans_fat_min, trans_fat_max, cholesterol_min, cholesterol_max, carbohydrates_min, carbohydrates_max, sugar_min, sugar_max, fiber_min, fiber_max, natrium_min, natrium_max, amino_acid_min, amino_acid_max, vitamin_d_min, vitamin_d_max, magnesium_min, magnesium_max, iron_min, iron_max } = req.body;

  const { data, error } = await supabaseResearcher.from('categories').insert({
    name, calories_min, calories_max, protein_min, protein_max, total_fat_min, total_fat_max, saturated_fat_min, saturated_fat_max, trans_fat_min, trans_fat_max, cholesterol_min, cholesterol_max, carbohydrates_min, carbohydrates_max, sugar_min, sugar_max, fiber_min, fiber_max, natrium_min, natrium_max, amino_acid_min, amino_acid_max, vitamin_d_min, vitamin_d_max, magnesium_min, magnesium_max, iron_min, iron_max
  }).select().single();

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    return res.status(500).json({ error: 'Failed to add category', details: error.message });
  }

  res.status(201).json({ message: 'Category added successfully', data });
};

exports.getCategories = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseResearcher
    .from('categories')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: 'Failed to fetch categories', details: error.message });

  res.status(200).json({
    message: 'List of categories',
    data,
    pagination: { page: Number(page), limit: Number(limit), total: count, totalPages: Math.ceil(count / limit) }
  });
};

exports.getCategoryById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseResearcher
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch category', details: error.message });
  }

  res.status(200).json({ message: 'Category retrieved successfully', data });
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, calories_min, calories_max, protein_min, protein_max, total_fat_min, total_fat_max, saturated_fat_min, saturated_fat_max, trans_fat_min, trans_fat_max, cholesterol_min, cholesterol_max, carbohydrates_min, carbohydrates_max, sugar_min, sugar_max, fiber_min, fiber_max, natrium_min, natrium_max, amino_acid_min, amino_acid_max, vitamin_d_min, vitamin_d_max, magnesium_min, magnesium_max, iron_min, iron_max } = req.body;

  const { data, error } = await supabaseResearcher.from('categories').update({
    name, calories_min, calories_max, protein_min, protein_max, total_fat_min, total_fat_max, saturated_fat_min, saturated_fat_max, trans_fat_min, trans_fat_max, cholesterol_min, cholesterol_max, carbohydrates_min, carbohydrates_max, sugar_min, sugar_max, fiber_min, fiber_max, natrium_min, natrium_max, amino_acid_min, amino_acid_max, vitamin_d_min, vitamin_d_max, magnesium_min, magnesium_max, iron_min, iron_max
  }).eq('id', id).select().single();

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    return res.status(500).json({ error: 'Failed to update category', details: error.message });
  }

  res.status(200).json({ message: 'Category updated successfully', data });
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseResearcher.from('categories').delete().eq('id', id);

  if (error) return res.status(500).json({ error: 'Failed to delete category', details: error.message });

  res.status(200).json({ message: 'Category deleted successfully' });
};