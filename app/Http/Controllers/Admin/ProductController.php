<?php
// app/Http/Controllers/Admin/ProductController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Storage;

class ProductController extends Controller
{
    /**
     * List products for the branch
     */
    public function index(Request $request)
{
    try {
        $user = Auth::user();
        $branch = $user->branch;
        
        $products = Product::whereHas('branchProducts', function($q) use ($branch) {
                $q->where('branch_id', $branch->id);
            })
            ->with(['category', 'recipes.ingredient'])
            ->get();
        
        $formattedProducts = [];
        foreach ($products as $product) {
            $branchProduct = $branch->branchProducts()
                ->where('product_id', $product->id)
                ->first();
            
            $formattedProducts[] = [
                'id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'image' => $product->image_url, // Add image URL
                'category' => $product->category ? $product->category->name : 'Uncategorized',
                'type' => $product->type,
                'is_available' => $branchProduct ? (bool) $branchProduct->is_available : false,
                'recipe_count' => $product->recipes->count()
            ];
        }
        
        return response()->json($formattedProducts);
        
    } catch (\Exception $e) {
        Log::error('ProductController@index error: ' . $e->getMessage());
        return response()->json([
            'message' => 'Failed to fetch products',
            'error' => $e->getMessage()
        ], 500);
    }
}
    
