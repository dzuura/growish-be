const supabaseNutritionist = require("../config/supabase-nutritionist");
const supabaseResearcher = require("../config/supabase-researcher");
const { sanitizeFilePath } = require("../utils/fileUtils");

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
    .select("id, user_id, name, image_url, description, category", {
      count: "exact",
    });

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

  res.status(200).json({
    message: "List of recipes",
    data: paginatedData,
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
    .select(
      "id, user_id, name, image_url, description, category, steps, nutrients, recipe_materials(material_id, quantity)"
    )
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
    .select("id, name")
    .in("id", materialIds);

  if (matError) {
    return res
      .status(500)
      .json({ error: "Failed to fetch materials", details: matError.message });
  }

  const materialsMap = Object.fromEntries(
    materialsData.map((m) => [m.id, m.name])
  );
  const enrichedMaterials = recipe.recipe_materials.map((rm) => ({
    quantity: rm.quantity,
    material: materialsMap[rm.material_id] || null,
  }));

  const { recipe_materials, created_at, ...rest } = recipe;
  const formattedData = {
    ...rest,
    recipe_materials: enrichedMaterials,
  };

  res.status(200).json({ message: "Recipe details", data: formattedData });
};

exports.createRecipe = async (req, res) => {
  const userId = req.user.id;
  let { name, description, category, materials, steps } = req.body;

  try {
    if (typeof materials === "string") {
      materials = JSON.parse(materials);
    }
    if (typeof steps === "string") {
      steps = JSON.parse(steps);
    }
  } catch (error) {
    return res
      .status(400)
      .json({
        error: "Invalid format for materials or steps",
        details: error.message,
      });
  }

  if (
    !name ||
    !category ||
    !materials ||
    !Array.isArray(materials) ||
    !Array.isArray(steps)
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (typeof name !== "string") {
    return res.status(400).json({ error: "Recipe name must be a string" });
  }

  const { data: existingRecipe, error: checkError } = await supabaseNutritionist
    .from("recipes")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    return res
      .status(500)
      .json({
        error: "Failed to check existing recipe",
        details: checkError.message,
      });
  }

  if (existingRecipe) {
    return res.status(400).json({ error: "Recipe name already exists" });
  }

  let imageUrl = null;
  let uploadedFilePath = null;
  if (req.file) {
    const file = req.file;
    if (file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: `Image size exceeds 5MB limit` });
    }

    const sanitizedRecipeName = sanitizeFilePath(name);
    const timestamp = Date.now();
    uploadedFilePath = `${sanitizedRecipeName}/${timestamp}_${file.originalname}`;

    const { data, error: uploadError } = await supabaseNutritionist.storage
      .from("recipes-images")
      .upload(uploadedFilePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return res
        .status(500)
        .json({
          error: "Failed to upload image",
          details: uploadError.message,
        });
    }

    imageUrl = supabaseNutritionist.storage
      .from("recipes-images")
      .getPublicUrl(uploadedFilePath).data.publicUrl;
  }

  const { data: availableCategories, error: catError } =
    await supabaseResearcher.from("categories").select("name");
  if (catError) {
    if (uploadedFilePath) {
      await supabaseNutritionist.storage
        .from("recipes-images")
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error(
            "Failed to clean up uploaded file:",
            removeError.message
          );
        });
    }
    return res
      .status(500)
      .json({ error: "Failed to fetch categories", details: catError.message });
  }
  const availableCategoryNames = availableCategories.map((cat) => cat.name);
  if (!availableCategoryNames.includes(category)) {
    if (uploadedFilePath) {
      await supabaseNutritionist.storage
        .from("recipes-images")
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error(
            "Failed to clean up uploaded file:",
            removeError.message
          );
        });
    }
    return res.status(400).json({
      error: `Category ${category} does not exist`,
      availableCategories: availableCategoryNames,
    });
  }

  const materialIds = materials.map((mat) => mat.id);
  const { data: validMaterials, error: matError } = await supabaseResearcher
    .from("materials")
    .select("*")
    .in("id", materialIds);
  if (matError) {
    if (uploadedFilePath) {
      await supabaseNutritionist.storage
        .from("recipes-images")
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error(
            "Failed to clean up uploaded file:",
            removeError.message
          );
        });
    }
    return res.status(500).json({
      error: "Failed to validate materials",
      details: matError.message,
    });
  }
  if (validMaterials.length !== materialIds.length) {
    if (uploadedFilePath) {
      await supabaseNutritionist.storage
        .from("recipes-images")
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error(
            "Failed to clean up uploaded file:",
            removeError.message
          );
        });
    }
    return res.status(400).json({ error: "Invalid material IDs" });
  }

  const materialsWithQuantity = materials.map((mat) => {
    const material = validMaterials.find((m) => m.id === mat.id);
    return {
      material,
      quantity: mat.quantity || 1, // Default quantity to 1 if not provided
    };
  });
  const totalNutrients =
    require("../utils/nutritionUtils").calculateRecipeNutrients(
      materialsWithQuantity
    );

  const recipe = {
    user_id: userId,
    name,
    image_url: imageUrl,
    description,
    category,
    steps: steps.join("\n"),
    created_at: new Date().toISOString(),
    nutrients: totalNutrients,
  };

  const { data, error } = await supabaseNutritionist
    .from("recipes")
    .insert(recipe)
    .select()
    .single();

  if (error) {
    if (uploadedFilePath) {
      await supabaseNutritionist.storage
        .from("recipes-images")
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error(
            "Failed to clean up uploaded file:",
            removeError.message
          );
        });
    }
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
    if (uploadedFilePath) {
      await supabaseNutritionist.storage
        .from("recipes-images")
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error(
            "Failed to clean up uploaded file:",
            removeError.message
          );
        });
    }
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
  let { name, description, category, materials, steps } = req.body;

  const { data: existingRecipe, error: findError } = await supabaseNutritionist
    .from("recipes")
    .select("id, image_url, name, description, category, steps")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .single();

  if (findError || !existingRecipe) {
    return res
      .status(403)
      .json({ error: `You can only edit recipes you created` });
  }

  const { data: existingMaterials, error: matFetchError } =
    await supabaseNutritionist
      .from("recipe_materials")
      .select("material_id, quantity")
      .eq("recipe_id", recipeId);

  if (matFetchError) {
    return res.status(500).json({
      error: "Failed to fetch existing materials",
      details: matFetchError.message,
    });
  }

  try {
    if (typeof materials === "string") {
      materials = JSON.parse(materials);
    }
    if (typeof steps === "string") {
      steps = JSON.parse(steps);
    }
  } catch (error) {
    return res
      .status(400)
      .json({
        error: "Invalid format for materials or steps",
        details: error.message,
      });
  }

  const updatedName = name || existingRecipe.name;
  const updatedDescription =
    description !== undefined ? description : existingRecipe.description;
  const updatedCategory = category || existingRecipe.category;
  const updatedMaterials =
    materials && Array.isArray(materials)
      ? materials
      : existingMaterials.map((mat) => ({
          id: mat.material_id,
          quantity: mat.quantity,
        }));
  const updatedSteps =
    steps && Array.isArray(steps) ? steps : existingRecipe.steps.split("\n");

  if (typeof updatedName !== "string" || updatedName.trim() === "") {
    return res
      .status(400)
      .json({ error: "Recipe name must be a non-empty string" });
  }

  if (!Array.isArray(updatedMaterials)) {
    return res.status(400).json({ error: "Materials must be an array" });
  }

  if (!Array.isArray(updatedSteps)) {
    return res.status(400).json({ error: "Steps must be an array" });
  }

  if (updatedCategory) {
    const { data: availableCategories, error: catError } =
      await supabaseResearcher.from("categories").select("name");
    if (catError) {
      return res
        .status(500)
        .json({
          error: "Failed to fetch categories",
          details: catError.message,
        });
    }
    const availableCategoryNames = availableCategories.map((cat) => cat.name);
    if (!availableCategoryNames.includes(updatedCategory)) {
      return res.status(400).json({
        error: `Category ${updatedCategory} does not exist`,
        availableCategories: availableCategoryNames,
      });
    }
  }

  let totalNutrients = {};
  if (materials && Array.isArray(materials)) {
    const materialIds = materials.map((mat) => mat.id);
    const { data: validMaterials, error: matError } = await supabaseResearcher
      .from("materials")
      .select("*")
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

    const materialsWithQuantity = materials.map((mat) => {
      const material = validMaterials.find((m) => m.id === mat.id);
      return {
        material,
        quantity: mat.quantity || 1,
      };
    });
    totalNutrients =
      require("../utils/nutritionUtils").calculateRecipeNutrients(
        materialsWithQuantity
      );
  } else {
    const materialIds = existingMaterials.map((mat) => mat.material_id);
    const { data: validMaterials, error: matError } = await supabaseResearcher
      .from("materials")
      .select("*")
      .in("id", materialIds);
    if (matError) {
      return res.status(500).json({
        error: "Failed to fetch materials for nutrition calculation",
        details: matError.message,
      });
    }

    const materialsWithQuantity = existingMaterials.map((mat) => {
      const material = validMaterials.find((m) => m.id === mat.material_id);
      return {
        material,
        quantity: mat.quantity || 1,
      };
    });
    totalNutrients =
      require("../utils/nutritionUtils").calculateRecipeNutrients(
        materialsWithQuantity
      );
  }

  let imageUrl = existingRecipe.image_url;
  let uploadedFilePath = null;
  if (req.file) {
    const file = req.file;
    if (file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: `Image size exceeds 5MB limit` });
    }

    if (imageUrl) {
      const pathStartIndex =
        imageUrl.indexOf("recipes-images/") + "recipes-images/".length;
      const oldPath = imageUrl.substring(pathStartIndex);
      const { error: removeError } = await supabaseNutritionist.storage
        .from("recipes-images")
        .remove([oldPath]);

      if (removeError) {
        return res.status(500).json({
          error: "Failed to remove old image",
          details: removeError.message,
        });
      }
    }

    const sanitizedRecipeName = sanitizeFilePath(updatedName);
    const timestamp = Date.now();
    uploadedFilePath = `${sanitizedRecipeName}/${timestamp}_${file.originalname}`;

    const { data, error: uploadError } = await supabaseNutritionist.storage
      .from("recipes-images")
      .upload(uploadedFilePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return res
        .status(500)
        .json({
          error: "Failed to upload image",
          details: uploadError.message,
        });
    }

    imageUrl = supabaseNutritionist.storage
      .from("recipes-images")
      .getPublicUrl(uploadedFilePath).data.publicUrl;
  }

  const { data, error: updateError } = await supabaseNutritionist
    .from("recipes")
    .update({
      name: updatedName,
      image_url: imageUrl,
      description: updatedDescription,
      category: updatedCategory,
      steps: updatedSteps.join("\n"),
      nutrients: totalNutrients,
    })
    .eq("id", recipeId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    if (uploadedFilePath) {
      await supabaseNutritionist.storage
        .from("recipes-images")
        .remove([uploadedFilePath])
        .catch((removeError) => {
          console.error(
            "Failed to clean up uploaded file:",
            removeError.message
          );
        });
    }
    return res
      .status(500)
      .json({ error: "Failed to update recipe", details: updateError.message });
  }

  if (materials && Array.isArray(materials)) {
    await supabaseNutritionist
      .from("recipe_materials")
      .delete()
      .eq("recipe_id", recipeId);

    const recipeMaterials = updatedMaterials.map((mat) => ({
      recipe_id: recipeId,
      material_id: mat.id,
      quantity: mat.quantity || 1,
    }));
    const { error: matInsertError } = await supabaseNutritionist
      .from("recipe_materials")
      .insert(recipeMaterials);

    if (matInsertError) {
      if (uploadedFilePath) {
        await supabaseNutritionist.storage
          .from("recipes-images")
          .remove([uploadedFilePath])
          .catch((removeError) => {
            console.error(
              "Failed to clean up uploaded file:",
              removeError.message
            );
          });
      }
      return res.status(500).json({
        error: "Failed to update recipe materials",
        details: matInsertError.message,
      });
    }
  }

  res.status(200).json({ message: "Recipe updated successfully", data });
};

exports.deleteRecipe = async (req, res) => {
  const userId = req.user.id;
  const recipeId = req.params.id;

  const { data: recipe, error: findError } = await supabaseNutritionist
    .from("recipes")
    .select("id, image_url")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .single();

  if (findError || !recipe) {
    return res
      .status(403)
      .json({ error: `You can only delete recipes you created` });
  }

  if (recipe.image_url) {
    const pathStartIndex =
      recipe.image_url.indexOf("recipes-images/") + "recipes-images/".length;
    const oldPath = recipe.image_url.substring(pathStartIndex);
    const { error: removeError } = await supabaseNutritionist.storage
      .from("recipes-images")
      .remove([oldPath]);

    if (removeError) {
      return res.status(500).json({
        error: "Failed to remove image",
        details: removeError.message,
      });
    }
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