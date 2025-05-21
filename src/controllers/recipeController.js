const supabaseNutritionist = require("../config/supabase-nutritionist");
const supabaseResearcher = require("../config/supabase-researcher");

exports.getRecipes = async (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  const offset = (page - 1) * limit;

  const { data: availableCategories, error: catError } =
    await supabaseResearcher.from("categories").select("name");

  if (catError) {
    return res.status(500).json({
      error: "Failed to fetch available categories",
      details: catError.message,
    });
  }

  const availableCategoryNames = availableCategories.map((cat) => cat.name);

  if (category && category !== "all") {
    if (
      !availableCategoryNames
        .map((name) => name.toLowerCase())
        .includes(category.toLowerCase())
    ) {
      return res.status(400).json({
        error: `Category ${category} does not exist`,
        availableCategories: availableCategoryNames,
      });
    }
  }

  let recipeQuery = supabaseNutritionist
    .from("recipes")
    .select("*, recipe_materials(material_id, quantity)", { count: "exact" });

  if (category && category !== "all") {
    recipeQuery = recipeQuery.eq("category", category);
  }

  if (search) {
    recipeQuery = recipeQuery.ilike("name", `%${search}%`);
  }

  const { data: recipes, count, error } = await recipeQuery;

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch recipes", details: error.message });
  }

  if (!recipes || recipes.length === 0) {
    return res.status(404).json({ error: "No recipes found" });
  }

  let filteredData = recipes;
  if (category && category !== "all") {
    filteredData = recipes.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (filteredData.length === 0) {
    return res.status(404).json({
      error: `No recipes found for category ${category}`,
      availableCategories: availableCategoryNames,
    });
  }

  const total = filteredData.length;
  const paginatedData = filteredData.slice(offset, offset + Number(limit));

  const materialIds = [
    ...new Set(
      paginatedData.flatMap((r) => r.recipe_materials.map((m) => m.material_id))
    ),
  ];

  const { data: materialsData, error: matError } = await supabaseResearcher
    .from("materials")
    .select("*")
    .in("id", materialIds);

  if (matError) {
    return res
      .status(500)
      .json({ error: "Failed to fetch materials", details: matError.message });
  }

  const materialsMap = Object.fromEntries(materialsData.map((m) => [m.id, m]));

  const enrichedRecipes = paginatedData.map((recipe) => ({
    ...recipe,
    recipe_materials: recipe.recipe_materials.map((rm) => ({
      ...rm,
      material: materialsMap[rm.material_id] || null,
    })),
  }));

  res.status(200).json({
    message: "List of recipes",
    data: enrichedRecipes,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
};

exports.getMyRecipes = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, category, search } = req.query;
  const offset = (page - 1) * limit;

  const { data: availableCategories, error: catError } =
    await supabaseResearcher.from("categories").select("name");

  if (catError) {
    return res.status(500).json({
      error: "Failed to fetch available categories",
      details: catError.message,
    });
  }

  const availableCategoryNames = availableCategories.map((cat) => cat.name);

  if (category && category !== "all") {
    if (
      !availableCategoryNames
        .map((name) => name.toLowerCase())
        .includes(category.toLowerCase())
    ) {
      return res.status(400).json({
        error: `Category ${category} does not exist`,
        availableCategories: availableCategoryNames,
      });
    }
  }

  let recipeQuery = supabaseNutritionist
    .from("recipes")
    .select("*, recipe_materials(material_id, quantity)", { count: "exact" })
    .eq("user_id", userId);

  if (category && category !== "all") {
    recipeQuery = recipeQuery.eq("category", category);
  }

  if (search) {
    recipeQuery = recipeQuery.ilike("name", `%${search}%`);
  }

  const { data: recipes, count, error } = await recipeQuery;

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch recipes", details: error.message });
  }

  if (!recipes || recipes.length === 0) {
    return res.status(404).json({ error: "No recipes found" });
  }

  let filteredData = recipes;
  if (category && category !== "all") {
    filteredData = recipes.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (filteredData.length === 0) {
    return res.status(404).json({
      error: `No recipes found for category ${category}`,
      availableCategories: availableCategoryNames,
    });
  }

  const total = filteredData.length;
  const paginatedData = filteredData.slice(offset, offset + Number(limit));

  const materialIds = [
    ...new Set(
      paginatedData.flatMap((r) => r.recipe_materials.map((m) => m.material_id))
    ),
  ];

  const { data: materialsData, error: matError } = await supabaseResearcher
    .from("materials")
    .select("*")
    .in("id", materialIds);

  if (matError) {
    return res
      .status(500)
      .json({ error: "Failed to fetch materials", details: matError.message });
  }

  const materialsMap = Object.fromEntries(materialsData.map((m) => [m.id, m]));

  const enrichedRecipes = paginatedData.map((recipe) => ({
    ...recipe,
    recipe_materials: recipe.recipe_materials.map((rm) => ({
      ...rm,
      material: materialsMap[rm.material_id] || null,
    })),
  }));

  res.status(200).json({
    message: "List of my recipes",
    data: enrichedRecipes,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
};

exports.getRecipeStats = async (req, res) => {
  const userId = req.user.id;

  const { data: totalRecipes, error: totalError } = await supabaseNutritionist
    .from("recipes")
    .select("*", { count: "exact" });

  if (totalError) {
    return res.status(500).json({
      error: "Failed to fetch total recipes",
      details: totalError.message,
    });
  }

  const { data: myRecipes, error: myError } = await supabaseNutritionist
    .from("recipes")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (myError) {
    return res.status(500).json({
      error: "Failed to fetch my recipes",
      details: myError.message,
    });
  }

  const { data: totalMaterials, error: materialsError } =
    await supabaseResearcher.from("materials").select("*", { count: "exact" });

  if (materialsError) {
    return res.status(500).json({
      error: "Failed to fetch total materials",
      details: materialsError.message,
    });
  }

  res.status(200).json({
    message: "Recipe statistics",
    data: {
      totalRecipes: totalRecipes.length,
      myRecipes: myRecipes.length,
      totalMaterials: totalMaterials.length,
    },
  });
};

exports.getRecipeById = async (req, res) => {
  const userId = req.user.id;
  const recipeId = req.params.id;

  const { data: recipe, error } = await supabaseNutritionist
    .from("recipes")
    .select("*, recipe_materials(material_id, quantity)")
    .eq("id", recipeId)
    .single();

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch recipe", details: error.message });
  }

  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  const materialIds = recipe.recipe_materials.map((rm) => rm.material_id);
  const { data: materialsData, error: matError } = await supabaseResearcher
    .from("materials")
    .select("*")
    .in("id", materialIds);

  if (matError) {
    return res
      .status(500)
      .json({ error: "Failed to fetch materials", details: matError.message });
  }

  const materialsMap = Object.fromEntries(materialsData.map((m) => [m.id, m]));
  const enrichedMaterials = recipe.recipe_materials.map((rm) => ({
    ...rm,
    material: materialsMap[rm.material_id] || null,
  }));

  const formattedData = {
    ...recipe,
    recipe_materials: enrichedMaterials,
  };

  res.status(200).json({ message: "Recipe details", data: formattedData });
};

exports.createRecipe = async (req, res) => {
  const userId = req.user.id;
  const { name, description, category, materials, steps } = req.body;

  if (!name || !category || !materials || !Array.isArray(steps)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (typeof name !== "string") {
    return res.status(400).json({ error: "Recipe name must be a string" });
  }

  const { data: availableCategories, error: catError } =
    await supabaseResearcher.from("categories").select("name");
  if (catError) {
    return res
      .status(500)
      .json({ error: "Failed to fetch categories", details: catError.message });
  }
  const availableCategoryNames = availableCategories.map((cat) => cat.name);
  if (!availableCategoryNames.includes(category)) {
    return res.status(400).json({
      error: `Category ${category} does not exist`,
      availableCategories: availableCategoryNames,
    });
  }

  const materialIds = materials.map((mat) => mat.id);
  const { data: validMaterials, error: matError } = await supabaseResearcher
    .from("materials")
    .select("id")
    .in("id", materialIds);
  if (matError) {
    return res.status(500).json({
      error: "Failed to validate materials",
      details: matError.message,
    });
  }
  if (validMaterials.length !== materialIds.length) {
    return res.status(400).json({ error: "Invalid material IDs" });
  }

  const recipe = {
    user_id: userId,
    name,
    description,
    category,
    steps: steps.join("\n"),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseNutritionist
    .from("recipes")
    .insert(recipe)
    .select()
    .single();

  if (error) {
    return res
      .status(500)
      .json({ error: "Failed to add recipe", details: error.message });
  }

  const recipeMaterials = materials.map((mat) => ({
    recipe_id: data.id,
    material_id: mat.id,
    quantity: mat.quantity || 1,
  }));
  const { error: matInsertError } = await supabaseNutritionist
    .from("recipe_materials")
    .insert(recipeMaterials);

  if (matInsertError) {
    await supabaseNutritionist.from("recipes").delete().eq("id", data.id);
    return res.status(500).json({
      error: "Failed to add recipe materials, recipe creation rolled back",
      details: matInsertError.message,
    });
  }

  res.status(201).json({ message: "Recipe added successfully", data });
};

exports.updateRecipe = async (req, res) => {
  const userId = req.user.id;
  const recipeId = req.params.id;
  const { name, description, category, materials, steps } = req.body;

  if (!name || !category || !materials || !Array.isArray(steps)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (typeof name !== "string") {
    return res.status(400).json({ error: "Recipe name must be a string" });
  }

  const { data: availableCategories, error: catError } =
    await supabaseResearcher.from("categories").select("name");
  if (catError) {
    return res
      .status(500)
      .json({ error: "Failed to fetch categories", details: catError.message });
  }
  const availableCategoryNames = availableCategories.map((cat) => cat.name);
  if (!availableCategoryNames.includes(category)) {
    return res.status(400).json({
      error: `Category ${category} does not exist`,
      availableCategories: availableCategoryNames,
    });
  }

  const { data: recipeExists, error: findError } = await supabaseNutritionist
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .single();

  if (findError || !recipeExists) {
    return res
      .status(403)
      .json({ error: `You can only edit recipes you created` });
  }

  const materialIds = materials.map((mat) => mat.id);
  const { data: validMaterials, error: matError } = await supabaseResearcher
    .from("materials")
    .select("id")
    .in("id", materialIds);
  if (matError) {
    return res.status(500).json({
      error: "Failed to validate materials",
      details: matError.message,
    });
  }
  if (validMaterials.length !== materialIds.length) {
    return res.status(400).json({ error: "Invalid material IDs" });
  }

  const { data, error: updateError } = await supabaseNutritionist
    .from("recipes")
    .update({
      name,
      description,
      category,
      steps: steps.join("\n"),
    })
    .eq("id", recipeId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    return res
      .status(500)
      .json({ error: "Failed to update recipe", details: updateError.message });
  }

  await supabaseNutritionist
    .from("recipe_materials")
    .delete()
    .eq("recipe_id", recipeId);

  const recipeMaterials = materials.map((mat) => ({
    recipe_id: recipeId,
    material_id: mat.id,
    quantity: mat.quantity || 1,
  }));
  const { error: matInsertError } = await supabaseNutritionist
    .from("recipe_materials")
    .insert(recipeMaterials);

  if (matInsertError) {
    return res.status(500).json({
      error: "Failed to update recipe materials",
      details: matInsertError.message,
    });
  }

  res.status(200).json({ message: "Recipe updated successfully", data });
};

exports.deleteRecipe = async (req, res) => {
  const userId = req.user.id;
  const recipeId = req.params.id;

  const { data: recipe, error: findError } = await supabaseNutritionist
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .single();

  if (findError || !recipe) {
    return res
      .status(403)
      .json({ error: `You can only delete recipes you created` });
  }

  await supabaseNutritionist
    .from("recipe_materials")
    .delete()
    .eq("recipe_id", recipeId);

  const { error: deleteError } = await supabaseNutritionist
    .from("recipes")
    .delete()
    .eq("id", recipeId);

  if (deleteError) {
    return res
      .status(500)
      .json({ error: "Failed to delete recipe", details: deleteError.message });
  }

  res.status(200).json({ message: "Recipe deleted successfully" });
};