    /**
     * Create new product
     */
    public function store(Request $request)
{
    try {
        $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'type' => 'required|in:ingredient_based,stock_based',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
        
        $user = Auth::user();
        $branch = $user->branch;
        
        // Check if category belongs to this branch
        if ($request->category_id) {
            $categoryBelongsToBranch = $branch->categories()
                ->where('category_id', $request->category_id)
                ->exists();
                
            if (!$categoryBelongsToBranch) {
                return response()->json([
                    'message' => 'Selected category does not belong to this branch'
                ], 400);
            }
        }
        
        DB::beginTransaction();
        
        // Handle image upload - FIXED
        $imagePath = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            // Generate a unique filename
            $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            // Store the file - this returns the path
            $storedPath = $image->storeAs('products', $filename, 'public');
            // Only store the filename, not the full path
            $imagePath = $filename;
            
            \Log::info('Image uploaded:', ['filename' => $filename, 'storedPath' => $storedPath]);
        }
        
        // Create product
        $product = Product::create([
            'name' => $request->name,
            'price' => $request->price,
            'category_id' => $request->category_id,
            'type' => $request->type,
            'image' => $imagePath  // Store only the filename
        ]);
        
        // Add to branch products
        $branch->branchProducts()->create([
            'product_id' => $product->id,
            'is_available' => false
        ]);
        
        DB::commit();
        
        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product
        ], 201);
        
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('ProductController@store error: ' . $e->getMessage());
        return response()->json([
            'message' => 'Failed to create product',
            'error' => $e->getMessage()
        ], 500);
    }
}
    
    /**
     * Update product
     */
    public function update(Request $request, Product $product)
{
    try {
        $request->validate([
            'name' => 'sometimes|string|max:100',
            'price' => 'sometimes|numeric|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'type' => 'sometimes|in:ingredient_based,stock_based',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
        
        $user = Auth::user();
        $branch = $user->branch;
        
        // Check if category belongs to this branch
        if ($request->category_id) {
            $categoryBelongsToBranch = $branch->categories()
                ->where('category_id', $request->category_id)
                ->exists();
                
            if (!$categoryBelongsToBranch) {
                return response()->json([
                    'message' => 'Selected category does not belong to this branch'
                ], 400);
            }
        }
        
        // Handle image upload - FIXED
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image && Storage::disk('public')->exists('products/' . $product->image)) {
                Storage::disk('public')->delete('products/' . $product->image);
            }
            
            $image = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $image->storeAs('products', $filename, 'public');
            $product->image = $filename;
        }
        
        // Update other fields
        $product->fill($request->only(['name', 'price', 'category_id', 'type']));
        $product->save();
        
        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product
        ]);
        
    } catch (\Exception $e) {
        Log::error('ProductController@update error: ' . $e->getMessage());
        return response()->json([
            'message' => 'Failed to update product',
            'error' => $e->getMessage()
        ], 500);
    }
}
    
    /**
     * Delete product
     */
    public function destroy(Product $product)
    {
        try {
            // Check if product has orders
            if ($product->orderItems()->exists()) {
                return response()->json([
                    'message' => 'Cannot delete product with existing orders'
                ], 400);
            }
            
            $product->delete();
            
            return response()->json([
                'message' => 'Product deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('ProductController@destroy error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Define recipe for ingredient-based product
     */
    public function addRecipe(Request $request, Product $product)
    {
        try {
            $request->validate([
                'ingredients' => 'required|array',
                'ingredients.*.ingredient_id' => 'required|exists:ingredients,id',
                'ingredients.*.quantity_needed' => 'required|numeric|min:0.01'
            ]);
            
            // Check if product is ingredient-based
            if (!$product->isIngredientBased()) {
                return response()->json([
                    'message' => 'Recipe can only be added to ingredient-based products'
                ], 400);
            }
            
            DB::beginTransaction();
            
            // Clear existing recipe
            $product->recipes()->delete();
            
            // Add new recipe
            foreach ($request->ingredients as $ingredient) {
                $product->recipes()->create([
                    'ingredient_id' => $ingredient['ingredient_id'],
                    'quantity_needed' => $ingredient['quantity_needed']
                ]);
            }
            
            // After recipe is set, check if product can be made available
            $user = Auth::user();
            $branch = $user->branch;
            
            $canBeAvailable = $this->checkProductAvailability($branch, $product);
            
            // Update availability
            $branch->branchProducts()
                ->where('product_id', $product->id)
                ->update(['is_available' => $canBeAvailable]);
            
            DB::commit();
            
            return response()->json([
                'message' => 'Recipe added successfully',
                'is_available' => $canBeAvailable
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ProductController@addRecipe error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to add recipe',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Set stock for stock-based product
     */
    public function setStock(Request $request, Product $product)
    {
        try {
            $request->validate([
                'quantity' => 'required|integer|min:0'
            ]);
            
            // Check if product is stock-based
            if (!$product->isStockBased()) {
                return response()->json([
                    'message' => 'Stock can only be set for stock-based products'
                ], 400);
            }
            
            $user = Auth::user();
            $branch = $user->branch;
            
            $productStock = $branch->productStocks()
                ->where('product_id', $product->id)
                ->first();
                
            if ($productStock) {
                $productStock->update(['quantity' => $request->quantity]);
            } else {
                $branch->productStocks()->create([
                    'product_id' => $product->id,
                    'quantity' => $request->quantity
                ]);
            }
            
            // Check availability after setting stock
            $isAvailable = $request->quantity > 0;
            
            $branch->branchProducts()
                ->where('product_id', $product->id)
                ->update(['is_available' => $isAvailable]);
                
            return response()->json([
                'message' => 'Stock updated successfully',
                'quantity' => $request->quantity,
                'is_available' => $isAvailable
            ]);
            
        } catch (\Exception $e) {
            Log::error('ProductController@setStock error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    private function checkProductAvailability($branch, $product)
    {
        try {
            if ($product->isIngredientBased()) {
                $recipes = $product->recipes;
                
                foreach ($recipes as $recipe) {
                    $branchIngredient = $branch->branchIngredients()
                        ->where('ingredient_id', $recipe->ingredient_id)
                        ->first();
                        
                    if (!$branchIngredient || $branchIngredient->quantity < $recipe->quantity_needed) {
                        return false;
                    }
                }
                
                return true;
            } else {
                $productStock = $branch->productStocks()
                    ->where('product_id', $product->id)
                    ->first();
                    
                return $productStock && $productStock->quantity > 0;
            }
        } catch (\Exception $e) {
            Log::error('checkProductAvailability error: ' . $e->getMessage());
            return false;
        }
    }

}

