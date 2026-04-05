<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CategoryController extends Controller
{
    /**
     * Get categories for the current admin's branch only
     */
    public function index()
    {
        try {
            $user = Auth::user();
            $branch = $user->branch;
            
            // Get categories assigned to this branch
            $categories = $branch->categories()
                ->orderBy('name')
                ->get();
                
            return response()->json($categories);
        } catch (\Exception $e) {
            Log::error('CategoryController@index error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch categories'], 500);
        }
    }
    
    /**
     * Create a new category for the current branch
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100'
        ]);
        
        try {
            $user = Auth::user();
            $branch = $user->branch;
            
            // Check if this category name already exists for this branch
            $existing = $branch->categories()
                ->where('name', $request->name)
                ->first();
                
            if ($existing) {
                return response()->json([
                    'message' => 'Category already exists in this branch'
                ], 400);
            }
            
            // Create the category
            $category = Category::create([
                'name' => $request->name
            ]);
            
            // Associate with the branch
            $branch->categories()->attach($category->id, ['is_active' => true]);
            
            return response()->json($category, 201);
            
        } catch (\Exception $e) {
            Log::error('CategoryController@store error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create category'], 500);
        }
    }
    
    /**
     * Update a category
     */
    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:100'
        ]);
        
        try {
            $user = Auth::user();
            $branch = $user->branch;
            
            // Check if this category belongs to the current branch
            if (!$branch->categories()->where('category_id', $category->id)->exists()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            // Check if name already exists for this branch
            $existing = $branch->categories()
                ->where('name', $request->name)
                ->where('category_id', '!=', $category->id)
                ->first();
                
            if ($existing) {
                return response()->json([
                    'message' => 'Category name already exists in this branch'
                ], 400);
            }
            
            $category->update($request->only(['name']));
            
            return response()->json($category);
            
        } catch (\Exception $e) {
            Log::error('CategoryController@update error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update category'], 500);
        }
    }
    
    /**
     * Delete a category from the branch
     */
    public function destroy(Category $category)
    {
        try {
            $user = Auth::user();
            $branch = $user->branch;
            
            // Check if this category belongs to the current branch
            if (!$branch->categories()->where('category_id', $category->id)->exists()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            // Check if category has products in this branch
            $hasProducts = $branch->products()
                ->where('category_id', $category->id)
                ->exists();
                
            if ($hasProducts) {
                return response()->json([
                    'message' => 'Cannot delete category with existing products. Reassign products first.'
                ], 400);
            }
            
            // Remove the branch association
            $branch->categories()->detach($category->id);
            
            // Optional: If category is not used by any branch, delete it
            if ($category->branches()->count() === 0) {
                $category->delete();
            }
            
            return response()->json(['message' => 'Category deleted successfully']);
            
        } catch (\Exception $e) {
            Log::error('CategoryController@destroy error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete category'], 500);
        }
    }
    
    /**
     * Get all categories (for Super Admin to see all)
     */
    public function getAllCategories()
    {
        try {
            $categories = Category::with('branches')
                ->orderBy('name')
                ->get();
                
            return response()->json($categories);
        } catch (\Exception $e) {
            Log::error('CategoryController@getAllCategories error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch categories'], 500);
        }
    }
    
    /**
     * Toggle category visibility for a branch
     */
    public function toggleVisibility(Request $request, Category $category)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'is_active' => 'required|boolean'
        ]);
        
        try {
            $branch = Branch::find($request->branch_id);
            
            // Update the pivot table
            $branch->categories()->updateExistingPivot($category->id, [
                'is_active' => $request->is_active
            ]);
            
            return response()->json(['message' => 'Category visibility updated']);
            
        } catch (\Exception $e) {
            Log::error('CategoryController@toggleVisibility error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update visibility'], 500);
        }
    }
    
    // Keep for backward compatibility
    public function getCategory()
    {
        return $this->index();
    }
}