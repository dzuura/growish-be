const supabaseResearcher = require('../config/supabase-researcher');
const supabaseNutritionist = require('../config/supabase-nutritionist');
const materialService = require('../services/materialService');

exports.getMaterials = async (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseResearcher.from('materials').select('*', { count: 'exact' });

  if (category && category !== 'all') {
    query = supabaseResearcher
      .from('materials')
      .select('*, material_categories!inner(category_id), categories!material_categories!inner(name)')
      .eq('categories.name', category);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: 'Failed to fetch materials' });

  res.status(200).json({
    message: 'List of materials',
    data,
    pagination: { page: Number(page), limit: Number(limit), total: count || data.length, totalPages: Math.ceil((count || data.length) / limit) }
  });
};

exports.getMaterialStats = async (req, res) => {
  const { data: totalMaterials, error: totalError } = await supabaseResearcher
    .from('materials')
    .select('*', { count: 'exact' });

  if (totalError) return res.status(500).json({ error: 'Failed to fetch total materials' });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: newMaterials, error: newError } = await supabaseResearcher
    .from('materials')
    .select('*', { count: 'exact' })
    .gte('created_at', sevenDaysAgo.toISOString());

  if (newError) return res.status(500).json({ error: 'Failed to fetch new materials' });

  const { data: categories, error: catError } = await supabaseResearcher
    .from('categories')
    .select('name, material_categories!inner(material_id)');

  if (catError) return res.status(500).json({ error: 'Failed to fetch categories' });

  const categoryStats = categories.map(cat => ({
    name: cat.name,
    count: cat.material_categories.length
  }));

  const { data: materialCategories, error: matCatError } = await supabaseResearcher
    .from('materials')
    .select('material_category')
    .not('material_category', 'is', null);

  if (matCatError) return res.status(500).json({ error: 'Failed to fetch material categories' });

  const totalMaterialCategories = [...new Set(materialCategories.map(mc => mc.material_category))].length;

  res.status(200).json({
    message: 'Material statistics',
    data: {
      totalMaterials: totalMaterials.length,
      newMaterials: newMaterials.length,
      categoryStats,
      totalMaterialCategories: totalMaterialCategories
    }
  });
};

exports.getMaterialById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseResearcher
    .from('materials')
    .select('*, material_categories(category_id), categories(name)')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: 'Failed to fetch material' });

  const categories = data.material_categories.map(mc => {
    const category = data.categories.find(cat => cat.id === mc.category_id);
    return category ? category.name : null;
  }).filter(Boolean);

  res.status(200).json({ message: 'Material details', data: { ...data, categories } });
};

exports.createMaterial = async (req, res) => {
  const { name, calories, protein, total_fat, saturated_fat, trans_fat, cholesterol, carbohydrates, sugar, fiber, natrium, amino_acid, vitamin_d, magnesium, iron, test_date, material_category, notes, source } = req.body;

  const material = { 
    name, calories, protein, total_fat, saturated_fat, trans_fat, cholesterol, carbohydrates, sugar, fiber, 
    natrium, amino_acid, vitamin_d, magnesium, iron, test_date, material_category, notes, source 
  };
  const { data, error } = await supabaseResearcher.from('materials').insert(material).select().single();

  if (error) return res.status(500).json({ error: 'Failed to add material' });

  const categoryIds = await materialService.categorizeMaterial(material);
  const materialCategories = categoryIds.map(category_id => ({ material_id: data.id, category_id }));
  await supabaseResearcher.from('material_categories').insert(materialCategories);

  res.status(201).json({ message: 'Material added successfully', data });
};

exports.updateMaterial = async (req, res) => {
  const { id } = req.params;
  const { name, calories, protein, total_fat, saturated_fat, trans_fat, cholesterol, carbohydrates, sugar, fiber, natrium, amino_acid, vitamin_d, magnesium, iron, test_date, material_category, notes, source } = req.body;

  const material = { 
    name, calories, protein, total_fat, saturated_fat, trans_fat, cholesterol, carbohydrates, sugar, fiber, 
    natrium, amino_acid, vitamin_d, magnesium, iron, test_date, material_category, notes, source 
  };
  const { data, error } = await supabaseResearcher.from('materials').update(material).eq('id', id).select().single();

  if (error) return res.status(500).json({ error: 'Failed to update material' });

  await supabaseResearcher.from('material_categories').delete().eq('material_id', id);
  const categoryIds = await materialService.categorizeMaterial(material);
  const materialCategories = categoryIds.map(category_id => ({ material_id: id, category_id }));
  await supabaseResearcher.from('material_categories').insert(materialCategories);

  res.status(200).json({ message: 'Material updated successfully', data });
};

exports.deleteMaterial = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseResearcher.from('materials').delete().eq('id', id);

  if (error) return res.status(500).json({ error: 'Failed to delete material' });

  await supabaseNutritionist.from('recipe_materials').delete().eq('material_id', id);

  res.status(200).json({ message: 'Material deleted successfully' });
};