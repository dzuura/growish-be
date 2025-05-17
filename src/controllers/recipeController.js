const supabaseNutritionist = require('../config/supabase-nutritionist');
const supabaseResearcher = require('../config/supabase-researcher')

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
