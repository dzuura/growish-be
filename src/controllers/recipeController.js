const supabaseNutritionist = require('../config/supabase-nutritionist');
const supabaseResearcher = require('../config/supabase-researcher')


exports.getRecipes = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, category, search } = req.query;
  const offset = (page - 1) * limit;

  let recipeQuery = supabaseNutritionist
    .from('recipes')
    .select('*, recipe_materials(material_id, quantity)', { count: 'exact' })
    .eq('user_id', userId);


  if (category) {
    recipeQuery = recipeQuery.eq('category', category);
  }

  if (search) {
    recipeQuery = recipeQuery.ilike('name', `%${search}%`);
  }

  recipeQuery = recipeQuery.range(offset, offset + parseInt(limit) - 1);

  const { data: recipes, count, error } = await recipeQuery;

  if (error) return res.status(500).json({ error: 'Gagal ambil resep', details: error.message });

  const materialIds = [...new Set(recipes.flatMap(r =>
    r.recipe_materials.map(m => m.material_id)
  ))];

  const { data: materialsData, error: matError } = await supabaseResearcher
    .from('materials')
    .select('*')
    .in('id', materialIds);

  if (matError) return res.status(500).json({ error: 'Gagal ambil bahan', details: matError.message });

  const materialsMap = Object.fromEntries(materialsData.map(m => [m.id, m]));

  const enrichedRecipes = recipes.map(recipe => ({
    ...recipe,
    recipe_materials: recipe.recipe_materials.map(rm => ({
      ...rm,
      material: materialsMap[rm.material_id] || null
    }))
  }));

  res.status(200).json({
    message: 'List of recipes',
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    },
    data: enrichedRecipes
  });
};


exports.getRecipeStats = async (req, res) => {
  const userId = req.user.id;

  const { data: totalRecipes, error: totalError } = await supabaseNutritionist
    .from('recipes')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (totalError) return res.status(500).json({ error: 'Failed to fetch total recipes', details: totalError.message });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: newRecipes, error: newError } = await supabaseNutritionist
    .from('recipes')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo.toISOString());

  if (newError) return res.status(500).json({ error: 'Failed to fetch new recipes', details: newError.message });

  const { data: totalMaterials, error: materialsError } = await supabaseResearcher
    .from('materials')
    .select('*', { count: 'exact' });

  if (materialsError) return res.status(500).json({ error: 'Failed to fetch total materials', details: materialsError.message });

  res.status(200).json({
    message: 'Recipe statistics',
    data: {
      totalRecipes: totalRecipes.length,
      newRecipes: newRecipes.length,
      totalMaterialsAvailable: totalMaterials.length
    }
  });
};

exports.getRecipeById = async (req, res) => {
  const userId = req.user.id;
  const recipeId = req.params.id;

  const { data: recipe, error } = await supabaseNutritionist
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .eq('user_id', userId)
    .single();

  if (error || !recipe) return res.status(404).json({ error: 'Recipe not found' });

  const { data: materials, error: matError } = await supabaseNutritionist
    .from('recipe_materials')
    .select('material_id, quantity')
    .eq('recipe_id', recipeId);

  if (matError) return res.status(500).json({ error: 'Failed to fetch materials', details: matError.message });

  res.status(200).json({ message: 'Recipe fetched successfully', data: { ...recipe, materials } });
};

exports.createRecipe = async (req, res) => {
  const userId = req.user.id;
  const { name, description, category, materials, steps } = req.body;

  if (!name || !category || !materials || !Array.isArray(steps)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!['diet', 'heart', 'diabetes', 'muscle'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const materialIds = materials.map(mat => mat.id);
  const { data: validMaterials, error: matError } = await supabaseResearcher
    .from('materials')
    .select('id')
    .in('id', materialIds);
  if (matError || validMaterials.length !== materialIds.length) {
    return res.status(400).json({ error: 'Invalid material IDs' });
  }

  const recipe = {
    user_id: userId,
    name,
    description,
    category,
    steps: steps.join('\n'),
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabaseNutritionist.from('recipes').insert(recipe).select().single();

  if (error) return res.status(500).json({ error: 'Failed to add recipe', details: error.message });

  const recipeMaterials = materials.map(mat => ({
    recipe_id: data.id,
    material_id: mat.id,
    quantity: mat.quantity || 1
  }));
  const { error: matInsertError } = await supabaseNutritionist.from('recipe_materials').insert(recipeMaterials);

  if (matInsertError) {
    await supabaseNutritionist.from('recipes').delete().eq('id', data.id);
    return res.status(500).json({ error: 'Failed to add recipe materials', details: matInsertError.message });
  }

  res.status(201).json({ message: 'Recipe added successfully', data });
};
exports.updateRecipe = async (req, res) => {
  const userId = req.user.id;
  const recipeId = req.params.id;
  const { name, description, category, materials, steps } = req.body;

  if (!name || !category || !materials || !Array.isArray(steps)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: recipeExists, error: findError } = await supabaseNutritionist
    .from('recipes')
    .select('id')
    .eq('id', recipeId)
    .eq('user_id', userId)
    .single();

  if (findError || !recipeExists) {
    return res.status(404).json({ error: 'Recipe not found or unauthorized' });
  }

  const { error: updateError } = await supabaseNutritionist
    .from('recipes')
    .update({
      name,
      description,
      category,
      steps: steps.join('\n')
    })
    .eq('id', recipeId);

  if (updateError) return res.status(500).json({ error: 'Failed to update recipe', details: updateError.message });
  await supabaseNutritionist.from('recipe_materials').delete().eq('recipe_id', recipeId);

  const recipeMaterials = materials.map(mat => ({
    recipe_id: recipeId,
    material_id: mat.id,
    quantity: mat.quantity || 1
  }));
  const { error: matError } = await supabaseNutritionist.from('recipe_materials').insert(recipeMaterials);

  if (matError) return res.status(500).json({ error: 'Failed to update materials', details: matError.message });

  res.status(200).json({ message: 'Recipe updated successfully' });
};

exports.deleteRecipe = async (req, res) => {
  const userId = req.user.id;
  const recipeId = req.params.id;

  const { data: recipe, error: findError } = await supabaseNutritionist
    .from('recipes')
    .select('id')
    .eq('id', recipeId)
    .eq('user_id', userId)
    .single();

  if (findError || !recipe) {
    return res.status(404).json({ error: 'Recipe not found or unauthorized' });
  }
  await supabaseNutritionist.from('recipe_materials').delete().eq('recipe_id', recipeId);

  const { error: deleteError } = await supabaseNutritionist.from('recipes').delete().eq('id', recipeId);

  if (deleteError) return res.status(500).json({ error: 'Failed to delete recipe', details: deleteError.message });

  res.status(200).json({ message: 'Recipe deleted successfully' });
};
